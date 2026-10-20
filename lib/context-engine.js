import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const filePath = process.env.CONTEXT_FILE || path.resolve(process.env.DATA_DIR || './data', 'context.json');
const MAX_ITEMS = 500;
const MAX_TEXT = 4000;
const SECRET_PATTERNS = [
  /(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|passwd|private[_-]?key)\s*[:=]\s*\S+/i,
  /\bsk-[A-Za-z0-9_-]{16,}\b/,
  /\bBearer\s+[A-Za-z0-9._~-]{16,}\b/i
];

function sanitizeText(value) {
  const text = String(value ?? '').trim().slice(0, MAX_TEXT);
  if (!text) throw Object.assign(new Error('text gerekli.'), { status: 400 });
  if (SECRET_PATTERNS.some((pattern) => pattern.test(text))) {
    throw Object.assign(new Error('Gizli anahtar veya kimlik bilgisi içerebilecek metin kaydedilmedi.'), { status: 400 });
  }
  return text;
}

async function load() {
  try {
    const parsed = JSON.parse(await readFile(filePath, 'utf8'));
    return Array.isArray(parsed) ? parsed.slice(-MAX_ITEMS) : [];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function save(items) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(items.slice(-MAX_ITEMS), null, 2), { encoding: 'utf8', mode: 0o600 });
}

export async function createContext(input = {}) {
  const text = sanitizeText(input.text);
  const item = {
    id: randomUUID(),
    text,
    tags: Array.isArray(input.tags) ? input.tags.slice(0, 12).map((tag) => String(tag).trim().slice(0, 40)).filter(Boolean) : [],
    source: String(input.source || 'manual').slice(0, 80),
    kind: String(input.kind || 'note').slice(0, 40),
    confidence: Number.isFinite(Number(input.confidence)) ? Math.max(0, Math.min(1, Number(input.confidence))) : 1,
    createdAt: new Date().toISOString()
  };
  const items = await load();
  const duplicate = items.find((entry) => entry.text.toLowerCase() === text.toLowerCase());
  if (duplicate) return { ...duplicate, deduplicated: true };
  items.push(item);
  await save(items);
  return item;
}

export async function deriveContexts(input = {}) {
  const sourceText = String(input.text || '').slice(0, 20000);
  if (!sourceText.trim()) throw Object.assign(new Error('text gerekli.'), { status: 400 });
  const sentences = sourceText.split(/(?<=[.!?\n])\s+/u).map((part) => part.trim()).filter(Boolean);
  const cues = [
    { pattern: /\b(tercih|önceliğim|prefer|preference)\b/i, tag: 'preference', kind: 'preference' },
    { pattern: /\b(karar verdim|kararımız|decision|decided)\b/i, tag: 'decision', kind: 'decision' },
    { pattern: /\b(proje|project|görev|task|yapılacak)\b/i, tag: 'project', kind: 'task' },
    { pattern: /\b(hatırla|unutma|remember|do not forget)\b/i, tag: 'remember', kind: 'note' }
  ];
  const candidates = [];
  for (const sentence of sentences) {
    if (SECRET_PATTERNS.some((pattern) => pattern.test(sentence))) continue;
    const cue = cues.find((item) => item.pattern.test(sentence));
    if (!cue || sentence.length < 12) continue;
    candidates.push({ text: sentence.slice(0, MAX_TEXT), tags: [cue.tag], kind: cue.kind, source: String(input.source || 'auto-derived'), confidence: 0.65 });
    if (candidates.length >= 20) break;
  }
  const created = [];
  for (const candidate of candidates) created.push(await createContext(candidate));
  return { scannedSentences: sentences.length, candidates: candidates.length, created: created.length, contexts: created };
}

export async function searchContexts(query = '', limit = 10) {
  const items = await load();
  const needle = String(query).trim().toLocaleLowerCase();
  const matches = needle
    ? items.filter((item) => `${item.text} ${(item.tags || []).join(' ')} ${item.kind || ''} ${item.source || ''}`.toLocaleLowerCase().includes(needle))
    : items;
  return matches.slice(-Math.min(Math.max(Number(limit) || 10, 1), 50)).reverse();
}

export async function contextHealth() {
  const items = await load();
  return { ok: true, count: items.length, backend: 'json-file', maxItems: MAX_ITEMS };
}
