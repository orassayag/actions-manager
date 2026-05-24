import { Service } from 'node-windows';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');

const svc = new Service({
  name: 'ActionsManagerWatchdog',
  script: path.resolve(projectRoot, 'src/watchdog/watchdog.ts'),
});

svc.on('uninstall', () => console.log('✅ Service removed.'));
svc.uninstall();
