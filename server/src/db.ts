import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/office.db';
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    model TEXT NOT NULL,
    desk_x INTEGER NOT NULL,
    desk_y INTEGER NOT NULL,
    status TEXT DEFAULT 'idle'
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agent_id) REFERENCES agents(id)
  );
`);

const count = db.prepare('SELECT count(*) as count FROM agents').get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare(
    `INSERT INTO agents (id, name, role, system_prompt, model, desk_x, desk_y, status)
    VALUES (@id, @name, @role, @system_prompt, @model, @desk_x, @desk_y, 'idle')`
  );

  insert.run({
    id: 'agent_1',
    name: 'Atlas (Manager)',
    role: 'Product Lead',
    system_prompt: 'You are the office manager. Break high-level problems into actionable subtasks.',
    model: process.env.OPENROUTER_DEFAULT_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
    desk_x: 2,
    desk_y: 2,
  });

  insert.run({
    id: 'agent_2',
    name: 'Cipher (Dev)',
    role: 'Senior Coder',
    system_prompt: 'You are a pragmatic, concise software developer. Implement solutions directly in code.',
    model: process.env.OPENROUTER_DEFAULT_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
    desk_x: 5,
    desk_y: 2,
  });
}
