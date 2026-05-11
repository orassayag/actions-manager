import { ActionDefinition } from '../types';
import { spawnSync } from 'child_process';

const seriesAndMovies: ActionDefinition = {
  name: 'seriesAndMovies',
  label: 'Series & Movies',
  schedulePeriod: undefined, // manual only
  pauseAfterRun: true, // was "pause" in the original bat
  run: async () => {
    await Promise.resolve();
    const result = spawnSync('pnpm', ['run', 'add'], {
      cwd: 'C:\\Or\\web\\projects\\series-and-movies',
      stdio: 'inherit',
      shell: true,
    });
    if (result.status !== 0) {
      throw new Error(`Process exited with code ${result.status}`);
    }
  },
};

export default seriesAndMovies;
