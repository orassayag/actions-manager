import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';

const globalPackageUpdater: ActionDefinition = {
  name: 'globalPackageUpdater',
  label: 'Global Package Updater',
  schedulePeriod: undefined, // manual only
  pauseAfterRun: true, // was "pause" in the original bat
  run: async () => {
    await Promise.resolve();
    const result = spawnSync('pnpm', ['run', 'start'], {
      cwd: 'C:\\Or\\web\\projects\\global-package-updater',
      stdio: 'inherit',
      shell: true,
    });
    if (result.status !== 0) {
      throw new Error(`Process exited with code ${result.status}`);
    }
  },
};

export default globalPackageUpdater;
