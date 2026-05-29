import { ActionDefinition } from '../types';
import { spawn } from 'child_process';
import { logger } from '../logging';

const seriesAndMovies: ActionDefinition = {
  name: 'seriesAndMovies',
  label: 'Series & Movies',
  schedulePeriod: undefined, // manual only
  pauseAfterRun: true, // was "pause" in the original bat
  run: async () => {
    const cwd = 'C:\\Or\\web\\projects\\series-and-movies';
    logger.debug(`Spawning seriesAndMovies in ${cwd}`);
    await new Promise<void>((resolve, reject) => {
      const child = spawn('pnpm', ['run', 'add'], {
        cwd,
        stdio: 'inherit',
        shell: true,
      });

      child.on('exit', (code) => {
        if (code === 0) {
          logger.debug('seriesAndMovies completed successfully');
          resolve();
        } else {
          logger.error(`seriesAndMovies exited with code ${code}`);
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      child.on('error', (err) => {
        logger.error('Failed to spawn seriesAndMovies', err);
        reject(err);
      });
    });
  },
};

export default seriesAndMovies;
