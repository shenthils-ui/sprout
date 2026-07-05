// Quiz Corner: 3 multiple-choice questions built from the word-of-the-day
// bank. The day's first round uses date-seeded questions; replays shuffle.
// Best score of the day is recorded (badges: Quiz Whiz / Quiz Master).

import { useMemo, useState } from 'react';
import { dayIndex, todayStr } from '../../shared/dates.js';
import { WORDS_AND_FACTS } from '../../shared/words.js';
import { getApi } from '../api/index.js';
import { useCelebrate } from './Celebration.jsx';

const WORDS = WORDS_AND_FACTS.filter((w) => w.type === 'word');

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildQuestions(seed) {
  const rand = mulberry32(seed);
  const pool = [...WORDS];
  const pick = () => pool.splice(Math.floor(rand() * pool.length), 1)[0];
  return Array.from({ length: 3 }, () => {
    const answer = pick();
    const wrong = [pick(), pick(), pick()];
    const options = [answer, ...wrong]
      .map((w) => ({ w, r: rand() }))
      .sort((a, b) => a.r - b.r)
      .map(({ w }) => w);
    return { answer, options };
  });
}

export default function QuizModal({ onClose }) {
  const [round, setRound] = useState(0); // 0 = today's seeded round
  const [qi, setQi] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const celebrate = useCelebrate();

  const questions = useMemo(
    () => buildQuestions(round === 0 ? dayIndex(todayStr()) : Math.floor(Math.random() * 1e9)),
    [round]);
  const q = questions[qi];

  const choose = async (opt) => {
    if (chosen) return;
    setChosen(opt);
    const isRight = opt === q.answer;
    const newCorrect = correct + (isRight ? 1 : 0);
    setCorrect(newCorrect);
    setTimeout(async () => {
      if (qi < questions.length - 1) {
        setQi(qi + 1);
        setChosen(null);
      } else {
        setFinished(true);
        const res = await getApi().recordQuiz({
          date: todayStr(), correct: newCorrect, total: questions.length,
        });
        celebrate(res.newBadges);
      }
    }, 900);
  };

  const again = () => {
    setRound(round + 1); setQi(0); setChosen(null); setCorrect(0); setFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={onClose}>
      <div className="anim-rise w-full max-w-sm rounded-3xl bg-(--card) p-5" onClick={(e) => e.stopPropagation()}>
        {!finished ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">🧠 Quiz Corner</h3>
              <span className="text-xs font-bold text-(--muted)">{qi + 1} / {questions.length}</span>
            </div>
            <p className="mt-3 text-sm text-(--muted)">Which word means…</p>
            <p className="mt-1 font-bold leading-snug">“{q.answer.def}”</p>
            <div className="mt-4 flex flex-col gap-2">
              {q.options.map((opt) => {
                let bg = 'var(--bg)';
                if (chosen) {
                  if (opt === q.answer) bg = 'var(--tint)';
                  else if (opt === chosen) bg = 'var(--line)';
                }
                return (
                  <button key={opt.word} onClick={() => choose(opt)}
                    className={`rounded-2xl border-2 px-4 py-3 text-left font-bold transition-transform active:scale-[0.98] ${
                      chosen && opt === q.answer ? 'anim-pop' : ''}`}
                    style={{
                      background: bg,
                      borderColor: chosen && opt === q.answer ? 'var(--accent)' : 'var(--line)',
                    }}>
                    {opt.word}
                    {chosen && opt === q.answer && ' ✓'}
                    {chosen && opt === chosen && opt !== q.answer && ' 🌤️'}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-5xl anim-wiggle">
              {correct === 3 ? '🏆' : correct === 2 ? '🌟' : correct === 1 ? '💪' : '🌱'}
            </div>
            <h3 className="mt-2 text-xl font-extrabold">{correct} / {questions.length}</h3>
            <p className="mt-1 text-sm text-(--muted)">
              {correct === 3 ? 'Perfect round — word wizard!'
                : correct >= 1 ? 'Nice! Every answer teaches you a new word.'
                : 'Tricky ones today — now you know three new words!'}
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={again} className="flex-1 rounded-2xl border-2 border-(--line) py-2.5 font-bold">
                🔁 Play again
              </button>
              <button onClick={onClose} className="flex-1 rounded-2xl py-2.5 font-bold text-white"
                style={{ background: 'var(--accent)' }}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
