# Changelog

## 1.2.0 — Quality, security & docs review (2026-07-14)

### Fixed
- Typing a note or number while an autosave refresh landed could lose
  keystrokes (TaskRow no longer resets its inputs on background refreshes).
- Standalone build: a failed IndexedDB write (full storage, private mode)
  was silently ignored — it now retries, warns once, and advises exporting
  a backup.
- Importing a backup from a **newer** app version is now rejected up front
  instead of risking a partial import.

### Security
- The settings PIN is now stored as a salted SHA-256 hash (and therefore no
  longer readable in exported backups). Existing plaintext PINs upgrade
  automatically on first successful entry.

### Added
- **Change PIN** section in Settings; "forgot the PIN?" help on the lock
  screen (recovery steps in docs/troubleshooting.md).
- Diary history pagination — "read even older entries" past the first 60.
- Unit test suite (`npm test`, 21 tests) covering migrations, streak math,
  badges, backup round-trips and format guards, quiz banks, hashing.
- ESLint (`npm run lint`) with React hooks rules; codebase is clean.
- Documentation set: docs/user-guide.md, docs/developer-guide.md,
  docs/troubleshooting.md, this changelog.

### Improved
- Accessibility: proper labels/pressed states for mood, theme and calendar
  buttons and the PIN pad.
- Badge checks skip their stats computation once every badge is earned.
- Quiz replay seeds and the practice timer follow React purity rules
  (no impure calls during render).

## 1.1.0 — Fun & guide batch

- Quiz Corner rebuilt around kid trivia, true/false facts and emoji puzzles.
- Pip dress-up studio (badge-unlocked outfits), reading goals per book,
  diary photo-of-the-day + doodle pad, weekly recap card, riddle of the
  day, practice timer, year-in-moods grid, 11 new badges (23 total),
  6 new starter tasks, first-launch welcome tour, in-app guide.
- Schema v2 (books, quiz_results, diary photo/doodle) with automatic
  migration; backup format 2 (still imports format 1).

## 1.0.0 — Initial release

- Local-first task tracker + diary; one codebase, two builds
  (Express + better-sqlite3 server / sql.js + IndexedDB standalone PWA).
- Today, Diary (prompts + moods), History calendar + reading log, Sticker
  Book, Insights, PIN-locked Settings, themes, JSON export/import.
- GitHub Pages deploy workflow with correct subpath + offline support;
  browser-verified E2E suite.
