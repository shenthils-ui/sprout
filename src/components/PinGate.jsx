// Soft 4-digit PIN gate for the parent settings area. A gentle deterrent so
// tasks don't get reorganised by accident — not real security (the README
// says so too). The PIN is stored as a salted SHA-256 hash so backups don't
// contain it in plaintext; legacy plaintext PINs are upgraded on first entry.

import { useEffect, useState } from 'react';
import { hashPin } from '../../shared/hash.js';
import { getApi } from '../api/index.js';

const LEGACY_PLAINTEXT = /^\d{4}$/;

export default function PinGate({ children }) {
  const [state, setState] = useState('loading'); // loading | setup | locked | open
  const [pin, setPin] = useState('');
  const [stored, setStored] = useState(null);
  const [shake, setShake] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    getApi().getSettings().then((s) => {
      setStored(s.pin ?? null);
      setState(s.pin ? 'locked' : 'setup');
    }).catch(console.error);
  }, []);

  const matches = (entered) =>
    LEGACY_PLAINTEXT.test(stored)
      ? entered === stored              // legacy plaintext value
      : hashPin(entered) === stored;    // hashed value

  const press = async (d) => {
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length < 4) return;
    if (state === 'setup') {
      await getApi().setSetting({ key: 'pin', value: hashPin(next) });
      setState('open');
    } else if (matches(next)) {
      if (LEGACY_PLAINTEXT.test(stored)) {
        // transparent upgrade: replace plaintext with the hash
        await getApi().setSetting({ key: 'pin', value: hashPin(next) });
      }
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
      <div className={`flex gap-3 ${shake ? 'anim-wiggle' : ''}`} aria-label="PIN progress">
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
              aria-label={k === 'del' ? 'Delete digit' : `Digit ${k}`}
              onClick={() => (k === 'del' ? setPin(pin.slice(0, -1)) : press(String(k)))}
              className="h-16 w-16 rounded-full bg-(--card) text-xl font-bold shadow-sm border border-(--line) active:scale-95 transition-transform">
              {k === 'del' ? '⌫' : k}
            </button>
          ))}
      </div>
      {state === 'locked' && (
        <button onClick={() => setShowHelp(!showHelp)}
          className="text-xs font-bold text-(--muted) underline">
          forgot the PIN?
        </button>
      )}
      {showHelp && (
        <p className="px-8 text-center text-xs text-(--muted)">
          No problem — see "Forgot PIN" in the Troubleshooting guide
          (docs/troubleshooting.md in the project folder, or the README).
          Your data is not locked — only this settings page is.
        </p>
      )}
    </div>
  );
}
