import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const filePath = process.env.CONTEXT_FILE || path.resolve(process.env.DATA_DIR || './data', 'context.json');
const MAX_ITEMS = 500;
const MAX_TEXT = 4000;
const SECRET_PATTERNS = [
  /(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|passwd|private[_-]?key)\s*[:=]\s*\S+/i,
  /\bsk-[A-Za-z0-9_-]{16,}\b/,
  /\bBearer\s+[A-Za-z0-9._~-]{16,}\b/i,
  /\bxai-[A-Za-z0-9_-]{16,}\b/i,
  /\bghp_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/
];

// Serialize mutations within this Node process. A shared database/volume with
// cross-instance transactions is still required for multi-instance deployments.
let writeQueue = Promise.resolve();
function serializeWrite(operation) {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.catch(() => {});
  return result;
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(/\u0130/g, 'i')
    .replace(/\u0307/g, '')
    .toLocaleLowerCase('tr-TR');
}

function sanitizeText(value) {
  const text = String(value ?? '').trim().slice(0, MAX_TEXT);
  if (!text) throw Object.assign(new Error('text gerekli.'), { status: 400 });
  if (SECRET_PATTERNS.some((pattern) => pattern.test(text))) {
    throw Object.assign(new Error('Gizli anahtar veya kimlik bilgisi içerebilecek metin kaydedilmedi.'), { status: 400 });
  }
  return text;
}

function assertStorageAvailable() {
  // Vercel's function filesystem is not durable. Fail closed rather than
  // report successful writes to ephemeral/read-only storage.
  if (process.env.VERCEL === '1') {
    throw Object.assign(new Error('Kalıcı bağlam deposu yapılandırılmadı; üretimde kayıt kapalı.'), { status: 503 });
  }
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
  assertStorageAvailable();
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, JSON.stringify(items.slice(-MAX_ITEMS), null, 2), { encoding: 'utf8', mode: 0o600 });
    await rename(temporaryPath, filePath);
  } finally {
    // If rename succeeded this path no longer exists; cleanup is best-effort.
    await import('node:fs/promises').then(({ rm }) => rm(temporaryPath, { force: true })).catch(() => {});
  }
}

export async function createContext(input = {}) {
  const text = sanitizeText(input.text);
  return serializeWrite(async () => {
    assertStorageAvailable();
    const items = await load();
    const duplicate = items.find((entry) => normalize(entry.text) === normalize(text));
    if (duplicate) return { ...duplicate, deduplicated: true };
    const item = {
      id: randomUUID(),
      text,
      tags: Array.isArray(input.tags) ? input.tags.slice(0, 12).map((tag) => String(tag).trim().slice(0, 40)).filter(Boolean) : [],
      source: String(input.source || 'manual').slice(0, 80),
      kind: String(input.kind || 'note').slice(0, 40),
      confidence: Number.isFinite(Number(input.confidence)) ? Math.max(0, Math.min(1, Number(input.confidence))) : 1,
      createdAt: new Date().toISOString()
    };
    items.push(item);
    await save(items);
    return item;
  });
}

export async function deriveContexts(input = {}) {
  const sourceText = String(input.text || '').slice(0, 20000);
  if (!sourceText.trim()) throw Object.assign(new Error('text gerekli.'), { status: 400 });
  const sentences = sourceText.split(/(?<=[.!?\n])\s+/u).map((part) => part.trim()).filter(Boolean);
  const cues = [
    { pattern: /(?:tercih\w*|önceliğim|önceliğimiz|prefer\w*|preference\w*)/iu, tag: 'preference', kind: 'preference' },
    { pattern: /(?:karar\s+ver\w*|kararımız|decision\w*|decided)/iu, tag: 'decision', kind: 'decision' },
    { pattern: /(?:proje\w*|görev\w*|yapılacak\w*|task\w*|project\w*)/iu, tag: 'project', kind: 'task' },
    { pattern: /(?:hatırla\w*|unutma\w*|remember\w*|do\s+not\s+forget)/iu, tag: 'remember', kind: 'note' }
  ];
  const candidates = [];
  for (const sentence of sentences) {
    if (SECRET_PATTERNS.some((pattern) => pattern.test(sentence))) continue;
    const cue = cues.find((item) => item.pattern.test(sentence));
    if (!cue || sentence.length < 12) continue;
    candidates.push({ text: sentence.slice(0, MAX_TEXT), tags: [cue.tag], kind: cue.kind, source: String(input.source || 'auto-derived'), confidence: 0.65 });
    if (candidates.length >= 20) break;
  }
  const contexts = [];
  for (const candidate of candidates) contexts.push(await createContext(candidate));
  return {
    scannedSentences: sentences.length,
    candidates: candidates.length,
    created: contexts.filter((item) => !item.deduplicated).length,
    contexts
  };
}

export async function searchContexts(query = '', limit = 10) {
  const items = await load();
  const needle = normalize(query.trim());
  const matches = needle
    ? items.filter((item) => normalize(`${item.text} ${(item.tags || []).join(' ')} ${item.kind || ''} ${item.source || ''}`).includes(needle))
    : items;
  return matches.slice(-Math.min(Math.max(Number(limit) || 10, 1), 50)).reverse();
}

export async function contextHealth() {
  let count = 0;
  try {
    count = (await load()).length;
  } catch {
    return { ok: false, count: 0, backend: 'json-file', durable: false, maxItems: MAX_ITEMS };
  }
  return {
    ok: process.env.VERCEL !== '1',
    count,
    backend: 'json-file',
    durable: false,
    deploymentReady: process.env.VERCEL !== '1',
    maxItems: MAX_ITEMS
  };
}
