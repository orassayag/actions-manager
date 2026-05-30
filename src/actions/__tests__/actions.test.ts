import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as child_process from 'child_process';
import dailyEventsBot from '../dailyEventsBot';
import syncDaily from '../syncDaily';
import syncAutoPackagesUpdater from '../syncAutoPackagesUpdater';
import seriesAndMovies from '../seriesAndMovies';
import reposScanReporter from '../reposScanReporter';
import contactsScanMaintainer from '../contactsScanMaintainer';
import globalPackageUpdater from '../globalPackageUpdater';
import backupsManager from '../backupsManager';

vi.mock('child_process', () => ({
  spawnSync: vi.fn(),
  spawn: vi.fn(),
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
});
