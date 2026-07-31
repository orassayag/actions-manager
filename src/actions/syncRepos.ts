import { ActionDefinition } from '../index';
import { spawnSync } from 'child_process';

const syncRepos: ActionDefinition = {
  name: 'syncRepos',
  label: 'Sync Repos',
  taskName: 'syncRepos',
  schedulePeriod: 'Daily',
  pauseAfterRun: false,
  run: async () => {
    await Promise.resolve();
    const result = spawnSync('pnpm', ['run', 'sync-repos'], {
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

export default syncRepos;
