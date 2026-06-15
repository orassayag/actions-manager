# Setup and Usage Instructions

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Available Commands](#available-commands)
4. [Script Usage Guide](#script-usage-guide)
5. [Troubleshooting](#troubleshooting)
6. [Extending the Application](#extending-the-application)
7. [Best Practices](#best-practices)
8. [Documentation](#documentation)
9. [External Resources](#external-resources)

## Prerequisites

### System Requirements

- **Node.js**: Version 20 or higher recommended
- **Package Manager**: pnpm (recommended) or npm
- **Operating System**: Windows (primary target for `.bat` integration)
- **Memory**: 2GB RAM minimum
- **Disk Space**: 200MB for application and dependencies

### Task Scheduler Requirements

- Administrative access to create tasks in Windows Task Scheduler
- Basic understanding of task triggers and arguments

## Initial Setup

### 1. Install Dependencies

**Using pnpm (recommended):**

```bash
pnpm install
```

**Using npm:**

```bash
npm install
```

**Verify installation:**

```bash
pnpm build
```

### 2. Configure Settings

#### Main Settings

Open [settings.ts](file:///c:/Or/web/projects/actions-manager/src/settings.ts) to manage:

- `reportPath`: The absolute path where `ACTIONS_REPORT.txt` is generated (e.g., your Desktop).

#### Action Registration

All actions must be registered in [registry.ts](file:///c:/Or/web/projects/actions-manager/src/registry.ts) to be visible in the CLI and report.

## Available Commands

### Development Commands

**Linting and Formatting:**

```bash
# Check code style and quality
pnpm lint

# Format all TypeScript files
pnpm format

# Check formatting without modifying files
pnpm format:check
```

**Building:**

```bash
# Compile TypeScript to JavaScript
pnpm build

# Development mode with auto-reload
pnpm dev
```

**Testing:**

```bash
# Run all tests with coverage
pnpm test

# Run tests in watch mode
pnpm test:watch

# Open Vitest UI
pnpm test:ui
```

### Running Scripts

**Interactive Mode (Manual):**

```bash
# Run the interactive manager
pnpm start

# Or via the batch file
./actionsManager.bat
```

**Scheduled Mode (Task Scheduler):**

```bash
# Execute with an action name argument
./actionsManager.bat dailyEventsBot
```

## Script Usage Guide

### Manual Execution

1. Run `actionsManager.bat`.
2. Use arrow keys to select an action.
3. Press `Enter` to execute or `Esc` to exit.
4. The terminal may pause after execution if `pauseAfterRun` is set to `true` in the action definition.

### Automated Execution (Task Scheduler)

1. Open **Task Scheduler**.
2. Create a new **Basic Task**.
3. Set your desired **Trigger** (Daily, Weekly, etc.).
4. For **Action**, select **Start a program**.
5. **Program/script**: `C:\path\to\actions-manager\actionsManager.bat`.
6. **Add arguments**: `<actionName>` (e.g., `dailyEventsBot`).
7. **Start in**: `C:\path\to\actions-manager`.

## Troubleshooting

### Common Issues and Solutions

#### Action Not Found

**Problem**: "Unknown action: 'actionName'"

**Solutions**:

1. Verify the action name matches the `name` field in the action file.
2. Ensure the action is registered in [registry.ts](file:///c:/Or/web/projects/actions-manager/src/registry.ts).

#### Task Scheduler Failures

**Problem**: Task runs but fails to execute the action correctly.

**Solutions**:

1. Check "Start in" directory in Task Scheduler (must be the project root).
2. Ensure `pnpm` and `tsx` are in the system PATH.
3. Check `data/history.json` or `ACTIONS_REPORT.txt` for error messages.

#### Path Issues

**Problem**: Report not generated or history not saved.

**Solutions**:

1. Verify `reportPath` in [settings.ts](file:///c:/Or/web/projects/actions-manager/src/settings.ts) is a valid absolute path.
2. Ensure the `data/` directory exists and is writable.

## Extending the Application

### Adding New Actions

1. **Create Action File**: Add a new file in `src/actions/` (e.g., `myAction.ts`).
2. **Implement Interface**: Export a default object implementing `ActionDefinition`.
3. **Register Action**: Import and add to the `actions` array in [registry.ts](file:///c:/Or/web/projects/actions-manager/src/registry.ts).

```typescript
import { ActionDefinition } from '../types';

const myAction: ActionDefinition = {
  name: 'myAction',
  label: 'My Action',
  schedulePeriod: 'Daily',
  run: async () => {
    // Your logic here
  },
};
export default myAction;
```

## Best Practices

1. **Keep Actions Modular**: Each action should handle one specific task.
2. **Use Robust Sub-processes**: Use `spawnSync` for external commands to ensure proper lifecycle management.
3. **Meaningful Labels**: Labels should be clear for users selecting them in the interactive menu.
4. **Regular Testing**: Run `pnpm test` before committing changes to ensure core logic remains stable.
5. **Monitor Reports**: Check the generated status reports regularly to identify failing automated tasks.

## Documentation

- **README.md**: General project overview and features.
- **CHANGELOG.md**: History of changes and versions.
- **Architecture Flow**: See the Mermaid diagram in [README.md](file:///c:/Or/web/projects/actions-manager/README.md).

## External Resources

- [Node.js Documentation](https://nodejs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Enquirer Documentation](https://github.com/enquirer/enquirer)

## Author

- **Or Assayag** - _Initial work_ - [orassayag](https://github.com/orassayag)
- Or Assayag <orassayag@gmail.com>
- GitHub: https://github.com/orassayag
- StackOverflow: https://stackoverflow.com/users/4442606/or-assayag?tab=profile
- LinkedIn: https://linkedin.com/in/orassayag

---

**Last Updated**: June 2026
**Version**: 1.0.0
