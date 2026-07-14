# Sprout — Troubleshooting

## Laptop (start.bat)

**"Node.js is not installed"** — install the LTS from <https://nodejs.org>,
then run start.bat again.

**First run is slow / seems stuck** — the first run downloads packages and
builds the app (needs internet once). Later runs start in seconds.

**Browser shows "can't reach this page"** — keep the black console window
open; closing it stops the server. Re-run start.bat.

**Phone can't open the Wi-Fi address (http://192.168.x.x:3000)** — allow
Node.js when Windows Firewall asks (or add an inbound rule for it), and make
sure the phone is on the same Wi-Fi network.

**Updating after `git pull` doesn't show new features** — delete the `dist`
folder and run start.bat again (it rebuilds when `dist` is missing).

**better-sqlite3 install/build errors on Windows** — use the Node LTS
version (prebuilt binaries exist for it); after switching Node versions,
delete `node_modules` and re-run start.bat.

## Phone (standalone app)

**App won't update** — open it with internet on, wait ~10 s, close it fully
(swipe away), reopen. Updates never touch your data.

**Deep link / white screen on first visit** — make sure you're on the
GitHub Pages URL (…github.io/sprout/). If the deploy just finished, wait a
minute and reload once.

**"Sprout couldn't save to this device's storage"** — the phone is out of
storage or the browser is in a private/incognito profile. Free up space,
and export a backup (Settings → Backup) before closing the app; your
changes are still in memory until then.

**Data disappeared** — almost always "Clear browsing data" for the site, or
a different browser/profile was opened. Restore from your latest JSON
backup (Settings → Import). This is why occasional exports matter.

## Forgot the PIN

The PIN only guards the settings page — the data is never locked. To reset:

1. Open the app, and open the browser's console
   (laptop: F12 → Console; phone: use the laptop version, or connect Chrome
   remote debugging).
2. Run: `sproutApi.setSetting({ key: 'pin', value: null })`
3. Reload — Settings will ask you to choose a new PIN.

Alternative without a console: export a backup, open the JSON in a text
editor, delete the `{"key":"pin", ...}` object from `settings`, then import
the edited file.

## Backups

**Import says "Not a Sprout backup file"** — the file isn't a Sprout export
(or was edited into invalid JSON). Re-export and try again.

**Import says the backup is from a newer version** — update this copy of
the app first (phone: reopen with internet; laptop: `git pull`, delete
`dist`, start.bat), then import.

**Backup file is huge** — photos live inside the backup. That's by design
(one file = everything); attach fewer/smaller photos if size matters.

## Development

**`npm test` fails on a fresh clone** — run `npm install` first.

**E2E script errors "Cannot find module 'playwright-core'"** — it's
intentionally not a dependency: `npm i --no-save playwright-core`, and set
`CHROMIUM_PATH` if Chromium isn't at `/opt/pw-browsers/chromium`.

**Service worker serves a stale app in dev** — the PWA is only enabled in
the standalone build; use `npm run dev` for development, and unregister the
SW via DevTools → Application if you previewed a standalone build on the
same origin.
