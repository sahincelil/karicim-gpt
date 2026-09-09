import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = process.env.DATA_DIR || './data';
const PROPOSAL_FILE = process.env.IMPROVEMENT_FILE || join(DATA_DIR, 'improvement-proposals.json');
const MAX_PROPOSALS = 100;
const MAX_TEXT = 2000;
const MIN_IMPROVEMENT_DELTA = 0.01;

function emptyState() {
  return { version: 2, proposals: [], metrics: { generated: 0, accepted: 0, rejected: 0 }, updatedAt: new Date().toISOString() };
}
function clean(value, max = MAX_TEXT) { return String(value || '').trim().slice(0, max); }
function normalize(state) {
  const base = emptyState();
  return { ...base, ...state, version: 2, proposals: Array.isArray(state?.proposals) ? state.proposals.slice(-MAX_PROPOSALS) : [], metrics: { ...base.metrics, ...(state?.metrics || {}) } };
}
export async function loadImprovementState() {
  try { return normalize(JSON.parse(await readFile(PROPOSAL_FILE, 'utf8'))); }
  catch (error) { if (error?.code !== 'ENOENT') console.error('improvement:load', error?.message || error); return emptyState(); }
}
export async function saveImprovementState(state) {
  const next = normalize({ ...state, updatedAt: new Date().toISOString() });
  await mkdir(DATA_DIR, { recursive: true });
  const temp = `${PROPOSAL_FILE}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(next, null, 2), 'utf8');
  await rename(temp, PROPOSAL_FILE);
  return next;
}
function score(value) { const n = Number(value); return Number.isFinite(n) && n >= 0 && n <= 1 ? n : null; }
function classify(benchmark = {}) {
  const failures = Array.isArray(benchmark.failures) ? benchmark.failures : [];
  const text = `${benchmark.summary || ''} ${failures.map((item) => item?.name || item?.error || '').join(' ')}`.toLowerCase();
  if (/timeout|latency/.test(text)) return { area: 'reliability', action: 'Reduce bounded work per cycle and improve timeout-aware retry policy.' };
  if (/memory|recall|knowledge/.test(text)) return { area: 'memory', action: 'Improve relevance scoring, deduplication, and transfer tests for persistent memory.' };
  if (/plan|goal|strategy/.test(text)) return { area: 'planning', action: 'Improve goal decomposition and strategy selection using recorded outcomes.' };
  if (/tool|fetch|provider|api/.test(text)) return { area: 'tooling', action: 'Improve bounded tool routing, fallback selection, and failure classification.' };
  if (/test|assert|validation|regression/.test(text)) return { area: 'validation', action: 'Add a deterministic regression case for the observed failure before changing runtime behavior.' };
  return { area: 'general', action: 'Add a focused benchmark reproducer, then make the smallest reversible improvement.' };
}
export function proposeImprovement(benchmark = {}) {
  const diagnosis = classify(benchmark);
  const baseline = score(benchmark.baselineScore);
  const candidate = score(benchmark.candidateScore);
  const delta = baseline !== null && candidate !== null ? candidate - baseline : null;
  const measurable = delta !== null;
  return {
    id: randomUUID(), source: 'benchmark', area: diagnosis.area,
    trigger: clean(benchmark.summary || 'Benchmark exposed a weakness.', 1000),
    proposal: clean(diagnosis.action),
    baselineScore: baseline, candidateScore: candidate, delta,
    decision: measurable ? (delta >= MIN_IMPROVEMENT_DELTA ? 'accept' : 'reject') : 'hold',
    guardrail: 'Do not modify secrets, permissions, safety boundaries, or external systems automatically.',
    verification: `Require deterministic regression and benchmark; accept only if candidate score improves baseline by at least ${MIN_IMPROVEMENT_DELTA.toFixed(2)}.`,
    status: 'proposed', createdAt: new Date().toISOString()
  };
}
export async function recordImprovementProposal(benchmark) {
  const state = await loadImprovementState();
  const proposal = proposeImprovement(benchmark);
  state.proposals.push(proposal);
  state.metrics.generated += 1;
  if (proposal.decision === 'accept') state.metrics.accepted += 1;
  if (proposal.decision === 'reject') state.metrics.rejected += 1;
  await saveImprovementState(state);
  return proposal;
}
export async function improvementSnapshot() {
  const state = await loadImprovementState();
  return { version: state.version, recentProposals: state.proposals.slice(-10), metrics: state.metrics, updatedAt: state.updatedAt };
}
