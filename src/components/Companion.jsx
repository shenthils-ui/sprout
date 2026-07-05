// Pip the sprout — the companion. Grows with recent activity, glows when
// today has any activity, and NEVER looks sad. If she takes a break, Pip
// just waits patiently.

const STAGES = [
  { emoji: '🌰', name: 'a cozy seed', waiting: 'Pip the seed is cozy and waiting for you.', active: 'Pip felt that! Something is stirring…' },
  { emoji: '🌱', name: 'a tiny sprout', waiting: 'Pip is peeking out, happy to see you.', active: 'Pip perked right up — nice one!' },
  { emoji: '🌿', name: 'a happy seedling', waiting: 'Pip sways gently, no rush at all.', active: 'Pip is stretching new leaves for you!' },
  { emoji: '🪴', name: 'a leafy plant', waiting: 'Pip looks comfy and content.', active: 'Pip is thriving — look at those leaves!' },
  { emoji: '🌷', name: 'a budding flower', waiting: 'Pip has a bud ready, whenever you are.', active: 'Pip is about to bloom — so exciting!' },
  { emoji: '🌻', name: 'in FULL BLOOM', waiting: 'Pip is blooming and beaming at you.', active: 'Pip is in full bloom — you did that! 🎉' },
];

export default function Companion({ companion, size = 'lg' }) {
  if (!companion) return null;
  const stage = STAGES[Math.min(companion.stage, 5)];
  const msg = companion.todayActive ? stage.active : stage.waiting;
  const big = size === 'lg';

  return (
    <div className="flex flex-col items-center gap-1.5 py-2">
      <div
        className={`relative flex items-center justify-center rounded-full
          ${big ? 'h-28 w-28 text-6xl' : 'h-16 w-16 text-3xl'}`}
        style={{
          background: `radial-gradient(circle, var(--tint) 0%, transparent 72%)`,
          filter: companion.todayActive ? 'drop-shadow(0 0 14px var(--accent-2))' : 'none',
        }}
      >
        <span className={companion.todayActive ? 'anim-wiggle' : ''} role="img"
          aria-label={`Pip, ${stage.name}`}>
          {stage.emoji}
        </span>
        {companion.todayActive && (
          <span className="absolute -top-1 right-0 text-xl">✨</span>
        )}
      </div>
      {big && (
        <>
          <p className="text-sm font-semibold">Pip is {stage.name}</p>
          <p className="text-xs text-(--muted) text-center px-6">{msg}</p>
        </>
      )}
    </div>
  );
}
