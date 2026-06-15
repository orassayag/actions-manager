import { ActionDefinition } from '../index';
import { spawn } from 'child_process';

const seriesAndMovies: ActionDefinition = {
  name: 'seriesAndMovies',
  label: 'Series & Movies',
  schedulePeriod: undefined, // manual only
  pauseAfterRun: true, // was "pause" in the original bat
  run: async () => {
    await new Promise<void>((resolve, reject) => {
      const child = spawn('pnpm', ['run', 'add'], {
        cwd: 'C:\\Or\\web\\projects\\series-and-movies',
        stdio: 'inherit',
        shell: true,
      });

      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  },
};

export default seriesAndMovies;
