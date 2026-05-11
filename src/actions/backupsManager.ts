import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';

const backupsManager: ActionDefinition = {
  name: 'backupsManager',
  label: 'Backups Manager',
  schedulePeriod: 'Daily',
  pauseAfterRun: false,
  run: async () => {
    await Promise.resolve();
    const batPath = 'C:\\Users\\Or Assayag\\Desktop\\automatic-backup.bat';
    const result = spawnSync(`"${batPath}"`, {
      stdio: 'inherit',
      shell: true,
    });
    if (result.status !== 0) {
      throw new Error(`backupsManager exited with code ${result.status}`);
    }
  },
};

export default backupsManager;
