import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';

const reposScanReporter: ActionDefinition = {
  name: 'reposScanReporter',
  label: 'Repos Scan Reporter',
  schedulePeriod: 'Weekly',
  pauseAfterRun: false,
  run: async () => {
    const result = spawnSync('npm', ['run', 'start', '--', 'AUTO'], {
      cwd: 'C:\\Or\\web\\projects\\repos-maintainer',
      stdio: 'inherit',
      shell: true,
    });
    if (result.status !== 0) {
      throw new Error(`Process exited with code ${result.status}`);
    }
  },
};

export default reposScanReporter;
