// The in-app guide: every feature explained in kid-friendly language.
// Reachable from Settings (outside the PIN) and from the welcome tour.

import { useState } from 'react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    emoji: '🌱', title: 'Today — your home screen',
    items: [
      ['✅ Check tasks', 'Tap once = Done (yay!). Tap again = Skipped — that\'s totally fine, tomorrow\'s a fresh start. Tap a third time to clear it.'],
      ['🔢 Number tasks', 'Use − and + or type the number (like pages read or minutes practiced). Add the book or song name in the little note box.'],
      ['⏱ Practice timer', 'On minute tasks, tap "start timer", go practice, then "stop & add" — the minutes fill in by themselves.'],
      ['🌱 Pip', 'Pip grows when you do tasks and write in your diary. If you take a break, Pip just waits for you — Pip is never sad. Tap Pip to dress them up with outfits you unlock!'],
      ['💡 Word & 🧩 riddle', 'A new word and a new riddle every single day. Tap "reveal!" to see the riddle\'s answer.'],
      ['🧠 Quiz Corner', 'Three quick word questions a day. Wrong answers are fine — you just learned a new word!'],
      ['← → arrows', 'Go back to yesterday if you forgot to fill something in.'],
    ],
  },
  {
    emoji: '📔', title: 'Diary — your private book',
    items: [
      ['💭 Writing prompt', 'A new idea every day to help you start. Don\'t like it? Tap 🎲 shuffle. You can also ignore it and write anything!'],
      ['💾 Autosave', 'Everything saves by itself while you type. There is no save button because you don\'t need one.'],
      ['😄 Mood', 'Pick an emoji for how today felt. Totally optional.'],
      ['📸 Photo & 🖌️ doodle', 'Add one photo of your day, and draw a little doodle. They become part of your diary forever.'],
      ['📖 Past entries', 'Scroll back through everything you\'ve written — it becomes a real treasure over time.'],
      ['🖨️ Memory Book', 'Turns your whole diary into a printable book a grown-up can print and keep.'],
    ],
  },
  {
    emoji: '📅', title: 'History — the calendar',
    items: [
      ['🟡 Colored days', 'The brighter the day, the more you did. A tiny 📖 means you wrote in your diary that day.'],
      ['✏️ Fix a day', 'Tap any day to see and edit everything from that day.'],
      ['📚 Reading log', 'Every book you log pages for shows up here with a progress bar. Tap "set a page goal" and watch the bar fill up — finishing a book earns a sticker!'],
    ],
  },
  {
    emoji: '⭐', title: 'Sticker Book',
    items: [
      ['🏅 Stickers', 'You earn stickers for all kinds of things — first diary entry, reading streaks, quiz wins. Tap one to see how it\'s earned. Mystery ones show ❔ until you find them!'],
      ['💛 Forever yours', 'Once you earn a sticker, it can NEVER be taken away. Stickers also unlock outfits for Pip.'],
    ],
  },
  {
    emoji: '✨', title: 'My Week',
    items: [
      ['📊 Recap card', 'Tap "My week" on the Today screen for a cheerful summary of your last 7 days — screenshot it to share!'],
    ],
  },
  {
    emoji: '📈', title: 'Insights (mostly for grown-ups)',
    items: [
      ['📉 Quiet numbers', 'How the week or month went for each task, plus a mood map of the whole year.'],
      ['🔥 Kind streaks', 'Streaks here are counted kindly — missing ONE day never breaks a streak. Two days in a row just starts a fresh one, no big deal.'],
    ],
  },
  {
    emoji: '⚙️', title: 'Settings',
    items: [
      ['🎨 Make it yours', 'Pick your color theme and light/dark mode — this part is all yours, change it as often as you like.'],
      ['🔒 Grown-up corner', 'Behind the PIN: editing the task list, writing prompts, and backups. Ask your grown-up if a task needs changing.'],
      ['💾 Backup (grown-ups)', 'Export JSON downloads every bit of data as one file; Import replaces everything with a backup file. This is how data moves between the phone and the laptop — the file works on both.'],
    ],
  },
  {
    emoji: '🔐', title: 'Your privacy',
    items: [
      ['🏠 Everything stays here', 'Sprout has no internet connection, no account, and no cloud. Your diary and photos live only on this device. Nobody can read them unless you show them.'],
    ],
  },
];

export default function Guide() {
  const [open, setOpen] = useState(0);

  return (
    <div className="anim-rise">
      <Link to="/settings" className="text-sm font-bold text-(--accent)">← back to settings</Link>
      <div className="mt-2 text-center">
        <div className="text-4xl">🌱</div>
        <h1 className="text-lg font-extrabold">How Sprout works</h1>
        <p className="text-xs text-(--muted)">Tap a section to open it</p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {SECTIONS.map((s, i) => (
          <section key={s.title} className="rounded-3xl border border-(--line) bg-(--card) shadow-sm">
            <button onClick={() => setOpen(open === i ? -1 : i)}
              className="flex w-full items-center gap-2 p-4 text-left font-extrabold">
              <span className="text-xl">{s.emoji}</span>
              <span className="flex-1">{s.title}</span>
              <span className="text-(--muted)">{open === i ? '▾' : '▸'}</span>
            </button>
            {open === i && (
              <div className="flex flex-col gap-3 px-4 pb-4">
                {s.items.map(([head, body]) => (
                  <div key={head}>
                    <p className="text-sm font-bold">{head}</p>
                    <p className="text-sm leading-relaxed text-(--muted)">{body}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <p className="mt-4 text-center text-[11px] text-(--muted)">
        Made with 💛 for one very special kid.
      </p>
    </div>
  );
}
