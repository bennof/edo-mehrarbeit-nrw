// Hinweise für die Startseite aus static/info.json (lässt sich ohne neuen Build austauschen)
import { base } from '$app/paths';

export interface Info {
  title: string;
  /** HTML – kommt vom Betreiber der Seite, wird ungefiltert angezeigt */
  body: string;
  /** YYYY-MM-DD */
  date: string;
}

const isInfo = (x: unknown): x is Info =>
  typeof x === 'object' &&
  x !== null &&
  typeof (x as Info).title === 'string' &&
  typeof (x as Info).body === 'string' &&
  typeof (x as Info).date === 'string';

/** Neueste zuerst; fehlende oder fehlerhafte Datei ergibt eine leere Liste */
export async function loadInfo(): Promise<Info[]> {
  try {
    const res = await fetch(`${base}/info.json`, { cache: 'no-cache' });
    if (!res.ok) return [];
    const list: unknown = await res.json();
    if (!Array.isArray(list)) return [];
    return list.filter(isInfo).sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}
