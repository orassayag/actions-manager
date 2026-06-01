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
  const parts = frequency.split(' | ');
  let latestScheduled: Date | null = null;

  for (const part of parts) {
    // Daily HH:MM|HH:MM
    const dailyMatch = part.match(/^Daily ([\d{2}:\d{2}|]+)$/);
    if (dailyMatch) {
      const times = dailyMatch[1].split('|');
      for (const time of times) {
        const [hh, mm] = time.split(':');
        if (!hh || !mm) continue;
        const scheduled = new Date(now);
        scheduled.setHours(parseInt(hh), parseInt(mm), 0, 0);
        // If today's slot is in the future, use yesterday's
        if (scheduled > now) scheduled.setDate(scheduled.getDate() - 1);
        if (!latestScheduled || scheduled > latestScheduled) {
          latestScheduled = scheduled;
        }
      }
      continue;
    }

    // Weekly HH:MM Day|HH:MM Day
    const weeklyMatch = part.match(/^Weekly ([\d{2}:\d{2} \w{3}|]+)$/);
    if (weeklyMatch) {
      const details = weeklyMatch[1].split('|');
      for (const detail of details) {
        const detailMatch = detail.match(/^(\d{2}):(\d{2}) (\w{3})$/);
        if (!detailMatch) continue;

        const [, hh, mm, dayName] = detailMatch;
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const targetDay = days.indexOf(dayName);
        if (targetDay === -1) continue;

        const scheduled = new Date(now);
        scheduled.setHours(parseInt(hh), parseInt(mm), 0, 0);
        const diff = (now.getDay() - targetDay + 7) % 7;
        scheduled.setDate(scheduled.getDate() - diff);
        if (scheduled > now) scheduled.setDate(scheduled.getDate() - 7);
        if (!latestScheduled || scheduled > latestScheduled) {
          latestScheduled = scheduled;
        }
      }
      continue;
    }

    // Single "Once HH:MM"
    const onceMatch = part.match(/^Once (\d{2}):(\d{2})$/);
    if (onceMatch) {
      const [, hh, mm] = onceMatch;
      const scheduled = new Date(now);
      scheduled.setHours(parseInt(hh), parseInt(mm), 0, 0);
      // We don't subtract a day for "Once" since it's... once.
      // But if it's in the past, it's the expected run time.
      if (scheduled <= now) {
        if (!latestScheduled || scheduled > latestScheduled) {
          latestScheduled = scheduled;
        }
      }
    }
  }

  return latestScheduled;
}
