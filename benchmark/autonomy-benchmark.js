import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = await mkdtemp(join(tmpdir(), 'karicimgpt-benchmark-'));
process.env.DATA_DIR = dir;
process.env.AUTONOMY_FILE = join(dir, 'autonomy.json');

const autonomy = await import(`../lib/autonomy.js?benchmark=${Date.now()}`);
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
  assert.ok(snapshot.metrics.cycles >= 12);
  assert.ok(Object.keys(snapshot.strategies).length >= 1);
});

const total = checks.length;
const score = Math.round((passed / total) * 100);
const report = { benchmark: 'autonomy-core-v1', score, passed, total, checks, timestamp: new Date().toISOString() };
console.log(JSON.stringify(report, null, 2));
await rm(dir, { recursive: true, force: true });
if (score < 100) process.exitCode = 1;
