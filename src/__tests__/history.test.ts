import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import {
  getJerusalemTimestamp,
  loadHistory,
  recordRun,
  refreshReport,
} from '../history';
import { ActionDefinition } from '../types';

vi.mock('fs');
vi.mock('../scheduler', () => ({
  getTasksWithTriggers: vi.fn().mockResolvedValue([]),
  formatTrigger: vi.fn().mockReturnValue('Mock Frequency'),
  formatTriggers: vi.fn().mockReturnValue('Mock Frequency'),
}));

describe('History', () => {
  const mockAction: ActionDefinition = {
    name: 'testAction',
    label: 'Test Action',
    pauseAfterRun: false,
    run: async (): Promise<void> => {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getJerusalemTimestamp', () => {
    it('should return a formatted timestamp string', () => {
      const ts = getJerusalemTimestamp();
      // Format: dd/MM/yyyy HH:mm:ss
      expect(ts).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/);
    });
  });

  describe('loadHistory', () => {
    it('should return empty object if history file does not exist', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const history = loadHistory();
      expect(history).toEqual({});
    });

    it('should return parsed history if file exists', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(
        JSON.stringify({
          test: {
            lastRunAt: '2026-05-05T00:00:00Z',
            runType: 'Manual',
            status: 'Finished',
          },
        })
      );
      const history = loadHistory();
      expect(history.test).toBeDefined();
      expect(history.test.runType).toBe('Manual');
    });

    it('should return empty object on parse error', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('invalid json');
      const history = loadHistory();
      expect(history).toEqual({});
    });
  });

  describe('recordRun', () => {
    it('should save history and rebuild report', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const writeSpy = vi.spyOn(fs, 'writeFileSync');

      await recordRun(mockAction, 'Manual', [mockAction]);

      // Should call writeFileSync at least twice (one for history.json, one for report)
      expect(writeSpy).toHaveBeenCalledTimes(2);

      const historyCall = writeSpy.mock.calls.find((call) =>
        call[0].toString().includes('history.json')
      );
      expect(historyCall).toBeDefined();
      const savedHistory = JSON.parse(historyCall![1] as string);
      expect(savedHistory.testAction.runType).toBe('Manual');
      expect(savedHistory.testAction.status).toBe('Finished');
    });
  });

  describe('refreshReport sorting', () => {
    it('should sort actions by frequency (Daily > Weekly > Others > Never) and then by last run time', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      const writeSpy = vi.spyOn(fs, 'writeFileSync');

      const actions: ActionDefinition[] = [
        {
          name: 'a',
          label: 'Action A',
          schedulePeriod: 'Weekly',
          pauseAfterRun: false,
          run: async (): Promise<void> => {},
        },
        {
          name: 'b',
          label: 'Action B',
          schedulePeriod: 'Daily',
          pauseAfterRun: false,
          run: async (): Promise<void> => {},
        },
        {
          name: 'c',
          label: 'Action C',
          schedulePeriod: 'Daily',
          pauseAfterRun: false,
          run: async (): Promise<void> => {},
        },
        {
          name: 'd',
          label: 'Action D',
          schedulePeriod: 'Never',
          pauseAfterRun: false,
          run: async (): Promise<void> => {},
        },
      ];

      const history = {
        a: {
          lastRunAt: '2026-05-10T10:00:00Z',
          runType: 'Manual',
          status: 'Finished',
        }, // Weekly, 10:00
        b: {
          lastRunAt: '2026-05-10T12:00:00Z',
          runType: 'Manual',
          status: 'Finished',
        }, // Daily, 12:00
        c: {
          lastRunAt: '2026-05-10T08:00:00Z',
          runType: 'Manual',
          status: 'Finished',
        }, // Daily, 08:00
        d: {
          lastRunAt: '2026-05-10T09:00:00Z',
          runType: 'Manual',
          status: 'Finished',
        }, // Never, 09:00
      };

      vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(history));

      await refreshReport(actions);

      // Find the call to write the report file
      const reportCall = writeSpy.mock.calls.find(
        (call) =>
          !call[0].toString().includes('history.json') &&
          typeof call[1] === 'string' &&
          call[1].includes('Action')
      );

      expect(reportCall).toBeDefined();
      const reportContent = reportCall![1] as string;
      const lines = reportContent.split('\n');

      // Header is at lines[2], separator at lines[3], data starts at lines[4]
      // Expected order:
      // 1. Action C (Daily, 08:00) - Daily prio 1, early time
      // 2. Action B (Daily, 12:00) - Daily prio 1, late time
      // 3. Action A (Weekly, 10:00) - Weekly prio 2
      // 4. Action D (Never, 09:00) - Never prio 4

      expect(lines[4]).toContain('Action C');
      expect(lines[5]).toContain('Action B');
      expect(lines[6]).toContain('Action A');
      expect(lines[7]).toContain('Action D');
    });

    it('should put "Never" run actions first within their frequency category', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      const writeSpy = vi.spyOn(fs, 'writeFileSync');

      const actions: ActionDefinition[] = [
        {
          name: 'a',
          label: 'Action A',
          schedulePeriod: 'Daily',
          pauseAfterRun: false,
          run: async (): Promise<void> => {},
        },
        {
          name: 'b',
          label: 'Action B',
          schedulePeriod: 'Daily',
          pauseAfterRun: false,
          run: async (): Promise<void> => {},
        },
      ];

      const history = {
        a: {
          lastRunAt: '2026-05-10T10:00:00Z',
          runType: 'Manual',
          status: 'Finished',
        }, // Daily, 10:00
        // b has no history
      };

      vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(history));

      await refreshReport(actions);

      const reportCall = writeSpy.mock.calls.find(
        (call) =>
          !call[0].toString().includes('history.json') &&
          typeof call[1] === 'string' &&
          call[1].includes('Action')
      );

      const reportContent = reportCall![1] as string;
      const lines = reportContent.split('\n');

      expect(lines[4]).toContain('Action B'); // Never run (timestamp 0)
      expect(lines[5]).toContain('Action A'); // Ran at 10:00
    });
  });
});
