import { describe, it, expect, vi, beforeEach } from 'vitest';
import { main } from '../index';
import * as runner from '../runner';
import * as prompt from '../prompt';
import actions from '../registry';

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
    await main(['--help']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
  });

  it('should run scheduled action when argument is provided', async () => {
    const actionName = actions[0].name;
    await main([actionName]);
    expect(runner.runAction).toHaveBeenCalledWith(
      actions[0],
      'Task Scheduler',
      actions
    );
  });

  it('should run interactive mode when no argument is provided', async () => {
    const actionName = actions[0].name;
    vi.spyOn(prompt, 'selectWithEscape').mockResolvedValue({
      escaped: false,
      value: actionName,
    });

    await main([]);

    expect(prompt.selectWithEscape).toHaveBeenCalled();
    expect(runner.runAction).toHaveBeenCalledWith(
      actions[0],
      'Manual',
      actions
    );
  });

  it('should exit gracefully when interactive mode is escaped', async () => {
    vi.spyOn(prompt, 'selectWithEscape').mockResolvedValue({ escaped: true });
    const processSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    await expect(main([])).rejects.toThrow('exit');

    expect(processSpy).toHaveBeenCalledWith(0);
    processSpy.mockRestore();
  });

  it('should exit with error on unknown scheduled action', async () => {
    const processSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit 1');
    });

    await expect(main(['unknownAction'])).rejects.toThrow('exit 1');

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Unknown action: "unknownAction"')
    );
    expect(processSpy).toHaveBeenCalledWith(1);

    processSpy.mockRestore();
  });

  it('should handle "should never happen" action not found in interactive mode', async () => {
    vi.spyOn(prompt, 'selectWithEscape').mockResolvedValue({
      escaped: false,
      value: 'nonExistentAction',
    });
    const processSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit 1');
    });

    await expect(main([])).rejects.toThrow('exit 1');

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Action not found')
    );
    expect(processSpy).toHaveBeenCalledWith(1);

    processSpy.mockRestore();
  });
});
