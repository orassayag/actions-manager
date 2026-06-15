import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selectWithEscape } from '../index';

// Create mock functions that can be manipulated
const mockRun = vi.fn().mockResolvedValue('Choice 1');
const mockCancel = vi.fn();

// Mock enquirer
vi.mock('enquirer', () => {
  return {
    default: {
      Select: class {
        run = mockRun;
        cancel = mockCancel;
      },
    },
  };
});

describe('Prompt Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRun.mockResolvedValue('Choice 1');
  });

  it('should return the selected choice', async () => {
    const choices = [
      { name: 'Choice 1', value: 'c1' },
      { name: 'Choice 2', value: 'c2' },
    ];

    const result = await selectWithEscape({
      message: 'Select something:',
      choices,
    });

    expect(result).toEqual({ escaped: false, value: 'c1' });
  });

  it('should return escaped: true when prompt throws', async () => {
    mockRun.mockRejectedValueOnce(new Error('Cancelled'));

    const result = await selectWithEscape({
      message: 'Select something:',
      choices: [{ name: 'A', value: 'a' }],
    });

    expect(result).toEqual({ escaped: true });
  });

  it('should handle cancel/escape in patchCancel', async () => {
    let cancelFn: Function = () => {};
    let rejectRun: (reason?: any) => void;

    mockRun.mockImplementationOnce(function (this: any) {
      cancelFn = this.cancel;
      return new Promise((_, reject) => {
        rejectRun = reject;
      });
    });

    mockCancel.mockImplementationOnce(() => {
      rejectRun(new Error('Cancelled'));
    });

    const resultPromise = selectWithEscape({
      message: 'Select something:',
      choices: [{ name: 'A', value: 'a' }],
    });

    // Wait a bit for the prompt to "run"
    await new Promise((r) => setTimeout(r, 10));

    // Trigger cancel
    cancelFn();

    const result = await resultPromise;
    expect(result).toEqual({ escaped: true });
  });
});
