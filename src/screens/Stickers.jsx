import { useEffect, useState } from 'react';
import { getApi } from '../api/index.js';
import { shortDate } from '../lib/daily.js';

export default function Stickers() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    getApi().getBadges().then(setData).catch(console.error);
  }, []);

  if (!data) return null;
  const earnedCount = Object.keys(data.earned).length;

  return (
    <div className="anim-rise">
      <h1 className="text-lg font-extrabold">⭐ Sticker Book</h1>
      <p className="text-xs text-(--muted)">
        {earnedCount === 0
          ? 'Your first sticker is closer than you think! ✨'
          : `${earnedCount} of ${data.catalog.length} collected — every one is yours forever.`}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {data.catalog.map((b) => {
          const earnedAt = data.earned[b.id];
          return (
            <button key={b.id} onClick={() => setOpen(open === b.id ? null : b.id)}
              className={`flex flex-col items-center gap-1 rounded-3xl border p-3 shadow-sm transition-transform active:scale-95 ${
                earnedAt ? 'border-(--accent) bg-(--card)' : 'border-(--line) bg-(--bg)'}`}>
              <span className={`text-4xl ${earnedAt ? '' : 'opacity-30 grayscale'}`}>
                {earnedAt ? b.emoji : '❔'}
              </span>
              <span className={`text-center text-[11px] font-bold leading-tight ${earnedAt ? '' : 'text-(--muted)'}`}>
                {b.name}
              </span>
            </button>
          );
        })}
      </div>

      {open && (() => {
        const b = data.catalog.find((x) => x.id === open);
        const earnedAt = data.earned[open];
        return (
          <div className="anim-rise mt-4 rounded-3xl p-4 text-center" style={{ background: 'var(--tint)' }}>
            <div className="text-4xl">{earnedAt ? b.emoji : '🔮'}</div>
            <p className="mt-1 font-extrabold">{b.name}</p>
            <p className="mt-1 text-sm text-(--muted)">{b.desc}</p>
            <p className="mt-2 text-xs font-bold text-(--accent)">
              {earnedAt ? `Earned ${shortDate(earnedAt.slice(0, 10))} 🎉` : 'Still a mystery… keep going!'}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
