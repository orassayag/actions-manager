import { ActionDefinition } from '../types';
import { spawnAction } from '../utils/spawnAction';

const reposScanReporter: ActionDefinition = {
  name: 'reposScanReporter',
  label: 'Repos Scan Reporter',
  taskName: 'reposScanReporter',
  schedulePeriod: 'Weekly',
  pauseAfterRun: false,
  run: () => {
    spawnAction('reposScanReporter', 'pnpm', ['run', 'start', '--', 'AUTO'], {
      cwd: 'C:\\Or\\web\\projects\\repos-maintainer',
    });
  },
};

export default reposScanReporter;
