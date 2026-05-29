import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';
import { logger } from '../logging';

const reposScanReporter: ActionDefinition = {
  name: 'reposScanReporter',
  label: 'Repos Scan Reporter',
  taskName: 'reposScanReporter',
  schedulePeriod: 'Weekly',
  pauseAfterRun: false,
  run: async () => {
    const cwd = 'C:\\Or\\web\\projects\\repos-maintainer';
    logger.debug(`Spawning reposScanReporter in ${cwd}`);
    await Promise.resolve();
    const result = spawnSync('pnpm', ['run', 'start', '--', 'AUTO'], {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    if (result.error) {
      logger.error('Failed to spawn reposScanReporter', result.error);
      throw result.error;
    }

    if (result.status !== 0) {
      logger.error(`reposScanReporter exited with code ${result.status}`);
      throw new Error(`Process exited with code ${result.status}`);
    }
    logger.debug('reposScanReporter completed successfully');
  },
};

export default reposScanReporter;
