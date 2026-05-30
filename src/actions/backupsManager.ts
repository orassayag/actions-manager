import { ActionDefinition } from '../types';
import { spawnAction } from '../utils/spawnAction';

const backupsManager: ActionDefinition = {
  name: 'backupsManager',
  label: 'Backups Manager',
  taskName: 'backupsManager',
  schedulePeriod: 'Daily',
  pauseAfterRun: false,
  run: () => {
    spawnAction('backups-manager', 'pnpm', ['run', 'sync'], {
      cwd: 'C:\\Or\\web\\projects\\backups-manager',
    });
  },
};

export default backupsManager;
