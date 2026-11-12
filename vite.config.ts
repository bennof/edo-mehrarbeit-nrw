import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { buildPrefillHash } from './src/lib/prefill.ts';
import { legalPages } from './scripts/legal-pages.ts';
import { FORM_PROXY_PATH, FORM_URL } from './src/lib/form.ts';

// Dev-Server: Link mit den Stammdaten aus .env ausgeben (landen nicht im Bundle)
function prefillLink(hash: string): Plugin {
  return {
    name: 'prefill-link',
    apply: 'serve',
    configureServer(server) {
      const printUrls = server.printUrls.bind(server);
      server.printUrls = () => {
        printUrls();
        const url = server.resolvedUrls?.local[0];
        if (url && hash) server.config.logger.info(`  ➜  Mit .env-Daten: ${url}${hash}`);
      };
    }
  };
}

// Vorlage über die eigene Herkunft durchreichen (bra.nrw.de erlaubt kein CORS).
// In Produktion übernimmt das der Webserver, siehe README.
const form = new URL(FORM_URL);
const formProxy = {
  [`${process.env.BASE_PATH ?? ''}${FORM_PROXY_PATH}`]: {
    target: form.origin,
    changeOrigin: true,
    rewrite: () => form.pathname
  }
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [sveltekit(), legalPages(mode), prefillLink(buildPrefillHash(env))],
    // Nur die öffentliche OAuth-ID freigeben, niemals das Client-Secret.
    define: {
      __GOOGLE_CLIENT_ID__: JSON.stringify(env.EDO_GOOGLE_CLIENT_ID ?? '')
    },
    server: { port: Number(env.DEV_PORT) || 5173, proxy: formProxy },
    preview: { proxy: formProxy }
  };
});
