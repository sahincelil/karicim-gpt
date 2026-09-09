import test from 'node:test';
import assert from 'node:assert/strict';
import { proposeImprovement } from '../lib/self-improvement.js';

test('improvement proposal classifies memory weakness', () => {
  const proposal = proposeImprovement({ summary: 'memory recall regression', failures: [{ name: 'recall' }] });
  assert.equal(proposal.area, 'memory');
  assert.match(proposal.verification, /benchmark/i);
  assert.equal(proposal.status, 'proposed');
});

test('improvement proposal preserves safety boundary', () => {
  const proposal = proposeImprovement({ summary: 'provider timeout' });
  assert.equal(proposal.area, 'reliability');
  assert.match(proposal.guardrail, /secrets/i);
  assert.match(proposal.guardrail, /external systems/i);
});
