import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, basename } from 'path';

export interface OpenSpecChange {
  id: string;
  tasksTotal: number;
  tasksComplete: number;
  status: 'proposed' | 'in_progress' | 'review' | 'done';
}

export interface OpenSpecResult {
  found: boolean;
  changes: OpenSpecChange[];
  activeChange: OpenSpecChange | null;
}

/**
 * Check if a directory has OpenSpec structure.
 */
export function hasOpenSpec(projectPath: string): boolean {
  const openspecDir = join(projectPath, 'openspec');
  return existsSync(openspecDir) && existsSync(join(openspecDir, 'changes'));
}

/**
 * Parse tasks.md to count completed vs total tasks.
 */
function parseTasksFile(filepath: string): { total: number; complete: number } {
  if (!existsSync(filepath)) {
    return { total: 0, complete: 0 };
  }

  const content = readFileSync(filepath, 'utf8');
  const lines = content.split('\n');

  let total = 0;
  let complete = 0;

  for (const line of lines) {
    // Match markdown checkbox: - [ ] or - [x]
    if (/^\s*-\s*\[\s*\]\s/.test(line)) {
      total++;
    } else if (/^\s*-\s*\[x\]\s/i.test(line)) {
      total++;
      complete++;
    }
  }

  return { total, complete };
}

/**
 * Determine change status based on tasks.
 */
function determineStatus(tasksTotal: number, tasksComplete: number): OpenSpecChange['status'] {
  if (tasksTotal === 0) {
    return 'proposed';
  }
  if (tasksComplete === 0) {
    return 'proposed';
  }
  if (tasksComplete === tasksTotal) {
    return 'done';
  }
  // Check if any task is in review (you could expand this)
  return 'in_progress';
}

/**
 * Parse a single change directory.
 */
function parseChange(changePath: string): OpenSpecChange | null {
  const id = basename(changePath);

  // Skip archive directory
  if (id === 'archive') {
    return null;
  }

  const tasksFile = join(changePath, 'tasks.md');
  const { total, complete } = parseTasksFile(tasksFile);

  return {
    id,
    tasksTotal: total,
    tasksComplete: complete,
    status: determineStatus(total, complete),
  };
}

/**
 * Parse all OpenSpec changes in a project.
 */
export function parseOpenSpec(projectPath: string): OpenSpecResult {
  if (!hasOpenSpec(projectPath)) {
    return { found: false, changes: [], activeChange: null };
  }

  const changesDir = join(projectPath, 'openspec', 'changes');
  const entries = readdirSync(changesDir, { withFileTypes: true });
  const changes: OpenSpecChange[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const change = parseChange(join(changesDir, entry.name));
      if (change) {
        changes.push(change);
      }
    }
  }

  // Find active change (in_progress or proposed with tasks)
  let activeChange: OpenSpecChange | null = null;

  // Priority: in_progress > review > proposed with tasks
  for (const change of changes) {
    if (change.status === 'in_progress') {
      activeChange = change;
      break;
    }
  }

  if (!activeChange) {
    for (const change of changes) {
      if (change.status === 'review') {
        activeChange = change;
        break;
      }
    }
  }

  if (!activeChange) {
    for (const change of changes) {
      if (change.status === 'proposed' && change.tasksTotal > 0) {
        activeChange = change;
        break;
      }
    }
  }

  return { found: true, changes, activeChange };
}

/**
 * Get progress data from OpenSpec.
 */
export function getOpenSpecProgress(projectPath: string): {
  source: 'openspec' | 'manual';
  change?: string;
  tasks_done: number;
  tasks_total: number;
} {
  const result = parseOpenSpec(projectPath);

  if (!result.found || !result.activeChange) {
    return {
      source: 'manual',
      tasks_done: 0,
      tasks_total: 0,
    };
  }

  return {
    source: 'openspec',
    change: result.activeChange.id,
    tasks_done: result.activeChange.tasksComplete,
    tasks_total: result.activeChange.tasksTotal,
  };
}
