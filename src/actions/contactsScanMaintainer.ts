import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';
import { logger } from '../logging';

const contactsScanMaintainer: ActionDefinition = {
  name: 'contactsScanMaintainer',
  label: 'Contacts Scan Maintainer',
  taskName: 'contactsScanMaintainer',
  schedulePeriod: 'Weekly',
  pauseAfterRun: false,
  run: async () => {
    const cwd = 'C:\\Or\\web\\projects\\events-and-people-syncer';
    logger.debug(`Spawning contactsScanMaintainer in ${cwd}`);
    await Promise.resolve();
    const result = spawnSync('pnpm', ['run', 'start', '--', 'AUTO'], {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    if (result.error) {
      logger.error('Failed to spawn contactsScanMaintainer', result.error);
      throw result.error;
    }

    if (result.status !== 0) {
      logger.error(`contactsScanMaintainer exited with code ${result.status}`);
      throw new Error(`Process exited with code ${result.status}`);
    }
    logger.debug('contactsScanMaintainer completed successfully');
  },
};

export default contactsScanMaintainer;
