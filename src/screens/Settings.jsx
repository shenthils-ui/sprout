import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { todayStr } from '../../shared/dates.js';
import { getApi, IS_STANDALONE } from '../api/index.js';
import PinGate from '../components/PinGate.jsx';
import { applyTheme, loadTheme, PALETTES } from '../lib/theme.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Section({ title, children }) {
  return (
    <section className="mt-4 rounded-3xl border border-(--line) bg-(--card) p-4 shadow-sm">
      <h2 className="font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

/* ---------- theme (hers, no PIN) ---------- */
function ThemeSection() {
  const [theme, setTheme] = useState(loadTheme());
  const set = (patch) => {
    const next = { ...theme, ...patch };
    setTheme(next);
    applyTheme(next);
  };
  return (
    <Section title="🎨 Make it yours">
      <div className="mt-3 grid grid-cols-3 gap-2">
        {PALETTES.map((p) => (
          <button key={p.id} onClick={() => set({ palette: p.id })}
            aria-label={`Theme: ${p.name}`} aria-pressed={theme.palette === p.id}
            className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2.5 text-xs font-bold transition-transform active:scale-95 ${
              theme.palette === p.id ? 'border-(--accent)' : 'border-(--line)'}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-base"
              style={{ background: p.swatch }}>{p.emoji}</span>
            {p.name.split(' ')[0]}
          </button>
        ))}
      </div>
      <button onClick={() => set({ mode: theme.mode === 'dark' ? 'light' : 'dark' })}
        className="mt-3 w-full rounded-2xl border-2 border-(--line) py-2.5 text-sm font-bold active:scale-[0.98] transition-transform">
        {theme.mode === 'dark' ? '☀️ Switch to light mode' : '🌙 Switch to dark mode'}
      </button>
    </Section>
  );
}

/* ---------- task editor (parent, behind PIN) ---------- */
function TaskEditor() {
  const [tasks, setTasks] = useState([]);
  const [editing, setEditing] = useState(null); // task object being edited, or 'new'

  const reload = () => getApi().listTasks({ all: true }).then(setTasks);
  useEffect(() => { reload(); }, []);

  const move = async (i, dir) => {
    const ids = tasks.map((t) => t.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setTasks(await getApi().reorderTasks({ ids }));
  };

  return (
    <Section title="📝 Tasks">
      <div className="mt-2 flex flex-col gap-2">
        {tasks.map((t, i) => (
          <div key={t.id} className={`flex items-center gap-2 rounded-2xl border border-(--line) p-2 ${t.active ? '' : 'opacity-45'}`}>
            <div className="flex flex-col">
              <button onClick={() => move(i, -1)} className="px-1 text-xs text-(--muted)">▲</button>
              <button onClick={() => move(i, 1)} className="px-1 text-xs text-(--muted)">▼</button>
            </div>
            <span className="text-xl">{t.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-bold">{t.name}{t.active ? '' : ' (retired)'}</p>
              <p className="text-[11px] text-(--muted)">
                {t.kind === 'count' ? `count · ${t.unit ?? ''}` : 'check'}
                {t.expected_days ? ` · ${JSON.parse(t.expected_days).map((d) => WEEKDAYS[d]).join(' ')}` : ''}
              </p>
            </div>
            <button onClick={() => setEditing(t)} className="rounded-full bg-(--tint) px-3 py-1.5 text-xs font-bold">edit</button>
          </div>
        ))}
      </div>
      <button onClick={() => setEditing('new')}
        className="mt-3 w-full rounded-2xl py-2.5 text-sm font-bold text-white"
        style={{ background: 'var(--accent)' }}>
        + Add a task
      </button>
      {editing && (
        <TaskForm task={editing === 'new' ? null : editing}
          onClose={() => { setEditing(null); reload(); }} />
      )}
    </Section>
  );
}

function TaskForm({ task, onClose }) {
  const [f, setF] = useState({
    name: task?.name ?? '',
    emoji: task?.emoji ?? '⭐',
    kind: task?.kind ?? 'check',
    unit: task?.unit ?? '',
    note_label: task?.note_label ?? '',
    has_note: !!task?.has_note,
    days: task?.expected_days ? JSON.parse(task.expected_days) : [],
  });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    if (!f.name.trim()) return;
    const payload = {
      name: f.name.trim(),
      emoji: f.emoji || '⭐',
      kind: f.kind,
      unit: f.kind === 'count' ? (f.unit || 'times') : null,
      note_label: f.has_note ? (f.note_label || 'note') : null,
      has_note: f.has_note,
      expected_days: f.days.length ? JSON.stringify(f.days.sort()) : null,
    };
    if (task) await getApi().updateTask({ id: task.id, ...payload });
    else await getApi().createTask(payload);
    onClose();
  };

  const input = 'w-full rounded-xl border-2 border-(--line) bg-(--bg) px-3 py-2 text-sm outline-none focus:border-(--accent)';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-(--card) p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}>
        <h3 className="font-extrabold">{task ? 'Edit task' : 'New task'}</h3>
        <div className="mt-3 flex gap-2">
          <input className={`${input} !w-16 text-center text-xl`} value={f.emoji}
            onChange={(e) => set('emoji', e.target.value)} aria-label="emoji" />
          <input className={input} placeholder="Task name" value={f.name}
            onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="mt-3 flex gap-2">
          {['check', 'count'].map((k) => (
            <button key={k} onClick={() => set('kind', k)}
              className="flex-1 rounded-xl border-2 py-2 text-sm font-bold"
              style={f.kind === k ? { borderColor: 'var(--accent)', background: 'var(--tint)' } : { borderColor: 'var(--line)' }}>
              {k === 'check' ? '✓ check off' : '🔢 count a number'}
            </button>
          ))}
        </div>
        {f.kind === 'count' && (
          <input className={`${input} mt-3`} placeholder='Unit (e.g. "pages", "minutes")'
            value={f.unit} onChange={(e) => set('unit', e.target.value)} />
        )}
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={f.has_note} onChange={(e) => set('has_note', e.target.checked)} />
          offer a little text note
        </label>
        {f.has_note && (
          <input className={`${input} mt-2`} placeholder='Note label (e.g. "book title")'
            value={f.note_label} onChange={(e) => set('note_label', e.target.value)} />
        )}
        <p className="mt-3 text-sm font-semibold">Which days? <span className="text-(--muted) font-normal">(none = every day)</span></p>
        <div className="mt-1.5 flex gap-1">
          {WEEKDAYS.map((d, i) => (
            <button key={d}
              onClick={() => set('days', f.days.includes(i) ? f.days.filter((x) => x !== i) : [...f.days, i])}
              className="flex-1 rounded-lg border-2 py-1.5 text-[11px] font-bold"
              style={f.days.includes(i) ? { borderColor: 'var(--accent)', background: 'var(--tint)' } : { borderColor: 'var(--line)' }}>
              {d}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={save} className="flex-1 rounded-2xl py-2.5 font-bold text-white"
            style={{ background: 'var(--accent)' }}>Save</button>
          <button onClick={onClose} className="rounded-2xl border-2 border-(--line) px-4 font-bold">Cancel</button>
        </div>
        {task && (
          <div className="mt-3 flex gap-2 text-xs">
            <button onClick={async () => { await getApi().updateTask({ id: task.id, active: task.active ? 0 : 1 }); onClose(); }}
              className="flex-1 rounded-xl border border-(--line) py-2 font-bold text-(--muted)">
              {task.active ? '📦 Retire (keeps history)' : '↩️ Bring back'}
            </button>
            <button onClick={async () => {
              if (confirm(`Delete "${task.name}" AND all its history? Retiring is usually better.`)) {
                await getApi().deleteTask({ id: task.id }); onClose();
              }
            }} className="rounded-xl border border-(--line) px-3 py-2 font-bold text-(--muted)">🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- prompt bank (parent) ---------- */
function PromptEditor() {
  const [prompts, setPrompts] = useState([]);
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);
  const reload = () => getApi().listPrompts().then(setPrompts);
  useEffect(() => { reload(); }, []);

  return (
    <Section title="💭 Writing prompts">
      <p className="mt-1 text-xs text-(--muted)">{prompts.length} prompts rotate daily on the Diary screen.</p>
      <div className="mt-2 flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a new prompt…"
          className="flex-1 rounded-xl border-2 border-(--line) bg-(--bg) px-3 py-2 text-sm outline-none focus:border-(--accent)" />
        <button onClick={async () => {
          if (!draft.trim()) return;
          await getApi().addPrompt({ text: draft.trim() });
          setDraft(''); reload();
        }} className="rounded-xl px-4 font-bold text-white" style={{ background: 'var(--accent)' }}>+</button>
      </div>
      <button onClick={() => setExpanded(!expanded)} className="mt-2 text-xs font-bold text-(--accent)">
        {expanded ? '▾ hide list' : '▸ show all prompts'}
      </button>
      {expanded && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {prompts.map((p) => (
            <li key={p.id} className="flex items-center gap-2 rounded-xl bg-(--bg) px-3 py-2 text-xs">
              <span className="flex-1">{p.text}</span>
              <button onClick={async () => { await getApi().removePrompt({ id: p.id }); reload(); }}
                className="font-bold text-(--muted)">✕</button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* ---------- change PIN (parent) ---------- */
function PinSection() {
  const [draft, setDraft] = useState('');
  const [msg, setMsg] = useState(null);
  const save = async () => {
    if (!/^\d{4}$/.test(draft)) { setMsg('PIN must be exactly 4 digits.'); return; }
    const { hashPin } = await import('../../shared/hash.js');
    await getApi().setSetting({ key: 'pin', value: hashPin(draft) });
    setDraft('');
    setMsg('PIN changed ✓');
  };
  return (
    <Section title="🔒 Change PIN">
      <div className="mt-2 flex gap-2">
        <input value={draft} inputMode="numeric" maxLength={4} placeholder="New 4-digit PIN"
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
          className="flex-1 rounded-xl border-2 border-(--line) bg-(--bg) px-3 py-2 text-sm outline-none focus:border-(--accent)" />
        <button onClick={save} disabled={draft.length !== 4}
          className="rounded-xl px-4 font-bold text-white disabled:opacity-40"
          style={{ background: 'var(--accent)' }}>Save</button>
      </div>
      {msg && <p className="mt-2 text-xs font-semibold text-(--accent)">{msg}</p>}
    </Section>
  );
}

/* ---------- backup / restore (parent) ---------- */
function BackupSection() {
  const [msg, setMsg] = useState(null);

  const doExport = async () => {
    const payload = await getApi().exportData();
    const blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sprout-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg('Backup downloaded ✓ Keep it somewhere safe!');
  };

  const doImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const payload = JSON.parse(reader.result);
        if (!confirm('Importing REPLACES everything currently in the app with this backup. Continue?')) return;
        const r = await getApi().importData({ payload });
        setMsg(`Imported ${r.counts.tasks} tasks, ${r.counts.logs} logs, ${r.counts.diary} diary entries ✓ Reloading…`);
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        setMsg(`That didn't work: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <Section title="💾 Backup & move data">
      <p className="mt-1 text-xs text-(--muted)">
        The backup file works on both the phone app and the laptop version —
        export here, import there.
      </p>
      <div className="mt-3 flex gap-2">
        <button onClick={doExport} className="flex-1 rounded-2xl py-2.5 text-sm font-bold text-white"
          style={{ background: 'var(--accent)' }}>⬇️ Export JSON</button>
        <label className="flex-1 cursor-pointer rounded-2xl border-2 border-(--line) py-2.5 text-center text-sm font-bold">
          ⬆️ Import JSON
          <input type="file" accept="application/json,.json" className="hidden" onChange={doImport} />
        </label>
      </div>
      {msg && <p className="mt-2 text-xs font-semibold text-(--accent)">{msg}</p>}
    </Section>
  );
}

/* ---------- about ---------- */
function AboutSection() {
  return (
    <Section title="🌱 About Sprout">
      <p className="mt-1 text-xs leading-relaxed text-(--muted)">
        {IS_STANDALONE
          ? 'This copy of Sprout lives entirely on this device — no internet needed, nothing leaves your phone. To install: open in Chrome → menu (⋮) → "Add to Home screen".'
          : 'This copy of Sprout runs on the family laptop and stores data in a local database file (data/sprout.db).'}
        {' '}All data is private. Use Backup to move it between devices.
      </p>
    </Section>
  );
}

function GuideSection() {
  return (
    <Link to="/guide"
      className="mt-4 flex items-center gap-3 rounded-3xl border border-(--line) bg-(--card) p-4 shadow-sm active:scale-[0.98] transition-transform">
      <span className="text-2xl">📖</span>
      <span className="flex-1">
        <span className="block font-extrabold">How Sprout works</span>
        <span className="block text-xs text-(--muted)">Every feature explained — tasks, diary, Pip, stickers &amp; more</span>
      </span>
      <span className="text-(--muted)">→</span>
    </Link>
  );
}

export default function Settings() {
  return (
    <div className="anim-rise">
      <h1 className="text-lg font-extrabold">⚙️ Settings</h1>
      <GuideSection />
      <ThemeSection />
      <AboutSection />
      <div className="mt-6 border-t-2 border-dashed border-(--line) pt-2">
        <PinGate>
          <TaskEditor />
          <PromptEditor />
          <BackupSection />
          <PinSection />
        </PinGate>
      </div>
    </div>
  );
}
