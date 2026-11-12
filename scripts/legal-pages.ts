// Erzeugt privacy.html, impress.html und terms.html aus legal/*.html.
// Platzhalter {{NAME}} werden (HTML-escaped) aus der .env bzw. Umgebung ersetzt;
// {{#NAME}}…{{/NAME}} erscheint nur, wenn der Wert gesetzt ist.
// Fehlen Pflichtwerte (z. B. im CI-Release), werden die Seiten nicht erzeugt.
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv, type Plugin } from 'vite';

const PAGES = ['privacy.html', 'impress.html', 'terms.html'];
const PREFIX = 'EDO_LEGAL_';
const REQUIRED = ['NAME', 'STREET', 'ZIP_CITY', 'EMAIL'];

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`).replace(/\r?\n/g, '<br />');

function render(template: string, values: Record<string, string>): string {
  return template
    .replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, inner) => (values[key] ? inner : ''))
    .replace(/\{\{(\w+)\}\}/g, (_, key) => escapeHtml(values[key] ?? ''));
}

export function legalPages(mode: string, root = process.cwd()): Plugin {
  const env = { ...loadEnv(mode, root, PREFIX), ...process.env };
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    if (k.startsWith(PREFIX) && v) values[k.slice(PREFIX.length)] = String(v).trim();
  }
  const missing = REQUIRED.filter((k) => !values[k]);
  const html = (page: string) =>
    render(fs.readFileSync(path.join(root, 'legal', page), 'utf8'), values);

  return {
    name: 'legal-pages',
    // Die App blendet die Verweise im Info-Tab nur ein, wenn die Seiten erzeugt werden.
    config: () => ({ define: { __LEGAL_PAGES__: JSON.stringify(!missing.length) } }),
    configResolved(config) {
      if (!missing.length) return;
      config.logger.info(
        `  Rechtliche Seiten übersprungen (${missing.map((k) => PREFIX + k).join(', ')} nicht gesetzt, siehe example.env)`
      );
    },
    configureServer(server) {
      if (missing.length) return;
      const base = server.config.base.replace(/\/$/, '');
      server.middlewares.use((req, res, next) => {
        const page = PAGES.find((p) => req.url?.split('?')[0] === `${base}/${p}`);
        if (!page) return next();
        res.setHeader('content-type', 'text/html; charset=utf-8');
        res.end(html(page));
      });
    },
    generateBundle() {
      if (missing.length || this.environment?.name !== 'client') return;
      for (const page of PAGES)
        this.emitFile({ type: 'asset', fileName: page, source: html(page) });
    }
  };
}
