import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    // SPA: eine index.html, alle Pfade fallen darauf zurück
    adapter: adapter({ fallback: 'index.html' }),
    // Für Hosting in einem Unterverzeichnis (z. B. GitHub Pages): BASE_PATH=/repo-name
    paths: { base: /** @type {'' | `/${string}`} */ (process.env.BASE_PATH ?? '') }
  }
};
