# Fix: Capture Child Process Output for All Actions

## Goal

Replace `stdio: 'inherit'` with `stdio: 'pipe'` across all actions and extract a shared `spawnAction` helper so failures always log stdout/stderr.

---

## Step 1 — Create the shared helper

**File to create:** `src/utils/spawnAction.ts`

```typescript
import { spawnSync, SpawnSyncOptions } from 'child_process';
import { logger } from '../logging';

export function spawnAction(
  label: string,
  cmd: string,
  args: string[],
  options: Omit<SpawnSyncOptions, 'stdio' | 'encoding'>
): void {
  logger.debug(`Spawning ${label} in ${options.cwd}`);

  const result = spawnSync(cmd, args, {
    ...options,
    stdio: 'pipe',
    encoding: 'utf-8',
    shell: true,
  });

  const stdout = (result.stdout as string)?.trim();
  const stderr = (result.stderr as string)?.trim();

  if (stdout) logger.debug(`${label} stdout:\n${stdout}`);
  if (stderr) logger.debug(`${label} stderr:\n${stderr}`);

  if (result.error) {
    logger.error(`Failed to spawn ${label}`, {
      error: result.error.message,
      stderr,
    });
    throw result.error;
  }

  if (result.status !== 0) {
    logger.error(`${label} exited with code ${result.status}`, {
      stdout,
      stderr,
    });
    throw new Error(`Process exited with code ${result.status}`);
  }

  logger.debug(`${label} completed successfully`);
}
```

---

## Step 2 — Update `dailyEventsBot.ts`

**File:** `src/actions/dailyEventsBot.ts`

Replace the `spawnSync` block inside `run` with:

```typescript
import { spawnAction } from '../utils/spawnAction';

// inside run:
run: async () => {
  spawnAction('daily-events-bot', 'pnpm', ['run', 'start'], {
    cwd: 'C:\\Or\\web\\projects\\daily-events-bot',
  });
},
```

Remove the old `spawnSync` import if it's no longer used elsewhere in the file.

---

## Step 3 — Update `contactsScanMaintainer.ts`

**File:** `src/actions/contactsScanMaintainer.ts`

Replace the `spawnSync` block inside `run` with:

```typescript
import { spawnAction } from '../utils/spawnAction';

// inside run:
run: async () => {
  spawnAction('contactsScanMaintainer', 'pnpm', ['run', 'start', '--', 'AUTO'], {
    cwd: 'C:\\Or\\web\\projects\\events-and-people-syncer',
  });
},
```

Remove the old `spawnSync` import if it's no longer used elsewhere in the file.

---

## Step 4 — Update all remaining action files

For every other file in `src/actions/` that uses `spawnSync`:

1. Import `spawnAction` from `../utils/spawnAction`
2. Replace the `spawnSync` call + error/status checks with a single `spawnAction(...)` call
3. Remove the now-unused `spawnSync` import

---

## Step 5 — Verify

- Run one action manually (e.g. `node dist/index.js dailyEventsBot`) and confirm stdout/stderr appear in the logs
- Trigger a known-failing action and confirm the error log now includes the subprocess output explaining the failure
