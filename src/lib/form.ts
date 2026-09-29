// Herkunft der Blanko-Vorlage LBV(A/Bes)23. Ohne Browser-Abhängigkeiten, weil auch
// vite.config.ts die Werte für den Dev-Proxy braucht.

/** Offizielle Vorlage bei der Bezirksregierung Arnsberg */
export const FORM_URL =
  'https://www.bra.nrw.de/system/files/media/document/file/lbva_23_2019_02.pdf';

/**
 * Pfad auf der eigenen Seite, den der Webserver an FORM_URL weiterleitet.
 * Nötig, weil bra.nrw.de kein CORS erlaubt und der Browser die Datei sonst nicht lesen darf.
 */
export const FORM_PROXY_PATH = '/vorlage/lbva23.pdf';
