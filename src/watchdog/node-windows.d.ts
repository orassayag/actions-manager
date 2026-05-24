// src/watchdog/node-windows.d.ts
declare module 'node-windows' {
  export class Service {
    constructor(config: Record<string, unknown>);
    on(event: string, cb: (...args: unknown[]) => void): void;
    install(): void;
    uninstall(): void;
    start(): void;
  }
}
