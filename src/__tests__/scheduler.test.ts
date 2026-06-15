import { describe, it, expect, vi } from 'vitest';
import {
  formatTrigger,
  formatTriggers,
  getTaskFrequency,
  getTasksWithTriggers,
} from '../index';

vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

describe('Scheduler', () => {
  describe('getTasksWithTriggers', () => {
    it('should return empty array when stdout is empty', async () => {
      const { exec } = await import('child_process');
      (exec as any).mockImplementation((_cmd: string, _opts: any, cb: any) => {
        cb(null, { stdout: '   ' });
      });

      const tasks = await getTasksWithTriggers();
      expect(tasks).toEqual([]);
    });

    it('should return empty array when an error occurs during execution', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const { exec } = await import('child_process');
      (exec as any).mockImplementation((_cmd: string, _opts: any, cb: any) => {
        cb(new Error('PowerShell error'), { stdout: '' });
      });

      const tasks = await getTasksWithTriggers();
      expect(tasks).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return a single task as an array when PowerShell returns an object', async () => {
      const mockTask = {
        TaskName: 'singleTask',
        Triggers: {
          TriggerType: 'MSFT_TaskDailyTrigger',
          Enabled: true,
        },
      };

      const { exec } = await import('child_process');
      (exec as any).mockImplementation((_cmd: string, _opts: any, cb: any) => {
        cb(null, { stdout: JSON.stringify(mockTask) });
      });

      const tasks = await getTasksWithTriggers();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].TaskName).toBe('singleTask');
    });
  });

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

    it('should format Weekly triggers with array of days correctly', () => {
      const trigger = {
        TriggerType: 'MSFT_TaskWeeklyTrigger',
        StartBoundary: '2024-01-01T22:00:00',
        DaysOfWeek: ['Monday', 'Tuesday'],
        Enabled: true,
      };
      expect(formatTrigger(trigger)).toBe('Weekly 22:00 Mon');
    });

    it('should format Weekly triggers without days correctly', () => {
      const trigger = {
        TriggerType: 'MSFT_TaskWeeklyTrigger',
        StartBoundary: '2024-01-01T22:00:00',
        Enabled: true,
      } as any;
      expect(formatTrigger(trigger)).toBe('Weekly 22:00');
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

    it('should return Never when TriggerType is missing', () => {
      const trigger = {
        Enabled: true,
      } as any;
      expect(formatTrigger(trigger)).toBe('Never');
    });

    it('should format Boot triggers correctly', () => {
      const trigger = {
        TriggerType: 'MSFT_TaskBootTrigger',
        Enabled: true,
      };
      expect(formatTrigger(trigger)).toBe('At Startup');
    });

    it('should format Logon triggers correctly', () => {
      const trigger = {
        TriggerType: 'MSFT_TaskLogonTrigger',
        Enabled: true,
      };
      expect(formatTrigger(trigger)).toBe('At Logon');
    });

    it('should format Idle triggers correctly', () => {
      const trigger = {
        TriggerType: 'MSFT_TaskIdleTrigger',
        Enabled: true,
      };
      expect(formatTrigger(trigger)).toBe('When Idle');
    });

    it('should format Time triggers correctly', () => {
      const trigger = {
        TriggerType: 'MSFT_TaskTimeTrigger',
        StartBoundary: '2024-01-01T22:00:00',
        Enabled: true,
      };
      expect(formatTrigger(trigger)).toBe('Once 22:00');
    });
  });

  describe('formatTriggers', () => {
    it('should merge multiple daily triggers', () => {
      const triggers = [
        {
          TriggerType: 'MSFT_TaskDailyTrigger',
          StartBoundary: '2024-01-01T22:00:00',
          Enabled: true,
        },
        {
          TriggerType: 'MSFT_TaskDailyTrigger',
          StartBoundary: '2024-01-01T19:00:00',
          Enabled: true,
        },
      ];
      expect(formatTriggers(triggers)).toBe('Daily 22:00|19:00');
    });

    it('should handle multiple types of triggers', () => {
      const triggers = [
        {
          TriggerType: 'MSFT_TaskDailyTrigger',
          StartBoundary: '2024-01-01T22:00:00',
          Enabled: true,
        },
        {
          TriggerType: 'MSFT_TaskWeeklyTrigger',
          StartBoundary: '2024-01-01T02:00:00',
          DaysOfWeek: 'Saturday',
          Enabled: true,
        },
      ];
      expect(formatTriggers(triggers)).toBe('Daily 22:00 | Weekly 02:00 Sat');
    });

    it('should return "Never" if no triggers are enabled', () => {
      const triggers = [
        {
          TriggerType: 'MSFT_TaskDailyTrigger',
          StartBoundary: '2024-01-01T22:00:00',
          Enabled: false,
        },
      ];
      expect(formatTriggers(triggers)).toBe('Never');
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

    it('should return frequency for an existing task with multiple triggers', async () => {
      const mockTasks = [
        {
          TaskName: 'testTaskMultiple',
          Triggers: [
            {
              TriggerType: 'MSFT_TaskDailyTrigger',
              StartBoundary: '2024-01-01T10:00:00',
              Enabled: false,
            },
            {
              TriggerType: 'MSFT_TaskWeeklyTrigger',
              StartBoundary: '2024-01-01T12:00:00',
              DaysOfWeek: 'Monday',
              Enabled: true,
            },
          ],
        },
      ];

      const { exec } = await import('child_process');
      (exec as any).mockImplementation((_cmd: string, _opts: any, cb: any) => {
        cb(null, { stdout: JSON.stringify(mockTasks) });
      });

      const freq = await getTaskFrequency('testTaskMultiple');
      expect(freq).toBe('Weekly 12:00 Mon');
    });

    it('should return Never if no triggers are enabled', async () => {
      const mockTasks = [
        {
          TaskName: 'testTaskDisabled',
          Triggers: [
            {
              TriggerType: 'MSFT_TaskDailyTrigger',
              StartBoundary: '2024-01-01T10:00:00',
              Enabled: false,
            },
          ],
        },
      ];

      const { exec } = await import('child_process');
      (exec as any).mockImplementation((_cmd: string, _opts: any, cb: any) => {
        cb(null, { stdout: JSON.stringify(mockTasks) });
      });

      const freq = await getTaskFrequency('testTaskDisabled');
      expect(freq).toBe('Never');
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
