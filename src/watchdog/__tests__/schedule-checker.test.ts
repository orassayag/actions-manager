import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { wasMissed } from '../schedule-checker';

describe('schedule-checker', () => {
  beforeEach(() => {
    // Mock "now" to 2026-05-24 08:00:00 (Sunday)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-24T08:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Daily tasks', () => {
    it('should return false if last run was after the scheduled time', () => {
      // Scheduled for 22:00 (yesterday), ran at 22:05
      const lastRun = new Date('2026-05-23T22:05:00');
      expect(wasMissed('Daily 22:00', lastRun)).toBe(false);
    });

    it('should return true if last run was before the scheduled time', () => {
      // Scheduled for 22:00 (yesterday), ran at 21:55
      const lastRun = new Date('2026-05-23T21:55:00');
      expect(wasMissed('Daily 22:00', lastRun)).toBe(true);
    });

    it('should return false if scheduled for the future (today)', () => {
      // Scheduled for 22:00 (today), ran yesterday
      const lastRun = new Date('2026-05-23T22:00:00');
      // getLastExpectedRunTime should return yesterday's 22:00 slot because 08:00 < 22:00
      expect(wasMissed('Daily 22:00', lastRun)).toBe(false);
    });
  });

  describe('Weekly tasks', () => {
    it('should return false if last run was after weekly scheduled slot', () => {
      // Scheduled for Saturday 02:00. Today is Sunday 08:00.
      // Last run: Saturday 02:30
      const lastRun = new Date('2026-05-23T02:30:00');
      expect(wasMissed('Weekly 02:00 Sat', lastRun)).toBe(false);
    });

    it('should return true if last run was before weekly scheduled slot', () => {
      // Scheduled for Saturday 02:00. Today is Sunday 08:00.
      // Last run: Friday 23:00
      const lastRun = new Date('2026-05-22T23:00:00');
      expect(wasMissed('Weekly 02:00 Sat', lastRun)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should return false for "Never" frequency', () => {
      const lastRun = new Date('2020-01-01T00:00:00');
      expect(wasMissed('Never', lastRun)).toBe(false);
    });

    it('should return false for unrecognized frequency', () => {
      const lastRun = new Date('2020-01-01T00:00:00');
      expect(wasMissed('Monthly 01:00', lastRun)).toBe(false);
    });
  });
});
