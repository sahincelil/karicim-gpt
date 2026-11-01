import assert from 'node:assert/strict';
import { buildProposals } from '../lib/proposals.js';

const result = await buildProposals();
assert.equal(result.ok, true);
assert.ok(Array.isArray(result.proposals));

const byId = new Map(result.proposals.map((proposal) => [proposal.id, proposal]));
for (const id of [
  'authenticated-user-identity',
  'provider-spend-budget',
  'staging-security-evidence'
]) {
  assert.ok(byId.has(id), `missing required readiness proposal: ${id}`);
  assert.equal(byId.get(id).autoApply, false, `${id} must not auto-apply`);
  assert.ok(['critical', 'high'].includes(byId.get(id).priority));
}

assert.equal(result.policy.autonomousSourceWrite, false);
assert.equal(result.policy.autonomousDeploy, false);
assert.equal(result.policy.autonomousRollback, false);

console.log('Security readiness proposal tests passed.');
