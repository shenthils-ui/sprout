# Sprout — User Guide

Sprout is a private daily task tracker + diary for a kid, with Pip, a
companion sprout that grows with activity. This guide covers every feature.
(The same content, in kid-friendly form, is inside the app:
**Settings → 📖 How Sprout works**.)

## Concepts

- **Two copies, one data format.** The phone app and the laptop version are
  the same app. Each keeps its own data; a JSON backup moves data between
  them (Settings → Backup). Importing **replaces** everything in that copy.
- **Everything is autosaved.** There is no Save button anywhere.
- **No guilt, by design.** Skipping is neutral, streaks forgive a missed
  day, badges are never taken away, and Pip never looks sad.

## Today screen 🌱

- Big date header with ← → to visit past days (future days are locked).
- **Check tasks** cycle on tap: Done → Skipped → unset.
- **Count tasks** (pages, minutes, glasses…) have − / + steppers, a number
  box, and an optional note (book title, song name).
- **⏱ Practice timer** on minute tasks: start → practice → "stop & add".
- **Pip** grows through 6 stages based on the last 7 days of tasks + diary
  activity. Tap Pip to open the dress-up studio (outfits unlock via badges).
- **Daily fun card:** word/fact of the day, riddle of the day (tap
  "reveal!"), 🧠 Quiz Corner (3 questions: trivia, true/false, emoji
  puzzle — best score of the day counts), ✨ My week (recap card).
- Progress ring counts done vs applicable tasks; skipped tasks don't count
  against progress.

## Diary 📔

- A rotating writing prompt (36+ in the bank, no repeats for a month) with
  a 🎲 shuffle. Parents can add custom prompts in Settings.
- Free-text entry, autosaved while typing; optional mood emoji
  (tap again to clear); optional **photo of the day** (auto-shrunk to keep
  the app small); optional **doodle pad** (7 colors).
- **Past entries** below (journal-styled, newest first, "read even older
  entries" for pagination). **🖨️ Memory Book** compiles the whole diary +
  reading list into a printable page (browser print → Save as PDF).

## History 📅

- Monthly calendar; brighter days = more done; 📖 marks a diary entry.
- Tap a day to view/edit that day's full log and diary together.
- **Reading log:** books grouped by title with pages, progress bars, and an
  optional **page goal** per book — reaching it celebrates and marks the
  book finished.

## Sticker Book ⭐

23 badges for milestones (first task, streaks, pages read, diary counts,
quiz wins, …). Tap one for its story. Locked ones show ❔. Earned badges
are permanent and unlock outfits for Pip.

## Insights 📊 (parent-facing)

Per-task completion % (week/month), count totals and averages, current +
longest streaks (kind math: one missed day never breaks a streak), diary
counts, top mood, and a year-in-moods pixel grid.

## Settings ⚙️

- **📖 How Sprout works** — the in-app guide (no PIN).
- **🎨 Make it yours** — 6 color themes + light/dark (no PIN, device-local).
- Behind the **4-digit PIN** (set on first open, stored hashed):
  - **Tasks:** add/rename/reorder/retire/delete, check vs count, unit, note
    label, weekday schedule, emoji.
  - **Writing prompts:** add/remove the diary prompt bank.
  - **Backup:** Export JSON / Import JSON (works across both copies).
  - **Change PIN.**

## FAQ

- **Does it need internet?** Only to install/update the phone app from the
  GitHub Pages URL. Everything else is fully offline.
- **Where is my data?** Phone: in the browser's IndexedDB, on the device.
  Laptop: `data/sprout.db`. Nothing is sent anywhere.
- **Forgot the PIN?** See the Troubleshooting guide — data is never locked,
  only the settings page.
- **Multiple kids?** One profile per install. A second phone/browser
  profile works as a second copy.

## Known limitations

- The phone and laptop copies do not sync automatically — moving data is a
  manual export/import.
- Clearing the browser's site data on the phone deletes the app's data —
  export a backup first (and occasionally, just in case).
- One diary text box per day in the UI (the data model supports more).

*Screenshots: see the README and the app itself — every screen described
above matches the current implementation.*
