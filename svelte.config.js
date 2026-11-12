import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    // SPA: eine index.html, alle Pfade fallen darauf zurück
    adapter: adapter({ fallback: 'index.html' }),
    // Hash-Router: Routen stehen im #-Teil, die App läuft unter jedem Pfad ohne Server-Fallback.
    // Die Pfade in build/index.html macht scripts/relative-base.mjs relativ (siehe package.json).
    router: { type: 'hash' }
  }
};
