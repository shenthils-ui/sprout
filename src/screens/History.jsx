import { useEffect, useState } from 'react';
import { monthDays, todayStr, weekdayOf } from '../../shared/dates.js';
import { getApi } from '../api/index.js';
import { useCelebrate } from '../components/Celebration.jsx';
import TaskRow from '../components/TaskRow.jsx';
import { friendlyDate } from '../lib/daily.js';

function shiftMonth(ym, n) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function History() {
  const today = todayStr();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [data, setData] = useState({ days: {} });
  const [selected, setSelected] = useState(null);
  const [day, setDay] = useState(null);
  const [books, setBooks] = useState([]);
  const celebrate = useCelebrate();

  useEffect(() => {
    getApi().getMonth({ month }).then(setData).catch(console.error);
    getApi().getReadingLog().then(setBooks).catch(console.error);
  }, [month]);

  useEffect(() => {
    if (!selected) { setDay(null); return; }
    getApi().getDay({ date: selected }).then(setDay).catch(console.error);
  }, [selected]);

  const reload = async (result) => {
    celebrate(result?.newBadges);
    setDay(await getApi().getDay({ date: selected }));
    setData(await getApi().getMonth({ month }));
  };

  const days = monthDays(month);
  const label = new Date(`${month}-01T00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const leading = weekdayOf(days[0]);
  const maxPages = Math.max(...books.map((b) => b.pages), 1);

  return (
    <div className="anim-rise">
      {/* month nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month"
          className="h-11 w-11 rounded-full bg-(--card) shadow-sm border border-(--line) active:scale-90 transition-transform">←</button>
        <h1 className="text-lg font-extrabold">📅 {label}</h1>
        <button onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month"
          disabled={month >= today.slice(0, 7)}
          className="h-11 w-11 rounded-full bg-(--card) shadow-sm border border-(--line) active:scale-90 transition-transform disabled:opacity-30">→</button>
      </div>

      {/* calendar */}
      <div className="mt-3 grid grid-cols-7 gap-1.5 rounded-3xl border border-(--line) bg-(--card) p-3 shadow-sm">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-(--muted)">{d}</div>
        ))}
        {Array.from({ length: leading }).map((_, i) => <div key={`x${i}`} />)}
        {days.map((d) => {
          const info = data.days[d];
          const pct = info?.pct ?? 0;
          const future = d > today;
          return (
            <button key={d} onClick={() => !future && setSelected(d === selected ? null : d)}
              disabled={future}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-xs font-bold transition-transform active:scale-90 ${
                future ? 'opacity-25' : ''} ${selected === d ? 'ring-2 ring-(--accent)' : ''}`}
              style={{
                background: info
                  ? `color-mix(in srgb, var(--accent) ${Math.round(20 + pct * 60)}%, var(--bg))`
                  : 'var(--bg)',
                color: info && pct > 0.5 ? 'white' : 'var(--ink)',
              }}>
              {Number(d.slice(8))}
              {info?.hasDiary && <span className="absolute bottom-0.5 text-[8px]">📖</span>}
              {d === today && <span className="absolute top-0.5 right-1 text-[8px]">●</span>}
            </button>
          );
        })}
      </div>

      {/* selected day details: full log + diary together */}
      {selected && day && (
        <div className="anim-rise mt-4 rounded-3xl border border-(--line) bg-(--card) p-4 shadow-sm">
          <h2 className="font-extrabold">{friendlyDate(selected)}</h2>
          <div className="mt-3 flex flex-col gap-3">
            {day.tasks.map((t) => (
              <TaskRow key={`${t.id}-${selected}`} task={t} log={day.logs[t.id]}
                onCheck={(status) =>
                  getApi().setCheck({ date: selected, task_id: t.id, status }).then(reload)}
                onCount={(count, note) =>
                  getApi().setCount({ date: selected, task_id: t.id, count, note }).then(reload)}
              />
            ))}
          </div>
          {day.diary.filter((e) => e.text || e.photo || e.doodle).map((e) => (
            <article key={e.id} className="journal-lines mt-3 rounded-2xl p-3"
              style={{ background: 'var(--tint)' }}>
              <p className="text-xs font-bold">📔 Diary {e.mood && <span className="text-base">{e.mood}</span>}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-[1.6em]">{e.text}</p>
              {e.photo && <img src={e.photo} alt="" className="mt-2 w-full rounded-xl" />}
              {e.doodle && <img src={e.doodle} alt="doodle" className="mt-2 w-full rounded-xl" />}
            </article>
          ))}
        </div>
      )}

      {/* reading log */}
      <div className="mt-5">
        <h2 className="font-extrabold">📚 Reading log</h2>
        {books.length === 0 ? (
          <div className="mt-2 rounded-3xl bg-(--card) p-6 text-center text-sm text-(--muted) shadow-sm">
            No books logged yet — your next great read is waiting! 📖
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {books.map((b) => {
              const pct = b.total_pages
                ? Math.min(1, b.pages / b.total_pages)
                : Math.max(0.06, b.pages / maxPages);
              return (
                <div key={b.title} className="rounded-2xl border border-(--line) bg-(--card) p-3 shadow-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-bold">{b.finished && '🎉 '}{b.title}</p>
                    <p className="shrink-0 text-xs text-(--muted)">
                      {b.total_pages
                        ? b.finished
                          ? 'finished!'
                          : `${b.pages}/${b.total_pages} pages · ${Math.round(pct * 100)}%`
                        : `${b.pages} pages · ${b.days} day${b.days > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-(--line)">
                    <div className="h-full rounded-full"
                      style={{
                        width: `${pct * 100}%`,
                        background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
                      }} />
                  </div>
                  {!b.finished && (
                    <button onClick={async () => {
                      const v = window.prompt(
                        `How many pages does "${b.title}" have in total?`,
                        b.total_pages ?? '');
                      if (v === null) return;
                      const n = parseInt(v, 10);
                      const res = await getApi().setBookGoal({
                        title: b.title, total_pages: Number.isFinite(n) && n > 0 ? n : null });
                      celebrate(res.newBadges);
                      setBooks(await getApi().getReadingLog());
                    }} className="mt-1.5 text-[11px] font-bold text-(--accent)">
                      {b.total_pages ? '✏️ change goal' : '🎯 set a page goal'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
