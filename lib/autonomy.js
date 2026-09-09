import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = process.env.DATA_DIR || './data';
const STATE_FILE = process.env.AUTONOMY_FILE || join(DATA_DIR, 'autonomy.json');
const MAX_GOALS = 50;
const MAX_ATTEMPTS = 200;
const MAX_LESSONS = 100;
const STRATEGIES = ['baseline', 'recovery', 'conservative'];
let cycleLock = null;

export const TASKS = Object.freeze([
  { id: 'health', label: 'Runtime health', success: 'health checks pass' },
  { id: 'regression', label: 'Regression checks', success: 'deterministic test suite passes' },
  { id: 'memory-maintenance', label: 'Memory maintenance', success: 'memory store remains valid' }
]);

function emptyState() {
  return { version: 2, cycle: 0, goals: [], attempts: [], lessons: [], strategies: {}, metrics: { cycles: 0, successes: 0, failures: 0 }, updatedAt: new Date().toISOString() };
}

function normalize(state) {
  const base = emptyState();
  const strategies = state?.strategies && typeof state.strategies === 'object' ? state.strategies : {};
  return { ...base, ...state, version: 2, goals: Array.isArray(state?.goals) ? state.goals.slice(-MAX_GOALS) : [], attempts: Array.isArray(state?.attempts) ? state.attempts.slice(-MAX_ATTEMPTS) : [], lessons: Array.isArray(state?.lessons) ? state.lessons.slice(-MAX_LESSONS) : [], strategies, metrics: { ...base.metrics, ...(state?.metrics || {}) } };
}

export async function loadAutonomyState() {
  try { return normalize(JSON.parse(await readFile(STATE_FILE, 'utf8'))); }
  catch (error) { if (error?.code !== 'ENOENT') console.error('autonomy:load', error?.message || error); return emptyState(); }
}

export async function saveAutonomyState(state) {
  const next = normalize({ ...state, updatedAt: new Date().toISOString() });
  await mkdir(DATA_DIR, { recursive: true });
  const temp = `${STATE_FILE}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(next, null, 2), 'utf8');
  await rename(temp, STATE_FILE);
  return next;
}

export async function registerGoal(text, priority = 1, taskId = null, criteria = '') {
  const clean = String(text || '').trim().slice(0, 1000);
  if (!clean) throw new Error('Goal text is required');
  const state = await loadAutonomyState();
  const validTask = TASKS.some((task) => task.id === taskId) ? taskId : null;
  state.goals.push({ id: randomUUID(), text: clean, priority: Number.isFinite(priority) ? priority : 1, taskId: validTask, criteria: String(criteria || '').slice(0, 1000), status: 'open', createdAt: new Date().toISOString() });
  return saveAutonomyState(state);
}

function selectGoal(state) { return [...state.goals.filter((goal) => goal.status === 'open')].sort((a, b) => (b.priority || 0) - (a.priority || 0) || String(a.createdAt).localeCompare(String(b.createdAt)))[0] || null; }
function selectTask(state, goal) {
  if (goal?.taskId) return TASKS.find((task) => task.id === goal.taskId) || TASKS[0];
  const match = goal?.text?.toLowerCase().match(/health|regression|memory-maintenance/);
  return (match && TASKS.find((task) => task.id === match[0])) || TASKS[(state.cycle - 1) % TASKS.length];
}
function selectStrategy(state, task) {
  const stats = STRATEGIES.map((name) => { const key = `${task.id}:${name}`; const item = state.strategies[key] || { trials: 0, successes: 0, rate: 0 }; return { name, key, ...item }; });
  const unexplored = stats.find((item) => item.trials === 0);
  if (unexplored) return unexplored;
  const exploration = state.cycle % 5 === 0 ? stats[Math.floor(state.cycle / 5) % stats.length] : null;
  return exploration || [...stats].sort((a, b) => (b.rate || 0) - (a.rate || 0) || a.trials - b.trials)[0];
}
function recordStrategy(state, key, success) {
  const current = state.strategies[key] || { trials: 0, successes: 0, rate: 0 };
  current.trials += 1; if (success) current.successes += 1; current.rate = current.successes / current.trials; state.strategies[key] = current; return current;
}

export async function evaluateAttempt(attempt, success) {
  const state = await loadAutonomyState();
  const normalizedSuccess = Boolean(success);
  state.attempts.push({ ...attempt, success: normalizedSuccess, evaluatedAt: new Date().toISOString() });
  recordStrategy(state, attempt.strategyKey || `${attempt.task || 'unknown'}:${attempt.strategy || 'baseline'}`, normalizedSuccess);
  if (!normalizedSuccess && attempt.lesson) state.lessons.push({ id: randomUUID(), text: String(attempt.lesson).slice(0, 2000), source: attempt.task || 'unknown', createdAt: new Date().toISOString() });
  state.metrics.cycles += 1; if (normalizedSuccess) state.metrics.successes += 1; else state.metrics.failures += 1;
  return saveAutonomyState(state);
}

async function cycleUnlocked(callbacks) {
  const state = await loadAutonomyState(); state.cycle += 1;
  const goal = selectGoal(state); const task = selectTask(state, goal); const selected = selectStrategy(state, task);
  let success = false; let lesson = ''; let status = 'failed'; const startedAt = Date.now();
  try {
    if (typeof callbacks[task.id] !== 'function') { status = 'skipped'; lesson = `No executor registered for ${task.id}; result is not counted as success.`; }
    else { success = Boolean(await callbacks[task.id]({ goal, task, strategy: selected.name, state })); status = success ? 'succeeded' : 'failed'; if (!success) lesson = `Strategy '${selected.name}' did not satisfy ${task.success}. Try another bounded strategy.`; }
  } catch (error) { lesson = `${task.label} failed: ${error?.message || 'unknown error'}`.slice(0, 2000); }
  const attempt = { id: randomUUID(), cycle: state.cycle, goalId: goal?.id || null, task: task.id, strategy: selected.name, strategyKey: selected.key, status, success, durationMs: Date.now() - startedAt, lesson, createdAt: new Date().toISOString() };
  state.attempts.push({ ...attempt, evaluatedAt: new Date().toISOString() }); recordStrategy(state, selected.key, success);
  state.metrics.cycles += 1; if (success) state.metrics.successes += 1; else state.metrics.failures += 1;
  if (!success && lesson) state.lessons.push({ id: randomUUID(), text: lesson, source: task.id, createdAt: new Date().toISOString() });
  if (goal && success && (!goal.taskId || goal.taskId === task.id)) { goal.status = 'completed'; goal.completedAt = new Date().toISOString(); }
  await saveAutonomyState(state);
  return { cycle: state.cycle, goal, task, strategy: selected.name, status, success, lesson, stats: state.strategies[selected.key], lessonCount: state.lessons.length, metrics: state.metrics };
}

export async function runAutonomyCycle(callbacks = {}) { if (cycleLock) return cycleLock; cycleLock = cycleUnlocked(callbacks).finally(() => { cycleLock = null; }); return cycleLock; }
export async function autonomySnapshot() { const state = await loadAutonomyState(); return { version: state.version, cycle: state.cycle, goals: state.goals, recentAttempts: state.attempts.slice(-10), recentLessons: state.lessons.slice(-10), strategies: state.strategies, metrics: state.metrics, updatedAt: state.updatedAt }; }
export async function autonomyHealth() { const state = await loadAutonomyState(); const attempts = state.attempts.length; return { ok: true, cycle: state.cycle, goals: state.goals.length, attempts, lessons: state.lessons.length, strategies: Object.keys(state.strategies).length, successRate: attempts ? (state.metrics.successes || 0) / attempts : 0, backend: 'file', version: state.version }; }
