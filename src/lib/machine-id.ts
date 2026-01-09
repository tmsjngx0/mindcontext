import { createHash } from 'crypto';
import { hostname, userInfo } from 'os';
import { execSync } from 'child_process';

/**
 * Generate a unique machine identifier based on hostname, username, and git email.
 * Used to create unique filenames for update files.
 */
export function getMachineId(): { name: string; id: string } {
  const host = hostname();
  const user = userInfo().username;

  // Try to get git email for additional uniqueness
  let gitEmail = '';
  try {
    gitEmail = execSync('git config user.email', { encoding: 'utf8' }).trim();
  } catch {
    // Git not configured, use empty string
  }

  // Create hash for ID
  const hash = createHash('sha256')
    .update(`${host}-${user}-${gitEmail}`)
    .digest('hex')
    .substring(0, 8);

  // Create readable name
  const name = `${user}-${host}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  return { name, id: hash };
}

/**
 * Generate a timestamp string safe for filenames.
 * Format: YYYY-MM-DDTHH-MM-SS (uses dashes instead of colons)
 */
export function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, '');
}

/**
 * Generate a unique update filename.
 * Format: {timestamp}_{machine-name}_{machine-id}.json
 */
export function generateUpdateFilename(): string {
  const { name, id } = getMachineId();
  const timestamp = getTimestamp();
  return `${timestamp}_${name}_${id}.json`;
}
