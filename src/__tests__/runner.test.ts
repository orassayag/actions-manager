import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAction } from '../runner';
import { ActionDefinition } from '../types';
import * as history from '../history';

// Mock history module
vi.mock('../history', () => ({
  recordRun: vi.fn(),
}));

describe('Runner', () => {
  let mockAction: ActionDefinition;
  const allActions: ActionDefinition[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(history.recordRun).toHaveBeenCalledWith(mockAction, 'Manual', allActions, 'Running');
    expect(history.recordRun).toHaveBeenCalledWith(mockAction, 'Manual', allActions, 'Finished');
  });

  it('should handle action errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');
    mockAction.run = vi.fn().mockRejectedValue(error);

    await runAction(mockAction, 'Manual', allActions);

    expect(history.recordRun).toHaveBeenCalledWith(mockAction, 'Manual', allActions, 'Running');
    expect(history.recordRun).toHaveBeenCalledWith(mockAction, 'Manual', allActions, 'Error');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error in "Test Action":'),
      error,
    );
    consoleSpy.mockRestore();
  });

  it('should suppress log for "exited with code" errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Process exited with code 1');
    mockAction.run = vi.fn().mockRejectedValue(error);
    
    await runAction(mockAction, 'Manual', allActions);
    
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
