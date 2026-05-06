# Instructions

A centralized TypeScript Node.js actions manager designed to replace scattered `.bat` scripts and simplify Windows Task Scheduler automation.

## Setup Instructions

1. **Clone the project** to your local machine.
2. **Install dependencies**:
   ```bash
   pnpm install
   ```
3. **Configure Settings**:
   Edit [settings.ts](src/settings.ts) to define your `reportPath` (e.g., your Desktop).

## Prerequisites

- **Node.js**: v20 or higher.
- **pnpm**: Recommended package manager.
- **Task Scheduler**: For automated runs.

## Configuration

### Main Settings

Open [settings.ts](src/settings.ts) to manage:

- `reportPath`: The absolute path where `ACTIONS_REPORT.txt` is generated.

### Action Registration

All actions must be registered in [registry.ts](src/registry.ts) to be visible in the CLI and report.

### Action Definition

Each action is a TypeScript module in [src/actions/](src/actions/) implementing the `ActionDefinition` interface:

- `name`: Unique identifier (used for Task Scheduler arguments).
- `label`: Display name in CLI and report.
- `schedulePeriod`: Frequency label (Daily, Weekly, etc.).
- `pauseAfterRun`: Whether to keep the terminal open after manual execution.
- `run`: The async function containing the action logic.

## Running Scripts

### Interactive Mode (Manual)

Run the project-level or desktop batch file:

```bash
./actionsManager.bat
```

This launches the `enquirer` menu for manual action selection.

### Scheduled Mode (Task Scheduler)

Execute the batch file with an action name as an argument:

```bash
./actionsManager.bat dailyEventsBot
```

### Testing

```bash
pnpm test           # Run Vitest suite with coverage
pnpm test:watch     # Run tests in watch mode
```

## Quick Start Guide

1. **Install pnpm** if you haven't already.
2. **Run `pnpm install`** in the project root.
3. **Verify `settings.ts`** has a valid path for your report.
4. **Run `./actionsManager.bat`** to see the interactive menu.
5. **Configure Task Scheduler** for any automated tasks using the action names.

## File Structure

- [src/index.ts](src/index.ts): Main entry point.
- [src/registry.ts](src/registry.ts): Action registry.
- [src/runner.ts](src/runner.ts): Execution engine.
- [src/history.ts](src/history.ts): Persistence and reporting.
- [src/actions/](src/actions/): Individual action files.
- [data/history.json](data/history.json): Execution database.
- [actionsManager.bat](actionsManager.bat): Windows batch entry point.

## Author

- **Or Assayag** - _Initial work_ - [orassayag](https://github.com/orassayag)
- Or Assayag <orassayag@gmail.com>
- GitHub: https://github.com/orassayag
- StackOverflow: https://stackoverflow.com/users/4442606/or-assayag?tab=profile
- LinkedIn: https://linkedin.com/in/orassayag
