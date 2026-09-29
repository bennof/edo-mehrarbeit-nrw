// Datensicherung: gesamten Zustand als JSON herunterladen bzw. wieder einlesen
import { data, replaceData } from './store.svelte';

export function exportJson() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mehrarbeit-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Wirft einen Fehler, wenn die Datei kein Export dieser App ist */
export async function importJson(file: File) {
  let d;
  try {
    d = JSON.parse(await file.text());
  } catch {
    d = null;
  }
  if (!d?.profile || !Array.isArray(d.months)) {
    throw new Error('Die Datei ist kein gültiger Export dieser App.');
  }
  replaceData(d);
}
