import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { todayStr } from '../../shared/dates.js';
import { getApi } from '../api/index.js';
import { useCelebrate } from '../components/Celebration.jsx';
import { MOODS, promptOfTheDay, shortDate, shufflePrompt } from '../lib/daily.js';

export default function Diary() {
  const date = todayStr();
  const [prompts, setPrompts] = useState([]);
  const [prompt, setPrompt] = useState(null);
  const [entry, setEntry] = useState(null);      // today's diary row (or null)
  const [text, setText] = useState('');
  const [mood, setMood] = useState(null);
  const [saved, setSaved] = useState('idle');    // idle | saving | saved
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const celebrate = useCelebrate();
  const debounce = useRef(null);
  const entryRef = useRef(null);

  useEffect(() => {
    const api = getApi();
    Promise.all([api.listPrompts(), api.getDay({ date }), api.listDiary({ limit: 60 })])
      .then(([ps, day, hist]) => {
        setPrompts(ps);
        const today = day.diary[0] ?? null;
        setEntry(today);
        entryRef.current = today;
        setText(today?.text ?? '');
        setMood(today?.mood ?? null);
        setPrompt(today?.prompt_text
          ? { text: today.prompt_text }
          : promptOfTheDay(ps, date));
        setHistory(hist.filter((e) => e.date !== date));
      })
      .catch(console.error);
  }, [date]);

  const save = useCallback(async (newText, newMood) => {
    setSaved('saving');
    const res = await getApi().saveDiary({
      id: entryRef.current?.id ?? null,
      date,
      text: newText,
      prompt_text: prompt?.text ?? null,
      mood: newMood,
    });
    entryRef.current = res.entry;
    setEntry(res.entry);
    celebrate(res.newBadges);
    setSaved('saved');
    setTimeout(() => setSaved('idle'), 1500);
  }, [date, prompt, celebrate]);

  const onType = (v) => {
    setText(v);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => save(v, mood), 600);
  };

  const onMood = (m) => {
    const next = mood === m ? null : m;
    setMood(next);
    clearTimeout(debounce.current);
    save(text, next);
  };

  return (
    <div className="anim-rise">
      <h1 className="text-lg font-extrabold">📔 My Diary</h1>
      <p className="text-xs text-(--muted)">{shortDate(date)}</p>

      {/* prompt card */}
      {prompt && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl p-3 text-sm"
          style={{ background: 'var(--tint)' }}>
          <span className="text-lg">💭</span>
          <p className="flex-1 font-semibold">{prompt.text}</p>
          <button onClick={() => setPrompt(shufflePrompt(prompts, prompt.text))}
            aria-label="Different prompt"
            className="rounded-full bg-(--card) px-2.5 py-1 text-xs font-bold shadow-sm active:scale-90 transition-transform">
            🎲 shuffle
          </button>
        </div>
      )}

      <textarea value={text} onChange={(e) => onType(e.target.value)}
        placeholder="Write anything you like… it's your book. ✨"
        rows={7}
        className="mt-3 w-full resize-y rounded-3xl border-2 border-(--line) bg-(--card) p-4 text-[15px] leading-relaxed outline-none focus:border-(--accent)" />
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] text-(--muted)">
          {saved === 'saving' ? 'saving…' : saved === 'saved' ? 'saved ✓' : 'autosaves as you write'}
        </p>
        <p className="text-[11px] text-(--muted)">{text.trim() ? `${text.trim().split(/\s+/).length} words` : ''}</p>
      </div>

      {/* mood */}
      <div className="mt-2 rounded-2xl border border-(--line) bg-(--card) p-3 shadow-sm">
        <p className="text-xs font-bold text-(--muted)">Today felt… <span className="font-normal">(optional)</span></p>
        <div className="mt-2 flex justify-between">
          {MOODS.map((m) => (
            <button key={m} onClick={() => onMood(m)}
              className={`h-10 w-10 rounded-full text-xl transition-all active:scale-90 ${
                mood === m ? 'anim-pop scale-110' : 'opacity-60'}`}
              style={mood === m ? { background: 'var(--tint)', boxShadow: '0 0 0 2px var(--accent)' } : {}}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* history */}
      <div className="mt-5 flex items-center justify-between">
        <button onClick={() => setShowHistory(!showHistory)}
          className="text-sm font-bold text-(--accent)">
          {showHistory ? '▾ hide past entries' : `▸ read past entries${history.length ? ` (${history.length})` : ''}`}
        </button>
        {history.length > 0 && (
          <Link to="/memory-book" className="text-xs font-bold text-(--muted) underline">
            🖨️ Memory Book
          </Link>
        )}
      </div>

      {showHistory && (
        <div className="mt-3 flex flex-col gap-3">
          {history.length === 0 && (
            <div className="rounded-3xl bg-(--card) p-6 text-center text-sm text-(--muted)">
              Your diary is just getting started — today's entry will appear here tomorrow. 🌱
            </div>
          )}
          {history.map((e) => (
            <article key={e.id} className="journal-lines rounded-3xl border border-(--line) bg-(--card) p-4 shadow-sm">
              <header className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-extrabold">{shortDate(e.date)}</h3>
                {e.mood && <span className="text-lg">{e.mood}</span>}
              </header>
              {e.prompt_text && (
                <p className="mb-1 text-[11px] italic text-(--muted)">💭 {e.prompt_text}</p>
              )}
              <p className="whitespace-pre-wrap text-sm leading-[1.6em]">{e.text}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
