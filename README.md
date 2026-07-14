# 🌱 Sprout

A fun, private, local-first daily task tracker + diary for kids — with Pip,
a little companion sprout that grows as you go (and can be dressed up with
outfits unlocked by stickers). No cloud, no accounts, no tracking. All data
stays on your own devices.

Inside: daily tasks with a practice timer, a diary with rotating writing
prompts, mood emoji, photo-of-the-day and a doodle pad, a word + riddle of
the day, a 3-question Quiz Corner, reading goals per book, a sticker book
(23 badges), a weekly recap card, a history calendar with a Daylio-style
"year in moods", and a printable Memory Book.

One codebase, two ways to run it:

| | Where it runs | Where data lives |
|---|---|---|
| **Phone app** | Installed from your GitHub Pages URL, then works 100% offline | In the phone's own browser storage (SQLite-in-WASM → IndexedDB) |
| **Laptop version** | A small local server started by `start.bat` | `data/sprout.db` (SQLite file) on the laptop |

Both use the identical data format, so a backup exported from one imports
cleanly into the other.

---

## 1. One-time setup on the laptop (Windows)

1. Install **Node.js** (the LTS version) from <https://nodejs.org> — just
   click through the installer with default options.
2. Double-click **`start.bat`** in this folder. The first run installs
   packages and builds the app (needs internet once); after that it starts
   instantly and works without internet.
3. A browser opens at `http://localhost:3000`. Keep the black window open
   while using the app; close it to stop the server.

The window also prints a Wi-Fi address like `http://192.168.1.23:3000` —
any phone on the same Wi-Fi can open the laptop version there.

## 2. One-time setup for the phone app (GitHub Pages)

1. Push this repository to GitHub (branch `main`).
2. In the repository: **Settings → Pages → Source → "GitHub Actions"**.
   That's the only setting you need to touch.
3. Every push to `main` now auto-builds and deploys the standalone app to
   `https://<your-username>.github.io/<repo-name>/`.

### Installing on her Android phone

1. Open the Pages URL in **Chrome** on the phone (internet needed just this once).
2. Chrome menu (⋮) → **"Add to Home screen"** → Add.
3. Done. The 🌱 icon on her home screen now opens Sprout like a normal app —
   full screen, no browser bars, **no internet needed ever again**. All her
   data lives only on her phone.

## 3. Moving her data onto the laptop (and back)

1. On the phone: **Settings → (enter PIN) → Backup & move data → Export JSON**.
   A file like `sprout-backup-2026-07-05.json` downloads.
2. Get the file to the laptop however you like (USB cable, email to yourself,
   Bluetooth…).
3. On the laptop version: **Settings → Backup & move data → Import JSON** and
   pick the file. Importing **replaces** everything in that copy of the app.

The same works in reverse (laptop → phone).

## 4. For the parent

- **Settings is PIN-locked** (you choose a 4-digit PIN the first time you open
  it; it's stored hashed and can be changed in Settings). It's a soft deterrent
  so tasks don't get rearranged by accident — not real security. Forgot it?
  See [Troubleshooting](docs/troubleshooting.md). The **theme picker is outside
  the PIN** on purpose, so she can restyle her app freely.
- **Tasks** are fully editable in Settings: name, emoji, check vs. count,
  unit, optional note, which weekdays it applies to, order. "Retire" hides a
  task but keeps its history; delete removes history too.
- **Insights** shows per-task completion, totals/averages, streaks (counted
  kindly — one missed day never breaks a streak), and diary activity.
- **Memory Book** (link on the Diary screen) compiles all diary entries into
  a printable page — use the browser's print → Save as PDF for a keepsake.
- Skipping a task is always framed neutrally in the app. No guilt, ever.

## 5. Development

```
npm install
npm run dev               # dev server (start `npm run server` alongside for the API)
npm run build             # server-mode frontend  -> dist/
npm run build:standalone  # standalone PWA        -> dist-standalone/ (+404.html)
npm run server            # Express + better-sqlite3 on :3000
npm test                  # unit tests (shared data layer)
npm run lint              # ESLint
```

More documentation:

- **[User guide](docs/user-guide.md)** — every feature and workflow (also
  in-app: Settings → How Sprout works)
- **[Developer guide](docs/developer-guide.md)** — architecture, folder
  structure, testing, adding features
- **[Troubleshooting](docs/troubleshooting.md)** — install issues, updates,
  **forgot-PIN recovery**, data recovery
- **[Changelog](CHANGELOG.md)**

Architecture notes:

- `shared/` is the single source of truth: SQL schema, all business logic
  (`store.js`), seeds, badge rules, streak math. It runs unchanged on
  better-sqlite3 (Node) and on sql.js/WASM in the browser via a thin
  better-sqlite3-compatible shim (`src/api/sqljs-shim.js`).
- `src/api/index.js` decides at build time (`VITE_STANDALONE`) whether calls
  go to `fetch('/api/rpc')` or the in-browser engine. The sql.js engine is
  dynamically imported, so the server build contains no WASM.
- GitHub Pages subpath is handled by `VITE_BASE` (set in the workflow):
  Vite `base`, PWA `start_url`/`scope`, router basename, and a `404.html`
  SPA fallback all derive from it.
- `scripts/verify-standalone.mjs` (needs `npm i --no-save playwright-core`)
  drives a real Chromium through the standalone build under a simulated
  Pages subpath and asserts: zero network calls, IndexedDB persistence
  across reloads, deep links, offline mode via the service worker.
