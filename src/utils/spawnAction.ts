import { spawnSync, SpawnSyncOptions } from 'child_process';
import { logger } from '../logging';

export function spawnAction(
  label: string,
  cmd: string,
  args: string[],
  options: Omit<SpawnSyncOptions, 'stdio' | 'encoding'>
): void {
  logger.debug(`Spawning ${label} in ${options.cwd}`);

  const result = spawnSync(cmd, args, {
    ...options,
    stdio: 'pipe',
    encoding: 'utf-8',
    shell: true,
  });

  const stdout = (result.stdout as string)?.trim();
  const stderr = (result.stderr as string)?.trim();

  if (stdout) logger.debug(`${label} stdout:\n${stdout}`);
  if (stderr) logger.debug(`${label} stderr:\n${stderr}`);

  if (result.error) {
    logger.error(`Failed to spawn ${label}`, {
      error: result.error.message,
      stderr,
    });
    throw result.error;
  }

  if (result.status !== 0) {
    logger.error(`${label} exited with code ${result.status}`, {
      stdout,
      stderr,
    });
    throw new Error(`Process exited with code ${result.status}`);
  }

  logger.debug(`${label} completed successfully`);
}
