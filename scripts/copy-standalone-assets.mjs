import { cp, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const standaloneRoot = path.join(root, '.next', 'standalone');

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function copyDirectory(source, destination) {
  if (!(await exists(source)) || !(await exists(standaloneRoot))) return;
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
}

await copyDirectory(
  path.join(root, '.next', 'static'),
  path.join(standaloneRoot, '.next', 'static')
);

await copyDirectory(
  path.join(root, 'public'),
  path.join(standaloneRoot, 'public')
);
