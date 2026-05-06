import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as child_process from 'child_process';
import dailyEventsBot from '../dailyEventsBot';
import syncDaily from '../syncDaily';
import syncAutoPackagesUpdater from '../syncAutoPackagesUpdater';
import seriesAndMovies from '../seriesAndMovies';
import reposScanReporter from '../reposScanReporter';
import contactsScanMaintainer from '../contactsScanMaintainer';
import globalPackageUpdater from '../globalPackageUpdater';

vi.mock('child_process', () => ({
  spawnSync: vi.fn(),
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
  ];

  actions.forEach(({ action, name }) => {
    describe(name, () => {
      it('should execute successfully', async () => {
        vi.spyOn(child_process, 'spawnSync').mockReturnValue({ status: 0 } as any);
        await action.run();
        expect(child_process.spawnSync).toHaveBeenCalled();
      });

      it('should throw error if process fails', async () => {
        vi.spyOn(child_process, 'spawnSync').mockReturnValue({ status: 1 } as any);
        await expect(action.run()).rejects.toThrow(/exited with code 1/);
      });
    });
  });

  describe('syncDaily', () => {
    it('should execute xcopy successfully', async () => {
      vi.spyOn(child_process, 'spawnSync').mockReturnValue({ status: 0 } as any);
      // Mock setTimeout to avoid waiting 5 seconds in tests
      vi.useFakeTimers();
      const promise = syncDaily.run();
      vi.runAllTimers();
      await promise;
      expect(child_process.spawnSync).toHaveBeenCalledWith('xcopy', expect.any(Array), expect.any(Object));
      vi.useRealTimers();
    });

    it('should throw error if xcopy fails', async () => {
      vi.spyOn(child_process, 'spawnSync').mockReturnValue({ status: 4 } as any);
      await expect(syncDaily.run()).rejects.toThrow(/xcopy exited with code 4/);
    });
  });
});
