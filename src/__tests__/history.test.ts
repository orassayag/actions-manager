import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import { getJerusalemTimestamp, loadHistory, recordRun } from '../history';
import { ActionDefinition } from '../types'; 

vi.mock('fs');
vi.mock('../scheduler', () => ({
  getTasksWithTriggers: vi.fn().mockResolvedValue([]),
  formatTrigger: vi.fn().mockReturnValue('Mock Frequency'),
}));

describe('History', () => {
  const mockAction: ActionDefinition = {
    name: 'testAction',
    label: 'Test Action',
    pauseAfterRun: false,
    run: async () => {},
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
});
