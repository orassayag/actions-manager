import { spawnSync } from 'node:child_process';
import type { ActionDefinition } from '../types.js';

const logsCleaner: ActionDefinition = {
  name: 'logsCleaner',
  label: 'Logs Cleaner',
  taskName: 'logsCleaner',
  schedulePeriod: 'Daily',
  pauseAfterRun: false,
  run: async () => {
    await Promise.resolve();

    const result = spawnSync('pnpm', ['run', 'start'], {
      cwd: 'C:\\Or\\web\\projects\\logs-cleaner',
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(`Process exited with code ${result.status}`);
    }
  },
};

export default logsCleaner;
