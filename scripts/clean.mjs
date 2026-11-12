// npm run clean       – erzeugte Dateien löschen (Build, Caches, Lizenzdateien, Release-Archive)
// npm run clean:all   – zusätzlich node_modules (danach `npm ci`)
// Quelltext, .env und alles Eingecheckte bleiben unberührt.
import fs from 'node:fs';

const generated = [
  'build',
  '.svelte-kit',
  'package',
  '.vite',
  'coverage',
  'node_modules/.vite',
  'static/THIRD-PARTY-LICENSES.txt',
  'static/LICENSE.txt',
  'release-notes.md'
];
const targets = [...generated];
for (const f of fs.readdirSync('.')) if (/\.(zip|tar\.gz|log)$/.test(f)) targets.push(f);
if (process.argv.includes('--all')) targets.push('node_modules');

for (const t of targets) {
  if (!fs.existsSync(t)) continue;
  fs.rmSync(t, { recursive: true, force: true });
  console.log(`✗ ${t}`);
}
console.log('✓ aufgeräumt');
