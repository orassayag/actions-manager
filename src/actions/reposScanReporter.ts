import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';

const reposScanReporter: ActionDefinition = {
  name: 'reposScanReporter',
  label: 'Repos Scan Reporter',
  taskName: 'reposScanReporter',
  schedulePeriod: 'Weekly',
  pauseAfterRun: false,
  run: async () => {
    await Promise.resolve();
    const result = spawnSync('pnpm', ['run', 'start', '--', 'AUTO'], {
      cwd: 'C:\\Or\\web\\projects\\repos-maintainer',
      stdio: 'inherit',
      shell: true,
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(`Process exited with code ${result.status}`);
    }
  },
};

export default reposScanReporter;
