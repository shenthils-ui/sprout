// The single database schema shared by BOTH builds:
// - server: better-sqlite3 on the laptop
// - standalone: sql.js (WASM) in the phone's browser
// Never change columns without bumping SCHEMA_VERSION and adding a migration.

export const SCHEMA_VERSION = 1;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '⭐',
  kind TEXT NOT NULL DEFAULT 'check',        -- 'check' | 'count'
  unit TEXT,                                  -- for 'count': "pages", "minutes", ...
  note_label TEXT,                            -- label for the optional text note
  has_note INTEGER NOT NULL DEFAULT 0,        -- offer a text note field?
  expected_days TEXT,                         -- JSON array of weekdays 0-6, null = every day
  display_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,                         -- YYYY-MM-DD (local)
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  status TEXT,                                -- check tasks: 'done' | 'skipped' | NULL
  count REAL,                                 -- count tasks: the number
  note TEXT,                                  -- optional text note
  updated_at TEXT NOT NULL,
  UNIQUE(date, task_id)
);
CREATE INDEX IF NOT EXISTS idx_logs_date ON logs(date);
CREATE INDEX IF NOT EXISTS idx_logs_task ON logs(task_id);

CREATE TABLE IF NOT EXISTS diary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,                         -- YYYY-MM-DD (local)
  text TEXT NOT NULL DEFAULT '',
  prompt_text TEXT,                           -- the writing prompt shown for this entry
  mood TEXT,                                  -- optional emoji
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_diary_date ON diary(date);

CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS earned_badges (
  badge_id TEXT PRIMARY KEY,
  earned_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

// Applies schema + seeds on a fresh or existing db. Works with better-sqlite3
// and with the sql.js shim (same API).
export function migrate(db, seeds) {
  db.exec(SCHEMA_SQL);
  const row = db.prepare(`SELECT value FROM meta WHERE key='schema_version'`).get();
  if (!row) {
    db.prepare(`INSERT INTO meta (key, value) VALUES ('schema_version', ?)`)
      .run(String(SCHEMA_VERSION));
  }
  // future: if (Number(row.value) < SCHEMA_VERSION) run migrations here

  const taskCount = db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n;
  if (taskCount === 0 && seeds?.tasks) {
    const ins = db.prepare(`INSERT INTO tasks
      (name, emoji, kind, unit, note_label, has_note, expected_days, display_order, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`);
    seeds.tasks.forEach((t, i) => {
      ins.run(t.name, t.emoji, t.kind, t.unit ?? null, t.note_label ?? null,
        t.has_note ? 1 : 0, t.expected_days ?? null, i);
    });
  }

  const promptCount = db.prepare('SELECT COUNT(*) AS n FROM prompts').get().n;
  if (promptCount === 0 && seeds?.prompts) {
    const ins = db.prepare('INSERT INTO prompts (text, active) VALUES (?, 1)');
    for (const p of seeds.prompts) ins.run(p);
  }
}
