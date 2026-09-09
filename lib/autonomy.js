import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = process.env.DATA_DIR || './data';
const STATE_FILE = process.env.AUTONOMY_FILE || join(DATA_DIR, 'autonomy.json');
const MAX_GOALS = 50;
const MAX_ATTEMPTS = 100;
const MAX_LESSONS = 100;

const TASKS = [
  { id: 'health', label: 'Runtime health', success: 'health endpoint responds' },
  { id: 'regression', label: 'Regression checks', success: 'npm test passes' },
  { id: 'memory-maintenance', label: 'Memory maintenance', success: 'memory store remains valid' }
];

function emptyState() {
  return {
    version: 1,
    cycle: 0,
    goals: [],
    attempts: [],
    lessons: [],
    strategies: {},
    updatedAt: new Date().toISOString()
  };
}

function normalize(state) {
  const base = emptyState();
  return {
    ...base,
    ...state,
    goals: Array.isArray(state?.goals) ? state.goals.slice(-MAX_GOALS) : [],
    attempts: Array.isArray(state?.attempts) ? state.attempts.slice(-MAX_ATTEMPTS) : [],
    lessons: Array.isArray(state?.lessons) ? state.lessons.slice(-MAX_LESSONS) : [],
    strategies: state?.strategies && typeof state.strategies === 'object' ? state.strategies : {}
  };
}

export async function loadAutonomyState() {
  try {
    return normalize(JSON.parse(await readFile(STATE_FILE, 'utf8')));
  } catch (error) {
    if (error?.code !== 'ENOENT') console.error('autonomy:load', error?.message || error);
    return emptyState();
  }
}

export async function saveAutonomyState(state) {
  const next = normalize({ ...state, updatedAt: new Date().toISOString() });
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

export async function registerGoal(text, priority = 1) {
  const clean = String(text || '').trim().slice(0, 1000);
  if (!clean) throw new Error('Goal text is required');
  const state = await loadAutonomyState();
  state.goals.push({ id: randomUUID(), text: clean, priority: Number.isFinite(priority) ? priority : 1, status: 'open', createdAt: new Date().toISOString() });
  return saveAutonomyState(state);
}

export async function evaluateAttempt(attempt, success) {
  const state = await loadAutonomyState();
  const normalizedSuccess = Boolean(success);
  const record = { ...attempt, success: normalizedSuccess, evaluatedAt: new Date().toISOString() };
  state.attempts.push(record);
  const key = attempt.strategy || 'default';
  const current = state.strategies[key] || { trials: 0, successes: 0 };
  current.trials += 1;
  if (normalizedSuccess) current.successes += 1;
  current.rate = current.successes / current.trials;
  state.strategies[key] = current;
  if (!normalizedSuccess && attempt.lesson) {
    state.lessons.push({ id: randomUUID(), text: String(attempt.lesson).slice(0, 2000), source: attempt.task || 'unknown', createdAt: new Date().toISOString() });
  }
  return saveAutonomyState(state);
}

export async function runAutonomyCycle(callbacks = {}) {
  const state = await loadAutonomyState();
  state.cycle += 1;
  const openGoals = state.goals.filter((goal) => goal.status === 'open');
  const goal = [...openGoals].sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
  const task = goal ? TASKS.find((item) => goal.text.toLowerCase().includes(item.id)) || TASKS[state.cycle % TASKS.length] : TASKS[state.cycle % TASKS.length];
  const strategy = Object.entries(state.strategies).sort((a, b) => (b[1].rate || 0) - (a[1].rate || 0))[0]?.[0] || task.id;
  let success = false;
  let lesson = '';
  try {
    if (typeof callbacks[task.id] === 'function') success = Boolean(await callbacks[task.id]({ goal, task, strategy, state }));
    else success = true;
    if (!success) lesson = `Strategy '${strategy}' did not complete ${task.label}; choose a different strategy next cycle.`;
  } catch (error) {
    lesson = `${task.label} failed: ${error?.message || 'unknown error'}`.slice(0, 2000);
  }
  const attempt = { id: randomUUID(), cycle: state.cycle, goalId: goal?.id || null, task: task.id, strategy, lesson, createdAt: new Date().toISOString() };
  state.attempts.push({ ...attempt, success, evaluatedAt: new Date().toISOString() });
  const stats = state.strategies[strategy] || { trials: 0, successes: 0 };
  stats.trials += 1;
  if (success) stats.successes += 1;
  stats.rate = stats.successes / stats.trials;
  state.strategies[strategy] = stats;
  if (!success && lesson) state.lessons.push({ id: randomUUID(), text: lesson, source: task.id, createdAt: new Date().toISOString() });
  if (goal && success && task.id === goal.text.toLowerCase()) goal.status = 'completed';
  await saveAutonomyState(state);
  return { cycle: state.cycle, goal, task, strategy, success, lesson, stats, lessonCount: state.lessons.length };
}

export async function autonomyHealth() {
  const state = await loadAutonomyState();
  return { ok: true, cycle: state.cycle, goals: state.goals.length, attempts: state.attempts.length, lessons: state.lessons.length, strategies: Object.keys(state.strategies).length, backend: 'file' };
}
