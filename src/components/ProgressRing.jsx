export default function ProgressRing({ done, total, size = 64 }) {
  const pct = total > 0 ? done / total : 0;
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const complete = total > 0 && done >= total;

  return (
    <div className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--line)" strokeWidth="7" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--accent)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <span className="absolute text-sm font-bold">
        {complete ? '🎉' : `${done}/${total}`}
      </span>
    </div>
  );
}
