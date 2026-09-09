import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = process.env.DATA_DIR || './data';
const COGNITIVE_FILE = process.env.COGNITIVE_FILE || join(DATA_DIR, 'cognitive.json');
const MAX_PLANS = 100;
const MAX_OBSERVATIONS = 300;
const MAX_REFLECTIONS = 200;
const MAX_STEPS = 8;
const MAX_TEXT = 2000;
const MAX_RELEVANT_OBSERVATIONS = 6;

function emptyState() {
  return {
    version: 1,
    plans: [],
    observations: [],
    reflections: [],
    metrics: { plans: 0, completedPlans: 0, failedPlans: 0 },
    updatedAt: new Date().toISOString()
  };
}

function clean(value, max = MAX_TEXT) {
  return String(value || '').trim().slice(0, max);
}

function normalize(state) {
  const base = emptyState();
  return {
    ...base,
    ...state,
    version: 1,
    plans: Array.isArray(state?.plans) ? state.plans.slice(-MAX_PLANS) : [],
    observations: Array.isArray(state?.observations) ? state.observations.slice(-MAX_OBSERVATIONS) : [],
    reflections: Array.isArray(state?.reflections) ? state.reflections.slice(-MAX_REFLECTIONS) : [],
    metrics: { ...base.metrics, ...(state?.metrics || {}) }
  };
}

export async function loadCognitiveState() {
  try { return normalize(JSON.parse(await readFile(COGNITIVE_FILE, 'utf8'))); }
  catch (error) { if (error?.code !== 'ENOENT') console.error('cognitive:load', error?.message || error); return emptyState(); }
}

export async function saveCognitiveState(state) {
  const next = normalize({ ...state, updatedAt: new Date().toISOString() });
  await mkdir(DATA_DIR, { recursive: true });
  const temp = `${COGNITIVE_FILE}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(next, null, 2), 'utf8');
  await rename(temp, COGNITIVE_FILE);
  return next;
}

export function buildPlan(goal, task = null) {
  const text = clean(goal, 1000);
  if (!text) throw new Error('Goal text is required');
  const steps = [];
  if (task) steps.push(`Understand and validate ${clean(task, 300)}`);
  steps.push(`Gather relevant evidence for ${text}`);
  steps.push(`Execute the smallest bounded action that advances ${text}`);
  steps.push(`Observe the result and compare it with the success criteria`);
  steps.push(`Reflect on the result and select the next strategy`);
  return {
    id: randomUUID(), goal: text, status: 'active', steps: steps.slice(0, MAX_STEPS).map((description, index) => ({ id: index + 1, description, status: index === 0 ? 'ready' : 'pending' })),
    createdAt: new Date().toISOString()
  };
}

export async function registerPlan(goal, task = null) {
  const state = await loadCognitiveState();
  const plan = buildPlan(goal, task);
  state.plans.push(plan);
  state.metrics.plans += 1;
  await saveCognitiveState(state);
  return plan;
}

function tokens(query) { return [...new Set(clean(query, 1000).toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g) || [])]; }

export function recallObservations(state, query = '', limit = MAX_RELEVANT_OBSERVATIONS) {
  const wanted = tokens(query);
  const scored = (state?.observations || []).map((item, index) => {
    const haystack = `${item.entity || ''} ${item.attribute || ''} ${item.value || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
    const score = wanted.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0);
    return { item, score, index };
  }).filter((item) => item.score > 0);
  scored.sort((a, b) => b.score - a.score || b.index - a.index);
  return scored.slice(0, Math.min(MAX_RELEVANT_OBSERVATIONS, Math.max(0, Number(limit) || MAX_RELEVANT_OBSERVATIONS))).map((item) => item.item);
}

export async function recordObservation({ entity, attribute, value, sourceUrl, evidence, confidence = 0.5, tags = [] }) {
  const cleanEntity = clean(entity, 300); const cleanAttribute = clean(attribute, 300); const cleanValue = clean(value, 1200);
  const cleanEvidence = clean(evidence, 1200); const url = clean(sourceUrl, 1000);
  if (!cleanEntity || !cleanAttribute || !cleanValue) throw new Error('entity, attribute and value are required');
  if (!cleanEvidence) throw new Error('evidence is required');
  if (!/^https:\/\//i.test(url)) throw new Error('sourceUrl must be HTTPS');
  const state = await loadCognitiveState();
  const existing = state.observations.find((item) => item.entity === cleanEntity && item.attribute === cleanAttribute);
  if (existing) {
    existing.value = cleanValue; existing.evidence = cleanEvidence; existing.sourceUrl = url;
    existing.confidence = Math.max(0, Math.min(1, Number(confidence) || 0)); existing.updatedAt = new Date().toISOString();
    existing.tags = [...new Set([...(existing.tags || []), ...tags.map((tag) => clean(tag, 80)).filter(Boolean)])].slice(0, 10);
  } else {
    state.observations.push({ id: randomUUID(), entity: cleanEntity, attribute: cleanAttribute, value: cleanValue, sourceUrl: url, evidence: cleanEvidence, confidence: Math.max(0, Math.min(1, Number(confidence) || 0)), tags: [...new Set(tags.map((tag) => clean(tag, 80)).filter(Boolean))].slice(0, 10), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  await saveCognitiveState(state);
  return state.observations[state.observations.length - 1];
}

export function reflectOnAttempt({ goal = '', task = '', success = false, error = '', durationMs = 0, strategy = 'baseline' }) {
  const normalizedError = clean(error, 1000);
  let failureClass = 'none';
  if (!success) {
    const text = normalizedError.toLowerCase();
    if (/timeout|timed out|abort/.test(text)) failureClass = 'timeout';
    else if (/provider|api|429|5\d\d/.test(text)) failureClass = 'provider';
    else if (/tool|fetch|network/.test(text)) failureClass = 'tool';
    else if (/valid|schema|criteria|assert|test/.test(text)) failureClass = 'validation';
    else failureClass = 'unknown';
  }
  return {
    id: randomUUID(), goal: clean(goal, 800), task: clean(task, 300), strategy: clean(strategy, 100), success: Boolean(success), failureClass,
    diagnosis: success ? 'Outcome met the current success condition.' : `${failureClass} failure; preserve the evidence and try a bounded alternative strategy.`,
    nextAction: success ? 'Reuse the successful strategy when the context is similar.' : failureClass === 'timeout' ? 'Retry with a smaller bounded workload.' : failureClass === 'provider' ? 'Use a configured fallback provider or retry policy.' : 'Change one variable and re-evaluate.',
    durationMs: Math.max(0, Number(durationMs) || 0), createdAt: new Date().toISOString()
  };
}

export async function recordReflection(input) {
  const state = await loadCognitiveState();
  const reflection = reflectOnAttempt(input);
  state.reflections.push(reflection);
  if (reflection.success) state.metrics.completedPlans += 1; else state.metrics.failedPlans += 1;
  await saveCognitiveState(state);
  return reflection;
}

export async function cognitiveSnapshot() {
  const state = await loadCognitiveState();
  return { version: state.version, recentPlans: state.plans.slice(-10), recentObservations: state.observations.slice(-20), recentReflections: state.reflections.slice(-10), metrics: state.metrics, updatedAt: state.updatedAt };
}
