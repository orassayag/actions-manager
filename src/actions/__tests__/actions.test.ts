import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as child_process from 'child_process';
import * as fs from 'fs';
import {
  dailyEventsBot,
  syncDaily,
  syncAutoPackagesUpdater,
  seriesAndMovies,
  reposScanReporter,
  contactsScanMaintainer,
  globalPackageUpdater,
  backupsManager,
  logsCleaner,
  nodeWatchdog,
} from '../index';

vi.mock('child_process', () => ({
  spawnSync: vi.fn(),
  spawn: vi.fn(),
  execSync: vi.fn(),
}));

vi.mock('fs', () => ({
  appendFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

describe('Actions Implementation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const actions = [
    { action: dailyEventsBot, name: 'dailyEventsBot' },
    { action: syncAutoPackagesUpdater, name: 'syncAutoPackagesUpdater' },
    { action: seriesAndMovies, name: 'seriesAndMovies' },
    { action: reposScanReporter, name: 'reposScanReporter' },
    { action: contactsScanMaintainer, name: 'contactsScanMaintainer' },
    { action: globalPackageUpdater, name: 'globalPackageUpdater' },
    { action: backupsManager, name: 'backupsManager' },
  ];

  const mockProcessResult = (status: number): void => {
    vi.mocked(child_process.spawnSync).mockReturnValue({
      status,
    } as any);

    const mockChild = {
      on: vi.fn((event: string, callback: (code: number) => void): any => {
        if (event === 'exit') {
          setTimeout(() => callback(status), 0);
        }
        return mockChild;
      }),
    };
    vi.mocked(child_process.spawn).mockReturnValue(mockChild as any);
  };

  actions.forEach(({ action, name }) => {
    describe(name, () => {
      it('should execute successfully', async () => {
        mockProcessResult(0);
        await action.run();
        const spawnSyncCalled =
          vi.mocked(child_process.spawnSync).mock.calls.length > 0;
        const spawnCalled =
          vi.mocked(child_process.spawn).mock.calls.length > 0;
        expect(spawnSyncCalled || spawnCalled).toBe(true);
      });

      it('should throw error if process fails', async () => {
        mockProcessResult(1);
        await expect(async () => await action.run()).rejects.toThrow(
          /exited with code 1/
        );
      });
    });
  });

  describe('syncDaily', () => {
    it('should execute xcopy successfully', async () => {
      mockProcessResult(0);
      // Mock setTimeout to avoid waiting 5 seconds in tests
      vi.useFakeTimers();
      const promise = syncDaily.run();
      vi.runAllTimers();
      await promise;
      expect(child_process.spawnSync).toHaveBeenCalledWith(
        'xcopy',
        expect.any(Array),
        expect.any(Object)
      );
      vi.useRealTimers();
    });

    it('should throw error if xcopy fails', async () => {
      mockProcessResult(4);
      await expect(async () => await syncDaily.run()).rejects.toThrow(
        /Process exited with code 4/
      );
    });
  });

  describe('logsCleaner', () => {
    it('should execute successfully', async () => {
      vi.mocked(child_process.spawnSync).mockReturnValue({
        status: 0,
      } as any);
      await logsCleaner.run();
      expect(child_process.spawnSync).toHaveBeenCalled();
    });

    it('should throw error if process fails', async () => {
      vi.mocked(child_process.spawnSync).mockReturnValue({
        status: 1,
      } as any);
      await expect(async () => await logsCleaner.run()).rejects.toThrow(
        /Process exited with code 1/
      );
    });

    it('should throw error if spawnSync has error', async () => {
      const testError = new Error('spawn error');
      vi.mocked(child_process.spawnSync).mockReturnValue({
        error: testError,
      } as any);
      await expect(async () => await logsCleaner.run()).rejects.toThrow(
        testError
      );
    });
  });

  describe('nodeWatchdog', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    });

    it('should execute successfully without errors', async () => {
      vi.mocked(child_process.execSync).mockReturnValue('');
      await nodeWatchdog.run();
    });

    it('should handle getProcessList errors', async () => {
      vi.mocked(child_process.execSync).mockImplementation(() => {
        throw new Error('WMIC error');
      });
      await nodeWatchdog.run();
    });

    it('should handle log file write errors', async () => {
      vi.mocked(child_process.execSync).mockReturnValue('');
      vi.mocked(fs.mkdirSync).mockImplementation(() => {
        throw new Error('mkdir error');
      });
      await nodeWatchdog.run();
      expect(fs.mkdirSync).toHaveBeenCalled();
    });

    it('should handle processes without creation date', async () => {
      const mockWmicOutput = `Node,Name,ProcessId,CommandLine,CreationDate
node.exe,node.exe,1234,test command,`;
      vi.mocked(child_process.execSync).mockReturnValueOnce(mockWmicOutput);
      await nodeWatchdog.run();
    });

    it('should handle non-scheduler spawned processes', async () => {
      const mockWmicOutput = `Node,Name,ProcessId,CommandLine,CreationDate
node.exe,node.exe,1234,test command,20250615120000.123456+060`;
      vi.mocked(child_process.execSync)
        .mockReturnValueOnce(mockWmicOutput)
        .mockReturnValue('ParentProcessId=5678')
        .mockReturnValue('Name=explorer.exe');
      await nodeWatchdog.run();
    });

    it('should handle processes within time limit', async () => {
      const mockWmicOutput = `Node,Name,ProcessId,CommandLine,CreationDate
node.exe,node.exe,1234,test command,20250615120000.123456+060`;
      vi.mocked(child_process.execSync)
        .mockReturnValueOnce(mockWmicOutput)
        .mockReturnValue('ParentProcessId=5678')
        .mockReturnValue('Name=svchost.exe');
      await nodeWatchdog.run();
    });

    it('should handle processes exceeding time limit and kill them', async () => {
      // Mock Date.now() to return a date far in the future
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T12:00:00Z').getTime());

      const mockWmicOutput = `Node,Name,ProcessId,CommandLine,CreationDate
node.exe,node.exe,1234,test command,20250101120000.123456+060`;
      vi.mocked(child_process.execSync)
        .mockReturnValueOnce(mockWmicOutput)
        .mockReturnValueOnce('ParentProcessId=5678')
        .mockReturnValueOnce('Name=svchost.exe')
        .mockReturnValueOnce(
          'SUCCESS: The process with PID 1234 has been terminated.'
        );
      await nodeWatchdog.run();

      vi.useRealTimers();
    });

    it('should handle failed process kill', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T12:00:00Z').getTime());

      const mockWmicOutput = `Node,Name,ProcessId,CommandLine,CreationDate
node.exe,node.exe,1234,test command,20250101120000.123456+060`;
      vi.mocked(child_process.execSync)
        .mockReturnValueOnce(mockWmicOutput)
        .mockReturnValueOnce('ParentProcessId=5678')
        .mockReturnValueOnce('Name=svchost.exe')
        .mockImplementationOnce(() => {
          throw new Error('taskkill failed');
        });
      await nodeWatchdog.run();

      vi.useRealTimers();
    });

    it('should handle getParentPid errors', async () => {
      const mockWmicOutput = `Node,Name,ProcessId,CommandLine,CreationDate
node.exe,node.exe,1234,test command,20250615120000.123456+060`;
      vi.mocked(child_process.execSync)
        .mockReturnValueOnce(mockWmicOutput)
        .mockImplementationOnce(() => {
          throw new Error('getParentPid error');
        });
      await nodeWatchdog.run();
    });

    it('should handle getProcessName errors', async () => {
      const mockWmicOutput = `Node,Name,ProcessId,CommandLine,CreationDate
node.exe,node.exe,1234,test command,20250615120000.123456+060`;
      vi.mocked(child_process.execSync)
        .mockReturnValueOnce(mockWmicOutput)
        .mockReturnValue('ParentProcessId=5678')
        .mockImplementationOnce(() => {
          throw new Error('getProcessName error');
        });
      await nodeWatchdog.run();
    });

    it('should handle scheduler walk depth - parent pid is 0', async () => {
      const mockWmicOutput = `Node,Name,ProcessId,CommandLine,CreationDate
node.exe,node.exe,1234,test command,20250615120000.123456+060`;
      vi.mocked(child_process.execSync)
        .mockReturnValueOnce(mockWmicOutput)
        .mockReturnValue('ParentProcessId=0');
      await nodeWatchdog.run();
    });

    it('should handle scheduler walk depth - parent pid equals current', async () => {
      const mockWmicOutput = `Node,Name,ProcessId,CommandLine,CreationDate
node.exe,node.exe,1234,test command,20250615120000.123456+060`;
      vi.mocked(child_process.execSync)
        .mockReturnValueOnce(mockWmicOutput)
        .mockReturnValue('ParentProcessId=1234');
      await nodeWatchdog.run();
    });

    it('should handle scheduler walk depth - parent name is not in host names', async () => {
      const mockWmicOutput = `Node,Name,ProcessId,CommandLine,CreationDate
node.exe,node.exe,1234,test command,20250615120000.123456+060`;
      vi.mocked(child_process.execSync)
        .mockReturnValueOnce(mockWmicOutput)
        .mockReturnValue('ParentProcessId=5678')
        .mockReturnValue('Name=explorer.exe')
        .mockReturnValue('ParentProcessId=7890')
        .mockReturnValue('Name=notepad.exe')
        .mockReturnValue('ParentProcessId=1111')
        .mockReturnValue('Name=chrome.exe')
        .mockReturnValue('ParentProcessId=2222')
        .mockReturnValue('Name=firefox.exe')
        .mockReturnValue('ParentProcessId=3333')
        .mockReturnValue('Name=code.exe')
        .mockReturnValue('ParentProcessId=4444')
        .mockReturnValue('Name=terminal.exe');
      await nodeWatchdog.run();
    });

    it('should handle process listing with node.exe processes', async () => {
      const mockWmicOutput = `Node,Name,ProcessId,CommandLine,CreationDate
node.exe,node.exe,1234,test command,20250615120000.123456+060`;
      vi.mocked(child_process.execSync)
        .mockReturnValueOnce(mockWmicOutput)
        .mockReturnValue('ParentProcessId=5678')
        .mockReturnValue('Name=svchost.exe');
      await nodeWatchdog.run();
    });
  });
});
