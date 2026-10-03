// npm run anlage1
// Leeres, ausfüllbares Formular nach Anlage 1 zu BASS 21-22 Nr. 21 nach static/ schreiben.
import { writeFileSync } from 'node:fs';
import { buildAnlage1 } from '../src/lib/anlage1.ts';

const out = new URL('../static/anlage1.pdf', import.meta.url);
writeFileSync(out, await buildAnlage1());
console.log(`✓ ${out.pathname}`);
