// Nach `vite build`: build/index.html relativ machen, damit derselbe Build unter jedem Pfad läuft.
// Mit dem Hash-Router liegt die App immer auf genau einer URL (…/index.html), deshalb genügt ./.
// Die Laufzeit-Basis (`base`/`asset()` aus $app/paths) setzt SvelteKit im Hash-Modus selbst relativ
// zur Seite (new URL('.', location)); hier fehlen nur die absoluten Pfade im HTML.
import fs from 'node:fs';

const file = 'build/index.html';
const original = fs.readFileSync(file, 'utf8');

const html = original
  .replace(/(href|src)="\/(?!\/)/g, '$1="./') // href="/_app/…", href="/favicon.png"
  .replace(/import\("\/(?!\/)/g, 'import("./'); // import("/_app/…")

const stillAbsolute = /(href|src)="\/(?!\/)|import\("\//.test(html);
const relativeBase = /new URL\(['"]\.['"], location\)/.test(html);
if (html === original || stillAbsolute || !relativeBase)
  throw new Error('build/index.html konnte nicht relativ gemacht werden – Format geändert?');

fs.writeFileSync(file, html);
console.log('✓ build/index.html: relative Pfade');
