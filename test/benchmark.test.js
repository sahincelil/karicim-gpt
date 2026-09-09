import test from 'node:test';
import assert from 'node:assert/strict';
import { runAutonomyBenchmark } from '../lib/benchmark.js';

test('autonomy benchmark passes a valid state', () => {
  const state = {
    goals: [],
    attempts: [{ success: true, status: 'succeeded', durationMs: 3 }],
    lessons: [],
    metrics: { cycles: 1, successes: 1, failures: 0 },
    strategies: { 'health:baseline': { trials: 1, successes: 1, rate: 1 } }
  };
  const result = runAutonomyBenchmark(state);
  assert.equal(result.score, 1);
  assert.equal(result.passed, result.total);
});

test('autonomy benchmark catches inconsistent metrics', () => {
  const state = {
    goals: [], attempts: [], lessons: [],
    metrics: { cycles: 2, successes: 1, failures: 0 },
    strategies: {}
  };
  const result = runAutonomyBenchmark(state);
  assert.ok(result.score < 1);
  assert.equal(result.results.find((item) => item.id === 'metrics-consistency').passed, false);
});

test('autonomy benchmark requires lessons for recorded failures', () => {
  const state = {
    goals: [],
    attempts: [{ success: false, status: 'failed', durationMs: 4, lesson: 'retry with recovery' }],
    lessons: [],
    metrics: { cycles: 1, successes: 0, failures: 1 },
    strategies: { 'regression:baseline': { trials: 1, successes: 0, rate: 0 } }
  };
  const result = runAutonomyBenchmark(state);
  assert.equal(result.results.find((item) => item.id === 'lesson-persistence').passed, false);
});
