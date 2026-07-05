// Pip's dress-up sheet: pick a hat and a friend. Items unlock via badges;
// locked items show which sticker earns them (a gentle nudge, never pressure).

import { useEffect, useState } from 'react';
import { BADGE_CATALOG } from '../../shared/badges.js';
import { getApi } from '../api/index.js';
import { DECORATIONS, DECOR_SLOTS } from '../lib/decorations.js';

export default function PipStudio({ style, onChange, onClose }) {
  const [earned, setEarned] = useState({});

  useEffect(() => {
    getApi().getBadges().then((b) => setEarned(b.earned)).catch(console.error);
  }, []);

  const pick = async (slot, id) => {
    const next = { ...style, [slot]: style[slot] === id ? null : id };
    onChange(next);
    await getApi().setSetting({ key: 'pip_style', value: JSON.stringify(next) });
  };

  const badgeName = (id) => BADGE_CATALOG.find((b) => b.id === id)?.name ?? id;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}>
      <div className="anim-rise max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-(--card) p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold">🪞 Dress up Pip</h3>
          <button onClick={onClose} className="rounded-full bg-(--bg) px-3 py-1.5 text-sm font-bold">done</button>
        </div>
        <p className="mt-1 text-xs text-(--muted)">New outfits unlock with stickers you earn!</p>

        {DECOR_SLOTS.map(({ slot, label }) => (
          <div key={slot} className="mt-4">
            <p className="text-sm font-bold">{label}</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              <button onClick={() => pick(slot, null)}
                className="flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-[10px] font-bold"
                style={{ borderColor: !style[slot] ? 'var(--accent)' : 'var(--line)' }}>
                <span className="text-2xl">🚫</span>none
              </button>
              {DECORATIONS.filter((d) => d.slot === slot).map((d) => {
                const unlocked = !!earned[d.badge];
                return (
                  <button key={d.id} disabled={!unlocked}
                    onClick={() => pick(slot, d.id)}
                    className="flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-center text-[10px] font-bold leading-tight"
                    style={{ borderColor: style[slot] === d.id ? 'var(--accent)' : 'var(--line)' }}>
                    <span className={`text-2xl ${unlocked ? '' : 'opacity-30 grayscale'}`}>
                      {unlocked ? d.emoji : '❔'}
                    </span>
                    {unlocked ? d.name : <span className="text-(--muted)">earn "{badgeName(d.badge)}"</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
