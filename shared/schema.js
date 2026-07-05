// The single database schema shared by BOTH builds:
// - server: better-sqlite3 on the laptop
// - standalone: sql.js (WASM) in the phone's browser
// Never change columns without bumping SCHEMA_VERSION and adding a migration.

export const SCHEMA_VERSION = 2;

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
  photo TEXT,                                 -- optional photo (data URL, downscaled)
  doodle TEXT,                                -- optional doodle (data URL)
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_diary_date ON diary(date);

CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL UNIQUE,                 -- matches the reading log note
  total_pages INTEGER,                        -- the goal; NULL = no goal set
  finished_at TEXT                            -- set when pages read reach the goal
);

CREATE TABLE IF NOT EXISTS quiz_results (
  date TEXT PRIMARY KEY,                      -- one row per day, best score kept
  correct INTEGER NOT NULL,
  total INTEGER NOT NULL
);

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

// Adds a column to an existing table if it's missing (both engines support
// pragma_table_info as a queryable table function).
function ensureColumn(db, table, column, ddl) {
  const cols = db.prepare(`SELECT name FROM pragma_table_info(?)`).all(table);
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

// Applies schema + seeds on a fresh or existing db. Works with better-sqlite3
// and with the sql.js shim (same API).
export function migrate(db, seeds) {
  db.exec(SCHEMA_SQL);
  const row = db.prepare(`SELECT value FROM meta WHERE key='schema_version'`).get();
  if (!row) {
    db.prepare(`INSERT INTO meta (key, value) VALUES ('schema_version', ?)`)
      .run(String(SCHEMA_VERSION));
  } else if (Number(row.value) < SCHEMA_VERSION) {
    // v1 -> v2: photo/doodle on diary; books + quiz_results tables come from
    // SCHEMA_SQL's CREATE IF NOT EXISTS above.
    ensureColumn(db, 'diary', 'photo', 'TEXT');
    ensureColumn(db, 'diary', 'doodle', 'TEXT');
    db.prepare(`UPDATE meta SET value = ? WHERE key='schema_version'`)
      .run(String(SCHEMA_VERSION));
  }

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
