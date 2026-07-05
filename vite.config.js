import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Two build targets, one codebase:
//   `vite build`                    -> dist/            (server build, talks to Express)
//   `vite build --mode standalone`  -> dist-standalone/ (no backend; sql.js in browser, PWA)
// VITE_BASE is set by the GitHub Pages workflow (e.g. "/sprout/") so the
// manifest scope, start_url, precache URLs and router basename all agree.
export default defineConfig(({ mode }) => {
  const standalone = mode === 'standalone';
  const base = process.env.VITE_BASE || '/';

  return {
    base,
    // Statically replace the flag so the sql.js/WASM engine is dead-code
    // eliminated from the server build (and fetch code from the standalone).
    define: {
      'import.meta.env.VITE_STANDALONE': JSON.stringify(standalone),
    },
    plugins: [
      react(),
      tailwindcss(),
      ...(standalone
        ? [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['icons/favicon.svg'],
              manifest: {
                name: 'Sprout — my day, my diary',
                short_name: 'Sprout',
                description: 'A cheerful daily tracker and diary that lives on your phone.',
                theme_color: '#fbbf24',
                background_color: '#fffbf2',
                display: 'standalone',
                orientation: 'portrait',
                start_url: base,
                scope: base,
                icons: [
                  { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                  { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                  { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
              },
              workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,wasm,webmanifest}'],
                // sql-wasm.wasm is ~1.2 MB; raise the precache limit so it is
                // always available offline.
                maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
                navigateFallback: base + 'index.html',
              },
            }),
          ]
        : []),
    ],
    build: {
      outDir: standalone ? 'dist-standalone' : 'dist',
      emptyOutDir: true,
    },
    server: {
      proxy: { '/api': 'http://localhost:3000' },
    },
    optimizeDeps: { exclude: ['sql.js'] },
  };
});
