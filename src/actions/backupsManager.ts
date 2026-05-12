import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';

const backupsManager: ActionDefinition = {
  name: 'backupsManager',
  label: 'Backups Manager',
  schedulePeriod: 'Daily',
  pauseAfterRun: false,
  run: async () => {
    await Promise.resolve();
    const result = spawnSync('pnpm', ['run', 'sync'], {
      cwd: 'C:\\Or\\web\\projects\\backups-manager',
      stdio: 'inherit',
      shell: true,
    });
    if (result.status !== 0) {
      throw new Error(`Process exited with code ${result.status}`);
    }
  },
};

export default backupsManager;
