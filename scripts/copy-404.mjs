// GitHub Pages SPA fallback: Pages serves 404.html for unknown paths, so a
// copy of index.html lets deep links like /sprout/diary load the app (which
// then routes client-side). Runs after `vite build --mode standalone`.
import fs from 'node:fs';
fs.copyFileSync('dist-standalone/index.html', 'dist-standalone/404.html');
console.log('dist-standalone/404.html created (SPA deep-link fallback)');
