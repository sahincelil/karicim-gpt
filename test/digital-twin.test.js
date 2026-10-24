import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const dir = await mkdtemp(path.join(os.tmpdir(), 'karicimgpt-digital-twin-'));
process.env.DIGITAL_TWIN_FILE = path.join(dir, 'digital-twin.json');

const { getDigitalTwin, updateDigitalTwinProfile, addDecisionExample, digitalTwinHealth } = await import('../lib/digital-twin.js');

try {
  const initial = await getDigitalTwin();
  assert.equal(initial.profile.schemaVersion, 1);
  assert.equal(initial.profile.profileVersion, 1);
  assert.equal(initial.examples.length, 0);
  assert.equal(initial.health.backend, 'file');

  const profile = await updateDigitalTwinProfile({
    goals: ['KaricimGPT digital twin'],
    decisionPrinciples: ['Analyze context', 'Update with evidence'],
    hypotheses: ['Prefers flexible strategies'],
    ignoredField: 'must not be stored'
  }, 'initial profile');
  assert.equal(profile.profileVersion, 2);
  assert.deepEqual(profile.goals, ['KaricimGPT digital twin']);
  assert.equal(Object.hasOwn(profile, 'ignoredField'), false);

  const example = await addDecisionExample({
    situation: 'A major opportunity has uncertainty',
    decision: 'Compare options and manage risk',
    reasoning: 'Use context and evidence',
    outcome: 'Pending',
    tags: ['decision', 'risk'],
    confidence: 'high'
  });
  assert.equal(typeof example.id, 'string');
  assert.equal(example.source, 'user-provided');
  assert.equal(example.confidence, 'high');

  await assert.rejects(() => addDecisionExample({ situation: 'Missing decision' }), /situation and decision are required/);
  await assert.rejects(() => updateDigitalTwinProfile([]), /profile object is required/);

  const snapshot = await getDigitalTwin();
  assert.equal(snapshot.profile.profileVersion, 2);
  assert.equal(snapshot.examples.length, 1);
  assert.equal(snapshot.revisions.length, 1);
  assert.equal(snapshot.revisions[0].fromVersion, 1);
  assert.equal(snapshot.revisions[0].toVersion, 2);

  const health = await digitalTwinHealth();
  assert.equal(health.ok, true);
  assert.equal(health.exampleCount, 1);

  const stored = JSON.parse(await readFile(process.env.DIGITAL_TWIN_FILE, 'utf8'));
  assert.equal(stored.examples[0].decision, 'Compare options and manage risk');
} finally {
  await rm(dir, { recursive: true, force: true });
}

console.log('Digital twin tests passed.');
