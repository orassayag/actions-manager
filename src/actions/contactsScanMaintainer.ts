import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';

const contactsScanMaintainer: ActionDefinition = {
  name: 'contactsScanMaintainer',
  label: 'Contacts Scan Maintainer',
  taskName: 'contactsScanMaintainer',
  schedulePeriod: 'Weekly',
  pauseAfterRun: false,
  run: async () => {
    await Promise.resolve();
    const result = spawnSync('npm', ['run', 'start', '--', 'AUTO'], {
      cwd: 'C:\\Or\\web\\projects\\events-and-people-syncer',
      stdio: 'inherit',
      shell: true,
    });
    if (result.status !== 0) {
      throw new Error(`Process exited with code ${result.status}`);
    }
  },
};

export default contactsScanMaintainer;
