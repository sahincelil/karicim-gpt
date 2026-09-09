import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = await mkdtemp(join(tmpdir(), 'karicimgpt-autonomy-'));
process.env.DATA_DIR = dir;
process.env.AUTONOMY_FILE = join(dir, 'autonomy.json');
const autonomy = await import(`../lib/autonomy.js?test=${Date.now()}`);

test('records real success and learns per task strategy', async () => {
  await autonomy.registerGoal('health verification', 5, 'health');
  const result = await autonomy.runAutonomyCycle({ health: async ({ strategy }) => strategy === 'baseline' });
  assert.equal(result.success, true);
  assert.equal(result.status, 'succeeded');
  assert.equal(result.goal.status, 'completed');
  assert.equal(result.stats.trials, 1);
});

test('missing executor is skipped, never a false success', async () => {
  const result = await autonomy.runAutonomyCycle({});
  assert.equal(result.success, false);
  assert.equal(result.status, 'skipped');
  assert.match(result.lesson, /not counted as success/);
});

test('concurrent cycles serialize through one lock', async () => {
  const results = await Promise.all([
    autonomy.runAutonomyCycle({ health: async () => true, regression: async () => true, 'memory-maintenance': async () => true }),
    autonomy.runAutonomyCycle({ health: async () => true, regression: async () => true, 'memory-maintenance': async () => true })
  ]);
  assert.notEqual(results[0].cycle, results[1].cycle);
});

after(async () => { await rm(dir, { recursive: true, force: true }); });
