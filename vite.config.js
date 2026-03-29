// vite.config.js
// Vite is used two ways:
//   1. Dev server  — `npm run dev`   → serves repo root like http-server did (port 4173)
//   2. Module build — `npm run build:modules` → bundles js/modules/ → js/dist/wq-modules.js
//
// Legacy IIFE scripts (app.js, app-*.js, word-quest-runtime.js, etc.) are NOT touched by Vite.
// They continue to load as classic <script> tags and register window globals as before.
// The new ES module bundle lives alongside them during the transition.

import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // ─── Dev server ──────────────────────────────────────────────────────────────
  // Serves the whole repo root exactly like `python3 -m http.server 4173`.
  // All existing <script src="js/xxx.js?v=..."> paths resolve unchanged.
  root: '.',

  // Required for GitHub Pages subdirectory deployment (/CornerstoneMTSS/).
  // All asset paths in the built output will be relative rather than absolute.
  base: './',

  server: {
    port: 4173,       // Matches BASE_URL used in all Playwright test configs
    strictPort: true, // Fail loudly instead of silently picking another port
    open: false,
    fs: {
      // Allow serving files from the repo root (audio/, data/, assets/ etc.)
      allow: ['.'],
    },
  },

  preview: {
    port: 4173,
    strictPort: true,
  },

  // ─── Module build (library mode) ─────────────────────────────────────────────
  // Only compiles js/modules/ → js/dist/wq-modules.js.
  // Does NOT process the HTML files or the legacy IIFE scripts.
  build: {
    outDir: path.resolve(__dirname, 'js/dist'),
    emptyOutDir: true,

    lib: {
      // Single entry point — re-exports everything from js/modules/
      entry: path.resolve(__dirname, 'js/modules/index.js'),
      name: 'WQModules',
      formats: ['es'],              // ES module format only (native browser import)
      fileName: () => 'wq-modules.js',
    },

    rollupOptions: {},

    // Keep as one file during the transition — easier to debug
    codeSplitting: false,

    // Don't minify in library mode — source should be readable for now
    minify: false,
  },
});
