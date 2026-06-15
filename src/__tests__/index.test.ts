import { describe, it, expect, vi, beforeEach } from 'vitest';
import { main, actions } from '../index';
import * as runner from '../index';
import * as prompt from '../index';

vi.mock('../runner', () => ({
  runAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../prompt', () => ({
  selectWithEscape: vi.fn(),
}));

describe('Index Entry Point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should print usage and return on --help', async () => {
    const exitCode = await main(['--help']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
    expect(exitCode).toBe(0);
  });

  it('should run scheduled action when argument is provided', async () => {
    const actionName = actions[0].name;
    const exitCode = await main([actionName]);
    expect(runner.runAction).toHaveBeenCalledWith(
      actions[0],
      'Task Scheduler',
      actions
    );
    expect(exitCode).toBe(0);
  });

  it('should run interactive mode when no argument is provided', async () => {
    const actionName = actions[0].name;
    vi.spyOn(prompt, 'selectWithEscape').mockResolvedValue({
      escaped: false,
      value: actionName,
    });

    const exitCode = await main([]);

    expect(prompt.selectWithEscape).toHaveBeenCalled();
    expect(runner.runAction).toHaveBeenCalledWith(
      actions[0],
      'Manual',
      actions
    );
    expect(exitCode).toBe(0);
  });

  it('should exit gracefully when interactive mode is escaped', async () => {
    vi.spyOn(prompt, 'selectWithEscape').mockResolvedValue({ escaped: true });

    const exitCode = await main([]);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Bye!'));
    expect(exitCode).toBe(0);
  });

  it('should exit with error on unknown scheduled action', async () => {
    const exitCode = await main(['unknownAction']);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Unknown action: "unknownAction"')
    );
    expect(exitCode).toBe(1);
  });

  it('should handle "should never happen" action not found in interactive mode', async () => {
    vi.spyOn(prompt, 'selectWithEscape').mockResolvedValue({
      escaped: false,
      value: 'nonExistentAction',
    });

    const exitCode = await main([]);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Action not found')
    );
    expect(exitCode).toBe(1);
  });
});
