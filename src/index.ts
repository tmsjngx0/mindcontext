// Public API exports
export { init } from './commands/init.js';
export { connect } from './commands/connect.js';
export { sync } from './commands/sync.js';
export { pull } from './commands/pull.js';
export { context } from './commands/context.js';
export { progress } from './commands/progress.js';

// Library exports
export { getMachineId, getTimestamp, generateUpdateFilename } from './lib/machine-id.js';
export {
  isInitialized,
  readConfig,
  writeConfig,
  getMindcontextDir,
  getRepoDir,
  type Config,
  type ProjectConfig,
} from './lib/config.js';
export {
  createUpdateFile,
  readUpdateFiles,
  getLatestUpdate,
  getLatestByMachine,
  type UpdateFile,
  type ProgressData,
  type ContextData,
} from './lib/update-file.js';
export {
  hasOpenSpec,
  parseOpenSpec,
  getOpenSpecProgress,
  type OpenSpecChange,
  type OpenSpecResult,
} from './parsers/openspec.js';
