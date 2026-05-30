import { ActionDefinition } from '../types';
import { spawnAction } from '../utils/spawnAction';

const seriesAndMovies: ActionDefinition = {
  name: 'seriesAndMovies',
  label: 'Series & Movies',
  schedulePeriod: undefined, // manual only
  pauseAfterRun: true, // was "pause" in the original bat
  run: () => {
    spawnAction('seriesAndMovies', 'pnpm', ['run', 'add'], {
      cwd: 'C:\\Or\\web\\projects\\series-and-movies',
    });
  },
};

export default seriesAndMovies;
