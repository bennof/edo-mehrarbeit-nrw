// Stammdaten per Link vorbelegen: …/#schulnummer=123456&dienststelle=…
// Der Hash-Teil wird nie an den Server geschickt. In .env heißen die Werte gleich, nur groß.
import type { Profile, RateKey } from './types.ts';

export const PREFILL_PARAMS = {
  bearbeiter: 'clerk',
  dienststelle: 'office',
  aktenzeichen: 'fileNumber',
  telefon: 'phone',
  email: 'email',
  lbv_personalnummer: 'lbvNumber',
  schulnummer: 'schoolNumber',
  minuten_je_stunde: 'minutesPerLesson',
  nachname: 'lastName',
  vorname: 'firstName',
  geburtsdatum: 'birthDate',
  schluessel: 'rateKey',
  weitere_schulen: 'otherSchools'
} as const satisfies Record<string, keyof Profile>;

type Param = keyof typeof PREFILL_PARAMS;

/** Hash (#a=1&b=2) → Teil-Profil; ungültige Zahlen werden ignoriert */
export function parsePrefill(hash: string): Partial<Profile> {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const out: Partial<Record<keyof Profile, unknown>> = {};
  for (const [param, key] of Object.entries(PREFILL_PARAMS)) {
    const value = params.get(param);
    if (value === null) continue;
    if (key === 'rateKey') {
      const n = Number(value);
      if ([1, 2, 3, 4].includes(n)) out.rateKey = n as RateKey;
    } else if (key === 'minutesPerLesson' || key === 'otherSchools') {
      const n = Number(value.replace(',', '.'));
      if (Number.isFinite(n) && n >= 0) out[key] = n;
    } else {
      out[key] = value;
    }
  }
  return out as Partial<Profile>;
}

// Zum Teilen nur die Angaben der Dienststelle, keine persönlichen Daten der Lehrkraft
const SHARE_PARAMS: Param[] = [
  'dienststelle',
  'schulnummer',
  'aktenzeichen',
  'bearbeiter',
  'telefon',
  'email',
  'minuten_je_stunde'
];

function toHash(get: (param: Param) => string | undefined, params: Param[]): string {
  const search = new URLSearchParams();
  for (const param of params) {
    const value = get(param);
    if (value) search.set(param, value);
  }
  const s = search.toString();
  return s ? `#${s}` : '';
}

/** Werte (Schlüssel wie in .env, z. B. SCHULNUMMER) → Hash für einen Link */
export function buildPrefillHash(env: Record<string, string | undefined>): string {
  return toHash((param) => env[param.toUpperCase()], Object.keys(PREFILL_PARAMS) as Param[]);
}

/** Aktuelle Stammdaten der Dienststelle → Hash für einen Link an Kolleginnen und Kollegen */
export function buildShareHash(profile: Profile): string {
  return toHash((param) => {
    const value = profile[PREFILL_PARAMS[param]];
    return value == null ? undefined : String(value).trim();
  }, SHARE_PARAMS);
}
