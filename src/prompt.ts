import Enquirer from 'enquirer';

const ESC_GUARD_MS = 200;
let lastEscTimestamp: number | null = null;

function recordEsc(): void {
  lastEscTimestamp = Date.now();
}

function msSinceLastEsc(): number {
  if (lastEscTimestamp === null) return Infinity;
  return Date.now() - lastEscTimestamp;
}

function patchCancel(prompt: any): void {
  let cancelled = false;
  const originalCancel = prompt.cancel.bind(prompt);

  prompt.cancel = (err?: any): any => {
    const age = msSinceLastEsc();
    if (age < ESC_GUARD_MS) {
      return; // swallow phantom cancel from readline timer
    }
    if (cancelled) return;
    cancelled = true;
    recordEsc();
    return originalCancel(err);
  };
}

export async function selectWithEscape<T = string>(config: {
  message: string;
  choices: { name: string; value: T }[];
  pageSize?: number;
}): Promise<{ escaped: boolean; value?: T }> {
  const choiceNames = config.choices.map((c) => c.name);

  let escaped = false;
  let value: T | undefined;
  let prompt: any;

  try {
    const { Select } = Enquirer as any;
    prompt = new Select({
      type: 'select',
      name: 'value',
      message: config.message,
      choices: choiceNames,
      limit: config.pageSize || 15,
      escape(): void {
        this.cancel();
      },
    });

    patchCancel(prompt);

    const result = await prompt.run();
    const choice = config.choices.find((c) => c.name === result);
    value = choice ? choice.value : (result as unknown as T);
  } catch {
    escaped = true;
  } finally {
    if (process.stdout.isTTY) {
      process.stdout.write('\u001b[?25h'); // show cursor
    }
  }

  return escaped ? { escaped: true } : { escaped: false, value };
}
