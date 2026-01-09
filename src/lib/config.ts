import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { getMachineId } from './machine-id.js';

const MINDCONTEXT_DIR = join(homedir(), '.mindcontext');
const CONFIG_FILE = join(MINDCONTEXT_DIR, 'config.json');
const REPO_DIR = join(MINDCONTEXT_DIR, 'repo');
const PENDING_FILE = join(MINDCONTEXT_DIR, 'pending.json');

export interface ProjectConfig {
  path: string;
  openspec: boolean;
  category: string;
}

export interface Config {
  version: string;
  dashboard_repo: string;
  dashboard_url: string;
  projects: Record<string, ProjectConfig>;
  machine: {
    name: string;
    id: string;
  };
}

export interface PendingPush {
  timestamp: string;
  message: string;
}

/**
 * Get the mindcontext directory path.
 */
export function getMindcontextDir(): string {
  return MINDCONTEXT_DIR;
}

/**
 * Get the repo directory path.
 */
export function getRepoDir(): string {
  return REPO_DIR;
}

/**
 * Check if mindcontext is initialized.
 */
export function isInitialized(): boolean {
  return existsSync(CONFIG_FILE) && existsSync(REPO_DIR);
}

/**
 * Create default config structure.
 */
export function createDefaultConfig(): Config {
  const machine = getMachineId();
  return {
    version: '1.0',
    dashboard_repo: '',
    dashboard_url: '',
    projects: {},
    machine,
  };
}

/**
 * Read the config file.
 */
export function readConfig(): Config | null {
  if (!existsSync(CONFIG_FILE)) {
    return null;
  }
  try {
    const content = readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(content) as Config;
  } catch {
    return null;
  }
}

/**
 * Write the config file.
 */
export function writeConfig(config: Config): void {
  if (!existsSync(MINDCONTEXT_DIR)) {
    mkdirSync(MINDCONTEXT_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Read pending pushes.
 */
export function readPending(): PendingPush[] {
  if (!existsSync(PENDING_FILE)) {
    return [];
  }
  try {
    const content = readFileSync(PENDING_FILE, 'utf8');
    return JSON.parse(content) as PendingPush[];
  } catch {
    return [];
  }
}

/**
 * Write pending pushes.
 */
export function writePending(pending: PendingPush[]): void {
  writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
}

/**
 * Add a pending push.
 */
export function addPending(message: string): void {
  const pending = readPending();
  pending.push({
    timestamp: new Date().toISOString(),
    message,
  });
  writePending(pending);
}

/**
 * Clear pending pushes.
 */
export function clearPending(): void {
  if (existsSync(PENDING_FILE)) {
    writeFileSync(PENDING_FILE, '[]');
  }
}

/**
 * Get project directory in repo.
 */
export function getProjectDir(projectName: string): string {
  return join(REPO_DIR, 'projects', projectName, 'updates');
}

/**
 * Ensure project directory exists.
 */
export function ensureProjectDir(projectName: string): void {
  const dir = getProjectDir(projectName);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}
