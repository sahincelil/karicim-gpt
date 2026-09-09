import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = await mkdtemp(join(tmpdir(), 'karicim-cognitive-'));
process.env.DATA_DIR = dir;
process.env.COGNITIVE_FILE = join(dir, 'cognitive.json');
const { buildPlan, loadCognitiveState, recordObservation, recallObservations, reflectOnAttempt, registerPlan } = await import('../lib/cognitive.js');

test('buildPlan is bounded and creates an observe-reflect loop', () => {
  const plan = buildPlan('improve autonomous learning', 'regression');
  assert.equal(plan.status, 'active');
  assert.ok(plan.steps.length <= 8);
  assert.ok(plan.steps.some((step) => step.description.includes('Observe')));
  assert.ok(plan.steps.some((step) => step.description.includes('Reflect')));
});

test('world observations persist, merge, and remain recallable', async () => {
  await recordObservation({ entity: 'KaricimGPT', attribute: 'runtime', value: 'bounded autonomous agent', sourceUrl: 'https://example.com/a', evidence: 'public architecture evidence', confidence: 0.6, tags: ['agent'] });
  const merged = await recordObservation({ entity: 'KaricimGPT', attribute: 'runtime', value: 'bounded autonomous learning agent', sourceUrl: 'https://example.com/b', evidence: 'independent public evidence', confidence: 0.9, tags: ['learning'] });
  assert.equal(merged.value, 'bounded autonomous learning agent');
  const state = await loadCognitiveState();
  assert.equal(state.observations.length, 1);
  assert.equal(recallObservations(state, 'KaricimGPT learning')[0].id, merged.id);
});

test('observation rejects non-HTTPS sources', async () => {
  await assert.rejects(() => recordObservation({ entity: 'x', attribute: 'y', value: 'z', sourceUrl: 'http://example.com', evidence: 'evidence' }), /HTTPS/);
});

test('reflection classifies timeout and provider failures', () => {
  assert.equal(reflectOnAttempt({ goal: 'x', success: false, error: 'request timeout' }).failureClass, 'timeout');
  assert.equal(reflectOnAttempt({ goal: 'x', success: false, error: 'provider:503' }).failureClass, 'provider');
  assert.equal(reflectOnAttempt({ goal: 'x', success: true }).failureClass, 'none');
});

test('plans persist without exceeding the bounded store', async () => {
  const plan = await registerPlan('maintain regression quality', 'tests');
  const state = await loadCognitiveState();
  assert.equal(state.metrics.plans, 1);
  assert.equal(state.plans[0].id, plan.id);
});

await rm(dir, { recursive: true, force: true });
