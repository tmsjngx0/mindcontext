import { basename, resolve } from 'path';
import { isInitialized, readConfig } from '../lib/config.js';
import { getLatestByMachine, getLatestUpdate, UpdateFile } from '../lib/update-file.js';
import { getOpenSpecProgress, parseOpenSpec } from '../parsers/openspec.js';

export interface ContextOptions {
  json?: boolean;
  quiet?: boolean;
}

export interface ContextOutput {
  project: string;
  connected: boolean;
  progress: {
    source: 'openspec' | 'manual';
    change?: string;
    tasks_done: number;
    tasks_total: number;
    percentage: number;
  };
  lastUpdate?: {
    timestamp: string;
    machine: string;
    status: string;
    notes: string[];
    next: string[];
  };
  team: Array<{
    machine: string;
    timestamp: string;
    status: string;
  }>;
}

/**
 * Output current context for mindcontext-core integration.
 */
export async function context(options: ContextOptions = {}): Promise<void> {
  const projectPath = resolve(process.cwd());
  const projectName = basename(projectPath);

  // Check if initialized
  const initialized = isInitialized();
  const config = initialized ? readConfig() : null;
  const project = config?.projects[projectName];

  // Get progress from OpenSpec
  const progress = getOpenSpecProgress(projectPath);
  const percentage =
    progress.tasks_total > 0
      ? Math.round((progress.tasks_done / progress.tasks_total) * 100)
      : 0;

  // Build context output
  const output: ContextOutput = {
    project: projectName,
    connected: !!project,
    progress: {
      ...progress,
      percentage,
    },
    team: [],
  };

  // Get updates if connected
  if (project) {
    const latestUpdate = getLatestUpdate(projectName);
    if (latestUpdate) {
      output.lastUpdate = {
        timestamp: latestUpdate.timestamp,
        machine: latestUpdate.machine,
        status: latestUpdate.context.status,
        notes: latestUpdate.context.notes,
        next: latestUpdate.context.next,
      };
    }

    // Get team status
    const byMachine = getLatestByMachine(projectName);
    for (const [_machineId, update] of byMachine) {
      output.team.push({
        machine: update.machine,
        timestamp: update.timestamp,
        status: update.context.status,
      });
    }
  }

  if (options.json) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Human-readable output
  if (!options.quiet) {
    console.log(`Project: ${projectName}`);
    console.log(`Connected: ${output.connected ? 'Yes' : 'No'}`);
    console.log('');

    if (progress.source === 'openspec' && progress.change) {
      console.log(`Change: ${progress.change}`);
      console.log(`Progress: ${progress.tasks_done}/${progress.tasks_total} (${percentage}%)`);
    } else {
      console.log('Progress: No active change');
    }

    if (output.lastUpdate) {
      console.log('');
      console.log(`Last Update: ${output.lastUpdate.timestamp}`);
      console.log(`  Machine: ${output.lastUpdate.machine}`);
      console.log(`  Status: ${output.lastUpdate.status}`);
      if (output.lastUpdate.notes.length > 0) {
        console.log(`  Notes: ${output.lastUpdate.notes.join(', ')}`);
      }
      if (output.lastUpdate.next.length > 0) {
        console.log(`  Next: ${output.lastUpdate.next.join(', ')}`);
      }
    }

    if (output.team.length > 1) {
      console.log('');
      console.log('Team Activity:');
      for (const member of output.team) {
        console.log(`  ${member.machine}: ${member.status} (${member.timestamp})`);
      }
    }
  }
}
