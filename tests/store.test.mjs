// Unit tests for the shared data layer — the logic both builds run.
// Run with: npm test  (node --test, better-sqlite3 in-memory)

import assert from 'node:assert/strict';
import { test } from 'node:test';
import Database from 'better-sqlite3';
import { toDateStr, addDays, todayStr, taskAppliesOn } from '../shared/dates.js';
import { hashPin, sha256Hex } from '../shared/hash.js';
import { migrate, SCHEMA_VERSION } from '../shared/schema.js';
import { SEED_PROMPTS, SEED_TASKS } from '../shared/seeds.js';
import { createStore } from '../shared/store.js';
import { currentStreak, longestStreak, companionStage } from '../shared/streaks.js';
import { BADGE_CATALOG } from '../shared/badges.js';
import { buildRound, TRIVIA, TRUE_FALSE, EMOJI_PUZZLES } from '../shared/quiz.js';

function freshStore() {
  const db = new Database(':memory:');
  migrate(db, { tasks: SEED_TASKS, prompts: SEED_PROMPTS });
  return { db, store: createStore(db) };
}

/* ---------- schema & seeds ---------- */

test('fresh database seeds tasks and prompts at current schema version', () => {
  const { db, store } = freshStore();
  assert.equal(store.listTasks().length, SEED_TASKS.length);
  assert.ok(store.listPrompts().length >= 30, '30+ prompts for month-long rotation');
  assert.equal(db.prepare(`SELECT value FROM meta WHERE key='schema_version'`).get().value,
    String(SCHEMA_VERSION));
});

test('v1 database migrates to v2 keeping data', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
    INSERT INTO meta VALUES ('schema_version','1');
    CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '⭐', kind TEXT NOT NULL DEFAULT 'check', unit TEXT,
      note_label TEXT, has_note INTEGER NOT NULL DEFAULT 0, expected_days TEXT,
      display_order INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE logs (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL,
      task_id INTEGER NOT NULL, status TEXT, count REAL, note TEXT, updated_at TEXT NOT NULL,
      UNIQUE(date, task_id));
    CREATE TABLE diary (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL,
      text TEXT NOT NULL DEFAULT '', prompt_text TEXT, mood TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE prompts (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE earned_badges (badge_id TEXT PRIMARY KEY, earned_at TEXT NOT NULL);
    CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT);
    INSERT INTO diary (date, text, created_at, updated_at) VALUES ('2026-07-01','old entry','x','x');
  `);
  migrate(db, { tasks: SEED_TASKS, prompts: SEED_PROMPTS });
  const cols = db.prepare(`SELECT name FROM pragma_table_info('diary')`).all().map((c) => c.name);
  assert.ok(cols.includes('photo') && cols.includes('doodle'));
  assert.equal(db.prepare('SELECT text FROM diary').get().text, 'old entry');
  assert.equal(db.prepare(`SELECT value FROM meta WHERE key='schema_version'`).get().value, '2');
  db.prepare('SELECT COUNT(*) n FROM books').get(); // table exists
  db.prepare('SELECT COUNT(*) n FROM quiz_results').get(); // table exists
});

/* ---------- daily log ---------- */

test('check task cycles done -> skipped -> unset', () => {
  const { db, store } = freshStore();
  const yoga = store.listTasks().find((t) => t.name === 'Yoga');
  const d = todayStr();
  store.setCheck({ date: d, task_id: yoga.id, status: 'done' });
  assert.equal(store.getDay({ date: d }).logs[yoga.id].status, 'done');
  store.setCheck({ date: d, task_id: yoga.id, status: 'skipped' });
  assert.equal(store.getDay({ date: d }).logs[yoga.id].status, 'skipped');
  store.setCheck({ date: d, task_id: yoga.id, status: null });
  assert.equal(store.getDay({ date: d }).logs[yoga.id], undefined);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM logs').get().n, 0, 'unset deletes the row');
});

test('count task with zero count and no note removes the row', () => {
  const { db, store } = freshStore();
  const reading = store.listTasks().find((t) => t.name === 'Reading');
  const d = todayStr();
  store.setCount({ date: d, task_id: reading.id, count: 12, note: 'Matilda' });
  assert.equal(store.getDay({ date: d }).logs[reading.id].count, 12);
  store.setCount({ date: d, task_id: reading.id, count: 0, note: '' });
  assert.equal(db.prepare('SELECT COUNT(*) n FROM logs').get().n, 0);
});

test('skipped tasks are excluded from the progress denominator (kind math)', () => {
  const { store } = freshStore();
  const d = todayStr();
  const tasks = store.listTasks();
  store.setCheck({ date: d, task_id: tasks[3].id, status: 'skipped' });
  const { progress } = store.getDay({ date: d });
  assert.equal(progress.applicable, tasks.length - 1);
});

/* ---------- streak kindness ---------- */

const anyDayTask = { expected_days: null };

test('one missed day does not break a streak; two do', () => {
  const t = todayStr();
  const done = new Set([addDays(t, -4), addDays(t, -3), addDays(t, -1), t]); // gap at -2
  assert.equal(currentStreak(anyDayTask, done, new Set()), 4, 'single gap forgiven');
  const broken = new Set([addDays(t, -5), addDays(t, -4), t]); // gaps at -3,-2,-1...
  assert.equal(currentStreak(anyDayTask, broken, new Set()), 1, 'two+ misses break');
});

test('skipped days are neutral for streaks', () => {
  const t = todayStr();
  const done = new Set([addDays(t, -3), t]);
  const skipped = new Set([addDays(t, -2), addDays(t, -1)]);
  assert.equal(currentStreak(anyDayTask, done, skipped), 2);
});

test('longestStreak forgives single gaps', () => {
  const base = '2026-01-01';
  const done = new Set([base, addDays(base, 1), addDays(base, 3), addDays(base, 4)]);
  assert.equal(longestStreak(anyDayTask, done, new Set()), 4);
});

test('companion never shrinks below sprout once there is history', () => {
  assert.equal(companionStage(0, false), 0);
  assert.equal(companionStage(0, true), 1);
  assert.equal(companionStage(14, true), 5);
});

test('taskAppliesOn respects expected_days', () => {
  const sundayOnly = { expected_days: JSON.stringify([0]) };
  assert.equal(taskAppliesOn(sundayOnly, '2026-07-05'), true);  // a Sunday
  assert.equal(taskAppliesOn(sundayOnly, '2026-07-06'), false); // a Monday
  assert.equal(taskAppliesOn({ expected_days: null }, '2026-07-06'), true);
});

/* ---------- badges ---------- */

test('first task done and first diary entry award badges exactly once', () => {
  const { store } = freshStore();
  const d = todayStr();
  const yoga = store.listTasks().find((t) => t.name === 'Yoga');
  const r1 = store.setCheck({ date: d, task_id: yoga.id, status: 'done' });
  assert.deepEqual(r1.newBadges.map((b) => b.id), ['first-sprout']);
  const r2 = store.setCheck({ date: d, task_id: yoga.id, status: 'done' });
  assert.equal(r2.newBadges.length, 0, 'never re-awarded');
  const r3 = store.saveDiary({ date: d, text: 'hello' });
  assert.ok(r3.newBadges.some((b) => b.id === 'storyteller'));
});

test('reading goal reached finishes the book and awards first-book', () => {
  const { store } = freshStore();
  const reading = store.listTasks().find((t) => t.unit === 'pages');
  store.setCount({ date: todayStr(), task_id: reading.id, count: 60, note: 'Tiny Tales' });
  const r = store.setBookGoal({ title: 'Tiny Tales', total_pages: 50 });
  assert.ok(r.newBadges.some((b) => b.id === 'first-book'));
  const log = store.getReadingLog();
  assert.equal(log[0].finished, true);
});

test('quiz records best-of-day and never downgrades', () => {
  const { store } = freshStore();
  const d = todayStr();
  store.recordQuiz({ date: d, correct: 2, total: 3 });
  store.recordQuiz({ date: d, correct: 1, total: 3 });
  assert.equal(store.getQuiz({ date: d }).correct, 2);
  store.recordQuiz({ date: d, correct: 3, total: 3 });
  assert.equal(store.getQuiz({ date: d }).correct, 3);
});

test('badge catalog ids are unique and decorations reference real badges', async () => {
  const ids = new Set(BADGE_CATALOG.map((b) => b.id));
  assert.equal(ids.size, BADGE_CATALOG.length);
  const { DECORATIONS } = await import('../src/lib/decorations.js');
  for (const d of DECORATIONS) assert.ok(ids.has(d.badge), `${d.id} -> ${d.badge}`);
});

/* ---------- backup / restore ---------- */

test('export -> import round-trips including v2 tables', () => {
  const { store } = freshStore();
  const d = todayStr();
  const yoga = store.listTasks().find((t) => t.name === 'Yoga');
  store.setCheck({ date: d, task_id: yoga.id, status: 'done' });
  store.saveDiary({ date: d, text: 'roundtrip', mood: '😄', photo: 'data:x', doodle: 'data:y' });
  store.setBookGoal({ title: 'B', total_pages: 10 });
  store.recordQuiz({ date: d, correct: 3, total: 3 });
  const payload = store.exportData();
  assert.equal(payload.format, 2);

  const { store: other } = freshStore();
  other.importData({ payload });
  const day = other.getDay({ date: d });
  assert.equal(day.logs[yoga.id].status, 'done');
  assert.equal(day.diary[0].photo, 'data:x');
  assert.equal(other.getQuiz({ date: d }).correct, 3);
});

test('a format-1 backup (no books/quiz keys) imports cleanly', () => {
  const { store } = freshStore();
  const payload = store.exportData();
  payload.format = 1;
  delete payload.data.books;
  delete payload.data.quiz_results;
  const { store: other } = freshStore();
  assert.doesNotThrow(() => other.importData({ payload }));
});

test('backups from a future format version are rejected, not half-imported', () => {
  const { store } = freshStore();
  const payload = store.exportData();
  payload.format = 99;
  const { db, store: other } = freshStore();
  assert.throws(() => other.importData({ payload }), /newer version/);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM tasks').get().n, SEED_TASKS.length,
    'existing data untouched after rejection');
});

test('garbage payloads are rejected', () => {
  const { store } = freshStore();
  assert.throws(() => store.importData({ payload: { hello: 'world' } }), /Not a Sprout backup/);
});

/* ---------- quiz bank & rotation ---------- */

test('quiz banks are well-formed (answer always among options)', () => {
  for (const q of TRIVIA) assert.ok(q.options.includes(q.answer), q.q);
  for (const q of EMOJI_PUZZLES) assert.ok(q.options.includes(q.answer), q.q);
  for (const q of TRUE_FALSE) assert.equal(typeof q.answer, 'boolean', q.q);
  const round = buildRound(() => 0.42);
  assert.equal(round.length, 3);
  assert.deepEqual([...new Set(round.map((q) => q.type))].sort(), ['emoji', 'tf', 'trivia']);
});

/* ---------- hashing & dates ---------- */

test('sha256 matches NIST vectors and pins hash deterministically', () => {
  assert.equal(sha256Hex('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(hashPin('1234'), hashPin('1234'));
  assert.notEqual(hashPin('1234'), hashPin('1235'));
  assert.match(hashPin('0000'), /^[0-9a-f]{64}$/);
});

test('date helpers are consistent across month/year boundaries', () => {
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(toDateStr(new Date(2026, 6, 5)), '2026-07-05');
});
