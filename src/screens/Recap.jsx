// "My week" — a cheerful shareable recap card of the last 7 days.
// Built entirely from existing store calls; screenshot it to share.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, todayStr } from '../../shared/dates.js';
import { getApi } from '../api/index.js';
import Companion from '../components/Companion.jsx';
import { parsePipStyle } from '../lib/decorations.js';

export default function Recap() {
  const [data, setData] = useState(null);
  const to = todayStr();
  const from = addDays(to, -6);

  useEffect(() => {
    const api = getApi();
    (async () => {
      const [insights, badges, companion, settings] = await Promise.all([
        api.getInsights({ from, to }), api.getBadges(), api.getCompanion(), api.getSettings()]);
      const days = await Promise.all(
        Array.from({ length: 7 }, (_, i) => api.getDay({ date: addDays(from, i) })));
      setData({ insights, badges, companion, days, style: parsePipStyle(settings) });
    })().catch(console.error);
  }, [from, to]);

  if (!data) return null;
  const { insights, badges, companion, days, style } = data;

  const totalDone = days.reduce((s, d) => s + d.progress.done, 0);
  const pages = insights.perTask.filter((t) => t.task.unit === 'pages')
    .reduce((s, t) => s + t.countTotal, 0);
  const minutes = insights.perTask.filter((t) => /min/i.test(t.task.unit || ''))
    .reduce((s, t) => s + t.countTotal, 0);
  const newStickers = badges.catalog.filter(
    (b) => badges.earned[b.id] && badges.earned[b.id].slice(0, 10) >= from);
  let bestI = -1, bestDone = 0;
  days.forEach((d, i) => { if (d.progress.done > bestDone) { bestDone = d.progress.done; bestI = i; } });

  const fmt = (d) => new Date(`${d}T00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const stat = (emoji, n, label) => (
    <div className="rounded-2xl bg-(--card) p-3 text-center shadow-sm">
      <div className="text-2xl">{emoji}</div>
      <div className="text-xl font-extrabold">{Math.round(n)}</div>
      <div className="text-[10px] font-semibold text-(--muted)">{label}</div>
    </div>
  );

  return (
    <div className="anim-rise">
      <Link to="/today" className="no-print text-sm font-bold text-(--accent)">← back</Link>
      <div className="mt-2 rounded-3xl p-4"
        style={{ background: 'linear-gradient(160deg, var(--tint), var(--bg))' }}>
        <div className="text-center">
          <h1 className="text-xl font-extrabold">✨ My week ✨</h1>
          <p className="text-xs font-semibold text-(--muted)">{fmt(from)} – {fmt(to)}</p>
        </div>
        <Companion companion={companion} style={style} size="sm" />

        <div className="grid grid-cols-2 gap-2">
          {stat('✅', totalDone, 'tasks done')}
          {stat('📔', insights.diary.entries, 'diary entries')}
          {pages > 0 && stat('📚', pages, 'pages read')}
          {minutes > 0 && stat('🎵', minutes, 'practice minutes')}
        </div>

        {/* mood strip */}
        <div className="mt-2 rounded-2xl bg-(--card) p-3 shadow-sm">
          <p className="text-[10px] font-bold text-(--muted)">MOODS THIS WEEK</p>
          <div className="mt-1 flex justify-between">
            {days.map((d, i) => {
              const mood = d.diary.find((e) => e.mood)?.mood;
              const date = addDays(from, i);
              return (
                <div key={date} className="flex flex-col items-center gap-0.5">
                  <span className="text-xl">{mood ?? '·'}</span>
                  <span className="text-[9px] font-bold text-(--muted)">
                    {new Date(`${date}T00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {bestI >= 0 && (
          <p className="mt-2 rounded-2xl bg-(--card) p-3 text-center text-sm font-semibold shadow-sm">
            🌟 Star day: <b>{fmt(addDays(from, bestI))}</b> — {bestDone} tasks done!
          </p>
        )}

        {newStickers.length > 0 && (
          <div className="mt-2 rounded-2xl bg-(--card) p-3 text-center shadow-sm">
            <p className="text-[10px] font-bold text-(--muted)">NEW STICKERS</p>
            <p className="mt-1 text-2xl">{newStickers.map((b) => b.emoji).join(' ')}</p>
          </div>
        )}

        <p className="mt-3 text-center text-[11px] text-(--muted)">
          made with 🌱 Sprout — screenshot me!
        </p>
      </div>
    </div>
  );
}
