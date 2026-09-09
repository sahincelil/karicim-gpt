const CASES = Object.freeze([
  { id: 'state-shape', run: (state) => state && Array.isArray(state.goals) && Array.isArray(state.attempts) && Array.isArray(state.lessons) },
  { id: 'metrics-consistency', run: (state) => (state.metrics?.successes || 0) + (state.metrics?.failures || 0) === (state.metrics?.cycles || 0) },
  { id: 'strategy-accounting', run: (state) => Object.values(state.strategies || {}).every((item) => item.trials >= item.successes && item.rate === (item.trials ? item.successes / item.trials : 0)) },
  { id: 'attempt-integrity', run: (state) => state.attempts.every((item) => typeof item.success === 'boolean' && typeof item.status === 'string' && typeof item.durationMs === 'number') },
  { id: 'lesson-persistence', run: (state) => state.attempts.some((item) => !item.success && typeof item.lesson === 'string' && item.lesson.length > 0) ? state.lessons.length > 0 : true },
  { id: 'bounded-history', run: (state) => state.goals.length <= 50 && state.attempts.length <= 200 && state.lessons.length <= 100 }
]);

export function runAutonomyBenchmark(state) {
  const results = CASES.map((item) => ({ id: item.id, passed: Boolean(item.run(state)) }));
  const passed = results.filter((item) => item.passed).length;
  return { score: passed / results.length, passed, total: results.length, results };
}
