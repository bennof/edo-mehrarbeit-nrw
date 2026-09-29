// App-Zustand: Stammdaten, Monate, Erklärungen – optional im localStorage
import { parsePrefill } from './prefill';
import type { AppData, Declaration, Month } from './types';

const DATA_KEY = 'mehrarbeit-data';
const PERSIST_KEY = 'mehrarbeit-persist'; // "false" = Speichern abgeschaltet

const empty = (): AppData => ({
  profile: {
    clerk: '',
    office: '',
    fileNumber: '',
    phone: '',
    email: '',
    lbvNumber: '',
    schoolNumber: '',
    minutesPerLesson: 45,
    lastName: '',
    firstName: '',
    birthDate: '', // YYYY-MM-DD
    rateKey: 4, // Schlüssel Mehrarbeitsstundensatz 1–4
    otherSchools: 0 // 0 = nein
  },
  months: [],
  declarations: []
});

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value);
  } catch {}
}

export const settings = $state({ persist: read(PERSIST_KEY) !== 'false' });

// Ältere Stände (gespeichert oder importiert) um neu hinzugekommene Felder ergänzen
function normalize(d: Partial<AppData>): AppData {
  const e = empty();
  return {
    profile: { ...e.profile, ...d.profile },
    months: d.months ?? [],
    declarations: (d.declarations ?? []).map((x) => ({ ...x, remarks: x.remarks ?? '' }))
  };
}

function load(): AppData {
  if (!settings.persist) return empty();
  try {
    const d: Partial<AppData> | null = JSON.parse(read(DATA_KEY) ?? 'null');
    return normalize(d ?? {});
  } catch {
    return empty();
  }
}

export const data = $state(load());

// Stammdaten aus dem Link (#schulnummer=…) sofort übernehmen – vor Router und erstem Rendern,
// damit sie wie jede andere Änderung gespeichert werden
const prefill = parsePrefill(location.hash);
Object.assign(data.profile, prefill);
export const prefilled = Object.keys(prefill).length > 0;

// Jede Änderung speichern, solange Speichern aktiv ist
$effect.root(() => {
  $effect(() => {
    const json = JSON.stringify(data);
    if (settings.persist) write(DATA_KEY, json);
  });
});

export function setPersist(on: boolean) {
  settings.persist = on;
  if (on) {
    write(PERSIST_KEY, null);
    write(DATA_KEY, JSON.stringify(data));
  } else {
    write(DATA_KEY, null); // gespeicherte Daten löschen
    write(PERSIST_KEY, 'false'); // nur der Zustand bleibt
  }
}

export function replaceData(d: Partial<AppData>) {
  Object.assign(data, normalize(d));
}

/** Erklärung, in der ein Monat schon abgerechnet ist – `except` ausgenommen */
export function declarationOf(monthId: string, except?: string): Declaration | undefined {
  return data.declarations.find((d) => d.id !== except && d.monthIds.includes(monthId));
}

// ---------- Hilfen ----------
const id = () => crypto.randomUUID().slice(0, 8);
const today = () => new Date().toISOString().slice(0, 10);

export { byMonth, monthLabel, dateLabel } from './format';

export function newMonth(): Month {
  // nächster Monat nach dem jüngsten erfassten, sonst der aktuelle
  const last = data.months
    .map((m) => m.month)
    .sort()
    .at(-1);
  let month = today().slice(0, 7);
  if (last) {
    const [y, mo] = last.split('-').map(Number);
    month = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
  }
  const m: Month = { id: id(), month, hours: 0, belowThreshold: false };
  data.months.push(m);
  return m;
}

export function newDeclaration(): Declaration {
  const d: Declaration = { id: id(), date: today(), monthIds: [], remarks: '' };
  data.declarations.unshift(d);
  return d;
}
