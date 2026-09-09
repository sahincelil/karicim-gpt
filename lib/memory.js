import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const DEFAULT_LIMIT = 100;
const filePath = process.env.MEMORY_FILE || path.resolve(process.env.DATA_DIR || './data', 'memory.json');

async function load() {
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
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(items.slice(-DEFAULT_LIMIT), null, 2), 'utf8');
}

export async function remember(entry) {
  const items = await load();
  const text = String(entry?.text || '').trim();
  if (!text) throw Object.assign(new Error('Memory text is required'), { status: 400 });
  items.push({
    id: randomUUID(),
    text: text.slice(0, 4000),
    tags: Array.isArray(entry?.tags) ? entry.tags.slice(0, 10).map(String) : [],
    createdAt: new Date().toISOString()
  });
  await save(items);
  return items.at(-1);
}

export async function recall(query = '', limit = 10) {
  const items = await load();
  const needle = String(query).trim().toLowerCase();
  const matches = needle ? items.filter((item) => `${item.text} ${(item.tags || []).join(' ')}`.toLowerCase().includes(needle)) : items;
  return matches.slice(-Math.min(Math.max(Number(limit) || 10, 1), 25)).reverse();
}

export async function memoryHealth() {
  const items = await load();
  return { ok: true, count: items.length, backend: 'file' };
}
