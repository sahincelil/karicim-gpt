import assert from 'node:assert/strict';
import { buildImprovementPlan } from '../lib/improvement-loop.js';

const plan = buildImprovementPlan({
  audit: { warnings: ['persistent-memory-config'] },
  selfTest: { checks: [{ name: 'agent-auth', ok: false }, { name: 'healthy', ok: true }] },
  proposals: { proposals: [{ id: 'durable-store', priority: 'high', problem: 'Persistent store is missing', test: 'Test read/write round-trip' }] }
});

assert.equal(plan.ok, true);
assert.equal(plan.status, 'attention');
assert.ok(plan.steps.length <= 8);
assert.equal(plan.steps[0].source, 'self-test');
assert.ok(plan.steps.some((step) => step.source === 'audit'));
assert.ok(plan.steps.some((step) => step.source === 'proposal'));
assert.equal(plan.policy.autonomousSourceWrite, false);
assert.equal(plan.policy.autonomousDeploy, false);
assert.equal(plan.policy.autonomousRollback, false);
assert.equal(plan.policy.arbitraryShell, false);
assert.equal(plan.policy.secretDisclosure, false);

const baseline = buildImprovementPlan();
assert.equal(baseline.status, 'planned');
assert.equal(baseline.steps[0].id, 'expand-regression-benchmarks');
assert.equal(buildImprovementPlan().fingerprint, baseline.fingerprint);

const bounded = buildImprovementPlan({
  proposals: { proposals: Array.from({ length: 30 }, (_, i) => ({ id: `p-${i}`, priority: 'low' })) }
});
assert.equal(bounded.steps.length, 8);
console.log('improvement-loop tests passed');
