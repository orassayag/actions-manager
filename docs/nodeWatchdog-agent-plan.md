# Agent Plan: Integrate `nodeWatchdog` into actions-manager

> You are working inside the `actions-manager` TypeScript project at `C:\Or\web\projects\actions-manager`.
> The human has already created the file `src/actions/nodeWatchdog.ts`. Your job is to wire it up correctly.

---

## Step 1 — Register the action

Open `src/registry.ts`. It exports an array of `ActionDefinition` objects.

- Import `nodeWatchdog` from `'./actions/nodeWatchdog'`
- Add `nodeWatchdog` to the exported actions array

---

## Step 2 — Fix imports inside `nodeWatchdog.ts`

Open `src/actions/nodeWatchdog.ts`. The file uses `ActionDefinition` from `'../types'`. Verify this path resolves correctly by checking where other actions (e.g. `dailyEventsBot.ts`) import `ActionDefinition` from, and align the import path to match exactly.

---

## Step 3 — Check the `schedulePeriod` field

Open `src/types.ts` and find the `ActionDefinition` interface.

- If `schedulePeriod` is a string union (e.g. `'Daily' | 'Weekly' | ...`), add `'Every6Hours'` to it — or replace the value in `nodeWatchdog.ts` with whatever literal your type already allows.
- If it is typed as `string`, no change needed.

---

## Step 4 — Ensure `C:\logs` is writable

The watchdog writes to `C:\logs\node-watchdog.log`. The code already calls `mkdirSync(LOG_DIR, { recursive: true })` so the directory will be auto-created. No manual action needed unless the process runs under a restricted Windows user — in that case, pre-create the folder and grant write access to the task scheduler user.

---

## Step 5 — Log to `ACTIONS_REPORT.txt`

The project has a reporting/history system (based on `refreshReport` and `recordRun` in `index.ts` and `history.ts`). The watchdog action must appear in `ACTIONS_REPORT.txt` like every other action.

**Top section (scheduled run header):** This is handled automatically by `runAction()` in `runner.ts` — it calls `recordRun` before and/or after executing the action. Verify that `runner.ts` calls `recordRun` (or equivalent) with the action name, trigger source (`'Task Scheduler'`), and timestamps. No changes should be needed here as long as the action is registered and called through the normal `runAction` flow.

**Bottom section (completion / result footer):** Same — `runAction` should record the outcome (success or thrown error) at the end. Confirm `runner.ts` wraps the `action.run()` call in a try/catch and records the final status. If it does, `nodeWatchdog` gets this for free.

If for any reason `ACTIONS_REPORT.txt` does not show `nodeWatchdog` entries after a run, look at how `recordRun` is called in `runner.ts` and confirm the action's `name` field (`'nodeWatchdog'`) matches what the report keys on.

---

## Step 6 — Smoke test

Run the following in the project root and confirm it executes without TypeScript errors and writes to both `C:\logs\node-watchdog.log` and `ACTIONS_REPORT.txt`:

```bat
pnpm start nodeWatchdog
```

Expected console output:

```
─── Node Watchdog started ───────────────────────────────
Found N node.exe process(es) total.
  PID XXXXX — age X.Xh — NOT a scheduler process, skipping.
  ...
─── Done. Killed: 0  Skipped: N ───────────────
```

If TypeScript compilation fails, report the exact error messages so they can be resolved.

---

## Step 7 — Confirm registry completeness

Run `pnpm start` with no arguments and verify `nodeWatchdog` appears in the interactive dropdown with the label **"Node Watchdog (kill stale Task Scheduler processes)"**. If it is missing, the registry import in Step 1 was not saved correctly.

---

> **Note:** The human will handle the Windows Task Scheduler configuration separately. Your work is complete once Step 6 passes cleanly.
