import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';

const syncAutoPackagesUpdater: ActionDefinition = {
  name: 'syncAutoPackagesUpdater',
  label: 'Auto Packages Updater',
  schedulePeriod: 'Weekly',
  pauseAfterRun: true, // was "pause" in the original bat
  run: async () => {
    const result = spawnSync('npm', ['run', 'start', '--', 'AUTO'], {
      cwd: 'C:\\Or\\web\\projects\\auto-packages-updater',
      stdio: 'inherit',
      shell: true,
    });
    if (result.status !== 0) {
      throw new Error(`Process exited with code ${result.status}`);
    }
  },
};

export default syncAutoPackagesUpdater;
