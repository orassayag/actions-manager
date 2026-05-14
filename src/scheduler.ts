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
            TriggerType   = $_.CimClass.CimClassName
            StartBoundary = $_.StartBoundary
            DaysOfWeek    = $_.DaysOfWeek
            Enabled       = $_.Enabled
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

export async function getTaskFrequency(taskName: string): Promise<string> {
  const tasks = await getTasksWithTriggers();
  const task = tasks.find((t) => t.TaskName === taskName);

  if (!task || !task.Triggers) return 'Never';

  const triggers = Array.isArray(task.Triggers)
    ? task.Triggers
    : [task.Triggers];

  const activeTrigger = triggers.find((t) => t.Enabled);
  if (!activeTrigger) return 'Never';

  return formatTrigger(activeTrigger);
}
