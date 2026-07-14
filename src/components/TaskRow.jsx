// One big colorful tappable task row.
// 'check' tasks cycle: unset -> Done (celebrate) -> Skipped (neutral) -> unset.
// 'count' tasks get a friendly stepper + optional note, autosaved (debounced).

import { useEffect, useRef, useState } from 'react';

// Forest-style focus timer for minute-based tasks: press play, practice,
// press stop — the minutes fill themselves in.
function PracticeTimer({ onDone }) {
  const [startedAt, setStartedAt] = useState(null);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(
      () => setSecs(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  if (!startedAt) {
    return (
      <button onClick={(e) => { e.stopPropagation(); setSecs(0); setStartedAt(Date.now()); }}
        className="mt-1 rounded-full bg-(--tint) px-2.5 py-1 text-[11px] font-bold text-(--accent)">
        ▶ start timer
      </button>
    );
  }
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return (
    <button onClick={(e) => {
      e.stopPropagation();
      setStartedAt(null);
      onDone(Math.max(1, Math.round(secs / 60)));
    }}
      className="mt-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white anim-pop"
      style={{ background: 'var(--accent)' }}>
      ⏹ {mm}:{ss} — stop &amp; add
    </button>
  );
}

export default function TaskRow({ task, log, onCheck, onCount }) {
  const status = log?.status ?? null;
  const isDone = status === 'done' || (log?.count ?? 0) > 0;
  const [sparkles, setSparkles] = useState([]);
  // Local input state is initialised once per mount. Parents remount this
  // component per date (key={`${task.id}-${date}`}), so a date change gets
  // fresh state — and background refreshes after autosave can never clobber
  // what's currently being typed.
  const [count, setCount] = useState(log?.count ?? '');
  const [note, setNote] = useState(log?.note ?? '');
  const debounce = useRef(null);

  const burst = () => {
    const id = Date.now();
    setSparkles((s) => [...s, id]);
    setTimeout(() => setSparkles((s) => s.filter((x) => x !== id)), 900);
  };

  const cycle = () => {
    const next = status === null ? 'done' : status === 'done' ? 'skipped' : null;
    if (next === 'done') burst();
    onCheck(next);
  };

  const scheduleCount = (c, n) => {
    setCount(c);
    setNote(n);
    clearTimeout(debounce.current);
    const num = c === '' ? null : Math.max(0, Number(c) || 0);
    if (num > 0 && (log?.count ?? 0) === 0) burst();
    debounce.current = setTimeout(() => onCount(num, n || null), 400);
  };

  const doneStyle = isDone
    ? { background: 'var(--tint)', borderColor: 'var(--accent)' }
    : { background: 'var(--card)', borderColor: 'var(--line)' };

  if (task.kind === 'check') {
    return (
      <button onClick={cycle}
        className={`relative w-full rounded-3xl border-2 p-4 text-left shadow-sm transition-all active:scale-[0.98] ${isDone ? 'anim-pop' : ''}`}
        style={doneStyle}>
        {sparkles.map((id) => (
          <span key={id} className="sparkle right-6 top-2 text-xl">✨</span>
        ))}
        <div className="flex items-center gap-3">
          <span className="text-3xl">{task.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className={`font-bold ${status === 'skipped' ? 'text-(--muted)' : ''}`}>{task.name}</p>
            {status === 'skipped' && (
              <p className="text-xs text-(--muted)">Skipped today — tomorrow's a fresh start! 🌤️</p>
            )}
            {status === 'done' && log?.note && (
              <p className="truncate text-xs text-(--muted)">{log.note}</p>
            )}
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-lg"
            style={{
              borderColor: isDone ? 'var(--accent)' : 'var(--line)',
              background: isDone ? 'var(--accent)' : 'transparent',
              color: 'white',
            }}>
            {status === 'done' ? '✓' : status === 'skipped' ? '🌤️' : ''}
          </span>
        </div>
      </button>
    );
  }

  // 'count' task
  const num = count === '' ? 0 : Number(count) || 0;
  const isMinutes = /min/i.test(task.unit || '');
  return (
    <div className="relative w-full rounded-3xl border-2 p-4 shadow-sm" style={doneStyle}>
      {sparkles.map((id) => (
        <span key={id} className="sparkle right-6 top-2 text-xl">✨</span>
      ))}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{task.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold">{task.name}</p>
          <p className="text-xs text-(--muted)">{task.unit}</p>
          {isMinutes && (
            <PracticeTimer onDone={(mins) => scheduleCount(num + mins, note)} />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => scheduleCount(Math.max(0, num - 1) || '', note)}
            className="h-10 w-10 rounded-full border-2 border-(--line) bg-(--card) text-lg font-bold active:scale-90 transition-transform">−</button>
          <input type="number" inputMode="numeric" value={count} placeholder="0"
            onChange={(e) => scheduleCount(e.target.value, note)}
            className="h-10 w-14 rounded-xl border-2 border-(--line) bg-(--card) text-center font-bold outline-none focus:border-(--accent)" />
          <button onClick={() => scheduleCount(num + 1, note)}
            className="h-10 w-10 rounded-full text-lg font-bold text-white active:scale-90 transition-transform"
            style={{ background: 'var(--accent)' }}>+</button>
        </div>
      </div>
      {task.has_note ? (
        <input value={note} placeholder={task.note_label || 'note'}
          onChange={(e) => scheduleCount(count, e.target.value)}
          className="mt-3 w-full rounded-xl border-2 border-(--line) bg-(--bg) px-3 py-2 text-sm outline-none focus:border-(--accent)" />
      ) : null}
    </div>
  );
}
