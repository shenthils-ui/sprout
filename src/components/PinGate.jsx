// Soft 4-digit PIN gate for the parent settings area. A gentle deterrent so
// tasks don't get reorganised by accident — not real security (the README
// says so too).

import { useEffect, useState } from 'react';
import { getApi } from '../api/index.js';

export default function PinGate({ children }) {
  const [state, setState] = useState('loading'); // loading | setup | locked | open
  const [pin, setPin] = useState('');
  const [stored, setStored] = useState(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    getApi().getSettings().then((s) => {
      setStored(s.pin ?? null);
      setState(s.pin ? 'locked' : 'setup');
    });
  }, []);

  const press = async (d) => {
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length < 4) return;
    if (state === 'setup') {
      await getApi().setSetting({ key: 'pin', value: next });
      setState('open');
    } else if (next === stored) {
      setState('open');
    } else {
      setShake(true);
      setTimeout(() => { setPin(''); setShake(false); }, 450);
    }
  };

  if (state === 'loading') return null;
  if (state === 'open') return children;

  return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-4xl">🔒</div>
      <p className="text-sm font-semibold text-center px-8">
        {state === 'setup'
          ? 'Grown-up corner! Choose a 4-digit PIN to protect the task settings.'
          : 'Grown-up corner — enter the PIN.'}
      </p>
      <div className={`flex gap-3 ${shake ? 'anim-wiggle' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-4 rounded-full border-2"
            style={{
              borderColor: 'var(--accent)',
              background: i < pin.length ? 'var(--accent)' : 'transparent',
            }} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((k, i) =>
          k === null ? <div key={i} /> : (
            <button key={i}
              onClick={() => (k === 'del' ? setPin(pin.slice(0, -1)) : press(String(k)))}
              className="h-16 w-16 rounded-full bg-(--card) text-xl font-bold shadow-sm border border-(--line) active:scale-95 transition-transform">
              {k === 'del' ? '⌫' : k}
            </button>
          ))}
      </div>
    </div>
  );
}
