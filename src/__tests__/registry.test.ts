import { describe, it, expect } from 'vitest';
import { actions } from '../index';

describe('Actions Registry', () => {
  it('should have a list of actions', () => {
    expect(Array.isArray(actions)).toBe(true);
    expect(actions.length).toBeGreaterThan(0);
  });

  it('should have unique names for all actions', () => {
    const names = actions.map((a) => a.name);
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
  });

  it('should have unique task names for scheduled actions', () => {
    const taskNames = actions
      .map((a) => a.taskName)
      .filter((t): t is string => Boolean(t));
    const uniqueTaskNames = new Set(taskNames);
    expect(taskNames.length).toBe(uniqueTaskNames.size);
  });

  it('should have valid properties for all actions', () => {
    actions.forEach((action) => {
      expect(action).toHaveProperty('name');
      expect(action).toHaveProperty('label');
      expect(action).toHaveProperty('run');
      expect(typeof action.run).toBe('function');
      expect(typeof action.pauseAfterRun).toBe('boolean');
    });
  });

  it('should register the nightly syncRepos action', () => {
    const syncRepos = actions.find((a) => a.name === 'syncRepos');
    expect(syncRepos).toBeDefined();
    expect(syncRepos?.label).toBe('Sync Repos');
    expect(syncRepos?.taskName).toBe('syncRepos');
    expect(syncRepos?.schedulePeriod).toBe('Daily');
  });
});
