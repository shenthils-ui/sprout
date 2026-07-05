// Memory Book: a printable keepsake of diary entries (and the reading log).
// Uses the browser's print dialog — on Android that includes "Save as PDF".

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApi } from '../api/index.js';
import { friendlyDate } from '../lib/daily.js';

export default function MemoryBook() {
  const [entries, setEntries] = useState([]);
  const [books, setBooks] = useState([]);
  const [includeReading, setIncludeReading] = useState(true);

  useEffect(() => {
    getApi().listDiary({ limit: 1000 }).then((rows) => setEntries([...rows].reverse()));
    getApi().getReadingLog().then(setBooks);
  }, []);

  return (
    <div className="anim-rise">
      <div className="no-print flex items-center justify-between">
        <Link to="/diary" className="text-sm font-bold text-(--accent)">← back</Link>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-(--muted)">
          <input type="checkbox" checked={includeReading}
            onChange={(e) => setIncludeReading(e.target.checked)} />
          include reading log
        </label>
        <button onClick={() => window.print()}
          className="rounded-full px-4 py-2 text-sm font-bold text-white"
          style={{ background: 'var(--accent)' }}>
          🖨️ Print / save PDF
        </button>
      </div>

      <div className="mt-4 text-center">
        <h1 className="text-2xl font-extrabold">🌻 My Memory Book</h1>
        <p className="text-sm text-(--muted)">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          {entries.length > 0 && ` · ${friendlyDate(entries[0].date)} to ${friendlyDate(entries[entries.length - 1].date)}`}
        </p>
      </div>

      {entries.length === 0 && (
        <p className="no-print mt-8 text-center text-sm text-(--muted)">
          Write some diary entries first, then come back to print your book! 📔
        </p>
      )}

      <div className="mt-5 flex flex-col gap-4">
        {entries.map((e) => (
          <article key={e.id} style={{ breakInside: 'avoid' }}
            className="rounded-2xl border border-(--line) bg-(--card) p-4">
            <header className="flex items-center justify-between border-b border-(--line) pb-1">
              <h3 className="text-sm font-extrabold">{friendlyDate(e.date)}</h3>
              {e.mood && <span className="text-lg">{e.mood}</span>}
            </header>
            {e.prompt_text && <p className="mt-1 text-[11px] italic text-(--muted)">💭 {e.prompt_text}</p>}
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{e.text}</p>
          </article>
        ))}
      </div>

      {includeReading && books.length > 0 && (
        <div className="mt-6" style={{ breakInside: 'avoid' }}>
          <h2 className="text-center text-lg font-extrabold">📚 Books along the way</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {books.map((b) => (
              <li key={b.title} className="flex justify-between rounded-xl border border-(--line) bg-(--card) px-3 py-2 text-sm">
                <span className="font-semibold">{b.title}</span>
                <span className="text-(--muted)">{b.pages} pages</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
