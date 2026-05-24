import { describe, it, expect, vi } from 'vitest';
import { readTaskSchedulerActions } from '../status-reader';
import fs from 'fs';

vi.mock('fs');

describe('status-reader', () => {
  it('should parse ACTIONS_REPORT.txt correctly and filter for Task Scheduler actions', () => {
    const mockContent = `
Action                   | Last Run Type   | Frequency        | Last Run
-------------------------|-----------------|------------------|-------------------
Sync Daily Documents     | Task Scheduler  | Daily 22:00      | 23/05/2026 22:00:00
Auto Packages Updater    | Task Scheduler  | Daily 23:00      | 23/05/2026 23:00:00
Manual Action            | Manual          | Daily 10:00      | 24/05/2026 10:00:00
Invalid Date Action      | Task Scheduler  | Daily 05:00      | Invalid Date

Node-Windows Watchdog:
24/05/2026 09:00:00 - All run as expected!
    `;

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockContent);

    const actions = readTaskSchedulerActions();

    expect(actions).toHaveLength(2);
    expect(actions[0]).toEqual({
      name: 'Sync Daily Documents',
      lastRunType: 'Task Scheduler',
      frequency: 'Daily 22:00',
      lastRun: new Date('2026-05-23T22:00:00'),
    });
    expect(actions[1].name).toBe('Auto Packages Updater');
  });

  it('should throw error if report file does not exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    expect(() => readTaskSchedulerActions()).toThrow(/Report file not found/);
  });
});
