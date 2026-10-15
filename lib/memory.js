import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const DEFAULT_LIMIT = 100;
const filePath = process.env.MEMORY_FILE || path.resolve(process.env.DATA_DIR || './data', 'memory.json');
let poolPromise;
let schemaPromise;

function requireProductionDatabase() {
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production; refusing to use local file memory.');
  }
}

async function getPool() {
  requireProductionDatabase();
  if (!process.env.DATABASE_URL) return null;
  if (!poolPromise) {
    poolPromise = import('pg').then(({ Pool }) => new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.PGPOOL_MAX || 5),
      ...(process.env.PGSSLMODE === 'require'
        ? { ssl: { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false' } }
        : {})
    }));
  }
  return poolPromise;
}

async function ensureSchema(pool) {
  if (!schemaPromise) {
    schemaPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS karicimgpt_memories (
        id UUID PRIMARY KEY,
        text TEXT NOT NULL,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `).catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  await schemaPromise;
}

function fromRow(row) {
  return {
    id: row.id,
    text: row.text,
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: new Date(row.created_at).toISOString()
  };
}

async function load() {
  const pool = await getPool();
  if (pool) {
    await ensureSchema(pool);
    const result = await pool.query(
      'SELECT id, text, tags, created_at FROM karicimgpt_memories ORDER BY created_at ASC, id ASC'
    );
    return result.rows.map(fromRow);
  }
  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function save(items) {
  const pool = await getPool();
  if (pool) {
    await ensureSchema(pool);
    await pool.query(
      `DELETE FROM karicimgpt_memories
       WHERE id IN (
         SELECT id FROM karicimgpt_memories
         ORDER BY created_at DESC, id DESC
         OFFSET $1
       )`,
      [DEFAULT_LIMIT]
    );
    return;
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(items.slice(-DEFAULT_LIMIT), null, 2), 'utf8');
}

export async function remember(entry) {
  const text = String(entry?.text || '').trim();
  if (!text) throw Object.assign(new Error('Memory text is required'), { status: 400 });
  const tags = Array.isArray(entry?.tags) ? entry.tags.slice(0, 10).map((tag) => String(tag).slice(0, 100)) : [];
  const pool = await getPool();
  if (pool) {
    await ensureSchema(pool);
    const result = await pool.query(
      'INSERT INTO karicimgpt_memories (id, text, tags, created_at) VALUES ($1, $2, $3::jsonb, NOW()) RETURNING id, text, tags, created_at',
      [randomUUID(), text.slice(0, 4000), JSON.stringify(tags)]
    );
    await save([]);
    return fromRow(result.rows[0]);
  }

  const items = await load();
  items.push({
    id: randomUUID(),
    text: text.slice(0, 4000),
    tags,
    createdAt: new Date().toISOString()
  });
  await save(items);
  return items.at(-1);
}

export async function recall(query = '', limit = 10) {
  const needle = String(query).trim();
  const boundedLimit = Math.min(Math.max(Number(limit) || 10, 1), 25);
  const pool = await getPool();
  if (pool) {
    await ensureSchema(pool);
    const result = needle
      ? await pool.query(
          `SELECT id, text, tags, created_at FROM karicimgpt_memories
           WHERE text ILIKE $1 OR tags::text ILIKE $1
           ORDER BY created_at DESC, id DESC LIMIT $2`,
          [`%${needle}%`, boundedLimit]
        )
      : await pool.query(
          'SELECT id, text, tags, created_at FROM karicimgpt_memories ORDER BY created_at DESC, id DESC LIMIT $1',
          [boundedLimit]
        );
    return result.rows.map(fromRow);
  }
  const items = await load();
  const lowerNeedle = needle.toLowerCase();
  const matches = lowerNeedle
    ? items.filter((item) => `${item.text} ${(item.tags || []).join(' ')}`.toLowerCase().includes(lowerNeedle))
    : items;
  return matches.slice(-boundedLimit).reverse();
}

export async function memoryHealth() {
  const pool = await getPool();
  if (pool) {
    await ensureSchema(pool);
    const result = await pool.query('SELECT COUNT(*)::int AS count FROM karicimgpt_memories');
    return { ok: true, count: result.rows[0].count, backend: 'postgres' };
  }
  const items = await load();
  return { ok: true, count: items.length, backend: 'file' };
}
