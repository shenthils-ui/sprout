// A small finger-drawing canvas for the diary. Saves as a PNG data URL after
// each stroke (debounced by the parent's save).

import { useEffect, useRef, useState } from 'react';

const COLORS = ['#3b2f1e', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
const W = 640, H = 360; // internal resolution; displayed responsive

export default function DoodlePad({ initial, onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [color, setColor] = useState(COLORS[0]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    if (initial) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, W, H);
      img.src = initial;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = pos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setDirty(true);
    onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    setDirty(false);
    onChange(null);
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H}
        className="w-full touch-none rounded-2xl border-2 border-(--line) bg-white"
        style={{ aspectRatio: `${W}/${H}` }}
        onPointerDown={start} onPointerMove={move}
        onPointerUp={end} onPointerLeave={end} onPointerCancel={end} />
      <div className="mt-2 flex items-center gap-2">
        {COLORS.map((c) => (
          <button key={c} onClick={() => setColor(c)} aria-label={`color ${c}`}
            className="h-8 w-8 rounded-full border-2 transition-transform active:scale-90"
            style={{
              background: c,
              borderColor: color === c ? 'var(--ink)' : 'transparent',
              transform: color === c ? 'scale(1.15)' : 'none',
            }} />
        ))}
        <div className="flex-1" />
        {(dirty || initial) && (
          <button onClick={clear} className="rounded-full border border-(--line) px-3 py-1.5 text-xs font-bold text-(--muted)">
            clear
          </button>
        )}
      </div>
    </div>
  );
}
