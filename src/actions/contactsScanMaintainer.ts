import { ActionDefinition } from '../types';
import { spawnAction } from '../utils/spawnAction';

const contactsScanMaintainer: ActionDefinition = {
  name: 'contactsScanMaintainer',
  label: 'Contacts Scan Maintainer',
  taskName: 'contactsScanMaintainer',
  schedulePeriod: 'Weekly',
  pauseAfterRun: false,
  run: () => {
    spawnAction(
      'contactsScanMaintainer',
      'pnpm',
      ['run', 'start', '--', 'AUTO'],
      {
        cwd: 'C:\\Or\\web\\projects\\events-and-people-syncer',
      }
    );
  },
};

export default contactsScanMaintainer;
