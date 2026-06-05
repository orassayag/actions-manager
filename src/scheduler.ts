import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface TaskTrigger {
  TriggerType: string;
  StartBoundary?: string; // e.g. "2024-01-01T22:00:00"
  DaysOfWeek?: string | string[] | number;
  DaysInterval?: number;
  WeeksInterval?: number;
  RepetitionInterval?: string;
  Enabled: boolean;
}

export interface ScheduledTask {
  TaskName: string;
  TaskPath: string;
  State: string;
  Triggers: TaskTrigger[];
  Description: string;
}

export async function getTasksWithTriggers(): Promise<ScheduledTask[]> {
  const psCommand = `
    $ErrorActionPreference = 'SilentlyContinue'
    $tasks = Get-ScheduledTask | Where-Object { $_.Triggers -ne $null } | ForEach-Object {
      $task = $_
      [PSCustomObject]@{
        TaskName = $task.TaskName
        Triggers = $task.Triggers | ForEach-Object {
          [PSCustomObject]@{
            TriggerType        = $_.CimClass.CimClassName
            StartBoundary      = $_.StartBoundary
            DaysOfWeek         = $_.DaysOfWeek
            RepetitionInterval = $_.Repetition.Interval
            Enabled            = $_.Enabled
          }
        }
      }
    }
    if ($tasks) { $tasks | ConvertTo-Json -Depth 3 } else { "[]" }
  `;

  try {
    // Use Base64 encoding for the command to avoid parsing issues with newlines and quotes
    const encodedCommand = Buffer.from(psCommand, 'utf16le').toString('base64');

    const { stdout } = await execAsync(
      `powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedCommand}`,
      { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer for large task lists
    );

    if (!stdout.trim()) return [];
    const parsed = JSON.parse(stdout);
    // PowerShell returns object (not array) if only 1 task found
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    console.error('Error fetching scheduled tasks:', error);
    return [];
  }
}

export function formatTrigger(trigger: TaskTrigger): string {
  const type = trigger.TriggerType ?? '';

  // 1. Check for repetition first (e.g. "Hourly x6")
  if (trigger.RepetitionInterval) {
    // RepetitionInterval is usually ISO8601 duration, e.g. "PT6H" or "PT15M"
    const match = trigger.RepetitionInterval.match(/PT(\d+)([HM])/);
    if (match) {
      const value = match[1];
      const unit = match[2];
      if (unit === 'H') {
        return `Hourly x${value}`;
      } else if (unit === 'M') {
        // e.g. PT20M -> Minutely x20
        return `Minutely x${value}`;
      }
    }
  }

  // Extract time from ISO string, e.g. "2024-01-01T22:00:00" => "22:00"
  let time = '';
  if (trigger.StartBoundary) {
    const date = new Date(trigger.StartBoundary);
    time = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  if (type.includes('Daily')) {
    return `Daily ${time}`;
  }

  if (type.includes('Weekly')) {
    let days = Array.isArray(trigger.DaysOfWeek)
      ? trigger.DaysOfWeek[0]
      : trigger.DaysOfWeek;

    if (!days) return `Weekly ${time}`;

    // Handle bitmask values if they come back as numbers
    // 1=Sun, 2=Mon, 4=Tue, 8=Wed, 16=Thu, 32=Fri, 64=Sat
    const bitmaskMap: { [key: number]: string } = {
      1: 'Sun',
      2: 'Mon',
      4: 'Tue',
      8: 'Wed',
      16: 'Thu',
      32: 'Fri',
      64: 'Sat',
    };

    let shortDay = '';
    if (typeof days === 'number' && bitmaskMap[days]) {
      shortDay = bitmaskMap[days];
    } else {
      shortDay = String(days).substring(0, 3);
    }

    return `Weekly ${time} ${shortDay}`;
  }

  if (type.includes('Monthly')) {
    return `Monthly ${time}`;
  }

  if (type.includes('Boot')) {
    return 'At Startup';
  }

  if (type.includes('Logon')) {
    return 'At Logon';
  }

  if (type.includes('Idle')) {
    return 'When Idle';
  }

  if (type.includes('Time') && time) {
    return `Once ${time}`;
  }

  return 'Never';
}

/**
 * Formats multiple triggers into a single string.
 * Example: "Daily 22:00|19:00" or "Weekly 02:00 Sat | Daily 10:00"
 */
export function formatTriggers(triggers: TaskTrigger[]): string {
  const activeTriggers = triggers.filter((t) => t.Enabled);
  if (activeTriggers.length === 0) return 'Never';

  // Group by base type (Daily, Weekly, etc.)
  const groups = new Map<string, string[]>();

  for (const trigger of activeTriggers) {
    const formatted = formatTrigger(trigger);
    if (formatted === 'Never') continue;

    const firstSpace = formatted.indexOf(' ');
    if (firstSpace === -1) {
      if (!groups.has(formatted)) groups.set(formatted, []);
      continue;
    }

    const base = formatted.substring(0, firstSpace);
    const detail = formatted.substring(firstSpace + 1);

    if (!groups.has(base)) groups.set(base, []);
    const details = groups.get(base)!;
    if (!details.includes(detail)) {
      details.push(detail);
    }
  }

  if (groups.size === 0) return 'Never';

  const results: string[] = [];
  for (const [base, details] of groups.entries()) {
    if (details.length === 0) {
      results.push(base);
    } else {
      // Sort details (times) descending to match user's example "22:00|19:00"
      details.sort((a, b) => b.localeCompare(a));
      results.push(`${base} ${details.join('|')}`);
    }
  }

  return results.join(' | ');
}

export async function getTaskFrequency(taskName: string): Promise<string> {
  const tasks = await getTasksWithTriggers();
  const task = tasks.find((t) => t.TaskName === taskName);

  if (!task || !task.Triggers) return 'Never';

  const triggers = Array.isArray(task.Triggers)
    ? task.Triggers
    : [task.Triggers];

  return formatTriggers(triggers);
}
