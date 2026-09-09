import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = process.env.DATA_DIR || './data';
const KNOWLEDGE_FILE = process.env.KNOWLEDGE_FILE || join(DATA_DIR, 'knowledge.json');
const MAX_RECORDS = 200;
const MAX_FACT_CHARS = 3000;
const MAX_EVIDENCE_CHARS = 1200;
const MAX_TAGS = 10;
const MAX_SOURCES = 5;
const MAX_RELEVANT = 6;

function emptyState() {
  return { version: 1, records: [], metrics: { created: 0, merged: 0 }, updatedAt: new Date().toISOString() };
}

function normalize(state) {
  const base = emptyState();
  return {
    ...base,
    ...state,
    version: 1,
    records: Array.isArray(state?.records) ? state.records.slice(-MAX_RECORDS) : [],
    metrics: { ...base.metrics, ...(state?.metrics || {}) }
  };
}

function cleanText(value, max) { return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max); }
function normalizeFact(value) { return cleanText(value, MAX_FACT_CHARS).toLowerCase(); }
function tokens(value) { return [...new Set(String(value || '').toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g) || [])]; }

async function load() {
  try { return normalize(JSON.parse(await readFile(KNOWLEDGE_FILE, 'utf8'))); }
  catch (error) { if (error?.code !== 'ENOENT') console.error('knowledge:load', error?.message || error); return emptyState(); }
}

async function save(state) {
  const next = normalize({ ...state, updatedAt: new Date().toISOString() });
  await mkdir(DATA_DIR, { recursive: true });
  const temp = `${KNOWLEDGE_FILE}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(next, null, 2), 'utf8');
  await rename(temp, KNOWLEDGE_FILE);
  return next;
}

export async function loadKnowledgeState() { return load(); }
export async function knowledgeSnapshot() { const state = await load(); return { version: state.version, records: state.records.slice(-20), metrics: state.metrics, updatedAt: state.updatedAt }; }

export async function recordKnowledge({ fact, sourceUrl, sourceTitle = '', evidence = '', tags = [] } = {}) {
  const cleanFact = cleanText(fact, MAX_FACT_CHARS);
  const cleanUrl = cleanText(sourceUrl, 2000);
  if (!cleanFact) throw new Error('Knowledge fact is required.');
  let url;
  try { url = new URL(cleanUrl); } catch { throw new Error('A valid source URL is required.'); }
  if (url.protocol !== 'https:') throw new Error('Knowledge sources must use HTTPS.');
  const cleanEvidence = cleanText(evidence, MAX_EVIDENCE_CHARS);
  if (!cleanEvidence) throw new Error('Evidence is required.');
  const cleanTags = [...new Set((Array.isArray(tags) ? tags : []).map((tag) => cleanText(tag, 80)).filter(Boolean))].slice(0, MAX_TAGS);
  const state = await load();
  const key = normalizeFact(cleanFact);
  const existing = state.records.find((record) => normalizeFact(record.fact) === key);
  const source = { url: url.toString(), title: cleanText(sourceTitle, 300), evidence: cleanEvidence, addedAt: new Date().toISOString() };
  if (existing) {
    if (!existing.sources.some((item) => item.url === source.url) && existing.sources.length < MAX_SOURCES) existing.sources.push(source);
    existing.tags = [...new Set([...(existing.tags || []), ...cleanTags])].slice(0, MAX_TAGS);
    existing.confidence = Math.min(0.95, 0.5 + Math.max(0, existing.sources.length - 1) * 0.2);
    existing.updatedAt = new Date().toISOString();
    state.metrics.merged += 1;
    await save(state);
    return existing;
  }
  const record = { id: randomUUID(), fact: cleanFact, tags: cleanTags, confidence: 0.5, sources: [source], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  state.records.push(record);
  state.metrics.created += 1;
  await save(state);
  return record;
}

export function recallKnowledge(state, query = '', limit = MAX_RELEVANT) {
  const wanted = tokens(query);
  const records = Array.isArray(state?.records) ? state.records : [];
  return records.map((record, index) => {
    const haystack = `${record.fact} ${(record.tags || []).join(' ')}`.toLowerCase();
    const score = wanted.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0);
    return { record, score, index };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || (b.record.confidence || 0) - (a.record.confidence || 0) || b.index - a.index).slice(0, Math.max(0, Math.min(MAX_RELEVANT, Number(limit) || MAX_RELEVANT))).map((item) => item.record);
}
