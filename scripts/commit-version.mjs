// npm run commit-version
// Alles committen (Nachricht vX.Y.Z aus package.json), annotierten Tag setzen – der Editor
// öffnet sich für den Tag-Text, der auch die Release-Beschreibung wird – und beides pushen.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const tag = `v${version}`;

const git = (...args) => execFileSync('git', args, { stdio: 'inherit' });
const quiet = (...args) => {
  try {
    execFileSync('git', args, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

if (quiet('rev-parse', '--verify', '--quiet', `refs/tags/${tag}`)) {
  console.error(`Tag ${tag} gibt es schon – zuerst die Version in package.json erhöhen.`);
  process.exit(1);
}

try {
  git('add', '.');
  if (quiet('diff', '--cached', '--quiet'))
    console.log('Nichts zu committen – Tag kommt auf den letzten Commit.');
  else git('commit', '-m', tag);

  git('tag', '-a', tag, '-e', '-m', tag); // -e: Editor mit „vX.Y.Z“ als Vorlage
  git('push', 'origin', 'HEAD');
  git('push', 'origin', tag);
  console.log(`\n${tag} ist gepusht – die GitHub Action baut jetzt das Release.`);
} catch {
  process.exit(1); // git hat die Ursache schon ausgegeben
}
