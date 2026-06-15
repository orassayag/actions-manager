import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawnAction } from '../index';
import * as child_process from 'child_process';

vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

describe('spawnAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  it('should resolve when process exits with code 0', async () => {
    const mockChild = {
      stdout: {
        on: vi.fn(),
      },
      stderr: {
        on: vi.fn(),
      },
      on: vi.fn((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChild;
      }),
    };
    vi.mocked(child_process.spawn).mockReturnValue(mockChild as any);

    await spawnAction('test', 'cmd', ['arg'], { cwd: 'test' });
    expect(child_process.spawn).toHaveBeenCalled();
  });

  it('should reject when process exits with non-zero code', async () => {
    const mockChild = {
      stdout: {
        on: vi.fn(),
      },
      stderr: {
        on: vi.fn(),
      },
      on: vi.fn((event: string, callback: any) => {
        if (event === 'close') {
          callback(1);
        }
        return mockChild;
      }),
    };
    vi.mocked(child_process.spawn).mockReturnValue(mockChild as any);

    await expect(
      spawnAction('test', 'cmd', ['arg'], { cwd: 'test' })
    ).rejects.toThrow('Process exited with code 1');
  });

  it('should reject when there is a spawn error', async () => {
    const mockError = new Error('spawn error');
    const mockChild = {
      stdout: {
        on: vi.fn(),
      },
      stderr: {
        on: vi.fn(),
      },
      on: vi.fn((event: string, callback: any) => {
        if (event === 'error') {
          callback(mockError);
        }
        return mockChild;
      }),
    };
    vi.mocked(child_process.spawn).mockReturnValue(mockChild as any);

    await expect(
      spawnAction('test', 'cmd', ['arg'], { cwd: 'test' })
    ).rejects.toThrow(mockError);
  });

  it('should handle stdout and stderr data', async () => {
    const mockChild = {
      stdout: {
        on: vi.fn((event: string, callback: any) => {
          if (event === 'data') {
            callback(Buffer.from('stdout data'));
          }
          return mockChild.stdout;
        }),
      },
      stderr: {
        on: vi.fn((event: string, callback: any) => {
          if (event === 'data') {
            callback(Buffer.from('stderr data'));
          }
          return mockChild.stderr;
        }),
      },
      on: vi.fn((event: string, callback: any) => {
        if (event === 'close') {
          callback(0);
        }
        return mockChild;
      }),
    };
    vi.mocked(child_process.spawn).mockReturnValue(mockChild as any);

    await spawnAction('test', 'cmd', ['arg'], { cwd: 'test' });
    expect(process.stdout.write).toHaveBeenCalled();
    expect(process.stderr.write).toHaveBeenCalled();
  });
});
