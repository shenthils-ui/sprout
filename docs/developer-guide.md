# Sprout — Developer Guide

## Architecture in one paragraph

One React/Vite/Tailwind codebase produces two builds. The **server build**
(`npm run build` → `dist/`) is served by Express (`server/index.js`) which
opens the SQLite file with better-sqlite3 and exposes the entire data layer
as a single RPC endpoint. The **standalone build**
(`npm run build:standalone` → `dist-standalone/`) has no backend: it runs
sql.js (SQLite compiled to WebAssembly) in the browser behind a thin
better-sqlite3-compatible shim, persists the database bytes to IndexedDB,
and ships as an installable, fully offline PWA. **All schema, queries and
business logic live once, in `shared/`**, and run unchanged on both engines.

## Folder structure

```
shared/            single source of truth (runs in Node AND the browser)
  schema.js        DDL, SCHEMA_VERSION, migrate() with v1→v2 migration
  store.js         createStore(db): every operation the app can perform
  seeds.js         starter tasks + writing prompts
  badges.js        badge catalog + award conditions
  streaks.js       kind streak/companion math
  quiz.js          quiz question banks + round builder
  words.js         word/fact-of-the-day bank
  riddles.js       riddle bank
  dates.js         local-date helpers ("YYYY-MM-DD" strings everywhere)
  hash.js          pure-JS SHA-256 (PIN hashing; no crypto.subtle over LAN http)
server/index.js    Express: POST /api/rpc {method, params} -> store[method](params)
src/
  api/             the build-time switch
    index.js       initApi(): VITE_STANDALONE ? local engine : fetch RPC
    remote.js      fetch('/api/rpc') proxy (server build)
    local.js       sql.js engine + IndexedDB persistence (standalone build)
    sqljs-shim.js  better-sqlite3-compatible wrapper around sql.js
    idb.js         minimal IndexedDB key-value helper
  screens/         Today, Diary, History, Stickers, Insights, Settings,
                   Guide, Recap, MemoryBook
  components/      TaskRow, Companion, PipStudio, QuizModal, DoodlePad,
                   Celebration, PinGate, ProgressRing, WelcomeTour
  lib/             theme palettes, daily rotation, decorations catalog
scripts/
  verify-standalone.mjs  browser E2E suite (see Testing)
  copy-404.mjs           GitHub Pages SPA fallback
tests/store.test.mjs     unit tests for shared/
.github/workflows/deploy.yml  Pages deploy on push to main
```

## Key design decisions

- **RPC over REST:** the store's methods all take one JSON-serializable
  params object and return JSON, so the server is one generic route and
  both builds call the identical surface. Adding a feature = add a store
  method; no server change needed.
- **Dead-code elimination of the engines:** `VITE_STANDALONE` is defined
  statically in `vite.config.js`, so the sql.js/WASM engine is tree-shaken
  out of the server build (CI-verifiable: no `.wasm` in `dist/`).
- **Migrations:** bump `SCHEMA_VERSION`, extend `migrate()` (use
  `ensureColumn` for ALTERs — sql.js and better-sqlite3 both support
  `pragma_table_info`). Backups carry a `format` number; `importData`
  accepts older formats and rejects newer ones.
- **GitHub Pages subpath:** `VITE_BASE` (set by the workflow from the repo
  name) drives Vite `base`, manifest `start_url`/`scope`, the router
  basename, and the 404.html fallback.
- **Kindness is a spec requirement:** no red error colors for skips,
  streaks forgive one missed day (`shared/streaks.js`), badges are
  insert-only.

## Development

```
npm install
npm run server        # Express + SQLite on :3000
npm run dev           # Vite dev server (proxies /api to :3000)
npm test              # unit tests (node --test, in-memory SQLite)
npm run lint          # ESLint (flat config)
npm run build         # server build -> dist/
npm run build:standalone            # standalone -> dist-standalone/
```

`window.sproutApi` exposes the live store in the browser console on both
builds — useful for debugging and used by the E2E suite.

## Testing strategy

- **Unit** (`tests/store.test.mjs`): schema migration, streak math, badge
  awarding, backup round-trip + format guards, quiz bank integrity, hashing.
- **E2E** (`scripts/verify-standalone.mjs`, needs
  `npm i --no-save playwright-core`; Chromium path via `CHROMIUM_PATH` or
  the preinstalled `/opt/pw-browsers/chromium`): serves `dist-standalone`
  exactly like GitHub Pages (subpath + 404.html), then proves in a real
  browser: zero network escapes localhost, seeding, IndexedDB persistence
  across reload, deep links pre/post service worker, offline reload, PIN
  hashing, quiz round, dress-up, reading goals, recap. Build first with
  `VITE_BASE=/sprout/ npm run build:standalone`.

## Deployment

Push to `main` → `.github/workflows/deploy.yml` builds the standalone
target with `VITE_BASE=/<repo>/` and deploys to GitHub Pages (repo setting:
Pages → Source → "GitHub Actions", once). The laptop version deploys by
`git pull` + delete `dist/` + `start.bat` (rebuilds when `dist/` missing).

## Adding a feature (checklist)

1. Schema change? Bump `SCHEMA_VERSION`, add migration + export/import
   columns, extend the unit tests.
2. Add the store method in `shared/store.js` (single params object).
3. If it's a write, list it OUTSIDE `READ_ONLY` in `src/api/local.js` so it
   persists (read-only methods go in the set to skip redundant writes).
4. Build the UI; celebrate with `useCelebrate()(result.newBadges)`.
5. Add a check to the E2E script; run `npm test`, `npm run lint`, both
   builds, and the E2E suite.
