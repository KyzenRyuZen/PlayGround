// Copies the runtime web shell into www/ for Capacitor Android packaging.
// Usage: npm run build:web
import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'www');

const ENTRIES = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'icons',
  'src',
];

async function main() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  for (const entry of ENTRIES) {
    const from = join(root, entry);
    const to = join(out, entry);
    try {
      const info = await stat(from);
      if (info.isDirectory()) {
        await cp(from, to, { recursive: true });
      } else {
        await cp(from, to);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`skip missing ${entry}`);
        continue;
      }
      throw error;
    }
  }
  const files = await readdir(out);
  console.log(`Built www/ (${files.length} top-level entries) for Capacitor.`);
  console.log('Next: npx cap add android  (first time) or npm run android:sync');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
