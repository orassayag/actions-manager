import { describe, it, expect, vi } from 'vitest';
import { formatTrigger, getTaskFrequency } from '../scheduler';

vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

describe('Scheduler', () => {
  describe('formatTrigger', () => {
    it('should format Daily triggers correctly', () => {
      const trigger = {
        TriggerType: 'MSFT_TaskDailyTrigger',
        StartBoundary: '2024-01-01T22:00:00',
        Enabled: true,
      };
      // Note: toLocaleTimeString depends on locale, so we might need to be careful.
      // But we used 'en-GB' and hour12: false in the implementation.
      expect(formatTrigger(trigger)).toBe('Daily 22:00');
    });

    it('should format Weekly triggers correctly', () => {
      const trigger = {
        TriggerType: 'MSFT_TaskWeeklyTrigger',
        StartBoundary: '2024-01-01T22:00:00',
        DaysOfWeek: 'Saturday',
        Enabled: true,
      };
      expect(formatTrigger(trigger)).toBe('Weekly 22:00 Sat');
    });

    it('should format Weekly triggers with bitmask correctly', () => {
      const trigger = {
        TriggerType: 'MSFT_TaskWeeklyTrigger',
        StartBoundary: '2024-01-01T22:00:00',
        DaysOfWeek: 64, // Saturday
        Enabled: true,
      };
      expect(formatTrigger(trigger)).toBe('Weekly 22:00 Sat');
    });

    it('should format Monthly triggers correctly', () => {
      const trigger = {
        TriggerType: 'MSFT_TaskMonthlyTrigger',
        StartBoundary: '2024-01-01T22:00:00',
        Enabled: true,
      };
      expect(formatTrigger(trigger)).toBe('Monthly 22:00');
    });

    it('should return Never for unknown triggers', () => {
      const trigger = {
        TriggerType: 'Unknown',
        Enabled: true,
      };
      expect(formatTrigger(trigger)).toBe('Never');
    });
  });

  describe('getTaskFrequency', () => {
    it('should return frequency for an existing task', async () => {
      const mockTasks = [
        {
          TaskName: 'testTask',
          Triggers: {
            TriggerType: 'MSFT_TaskDailyTrigger',
            StartBoundary: '2024-01-01T10:00:00',
            Enabled: true,
          },
        },
      ];

      const { exec } = await import('child_process');
      (exec as any).mockImplementation((_cmd: string, _opts: any, cb: any) => {
        cb(null, { stdout: JSON.stringify(mockTasks) });
      });

      const freq = await getTaskFrequency('testTask');
      expect(freq).toBe('Daily 10:00');
    });

    it('should return Never if task not found', async () => {
      const { exec } = await import('child_process');
      (exec as any).mockImplementation((_cmd: string, _opts: any, cb: any) => {
        cb(null, { stdout: '[]' });
      });

      const freq = await getTaskFrequency('nonExistent');
      expect(freq).toBe('Never');
    });
  });
});
