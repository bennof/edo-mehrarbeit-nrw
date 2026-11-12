// Sammelt die Lizenzen aller installierten npm-Pakete (laut package-lock.json) in einer Datei.
// Aufruf: node scripts/third-party-licenses.mjs [Ausgabedatei]   (Standard: static/THIRD-PARTY-LICENSES.txt)
// Voraussetzung: `npm ci` wurde ausgeführt. Bricht ab, wenn eine Lizenz nicht auf der Allowlist steht.
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2] ?? 'static/THIRD-PARTY-LICENSES.txt';
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

// Mit der MIT-Lizenz des Projekts verträglich (permissiv bzw. nur dateiweises Copyleft bei reinen Build-Werkzeugen).
const ALLOWED = new Set([
  'MIT',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  'Apache-2.0',
  'Zlib',
  'MPL-2.0'
]);

const pkgs = [];
for (const [key, meta] of Object.entries(lock.packages)) {
  if (!key) continue;
  const dir = key; // z. B. node_modules/@scope/name
  if (!fs.existsSync(path.join(dir, 'package.json'))) continue; // plattformfremde optionale Pakete
  const pj = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const license = pj.license ?? meta.license ?? 'UNBEKANNT';
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^(licen[sc]e|copying|notice)(\.|$)/i.test(f))
    .sort();
  const texts = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8').trim());
  const repo =
    typeof pj.repository === 'string' ? pj.repository : (pj.repository?.url ?? pj.homepage ?? '');
  pkgs.push({
    name: pj.name,
    version: pj.version,
    license: String(license),
    repo: repo.replace(/^git\+/, ''),
    dev: !!meta.dev,
    texts
  });
}
pkgs.sort((a, b) => a.name.localeCompare(b.name));

const problems = pkgs.filter((p) =>
  p.license
    .replace(/[()]/g, '')
    .split(/\s+(?:AND|OR)\s+/)
    .some((l) => !ALLOWED.has(l))
);
if (problems.length) {
  console.error('Lizenz nicht auf der Allowlist:');
  for (const p of problems) console.error(`  ${p.name}@${p.version}: ${p.license}`);
  process.exit(1);
}

const bar = '='.repeat(78);
let text = `Lizenzen von Drittkomponenten – edo-mehrarbeit-nrw ${lock.version}
Automatisch erzeugt mit scripts/third-party-licenses.mjs – nicht von Hand ändern.

${pkgs.length} Pakete. [Laufzeit] = Abhängigkeit der Anwendung, [Build] = Build-Werkzeug
(Svelte und SvelteKit werden teilweise in die ausgelieferte Anwendung eingebunden).

Übersicht
---------
`;
for (const p of pkgs)
  text += `${p.name}@${p.version}  ${p.license}  [${p.dev ? 'Build' : 'Laufzeit'}]\n`;
for (const p of pkgs) {
  text += `\n${bar}\n${p.name}@${p.version}\nLizenz: ${p.license}\n${p.repo ? `Quelle: ${p.repo}\n` : ''}${bar}\n\n`;
  text += p.texts.length
    ? p.texts.join('\n\n---\n\n') + '\n'
    : `(Keine Lizenzdatei im Paket enthalten; Lizenz laut package.json: ${p.license})\n`;
}
fs.writeFileSync(out, text);
// Projektlizenz daneben ablegen, damit die App sie anzeigen kann
fs.copyFileSync('LICENSE', path.join(path.dirname(out), 'LICENSE.txt'));
console.log(`${out}: ${pkgs.length} Pakete`);
