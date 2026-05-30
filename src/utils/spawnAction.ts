// src/utils/spawnAction.ts
import { spawn } from 'child_process';
import { logger } from '../logging';

export function spawnAction(
  label: string,
  cmd: string,
  args: string[],
  options: { cwd: string }
): Promise<void> {
  logger.debug(`Spawning ${label} in ${options.cwd}`);

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      ...options,
      stdio: 'pipe', // capture streams
      shell: true,
    });

    let stdoutBuf = '';
    let stderrBuf = '';

    // Stream in real-time to parent console AND buffer
    child.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      process.stdout.write(text); // real-time console output
      stdoutBuf += text;
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      process.stderr.write(text); // real-time console output
      stderrBuf += text;
    });

    child.on('error', (err) => {
      logger.error(`Failed to spawn ${label}`, {
        error: err.message,
        stderr: stderrBuf.trim(),
      });
      reject(err);
    });

    child.on('close', (code) => {
      const stdout = stdoutBuf.trim();
      const stderr = stderrBuf.trim();

      if (code !== 0) {
        logger.error(`${label} exited with code ${code}`, { stdout, stderr });
        reject(new Error(`Process exited with code ${code}`));
      } else {
        logger.debug(`${label} completed successfully`);
        resolve();
      }
    });
  });
}
