// A thin better-sqlite3-compatible wrapper around a sql.js Database, so the
// shared store/schema run unchanged in the browser. Implements exactly the
// surface the shared code uses: prepare().get/all/run(), exec(),
// transaction(), pragma().

function normalizeParams(params) {
  return params.map((p) => {
    if (p === undefined) return null;
    if (typeof p === 'boolean') return p ? 1 : 0;
    return p;
  });
}

export function wrapDb(sqldb) {
  const db = {
    prepare(sql) {
      return {
        get(...params) {
          const stmt = sqldb.prepare(sql);
          try {
            stmt.bind(normalizeParams(params));
            return stmt.step() ? stmt.getAsObject() : undefined;
          } finally {
            stmt.free();
          }
        },
        all(...params) {
          const stmt = sqldb.prepare(sql);
          const rows = [];
          try {
            stmt.bind(normalizeParams(params));
            while (stmt.step()) rows.push(stmt.getAsObject());
            return rows;
          } finally {
            stmt.free();
          }
        },
        run(...params) {
          const stmt = sqldb.prepare(sql);
          try {
            stmt.bind(normalizeParams(params));
            stmt.step();
          } finally {
            stmt.free();
          }
          const changes = sqldb.getRowsModified();
          const r = sqldb.exec('SELECT last_insert_rowid()');
          const lastInsertRowid = r.length ? r[0].values[0][0] : 0;
          return { changes, lastInsertRowid };
        },
      };
    },

    exec(sql) {
      sqldb.exec(sql);
      return db;
    },

    transaction(fn) {
      return (...args) => {
        sqldb.exec('BEGIN');
        try {
          const result = fn(...args);
          sqldb.exec('COMMIT');
          return result;
        } catch (e) {
          sqldb.exec('ROLLBACK');
          throw e;
        }
      };
    },

    pragma(str) {
      sqldb.exec(`PRAGMA ${str}`);
    },

    export() {
      return sqldb.export();
    },
  };
  return db;
}
