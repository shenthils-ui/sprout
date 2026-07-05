import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dayIndex, addDays, todayStr } from '../../shared/dates.js';
import { RIDDLES } from '../../shared/riddles.js';
import { getApi } from '../api/index.js';
import { useCelebrate } from '../components/Celebration.jsx';
import Companion from '../components/Companion.jsx';
import PipStudio from '../components/PipStudio.jsx';
import ProgressRing from '../components/ProgressRing.jsx';
import QuizModal from '../components/QuizModal.jsx';
import TaskRow from '../components/TaskRow.jsx';
import { friendlyDate, wordOfTheDay } from '../lib/daily.js';
import { parsePipStyle } from '../lib/decorations.js';

export default function Today() {
  const [date, setDate] = useState(todayStr());
  const [day, setDay] = useState(null);
  const [companion, setCompanion] = useState(null);
  const [offline, setOffline] = useState(false);
  const [pipStyle, setPipStyle] = useState({});
  const [showStudio, setShowStudio] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const celebrate = useCelebrate();
  const isToday = date === todayStr();

  const load = useCallback(async () => {
    try {
      const api = getApi();
      const [d, c, s] = await Promise.all([
        api.getDay({ date }), api.getCompanion(), api.getSettings()]);
      setDay(d);
      setCompanion(c);
      setPipStyle(parsePipStyle(s));
      setOffline(false);
    } catch (e) {
      if (e.name === 'ServerUnreachableError') setOffline(true);
      else console.error(e);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setShowAnswer(false); }, [date]);

  const afterChange = (result) => {
    celebrate(result?.newBadges);
    load();
  };

  const word = wordOfTheDay(date);

  if (offline) {
    return (
      <div className="mt-16 rounded-3xl bg-(--card) p-8 text-center shadow-sm">
        <div className="text-5xl">📡</div>
        <h2 className="mt-3 font-extrabold">Can't find the Sprout server</h2>
        <p className="mt-2 text-sm text-(--muted)">
          Make sure the laptop is on and running start.bat, then
          <button onClick={load} className="ml-1 font-bold text-(--accent) underline">try again</button>.
        </p>
      </div>
    );
  }

  return (
    <div className="anim-rise">
      {/* date header */}
      <div className="flex items-center justify-between">
        <button onClick={() => setDate(addDays(date, -1))} aria-label="Previous day"
          className="h-11 w-11 rounded-full bg-(--card) text-lg shadow-sm border border-(--line) active:scale-90 transition-transform">←</button>
        <div className="text-center">
          <h1 className="text-lg font-extrabold">{isToday ? '🌞 Today' : friendlyDate(date)}</h1>
          {isToday && <p className="text-xs text-(--muted)">{friendlyDate(date)}</p>}
          {!isToday && (
            <button onClick={() => setDate(todayStr())} className="text-xs font-bold text-(--accent)">
              jump to today ↩
            </button>
          )}
        </div>
        <button onClick={() => setDate(addDays(date, 1))} aria-label="Next day"
          disabled={isToday}
          className="h-11 w-11 rounded-full bg-(--card) text-lg shadow-sm border border-(--line) active:scale-90 transition-transform disabled:opacity-30">→</button>
      </div>

      {/* companion + progress */}
      <div className="mt-2 flex items-center justify-around rounded-3xl p-2"
        style={{ background: 'linear-gradient(135deg, var(--tint), transparent)' }}>
        <Companion companion={companion} style={pipStyle} onTap={() => setShowStudio(true)} />
        {day && (
          <div className="flex flex-col items-center gap-1">
            <ProgressRing done={day.progress.done} total={day.progress.applicable} size={72} />
            <span className="text-xs font-semibold text-(--muted)">
              {day.progress.done === 0 ? 'ready when you are!'
                : day.progress.done >= day.progress.applicable ? 'all done — amazing!'
                : 'nice going!'}
            </span>
          </div>
        )}
      </div>

      {/* daily fun: word/fact + riddle + quiz */}
      <div className="mt-3 rounded-2xl border border-(--line) bg-(--card) p-3 text-sm shadow-sm">
        {word.type === 'word' ? (
          <p><span className="mr-1">💡</span> <b className="text-(--accent)">{word.word}</b> — {word.def}</p>
        ) : (
          <p><span className="mr-1">🤯</span> {word.fact}</p>
        )}
        {(() => {
          const riddle = RIDDLES[dayIndex(date) % RIDDLES.length];
          return (
            <p className="mt-2 border-t border-(--line) pt-2">
              <span className="mr-1">🧩</span> {riddle.q}{' '}
              {showAnswer
                ? <b className="text-(--accent) anim-pop inline-block">{riddle.a}</b>
                : <button onClick={() => setShowAnswer(true)}
                    className="rounded-full bg-(--tint) px-2 py-0.5 text-xs font-bold text-(--accent)">
                    reveal!
                  </button>}
            </p>
          );
        })()}
        {isToday && (
          <div className="mt-2 flex gap-2 border-t border-(--line) pt-2">
            <button onClick={() => setShowQuiz(true)}
              className="flex-1 rounded-full py-2 text-xs font-bold text-white active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}>
              🧠 Quiz Corner
            </button>
            <Link to="/recap"
              className="flex-1 rounded-full border-2 border-(--line) py-2 text-center text-xs font-bold active:scale-95 transition-transform">
              ✨ My week
            </Link>
          </div>
        )}
      </div>

      {/* tasks */}
      <div className="mt-4 flex flex-col gap-3">
        {day?.tasks.map((t) => (
          <TaskRow key={`${t.id}-${date}`} task={t} log={day.logs[t.id]}
            onCheck={(status) =>
              getApi().setCheck({ date, task_id: t.id, status }).then(afterChange)}
            onCount={(count, note) =>
              getApi().setCount({ date, task_id: t.id, count, note }).then(afterChange)}
          />
        ))}
        {day && day.tasks.length === 0 && (
          <div className="rounded-3xl bg-(--card) p-8 text-center text-sm text-(--muted) shadow-sm">
            No tasks for this day — a totally free day! 🏖️
          </div>
        )}
      </div>

      {showQuiz && <QuizModal onClose={() => setShowQuiz(false)} />}
      {showStudio && (
        <PipStudio style={pipStyle} onChange={setPipStyle}
          onClose={() => setShowStudio(false)} />
      )}
    </div>
  );
}
