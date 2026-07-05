// First-launch welcome: Pip introduces the app in four little slides.
// Shows once per device (localStorage flag) — reopen it any time from the
// full guide in Settings.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    emoji: '🌱',
    title: "Hi! I'm Pip!",
    text: 'Welcome to Sprout — your very own app. Do your daily things, write your diary, and watch me grow from a tiny seed into full bloom!',
  },
  {
    emoji: '✅',
    title: 'Tasks are taps',
    text: 'Tap a task once for Done 🎉. Tap again for Skipped — that\'s completely okay, tomorrow\'s a fresh start. Number tasks like reading have − and + buttons.',
  },
  {
    emoji: '📔',
    title: 'Your diary',
    text: 'A private page for every day, with a writing idea to get you started, mood emojis, a photo, and even a doodle pad. It saves itself while you type.',
  },
  {
    emoji: '⭐',
    title: 'Stickers & fun',
    text: 'Earn stickers you keep forever, play the daily word quiz, solve the riddle of the day… and use your stickers to unlock outfits for me!',
  },
];

export function shouldShowTour() {
  return !localStorage.getItem('sprout-welcomed');
}

export default function WelcomeTour({ onClose }) {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const s = SLIDES[i];
  const last = i === SLIDES.length - 1;

  const finish = () => {
    localStorage.setItem('sprout-welcomed', '1');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="anim-badge w-full max-w-xs rounded-3xl bg-(--card) p-6 text-center shadow-2xl">
        <div className="text-6xl anim-wiggle">{s.emoji}</div>
        <h3 className="mt-3 text-xl font-extrabold">{s.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-(--muted)">{s.text}</p>

        <div className="mt-4 flex justify-center gap-1.5">
          {SLIDES.map((_, d) => (
            <span key={d} className="h-2 w-2 rounded-full"
              style={{ background: d === i ? 'var(--accent)' : 'var(--line)' }} />
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={() => (last ? finish() : setI(i + 1))}
            className="w-full rounded-full py-2.5 font-bold text-white active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}>
            {last ? "Let's go! 🌱" : 'Next →'}
          </button>
          {last ? (
            <button onClick={() => { finish(); navigate('/guide'); }}
              className="w-full rounded-full border-2 border-(--line) py-2.5 text-sm font-bold">
              📖 Show me the full guide
            </button>
          ) : (
            <button onClick={finish} className="text-xs font-bold text-(--muted)">
              skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
