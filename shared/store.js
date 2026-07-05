// All business logic, shared verbatim by both builds. `db` is either a real
// better-sqlite3 Database (server) or the sql.js shim (standalone) — both
// expose prepare().get/all/run(), exec(), transaction().
//
// Every method takes ONE JSON-serializable params object and returns a
// JSON-serializable result, so the server can expose the whole store as a
// single RPC endpoint and the standalone build can call it directly.

import { BADGE_CATALOG, newlyEarnedBadges } from './badges.js';
import { addDays, monthDays, taskAppliesOn, todayStr } from './dates.js';
import { companionStage, currentStreak, longestStreak } from './streaks.js';

const now = () => new Date().toISOString();

export function createStore(db) {
  const taskById = (id) => db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  function doneDatesFor(taskId) {
    const rows = db.prepare(
      `SELECT date, status, count FROM logs WHERE task_id = ?`
    ).all(taskId);
    const done = new Set(), skipped = new Set();
    for (const r of rows) {
      if (r.status === 'done' || (r.count != null && r.count > 0)) done.add(r.date);
      else if (r.status === 'skipped') skipped.add(r.date);
    }
    return { done, skipped };
  }

  function companion() {
    const today = todayStr();
    let points = 0;
    let todayActive = false;
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, -i);
      const didTask = db.prepare(
        `SELECT 1 FROM logs WHERE date = ? AND (status = 'done' OR count > 0) LIMIT 1`
      ).get(d);
      const wrote = db.prepare(
        `SELECT 1 FROM diary WHERE date = ? AND text != '' LIMIT 1`
      ).get(d);
      if (didTask) points++;
      if (wrote) points++;
      if (i === 0 && (didTask || wrote)) todayActive = true;
    }
    const hasHistory = !!db.prepare(
      `SELECT 1 FROM logs LIMIT 1`
    ).get() || !!db.prepare(`SELECT 1 FROM diary LIMIT 1`).get();
    const stage = companionStage(points, hasHistory);
    return { stage, points, todayActive };
  }

  // Book pages come from the reading log; when a book with a goal reaches its
  // total, stamp finished_at (never un-stamp — celebrations are permanent).
  function syncFinishedBooks() {
    const books = db.prepare(
      `SELECT * FROM books WHERE total_pages > 0 AND finished_at IS NULL`).all();
    for (const b of books) {
      const pages = db.prepare(`SELECT COALESCE(SUM(l.count),0) AS n FROM logs l
        JOIN tasks t ON t.id = l.task_id
        WHERE t.unit = 'pages' AND TRIM(COALESCE(l.note,'')) = ?`).get(b.title).n;
      if (pages >= b.total_pages) {
        db.prepare('UPDATE books SET finished_at = ? WHERE id = ?').run(now(), b.id);
      }
    }
  }

  // Longest run of consecutive days with any activity (tasks or diary).
  function consecutiveActiveDays() {
    const rows = db.prepare(`SELECT DISTINCT date FROM (
      SELECT date FROM logs WHERE status IS NOT NULL OR count > 0
      UNION SELECT date FROM diary WHERE text != '') ORDER BY date`).all();
    let best = 0, run = 0, prev = null;
    for (const { date } of rows) {
      run = prev && addDays(prev, 1) === date ? run + 1 : 1;
      if (run > best) best = run;
      prev = date;
    }
    return best;
  }

  function gatherBadgeStats() {
    const q = (sql) => db.prepare(sql).get();
    const totalDone = q(`SELECT COUNT(*) AS n FROM logs WHERE status='done' OR count > 0`).n;
    const diaryEntries = q(`SELECT COUNT(*) AS n FROM diary WHERE text != ''`).n;
    const activeDays = q(`SELECT COUNT(*) AS n FROM (
      SELECT date FROM logs WHERE status IS NOT NULL OR count IS NOT NULL
      UNION SELECT date FROM diary WHERE text != '')`).n;
    const pagesTotal = q(`SELECT COALESCE(SUM(l.count),0) AS n FROM logs l
      JOIN tasks t ON t.id = l.task_id WHERE t.unit = 'pages'`).n;
    const musicMinutes = q(`SELECT COALESCE(SUM(l.count),0) AS n FROM logs l
      JOIN tasks t ON t.id = l.task_id WHERE t.unit = 'minutes'`).n;
    const craftsDone = q(`SELECT COUNT(*) AS n FROM logs l
      JOIN tasks t ON t.id = l.task_id
      WHERE l.status = 'done' AND LOWER(t.name) LIKE '%craft%'`).n;
    const moodsTagged = q(`SELECT COUNT(*) AS n FROM diary WHERE mood IS NOT NULL AND mood != ''`).n;
    const waterTotal = q(`SELECT COALESCE(SUM(l.count),0) AS n FROM logs l
      JOIN tasks t ON t.id = l.task_id WHERE t.unit = 'glasses'`).n;
    const quizCorrect = q(`SELECT COALESCE(SUM(correct),0) AS n FROM quiz_results`).n;
    const doodles = q(`SELECT COUNT(*) AS n FROM diary WHERE doodle IS NOT NULL`).n;
    const photos = q(`SELECT COUNT(*) AS n FROM diary WHERE photo IS NOT NULL`).n;
    syncFinishedBooks();
    const booksFinished = q(`SELECT COUNT(*) AS n FROM books WHERE finished_at IS NOT NULL`).n;

    let bestStreak = 0;
    const tasks = db.prepare('SELECT * FROM tasks WHERE active = 1').all();
    for (const t of tasks) {
      const { done, skipped } = doneDatesFor(t.id);
      const s = longestStreak(t, done, skipped);
      if (s > bestStreak) bestStreak = s;
    }
    return {
      totalDone, diaryEntries, activeDays, bestStreak, pagesTotal,
      musicMinutes, craftsDone, moodsTagged, companionStage: companion().stage,
      waterTotal, quizCorrect, doodles, photos, booksFinished,
      consecutiveActiveDays: consecutiveActiveDays(),
    };
  }

  const store = {
    // ---------- tasks ----------
    listTasks({ all = false } = {}) {
      return db.prepare(
        `SELECT * FROM tasks ${all ? '' : 'WHERE active = 1'} ORDER BY display_order, id`
      ).all();
    },

    createTask({ name, emoji = '⭐', kind = 'check', unit = null, note_label = null,
                 has_note = false, expected_days = null }) {
      const max = db.prepare('SELECT COALESCE(MAX(display_order),-1) AS m FROM tasks').get().m;
      const r = db.prepare(`INSERT INTO tasks
        (name, emoji, kind, unit, note_label, has_note, expected_days, display_order, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`)
        .run(name, emoji, kind, unit, note_label, has_note ? 1 : 0, expected_days, max + 1);
      return taskById(r.lastInsertRowid);
    },

    updateTask({ id, ...patch }) {
      const allowed = ['name', 'emoji', 'kind', 'unit', 'note_label', 'has_note',
        'expected_days', 'active'];
      const keys = Object.keys(patch).filter((k) => allowed.includes(k));
      if (keys.length) {
        const sets = keys.map((k) => `${k} = ?`).join(', ');
        const vals = keys.map((k) =>
          typeof patch[k] === 'boolean' ? (patch[k] ? 1 : 0) : patch[k]);
        db.prepare(`UPDATE tasks SET ${sets} WHERE id = ?`).run(...vals, id);
      }
      return taskById(id);
    },

    reorderTasks({ ids }) {
      const tx = db.transaction(() => {
        ids.forEach((id, i) =>
          db.prepare('UPDATE tasks SET display_order = ? WHERE id = ?').run(i, id));
      });
      tx();
      return store.listTasks({ all: true });
    },

    deleteTask({ id }) {
      const tx = db.transaction(() => {
        db.prepare('DELETE FROM logs WHERE task_id = ?').run(id);
        db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
      });
      tx();
      return { ok: true };
    },

    // ---------- daily log ----------
    getDay({ date }) {
      const tasks = store.listTasks().filter((t) => taskAppliesOn(t, date));
      const logRows = db.prepare('SELECT * FROM logs WHERE date = ?').all(date);
      const logs = {};
      for (const r of logRows) logs[r.task_id] = r;
      const diary = db.prepare(
        `SELECT * FROM diary WHERE date = ? ORDER BY id`).all(date);
      let done = 0, applicable = 0;
      for (const t of tasks) {
        const l = logs[t.id];
        const isDone = l && (l.status === 'done' || (l.count != null && l.count > 0));
        const isSkipped = l && l.status === 'skipped';
        if (!isSkipped) applicable++;
        if (isDone) done++;
      }
      return { tasks, logs, diary, progress: { done, applicable } };
    },

    setCheck({ date, task_id, status }) {
      // status: 'done' | 'skipped' | null (unset)
      if (status === null) {
        db.prepare(`DELETE FROM logs WHERE date = ? AND task_id = ?`).run(date, task_id);
      } else {
        db.prepare(`INSERT INTO logs (date, task_id, status, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(date, task_id)
          DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`)
          .run(date, task_id, status, now());
      }
      return store.checkBadges();
    },

    setCount({ date, task_id, count, note = null }) {
      const empty = (count == null || count === 0) && (!note || note === '');
      if (empty) {
        db.prepare(`DELETE FROM logs WHERE date = ? AND task_id = ?`).run(date, task_id);
      } else {
        db.prepare(`INSERT INTO logs (date, task_id, count, note, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(date, task_id)
          DO UPDATE SET count = excluded.count, note = excluded.note,
                        updated_at = excluded.updated_at`)
          .run(date, task_id, count, note, now());
      }
      return store.checkBadges();
    },

    setNote({ date, task_id, note }) {
      db.prepare(`INSERT INTO logs (date, task_id, note, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(date, task_id)
        DO UPDATE SET note = excluded.note, updated_at = excluded.updated_at`)
        .run(date, task_id, note, now());
      return { ok: true };
    },

    // ---------- diary ----------
    saveDiary({ id = null, date, text = '', prompt_text = null, mood = null,
                photo = null, doodle = null }) {
      if (id) {
        db.prepare(`UPDATE diary SET text = ?, prompt_text = ?, mood = ?,
          photo = ?, doodle = ?, updated_at = ? WHERE id = ?`)
          .run(text, prompt_text, mood, photo, doodle, now(), id);
        const entry = db.prepare('SELECT * FROM diary WHERE id = ?').get(id);
        return { entry, newBadges: store.checkBadges().newBadges };
      }
      const r = db.prepare(`INSERT INTO diary
        (date, text, prompt_text, mood, photo, doodle, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(date, text, prompt_text, mood, photo, doodle, now(), now());
      const entry = db.prepare('SELECT * FROM diary WHERE id = ?').get(r.lastInsertRowid);
      return { entry, newBadges: store.checkBadges().newBadges };
    },

    deleteDiary({ id }) {
      db.prepare('DELETE FROM diary WHERE id = ?').run(id);
      return { ok: true };
    },

    listDiary({ limit = 30, before = null } = {}) {
      // Paged, newest first, only non-empty entries (text, photo or doodle
      // counts) — the scrapbook view.
      const nonEmpty = `(text != '' OR photo IS NOT NULL OR doodle IS NOT NULL)`;
      if (before) {
        return db.prepare(`SELECT * FROM diary WHERE ${nonEmpty} AND date < ?
          ORDER BY date DESC, id DESC LIMIT ?`).all(before, limit);
      }
      return db.prepare(`SELECT * FROM diary WHERE ${nonEmpty}
        ORDER BY date DESC, id DESC LIMIT ?`).all(limit);
    },

    // ---------- prompts ----------
    listPrompts({ all = false } = {}) {
      return db.prepare(
        `SELECT * FROM prompts ${all ? '' : 'WHERE active = 1'} ORDER BY id`).all();
    },
    addPrompt({ text }) {
      const r = db.prepare('INSERT INTO prompts (text, active) VALUES (?, 1)').run(text);
      return db.prepare('SELECT * FROM prompts WHERE id = ?').get(r.lastInsertRowid);
    },
    removePrompt({ id }) {
      db.prepare('UPDATE prompts SET active = 0 WHERE id = ?').run(id);
      return { ok: true };
    },

    // ---------- badges ----------
    getBadges() {
      const earned = {};
      for (const r of db.prepare('SELECT * FROM earned_badges').all()) {
        earned[r.badge_id] = r.earned_at;
      }
      return { catalog: BADGE_CATALOG, earned };
    },

    checkBadges() {
      const earnedRows = db.prepare('SELECT badge_id FROM earned_badges').all();
      const earnedIds = earnedRows.map((r) => r.badge_id);
      const fresh = newlyEarnedBadges(gatherBadgeStats(), earnedIds);
      for (const id of fresh) {
        db.prepare('INSERT OR IGNORE INTO earned_badges (badge_id, earned_at) VALUES (?, ?)')
          .run(id, now());
      }
      const newBadges = BADGE_CATALOG.filter((b) => fresh.includes(b.id));
      return { newBadges };
    },

    // ---------- companion ----------
    getCompanion() {
      return companion();
    },

    // ---------- history ----------
    getMonth({ month }) {
      const days = {};
      const today = todayStr();
      for (const date of monthDays(month)) {
        if (date > today) continue;
        const { progress, diary } = store.getDay({ date });
        const hasDiary = diary.some((e) => e.text !== '' || e.photo || e.doodle);
        const hasAnything = db.prepare(
          'SELECT 1 FROM logs WHERE date = ? LIMIT 1').get(date);
        if (progress.done > 0 || hasDiary || hasAnything) {
          days[date] = {
            done: progress.done,
            applicable: progress.applicable,
            pct: progress.applicable ? progress.done / progress.applicable : 0,
            hasDiary,
          };
        }
      }
      return { days };
    },

    getReadingLog() {
      // Books from any "pages" count task, grouped by note (book title),
      // merged with per-book goals from the books table.
      syncFinishedBooks();
      const rows = db.prepare(`SELECT l.note, l.date, l.count FROM logs l
        JOIN tasks t ON t.id = l.task_id
        WHERE t.unit = 'pages' AND l.count > 0
        ORDER BY l.date`).all();
      const goals = new Map(db.prepare('SELECT * FROM books').all()
        .map((b) => [b.title, b]));
      const books = new Map();
      for (const r of rows) {
        const title = (r.note || '').trim() || 'Untitled reading';
        if (!books.has(title)) {
          books.set(title, { title, pages: 0, days: 0, first: r.date, last: r.date });
        }
        const b = books.get(title);
        b.pages += r.count;
        b.days += 1;
        b.last = r.date;
      }
      return [...books.values()].map((b) => {
        const g = goals.get(b.title);
        return {
          ...b,
          total_pages: g?.total_pages ?? null,
          finished: !!g?.finished_at,
        };
      }).sort((a, b) => (a.last < b.last ? 1 : -1));
    },

    setBookGoal({ title, total_pages }) {
      const t = title.trim();
      if (!t) throw new Error('Book title missing');
      if (!total_pages) {
        db.prepare('DELETE FROM books WHERE title = ? AND finished_at IS NULL').run(t);
      } else {
        db.prepare(`INSERT INTO books (title, total_pages) VALUES (?, ?)
          ON CONFLICT(title) DO UPDATE SET total_pages = excluded.total_pages`)
          .run(t, total_pages);
      }
      return store.checkBadges();
    },

    // ---------- quiz corner ----------
    getQuiz({ date }) {
      return db.prepare('SELECT * FROM quiz_results WHERE date = ?').get(date) ?? null;
    },

    recordQuiz({ date, correct, total }) {
      const prev = store.getQuiz({ date });
      if (!prev || correct > prev.correct) {
        db.prepare(`INSERT INTO quiz_results (date, correct, total) VALUES (?, ?, ?)
          ON CONFLICT(date) DO UPDATE SET correct = excluded.correct, total = excluded.total`)
          .run(date, correct, total);
      }
      return store.checkBadges();
    },

    // ---------- insights ----------
    getInsights({ from, to }) {
      const tasks = store.listTasks();
      const perTask = tasks.map((t) => {
        const rows = db.prepare(
          `SELECT * FROM logs WHERE task_id = ? AND date >= ? AND date <= ?`
        ).all(t.id, from, to);
        const byDate = new Map(rows.map((r) => [r.date, r]));
        let applicable = 0, done = 0, skipped = 0, total = 0, daysCounted = 0;
        let d = from;
        const today = todayStr();
        while (d <= to && d <= today) {
          if (taskAppliesOn(t, d)) {
            const l = byDate.get(d);
            const isDone = l && (l.status === 'done' || (l.count != null && l.count > 0));
            const isSkipped = l && l.status === 'skipped';
            if (isSkipped) skipped++;
            else {
              applicable++;
              if (isDone) done++;
            }
            if (l && l.count != null) { total += l.count; daysCounted++; }
          }
          d = addDays(d, 1);
        }
        const { done: dd, skipped: ss } = doneDatesFor(t.id);
        return {
          task: t,
          done, applicable, skipped,
          pct: applicable ? done / applicable : 0,
          countTotal: total,
          countAvg: daysCounted ? total / daysCounted : 0,
          currentStreak: currentStreak(t, dd, ss),
          longestStreak: longestStreak(t, dd, ss),
        };
      });

      const diaryRows = db.prepare(
        `SELECT * FROM diary WHERE text != '' AND date >= ? AND date <= ?`).all(from, to);
      const moods = diaryRows.map((e) => e.mood).filter(Boolean);
      const moodCounts = {};
      for (const m of moods) moodCounts[m] = (moodCounts[m] || 0) + 1;
      const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      return { perTask, diary: { entries: diaryRows.length, topMood } };
    },

    // ---------- settings ----------
    getSettings() {
      const out = {};
      for (const r of db.prepare('SELECT * FROM settings').all()) out[r.key] = r.value;
      return out;
    },
    setSetting({ key, value }) {
      db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, value);
      return { ok: true };
    },

    // ---------- backup / restore (identical JSON on both builds) ----------
    exportData() {
      const dump = (table) => db.prepare(`SELECT * FROM ${table}`).all();
      return {
        app: 'sprout',
        format: 2,
        exported_at: now(),
        data: {
          tasks: dump('tasks'),
          logs: dump('logs'),
          diary: dump('diary'),
          prompts: dump('prompts'),
          earned_badges: dump('earned_badges'),
          settings: dump('settings'),
          books: dump('books'),
          quiz_results: dump('quiz_results'),
        },
      };
    },

    importData({ payload }) {
      if (!payload || payload.app !== 'sprout' || !payload.data) {
        throw new Error('Not a Sprout backup file');
      }
      const d = payload.data;
      const tx = db.transaction(() => {
        for (const t of ['logs', 'diary', 'tasks', 'prompts', 'earned_badges',
                         'settings', 'books', 'quiz_results']) {
          db.prepare(`DELETE FROM ${t}`).run();
        }
        const insert = (table, rows, cols) => {
          if (!rows?.length) return;
          const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(',')})
            VALUES (${cols.map(() => '?').join(',')})`);
          for (const r of rows) stmt.run(...cols.map((c) => r[c] ?? null));
        };
        insert('tasks', d.tasks, ['id', 'name', 'emoji', 'kind', 'unit', 'note_label',
          'has_note', 'expected_days', 'display_order', 'active']);
        insert('logs', d.logs, ['id', 'date', 'task_id', 'status', 'count', 'note', 'updated_at']);
        insert('diary', d.diary, ['id', 'date', 'text', 'prompt_text', 'mood', 'photo', 'doodle', 'created_at', 'updated_at']);
        insert('prompts', d.prompts, ['id', 'text', 'active']);
        insert('earned_badges', d.earned_badges, ['badge_id', 'earned_at']);
        insert('settings', d.settings, ['key', 'value']);
        insert('books', d.books, ['id', 'title', 'total_pages', 'finished_at']);
        insert('quiz_results', d.quiz_results, ['date', 'correct', 'total']);
      });
      tx();
      return { ok: true, counts: {
        tasks: d.tasks?.length ?? 0, logs: d.logs?.length ?? 0,
        diary: d.diary?.length ?? 0,
      } };
    },
  };

  return store;
}
