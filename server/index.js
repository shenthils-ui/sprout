// Sprout laptop server: Express + better-sqlite3. Exposes the shared store
// as one RPC endpoint and serves the built frontend from ../dist.
// Listens on 0.0.0.0 so a phone on the same Wi-Fi can reach it too.

import Database from 'better-sqlite3';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from '../shared/schema.js';
import { SEED_PROMPTS, SEED_TASKS } from '../shared/seeds.js';
import { createStore } from '../shared/store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'sprout.db'));
db.pragma('journal_mode = WAL');
migrate(db, { tasks: SEED_TASKS, prompts: SEED_PROMPTS });
const store = createStore(db);

const app = express();
app.use(express.json({ limit: '50mb' }));

app.post('/api/rpc', (req, res) => {
  const { method, params } = req.body ?? {};
  if (typeof store[method] !== 'function') {
    return res.status(400).json({ error: `Unknown method: ${method}` });
  }
  try {
    res.json({ result: store[method](params ?? {}) ?? null });
  } catch (e) {
    console.error(`[rpc] ${method} failed:`, e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'sprout' }));

const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  // SPA fallback for client-side routes
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  app.get('/', (_req, res) => res.send(
    'Sprout server is running, but the app is not built yet. Run: npm run build'));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  🌱 Sprout is growing!');
  console.log(`     On this computer:  http://localhost:${PORT}`);
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const i of ifaces ?? []) {
      if (i.family === 'IPv4' && !i.internal) {
        console.log(`     On your Wi-Fi:      http://${i.address}:${PORT}`);
      }
    }
  }
  console.log('');
});
