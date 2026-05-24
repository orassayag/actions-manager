import { Service } from 'node-windows';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Now that we are in src/watchdog/services, the project root is 3 levels up
const projectRoot = path.resolve(__dirname, '../../..');

const svc = new Service({
  name: 'ActionsManagerWatchdog',
  description:
    'Checks overnight Task Scheduler actions at 08:00 and recovers missed ones.',
  script: path.resolve(projectRoot, 'src/watchdog/watchdog.ts'),
  nodeOptions: ['--import', 'tsx', '--no-warnings'],
  env: [
    { name: 'NODE_ENV', value: 'production' },
    { name: 'PATH', value: process.env.PATH || '' },
  ],
  workingdirectory: projectRoot,
  logmode: 'rotate',
});

svc.on('install', () => {
  console.log('✅ Service installed. Starting...');
  svc.start();
});

svc.on('error', (err: unknown) => {
  console.error('❌ Error:', err);
});

svc.install();
