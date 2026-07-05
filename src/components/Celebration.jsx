// Global celebration layer: badge unlock toasts. Screens call
// celebrate(newBadges) whenever an API result carries fresh badges.

import { createContext, useCallback, useContext, useState } from 'react';

const Ctx = createContext(() => {});

export function useCelebrate() {
  return useContext(Ctx);
}

export function CelebrationProvider({ children }) {
  const [queue, setQueue] = useState([]);

  const celebrate = useCallback((badges) => {
    if (!badges?.length) return;
    setQueue((q) => [...q, ...badges]);
  }, []);

  const dismiss = () => setQueue((q) => q.slice(1));
  const badge = queue[0];

  return (
    <Ctx.Provider value={celebrate}>
      {children}
      {badge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          onClick={dismiss}>
          <div className="anim-badge w-full max-w-xs rounded-3xl bg-(--card) p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="text-6xl anim-wiggle">{badge.emoji}</div>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-(--accent)">
              New sticker unlocked!
            </p>
            <h3 className="mt-1 text-xl font-extrabold">{badge.name}</h3>
            <p className="mt-1 text-sm text-(--muted)">{badge.desc}</p>
            <button onClick={dismiss}
              className="mt-4 w-full rounded-full py-2.5 font-bold text-white anim-pop"
              style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}>
              Yay! 🎉
            </button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
