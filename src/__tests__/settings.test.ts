import { describe, it, expect } from 'vitest';
import { settings } from '../settings';

describe('Settings', () => {
  it('should have a valid report path', () => {
    expect(settings.reportPath).toBeDefined();
    expect(typeof settings.reportPath).toBe('string');
    expect(settings.reportPath).toContain('ACTIONS_REPORT.txt');
  });
});
