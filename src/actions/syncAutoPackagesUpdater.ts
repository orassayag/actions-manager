import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';

const syncAutoPackagesUpdater: ActionDefinition = {
  name: 'syncAutoPackagesUpdater',
  label: 'Auto Packages Updater',
  taskName: 'syncAutoPackagesUpdater',
  schedulePeriod: 'Daily',
  pauseAfterRun: false,
  run: async () => {
    await Promise.resolve();
    const result = spawnSync('pnpm', ['run', 'sync'], {
      cwd: 'C:\\Or\\web\\projects\\auto-packages-updater-ts',
      stdio: 'inherit',
      shell: true,
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(`Process exited with code ${result.status}`);
    }
  },
};

export default syncAutoPackagesUpdater;
