import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAction } from '../runner';
import { ActionDefinition } from '../types';
import * as history from '../history';
import * as readline from 'readline';

// Mock history module
vi.mock('../history', () => ({
  recordRun: vi.fn(),
}));

// Mock readline
vi.mock('readline', () => ({
  createInterface: vi.fn(),
}));

describe('Runner', () => {
  let mockAction: ActionDefinition;
  const allActions: ActionDefinition[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockAction = {
      name: 'testAction',
      label: 'Test Action',
      pauseAfterRun: false,
      run: vi.fn().mockResolvedValue(undefined),
    };
    allActions.push(mockAction);
  });

  it('should run an action and record it', async () => {
    await runAction(mockAction, 'Manual', allActions);

    expect(mockAction.run).toHaveBeenCalled();
    // Check both start and end calls
    expect(history.recordRun).toHaveBeenCalledWith(
      mockAction,
      'Manual',
      allActions,
      'Running'
    );
    expect(history.recordRun).toHaveBeenCalledWith(
      mockAction,
      'Manual',
      allActions,
      'Finished'
    );
  });

  it('should handle action errors gracefully', async () => {
    const error = new Error('Test error');
    mockAction.run = vi.fn().mockRejectedValue(error);

    await runAction(mockAction, 'Manual', allActions);

    expect(history.recordRun).toHaveBeenCalledWith(
      mockAction,
      'Manual',
      allActions,
      'Running'
    );
    expect(history.recordRun).toHaveBeenCalledWith(
      mockAction,
      'Manual',
      allActions,
      'Error'
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error in "Test Action":'),
      error
    );
  });

  it('should suppress log for "exited with code" errors', async () => {
    const error = new Error('Process exited with code 1');
    mockAction.run = vi.fn().mockRejectedValue(error);

    await runAction(mockAction, 'Manual', allActions);

    expect(console.error).not.toHaveBeenCalled();
  });

  it('should wait for key press if pauseAfterRun is true', async () => {
    mockAction.pauseAfterRun = true;
    const rlMock = {
      question: vi.fn((_msg, cb) => cb()),
      close: vi.fn(),
    };
    (readline.createInterface as any).mockReturnValue(rlMock);

    await runAction(mockAction, 'Manual', allActions);

    expect(readline.createInterface).toHaveBeenCalled();
    expect(rlMock.question).toHaveBeenCalledWith(
      expect.stringContaining('Press Enter to close'),
      expect.any(Function)
    );
    expect(rlMock.close).toHaveBeenCalled();
  });
});
