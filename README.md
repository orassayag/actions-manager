# Actions Manager

Actions Manager is a centralized TypeScript and Node.js automation platform designed to replace scattered .bat scripts and streamline Windows Task Scheduler. It provides a single entry point for running, organizing, and monitoring automation tasks through an interactive CLI or scheduled execution. Include execution history tracking, automatic report generation, strict TypeScript typing, robust error handling, ESM architecture, and testing with Vitest.

Built in May 2026, the project focuses on maintainability, reliability, and improving developer productivity for local automation workflows.

## Features

- 🎛️ Centralized action management with a single entry point (`actionsManager.bat`)
- 🖥️ Interactive CLI menu powered by `enquirer` for manual action selection
- 📅 Windows Task Scheduler integration for automated execution
- 📜 Automatic history logging to `data/history.json` and `ACTIONS_REPORT.txt`
- 📊 Real-time status reports for at-a-glance task monitoring
- ⏱️ Execution tracking with last run time and run type recording
- 🏗️ Modern ESM architecture with TypeScript for future-proof code
- 🛡️ Robust error handling (suppresses noisy stack traces for expected failures)
- 🔒 Full TypeScript with strict type checking
- 🧪 Comprehensive testing with Vitest (80%+ coverage requirement)
- ⌨️ ESC navigation support for graceful menu exits
- 🔇 Quiet mode to suppress Node.js deprecation warnings
- ⚡ Fast execution via `tsx`

### Core Capabilities

- **Centralized Action Management**: Single entry point for all project actions via `actionsManager.bat`.
- **Interactive CLI**: Dynamic dropdown menu powered by `enquirer` for manual action selection.
- **Task Scheduler Integration**: Direct execution mode optimized for Windows Task Scheduler.
- **Automatic History Logging**: Every run is recorded to `data/history.json` and `ACTIONS_REPORT.txt`.
- **Real-Time Status Reporting**: Generates monitoring reports for at-a-glance task status.
- **Execution Tracking**: Automatically records last execution time and run type for every action.

### Technical Excellence

- **Modern ESM Architecture**: Built using ES Modules and TypeScript for a future-proof codebase.
- **Robust Error Handling**: Suppresses noisy stack traces for expected failures while preserving them for crashes.
- **Type Safety**: Full TypeScript implementation with strict type checking.
- **Comprehensive Testing**: Full Vitest setup with high coverage requirements (80%+).

### Developer Experience

- **Unified Entry Point**: One `.bat` file replaces multiple scattered scripts on your desktop.
- **ESC Navigation**: Full support for `Esc` to exit menus gracefully.
- **Quiet Mode**: Suppresses Node.js deprecation warnings and unnecessary shell noise.
- **Automatic Documentation**: History and reports are generated automatically without manual intervention.
- **Fast Execution**: Uses `tsx` for high-performance execution of TypeScript files.

## Getting Started

### Prerequisites

- **Node.js**: v20 or higher recommended.
- **pnpm**: Fast, disk space efficient package manager.
- **TypeScript**: The project uses `tsx` for execution.

### Installation

1. Clone the repository:

```bash
git clone https://github.com/orassayag/actions-manager.git
cd actions-manager
```

2. Install dependencies:

```bash
pnpm install
```

3. Configure your report path:
   Edit [settings.ts](file:///c:/Or/web/projects/actions-manager/src/settings.ts) to set your desired `ACTIONS_REPORT.txt` location.

## Configuration

### Project Settings

Edit [settings.ts](file:///c:/Or/web/projects/actions-manager/src/settings.ts) to manage global configurations:

- `reportPath`: Absolute path where the status report will be generated (e.g., your Desktop).

### Adding New Actions

1. **Create the action file**: Create `src/actions/myNewAction.ts` implementing the `ActionDefinition` interface.
2. **Register the action**: Open `src/registry.ts`, import your action and add it to the `actions` array.

## Usage

### Interactive Menu (Recommended)

Start the interactive CLI menu to select and run actions manually:

```bash
./actionsManager.bat
```

### Task Scheduler Mode

Point your Task Scheduler task to the batch file and pass the action name as an argument:

- **Program/script**: `C:\path\to\actions-manager\actionsManager.bat`
- **Add arguments**: `actionName`
- **Start in**: `C:\path\to\actions-manager`

### Current Actions & Their Arguments

| Action Name (argument)    | Label                    | Schedule |
| ------------------------- | ------------------------ | -------- |
| `dailyEventsBot`          | Daily Events Bot         | Daily    |
| `syncDaily`               | Sync Daily Documents     | Daily    |
| `syncAutoPackagesUpdater` | Auto Packages Updater    | Weekly   |
| `syncRepos`               | Sync Repos               | Daily    |
| `seriesAndMovies`         | Series & Movies          | Manual   |
| `reposScanReporter`       | Repos Scan Reporter      | Weekly   |
| `contactsScanMaintainer`  | Contacts Scan Maintainer | Weekly   |
| `globalPackageUpdater`    | Global Package Updater   | Manual   |

## Best Practices

1. **Use Meaningful Labels**: Ensure action labels are descriptive for the CLI menu.
2. **Handle Sub-Processes**: Use `spawnSync` or `execSync` with `stdio: 'inherit'` to preserve interactive flows.
3. **Monitor the Report**: Periodically check `ACTIONS_REPORT.txt` on your desktop for task status.
4. **Test Before Scheduling**: Run actions manually via the CLI before setting them up in Task Scheduler.
5. **Keep Settings Local**: Use [settings.ts](file:///c:/Or/web/projects/actions-manager/src/settings.ts) for environment-specific paths.

## Available Scripts

### CLI Operations

**Start the interactive menu:**

```bash
pnpm start
```

**Run in live mode (disables dry-mode):**

```bash
pnpm start:live
```

**Run with no cache:**

```bash
pnpm start:no-cache
```

**Run in auto mode (for Task Scheduler):**

```bash
pnpm sync
```

**Development mode with auto-reload:**

```bash
pnpm dev
```

### Testing

**Run all tests:**

```bash
pnpm test
```

**Watch mode (during development):**

```bash
pnpm test:watch
```

**Run tests without coverage:**

```bash
pnpm test:no-coverage
```

**Run Vitest UI:**

```bash
pnpm test:ui
```

### Maintenance

**Lint code:**

```bash
pnpm lint
```

**Format code:**

```bash
pnpm format
pnpm format:check  # Check without modifying
```

**Compile TypeScript:**

```bash
pnpm build
```

## Development

### Code Quality

**Linting:**
The project uses ESLint with strict rules to ensure code quality and consistency.

```bash
pnpm lint
```

**Formatting:**
Prettier is used for code formatting. Always format your code before submitting a pull request.

```bash
pnpm format
```

### Building

**Compilation:**
Compile the TypeScript source to JavaScript:

```bash
pnpm build
```

**Execution:**
The project uses `tsx` for direct execution of TypeScript files during development.

### Architecture Principles

This project follows clean architecture principles:

1. **Layered Architecture**: Decoupled entry, interactive, execution, and history layers.
2. **Registry Pattern**: Centralized registration of actions for easy management.
3. **Single Responsibility**: Each action is a standalone module in the `actions/` directory.
4. **Robust Persistence**: JSON-based history tracking for reliable data storage.
5. **Fail-Safe Design**: Errors in one action don't prevent others from being managed.

## Directory Structure

```
actions-manager/
├── src/
│   ├── actions/          # Individual action implementations
│   ├── __tests__/        # Unit tests and infrastructure tests
│   ├── history.ts        # History tracking and report generation logic
│   ├── index.ts          # Main entry point and CLI logic
│   ├── prompt.ts         # Enquirer-based interactive menu logic
│   ├── registry.ts       # Central registry for all actions
│   ├── runner.ts         # Execution engine for actions
│   ├── settings.ts       # Global project settings
│   └── types.ts          # TypeScript interfaces and types
├── data/                 # Local JSON storage for execution history
├── dist/                 # Compiled JavaScript output
├── actionsManager.bat    # Main Windows entry point
├── vitest.config.ts      # Vitest configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies and scripts
```

## Design Patterns

- **Registry Pattern**: All actions are registered in a central registry for discovery.
- **Command Pattern**: Actions encapsulate execution logic within a `run` function.
- **Strategy Pattern**: Different execution strategies for manual vs. scheduled runs.
- **Observer Pattern**: Logging and reporting systems observe action lifecycle events.

## Contributing

We welcome contributions! Please follow these guidelines:

- Report issues via GitHub Issues.
- Submit pull requests for new features or bug fixes.
- Maintain high test coverage for any new logic.
- Follow the existing ESM and TypeScript patterns.

## Support

For questions, issues, or contributions:

- **GitHub Issues**: [https://github.com/orassayag/actions-manager/issues](https://github.com/orassayag/actions-manager/issues)
- **Email**: orassayag@gmail.com

## License

This application has an MIT license - see the [LICENSE](LICENSE) file for details.

## Author

- **Or Assayag** - _Initial work_ - [orassayag](https://github.com/orassayag)
- Or Assayag <orassayag@gmail.com>
- GitHub: https://github.com/orassayag
- StackOverflow: https://stackoverflow.com/users/4442606/or-assayag?tab=profile
- LinkedIn: https://linkedin.com/in/orassayag

## Acknowledgments

- Built for educational and research purposes
- Respects robots.txt and implements rate limiting
- Uses user-agent rotation to avoid detection
- Implements polite crawling practices
