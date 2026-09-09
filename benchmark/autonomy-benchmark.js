import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = await mkdtemp(join(tmpdir(), 'karicimgpt-benchmark-'));
process.env.DATA_DIR = dir;
process.env.AUTONOMY_FILE = join(dir, 'autonomy.json');
process.env.IMPROVEMENT_FILE = join(dir, 'improvement-proposals.json');

const autonomy = await import(`../lib/autonomy.js?benchmark=${Date.now()}`);
const improvement = await import(`../lib/self-improvement.js?benchmark=${Date.now()}`);
let passed = 0;
const checks = [];

async function check(name, fn) {
  try { await fn(); passed += 1; checks.push({ name, ok: true }); }
  catch (error) { checks.push({ name, ok: false, error: error?.message || String(error) }); }
}

await check('goal completion requires real executor success', async () => {
  await autonomy.registerGoal('benchmark health', 10, 'health');
  const result = await autonomy.runAutonomyCycle({ health: async ({ strategy }) => strategy === 'baseline' });
  assert.equal(result.success, true);
  assert.equal(result.goal.status, 'completed');
});

await check('missing executor cannot become success', async () => {
  const result = await autonomy.runAutonomyCycle({});
  assert.equal(result.status, 'skipped');
  assert.equal(result.success, false);
});

await check('failure creates a persistent lesson', async () => {
  const result = await autonomy.runAutonomyCycle({ regression: async () => false });
  assert.equal(result.success, false);
  const raw = JSON.parse(await readFile(process.env.AUTONOMY_FILE, 'utf8'));
  assert.ok(raw.lessons.length >= 1);
});

await check('strategy selection learns from outcomes', async () => {
  await autonomy.registerGoal('strategy learning', 20, 'regression');
  const executor = async ({ strategy }) => strategy === 'baseline';
  const first = await autonomy.runAutonomyCycle({ regression: executor });
  const second = await autonomy.runAutonomyCycle({ regression: executor });
  const third = await autonomy.runAutonomyCycle({ regression: executor });
  const fourth = await autonomy.runAutonomyCycle({ regression: executor });
  assert.deepEqual([first.strategy, second.strategy, third.strategy], ['baseline', 'recovery', 'conservative']);
  assert.equal(fourth.strategy, 'baseline');
  assert.equal(fourth.success, true);
});

await check('learned lesson transfers to a novel goal', async () => {
  const state = await autonomy.loadAutonomyState();
  await autonomy.evaluateAttempt({ task: 'regression', strategy: 'baseline', strategyKey: 'regression:baseline', lesson: 'For regression recovery, prefer the baseline strategy before risky alternatives.' }, false);
  await autonomy.registerGoal('apply the learned baseline recovery lesson to a new maintenance task', 30, 'memory-maintenance', 'baseline recovery');
  const result = await autonomy.runAutonomyCycle({
    'memory-maintenance': async ({ lessons }) => lessons.some((lesson) => lesson.text.includes('baseline strategy'))
  });
  assert.equal(result.success, true);
  assert.ok(result.lessons.some((lesson) => lesson.text.includes('baseline strategy')));
});

await check('concurrent cycles serialize', async () => {
  const [a, b] = await Promise.all([
    autonomy.runAutonomyCycle({ health: async () => true }),
    autonomy.runAutonomyCycle({ health: async () => true })
  ]);
  assert.notEqual(a.cycle, b.cycle);
});

await check('state remains valid after repeated cycles', async () => {
  for (let i = 0; i < 8; i += 1) await autonomy.runAutonomyCycle({ 'memory-maintenance': async () => i % 2 === 0 });
  const snapshot = await autonomy.autonomySnapshot();
  assert.equal(snapshot.version, 2);
  assert.ok(snapshot.metrics.cycles >= 16);
  assert.ok(Object.keys(snapshot.strategies).length >= 1);
});

await check('benchmark result feeds the self-improvement gate', async () => {
  const baseline = 0.70;
  const candidate = 0.72;
  const proposal = await improvement.recordImprovementProposal({
    summary: 'autonomy benchmark candidate',
    baselineScore: baseline,
    candidateScore: candidate
  });
  assert.equal(proposal.decision, 'accept');
  assert.equal(proposal.delta, 0.02);
  const snapshot = await improvement.improvementSnapshot();
  assert.equal(snapshot.metrics.accepted, 1);
});

const total = checks.length;
const score = Math.round((passed / total) * 100);
const report = {
  benchmark: 'autonomy-core-v4-self-improvement-gated',
  score,
  passed,
  total,
  checks,
  improvementGate: { minimumDelta: 0.01, principle: 'only measurable improvements advance' },
  timestamp: new Date().toISOString()
};
console.log(JSON.stringify(report, null, 2));
await rm(dir, { recursive: true, force: true });
if (score < 100) process.exitCode = 1;
