/**
 * Returns true if the action should have completed before now
 * but its verified last-run timestamp predates its most recent scheduled slot.
 */
export function wasMissed(frequency: string, lastRun: Date): boolean {
  const now = new Date();
  const scheduledTime = getLastExpectedRunTime(frequency, now);
  if (!scheduledTime) return false;

  // Only flag as missed if the scheduled time has already passed
  if (now < scheduledTime) return false;

  return lastRun < scheduledTime;
}

function getLastExpectedRunTime(frequency: string, now: Date): Date | null {
  // Daily HH:MM
  const dailyMatch = frequency.match(/^Daily (\d{2}):(\d{2})$/);
  if (dailyMatch) {
    const [, hh, mm] = dailyMatch;
    const scheduled = new Date(now);
    scheduled.setHours(parseInt(hh), parseInt(mm), 0, 0);
    // If today's slot is in the future, use yesterday's
    if (scheduled > now) scheduled.setDate(scheduled.getDate() - 1);
    return scheduled;
  }

  // Weekly HH:MM Day (e.g. "Weekly 02:00 Sat")
  const weeklyMatch = frequency.match(/^Weekly (\d{2}):(\d{2}) (\w{3})$/);
  if (weeklyMatch) {
    const [, hh, mm, dayName] = weeklyMatch;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const targetDay = days.indexOf(dayName);
    if (targetDay === -1) return null;

    const scheduled = new Date(now);
    scheduled.setHours(parseInt(hh), parseInt(mm), 0, 0);
    const diff = (now.getDay() - targetDay + 7) % 7;
    scheduled.setDate(scheduled.getDate() - diff);
    if (scheduled > now) scheduled.setDate(scheduled.getDate() - 7);
    return scheduled;
  }

  // 'Never' or unrecognized
  return null;
}
