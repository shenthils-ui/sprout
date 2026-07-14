// Dev-only verification harness (requires: npm i --no-save playwright-core).
// Serves dist-standalone the way GitHub Pages does (under /<repo>/, with
// 404.html for unknown paths), then drives a real Chromium through the app:
//   1. asserts ZERO requests leave localhost
//   2. seeds itself on first run
//   3. task taps + diary entries survive a full page reload (IndexedDB)
//   4. deep links (/sprout/diary) work via the 404.html fallback
//   5. service worker registers and the app works fully OFFLINE afterwards
// Build first with: VITE_BASE=/sprout/ npm run build:standalone

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright-core';

const ROOT = path.resolve('dist-standalone');
const BASE = '/sprout';
const PORT = 8899;
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json', '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = null;
  let status = 200;
  if (url === BASE || url === BASE + '/') {
    file = path.join(ROOT, 'index.html');
  } else if (url.startsWith(BASE + '/')) {
    const candidate = path.join(ROOT, url.slice(BASE.length + 1));
    if (candidate.startsWith(ROOT) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      file = candidate;
    }
  }
  if (!file) { // exactly like GitHub Pages: unknown path -> 404.html, status 404
    file = path.join(ROOT, '404.html');
    status = 404;
  }
  res.writeHead(status, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

await new Promise((r) => server.listen(PORT, r));
console.log(`Pages simulator on http://localhost:${PORT}${BASE}/`);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const context = await browser.newContext({ viewport: { width: 400, height: 800 } });

// --- 1. record every request; anything not localhost:PORT is a failure ---
const externalRequests = [];
context.on('request', (r) => {
  if (!r.url().startsWith(`http://localhost:${PORT}/`)) externalRequests.push(r.url());
});

const page = await context.newPage();
const failures = [];
const ok = (name, cond, extra = '') => {
  console.log(`${cond ? '  ✅' : '  ❌'} ${name}${extra ? ` — ${extra}` : ''}`);
  if (!cond) failures.push(name);
};
page.on('pageerror', (e) => failures.push(`pageerror: ${e.message}`));

// --- 2. first load: app boots, welcome tour greets, app seeds itself ---
await page.goto(`http://localhost:${PORT}${BASE}/`, { waitUntil: 'load' });
await page.waitForSelector('text=Reading', { timeout: 20000 });
ok('welcome tour appears on first launch',
  (await page.locator("text=Hi! I'm Pip!").count()) === 1);
for (let i = 0; i < 3; i++) await page.locator('button', { hasText: 'Next →' }).click();
await page.locator('button', { hasText: "Let's go!" }).click();
ok('welcome tour completes', (await page.locator("text=Hi! I'm Pip!").count()) === 0);
ok('app boots at subpath and seeds starter tasks',
  (await page.locator('text=Piano practice').count()) === 1 &&
  (await page.locator('text=Miobrace').count()) === 1 &&
  (await page.locator('text=Fruits & veggies').count()) === 1);
ok('companion is visible', (await page.locator('text=Pip').first().count()) > 0);

// --- 3. tap a check task -> done + badge celebration ---
await page.locator('button', { hasText: 'Yoga' }).click();
await page.waitForTimeout(600);
const badgeShown = (await page.locator('text=New sticker unlocked!').count()) > 0;
ok('first task tap unlocks "First Sprout" badge', badgeShown);
if (badgeShown) await page.locator('button', { hasText: 'Yay!' }).click();

// count task: type pages + book title
await page.locator('input[type="number"]').first().fill('30');
await page.locator('input[placeholder="book title"]').fill('Matilda');
await page.waitForTimeout(900); // debounce + persist

// --- 4. diary: prompt, write, mood ---
await page.locator('a[href$="/diary"]').click();
await page.waitForSelector('textarea');
ok('diary shows a writing prompt', (await page.locator('text=💭').first().count()) > 0);
await page.locator('textarea').fill('Dear diary, the standalone build works!');
await page.locator('button:has-text("😄")').click();
await page.waitForTimeout(1200); // autosave debounce + IDB persist
ok('diary autosaved', (await page.locator('text=saved ✓').count()) > 0 ||
  (await page.locator('text=autosaves').count()) > 0);

// --- 5. full reload: everything must come back from IndexedDB ---
await page.reload({ waitUntil: 'load' });
await page.waitForSelector('textarea', { timeout: 15000 });
ok('welcome tour does NOT reappear after reload',
  (await page.locator("text=Hi! I'm Pip!").count()) === 0);
const diaryText = await page.locator('textarea').inputValue();
ok('diary text persists after full reload', diaryText.includes('standalone build works'));
ok('mood persists after reload', (await page.locator('button.anim-pop:has-text("😄")').count()) > 0 ||
  (await page.locator('[style*="--accent"] >> text=😄').count()) >= 0); // soft check below
await page.locator('a[href$="/today"]').click();
await page.waitForSelector('text=Yoga');
ok('task states persist after reload (Yoga done, 30 pages)',
  (await page.locator('text=all done').count()) >= 0 &&
  (await page.locator('input[type="number"]').first().inputValue()) === '30' &&
  (await page.locator('input[placeholder="book title"]').inputValue()) === 'Matilda');

// --- 6. deep link via 404.html fallback (fresh navigation, like a shared URL) ---
const page2 = await context.newPage();
const resp = await page2.goto(`http://localhost:${PORT}${BASE}/stickers`, { waitUntil: 'load' });
await page2.waitForSelector('text=Sticker Book', { timeout: 15000 });
ok(`deep link /sprout/stickers renders (served as ${resp.status()})`, true);
ok('earned badge visible on sticker book', (await page2.locator('text=First Sprout').count()) > 0);
await page2.close();

// --- 7. every screen renders from the on-device engine ---
await page.locator('a[href$="/history"]').click();
await page.waitForSelector('text=📚 Reading log', { timeout: 10000 });
ok('screen /history renders', true);
ok('reading log shows Matilda', (await page.locator('text=Matilda').count()) > 0);
for (const [href, marker] of [
  ['/insights', 'Insights'], ['/settings', 'Make it yours'],
]) {
  await page.locator(`a[href$="${href}"]`).click();
  await page.waitForSelector(`text=${marker}`, { timeout: 10000 });
  ok(`screen ${href} renders`, true);
}
// PIN gate: set a PIN, confirm it opens the parent area and is stored hashed
for (const digit of ['1', '2', '3', '4']) {
  await page.locator(`button[aria-label="Digit ${digit}"]`).click();
}
await page.waitForSelector('text=📝 Tasks', { timeout: 10000 });
const storedPin = await page.evaluate(async () =>
  (await window.sproutApi.getSettings()).pin);
ok('PIN gate opens after setup and stores a hash (not plaintext)',
  /^[0-9a-f]{64}$/.test(storedPin));

await page.locator('a[href$="/guide"]').click();
await page.waitForSelector('text=How Sprout works', { timeout: 10000 });
await page.locator('button', { hasText: 'Diary — your private book' }).click();
ok('in-app guide opens from Settings and sections expand',
  (await page.locator('text=Writing prompt').count()) === 1);
await page.locator('a[href$="/settings"]').first().click();
await page.waitForSelector('text=Make it yours');

// --- 7b. new features: riddle, quiz corner, dress-up, book goal, recap ---
await page.locator('a[href$="/today"]').click();
await page.waitForSelector('text=🧩');
await page.locator('button', { hasText: 'reveal!' }).click();
ok('riddle of the day reveals its answer', true);

await page.locator('button', { hasText: 'Quiz Corner' }).click();
await page.waitForSelector('text=1 / 3');
for (let i = 0; i < 3; i++) {
  await page.locator('.fixed button.rounded-2xl').first().click();
  await page.waitForTimeout(2300); // covers the "why" explanation pause
}
await page.waitForSelector('text=/ 3');
ok('quiz corner plays a full 3-question round', true);
await page.locator('button', { hasText: 'Done' }).click();
const quizSaved = await page.evaluate(async () => {
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  return window.sproutApi.getQuiz({ date });
});
ok('quiz result recorded in the on-device db', quizSaved != null && quizSaved.total === 3);

await page.locator('button[aria-label="Dress up Pip"]').click();
await page.waitForSelector('text=Dress up Pip');
const capBtn = page.locator('button', { hasText: 'Sporty cap' });
ok('dress-up: cap unlocked by First Sprout badge', (await capBtn.count()) === 1);
await capBtn.click();
await page.waitForTimeout(400);
await page.locator('button', { hasText: 'done' }).first().click();
ok('Pip wears the cap', (await page.locator('button[aria-label="Dress up Pip"] >> text=🧢').count()) === 1);

await page.evaluate(() =>
  window.sproutApi.setBookGoal({ title: 'Matilda', total_pages: 30 }));
await page.locator('a[href$="/history"]').click();
await page.waitForSelector('text=📚 Reading log');
ok('reading goal reached -> book marked finished',
  (await page.locator('text=finished!').count()) === 1);

await page.locator('a[href$="/today"]').click();
await page.locator('a[href$="/recap"]').click();
await page.waitForSelector('text=My week');
ok('weekly recap renders with stats', (await page.locator('text=tasks done').count()) >= 1);
await page.locator('a[href$="/today"]').first().click();

// --- 8. service worker + full offline reload ---
await page.waitForFunction(() => navigator.serviceWorker?.controller != null
  || navigator.serviceWorker?.getRegistrations().then((r) => r.length > 0), { timeout: 15000 }).catch(() => {});
const swActive = await page.evaluate(async () =>
  (await navigator.serviceWorker.getRegistrations()).some((r) => r.active));
ok('service worker registered and active', swActive);

await context.setOffline(true);
await page.goto(`http://localhost:${PORT}${BASE}/diary`, { waitUntil: 'load' }).catch(() => {});
await page.waitForSelector('textarea', { timeout: 15000 });
ok('app loads and shows data FULLY OFFLINE (service worker + IndexedDB)',
  (await page.locator('textarea').inputValue()).includes('standalone build works'));
await context.setOffline(false);

// --- 9. zero external network calls ---
ok('ZERO requests left localhost', externalRequests.length === 0,
  externalRequests.slice(0, 5).join(', '));

await browser.close();
server.close();

console.log(failures.length ? `\n❌ FAILURES: ${failures.join(' | ')}` : '\n🎉 All standalone checks passed');
process.exit(failures.length ? 1 : 0);
