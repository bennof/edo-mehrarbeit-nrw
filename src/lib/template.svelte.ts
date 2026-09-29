// Blanko-Vorlage online laden (über den Proxy-Pfad der eigenen Seite).
// Wird beim Start im Hintergrund angestoßen und von „Prüfen“ neu geladen.
import { base } from '$app/paths';
import { FORM_PROXY_PATH } from './form';
import { validateLbv23 } from './lbv23';

export const template = $state<{
  status: 'idle' | 'loading' | 'ok' | 'fail';
  size?: number;
  error?: string;
}>({ status: 'idle' });

let pending: Promise<ArrayBuffer> | undefined;

async function load(): Promise<ArrayBuffer> {
  try {
    const res = await fetch(`${base}${FORM_PROXY_PATH}`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const bytes = await res.arrayBuffer();
    await validateLbv23(bytes); // fängt auch die SPA-Fallback-Seite ab, falls kein Proxy läuft
    Object.assign(template, { status: 'ok', size: bytes.byteLength, error: undefined });
    return bytes;
  } catch (e) {
    const error =
      e instanceof TypeError ? 'Keine Verbindung' : e instanceof Error ? e.message : String(e);
    Object.assign(template, { status: 'fail', size: undefined, error });
    throw new Error(`Formularvorlage nicht verfügbar: ${error}`);
  }
}

/** Einmal laden und merken; `force` lädt neu (Button „Prüfen“) */
export function loadTemplate(force = false): Promise<ArrayBuffer> {
  if (force || !pending) {
    template.status = 'loading';
    pending = load();
    pending.catch(() => (pending = undefined)); // nächster Aufruf versucht es erneut
  }
  return pending;
}
