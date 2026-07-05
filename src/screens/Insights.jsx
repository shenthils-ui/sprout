// The parent's glance-at-the-week screen. Deliberately calm and low-key.

import { useEffect, useState } from 'react';
import { addDays, todayStr } from '../../shared/dates.js';
import { getApi } from '../api/index.js';

export default function Insights() {
  const [range, setRange] = useState('week');
  const [data, setData] = useState(null);
  const to = todayStr();
  const from = addDays(to, range === 'week' ? -6 : -29);

  useEffect(() => {
    getApi().getInsights({ from, to }).then(setData).catch(console.error);
  }, [from, to]);

  return (
    <div className="anim-rise">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">📊 Insights</h1>
        <div className="flex rounded-full border border-(--line) bg-(--card) p-1 text-xs font-bold">
          {['week', 'month'].map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className="rounded-full px-3 py-1.5 transition-colors"
              style={r === range ? { background: 'var(--accent)', color: 'white' } : { color: 'var(--muted)' }}>
              this {r}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <>
          <div className="mt-4 flex flex-col gap-2">
            {data.perTask.map(({ task, done, applicable, pct, countTotal, countAvg, currentStreak, longestStreak }) => (
              <div key={task.id} className="rounded-2xl border border-(--line) bg-(--card) p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{task.emoji}</span>
                  <p className="flex-1 text-sm font-bold">{task.name}</p>
                  <p className="text-sm font-extrabold text-(--accent)">{Math.round(pct * 100)}%</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-(--line)">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct * 100}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-(--muted)">
                  <span>{done}/{applicable} days</span>
                  {task.kind === 'count' && countTotal > 0 && (
                    <span>{Math.round(countTotal)} {task.unit} total · ~{Math.round(countAvg)}/day</span>
                  )}
                  {currentStreak > 1 && <span>🔥 {currentStreak}-day streak</span>}
                  {longestStreak > 1 && <span>best: {longestStreak}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-2xl border border-(--line) bg-(--card) p-3 shadow-sm">
            <p className="text-sm font-bold">📔 Diary</p>
            <p className="mt-1 text-sm text-(--muted)">
              {data.diary.entries === 0
                ? `No entries this ${range} — and that's perfectly fine.`
                : <>{data.diary.entries} {data.diary.entries === 1 ? 'entry' : 'entries'} this {range}
                  {data.diary.topMood && <> · most common mood: <span className="text-base">{data.diary.topMood}</span></>}</>}
            </p>
          </div>

          <p className="mt-4 text-center text-[11px] text-(--muted)">
            Streaks here are counted kindly — one missed day never breaks them. 💛
          </p>
        </>
      )}
    </div>
  );
}
