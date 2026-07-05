// Standalone-build API: SQLite compiled to WebAssembly (sql.js), running
// entirely in this browser, persisted to IndexedDB. Loaded only via dynamic
// import when VITE_STANDALONE is set, so none of this (or the .wasm) ends up
// in the server build.

import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { migrate } from '../../shared/schema.js';
import { SEED_PROMPTS, SEED_TASKS } from '../../shared/seeds.js';
import { createStore } from '../../shared/store.js';
import { loadDbBytes, saveDbBytes } from './idb.js';
import { wrapDb } from './sqljs-shim.js';

export async function createLocalApi() {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });

  const saved = await loadDbBytes();
  const sqldb = saved ? new SQL.Database(saved) : new SQL.Database();
  const db = wrapDb(sqldb);
  migrate(db, { tasks: SEED_TASKS, prompts: SEED_PROMPTS });
  const store = createStore(db);

  // Persist after writes, debounced; flush when the app is backgrounded so
  // nothing is lost if Android kills the tab.
  let timer = null;
  let dirty = false;
  const flush = async () => {
    if (!dirty) return;
    dirty = false;
    await saveDbBytes(db.export());
  };
  const schedulePersist = () => {
    dirty = true;
    clearTimeout(timer);
    timer = setTimeout(flush, 250);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });

  const READ_ONLY = new Set([
    'listTasks', 'getDay', 'listDiary', 'listPrompts', 'getBadges',
    'getCompanion', 'getMonth', 'getReadingLog', 'getInsights',
    'getSettings', 'exportData',
  ]);

  // If this was a fresh database, persist the seeded state right away.
  if (!saved) {
    dirty = true;
    await flush();
  }

  return new Proxy({}, {
    get: (_t, method) => {
      if (method === 'then') return undefined;
      return async (params) => {
        const fn = store[method];
        if (typeof fn !== 'function') throw new Error(`Unknown method: ${method}`);
        const result = fn(params ?? {});
        if (!READ_ONLY.has(method)) schedulePersist();
        return result;
      };
    },
  });
}
