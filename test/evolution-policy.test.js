import assert from 'node:assert/strict';
import { evaluateEvolutionProposal, summarizeEvolutionRun } from '../lib/evolution-policy.js';
import { buildEvolvePayload } from '../api/evolve.js';

const base = {
  id: 'proposal-1',
  summary: 'Add regression coverage for the evolution endpoint',
  action: 'test',
  evidence: ['Existing self-test omits evolution-policy invariants'],
  tests: ['node test/evolution-policy.test.js'],
  testsPassed: true,
  humanApproved: false,
  status: 'tested'
};

const reviewable = evaluateEvolutionProposal(base);
assert.equal(reviewable.valid, true);
assert.equal(reviewable.eligibleForReview, true);
assert.equal(reviewable.eligibleForMerge, false);
assert.equal(reviewable.permissions.sourceWrite, false);
assert.equal(reviewable.permissions.productionDeploy, false);

const approved = evaluateEvolutionProposal({ ...base, status: 'approved', humanApproved: true });
assert.equal(approved.eligibleForMerge, true);

const untested = evaluateEvolutionProposal({ ...base, testsPassed: false });
assert.equal(untested.eligibleForReview, false);

const invalidAction = evaluateEvolutionProposal({ ...base, action: 'arbitrary_shell' });
assert.equal(invalidAction.valid, false);
assert.ok(invalidAction.errors.includes('action-not-allowed'));

const missingEvidence = evaluateEvolutionProposal({ ...base, evidence: [] });
assert.equal(missingEvidence.valid, false);

assert.deepEqual(summarizeEvolutionRun([reviewable, approved, untested]), {
  total: 3,
  valid: 3,
  reviewable: 2,
  mergeable: 1,
  rejectedOrIncomplete: 0
});

const evolvePayload = buildEvolvePayload({
  audit: { ok: true, status: 'healthy', fingerprint: 'audit-123', warnings: [] },
  proposals: {
    proposals: [{
      id: 'memory-durable-backend',
      priority: 'high',
      problem: 'File-backed memory may not persist in serverless runtime.',
      proposal: 'Add a durable storage backend.',
      test: 'Run storage round-trip and failure-fallback integration tests.',
      autoApply: false
    }]
  },
  selfTest: { ok: true, status: 'passed', checks: [] }
});
assert.equal(evolvePayload.ok, true);
assert.equal(evolvePayload.health, 'ready');
assert.equal(evolvePayload.proposalGate.summary.total, 1);
assert.equal(evolvePayload.proposalGate.summary.valid, 1);
assert.equal(evolvePayload.proposalGate.summary.reviewable, 0);
assert.equal(evolvePayload.proposalGate.summary.mergeable, 0);
assert.equal(evolvePayload.proposalGate.proposals[0].eligibleForReview, false);
assert.equal(evolvePayload.proposalGate.proposals[0].eligibleForMerge, false);
assert.ok(evolvePayload.proposalGate.proposals[0].requiredHumanActions.includes('run-and-pass-tests'));
assert.equal(evolvePayload.proposalGate.proposals[0].permissions.sourceWrite, false);
assert.equal(evolvePayload.automatic.deploy, false);

const attentionPayload = buildEvolvePayload({
  audit: { ok: true, status: 'attention', warnings: ['provider'] },
  proposals: { proposals: [] },
  selfTest: { ok: false, status: 'attention', checks: [{ name: 'provider', ok: false }] }
});
assert.equal(attentionPayload.ok, false);
assert.equal(attentionPayload.health, 'attention');
assert.ok(attentionPayload.blockers.includes('provider'));

const incompletePayload = buildEvolvePayload({
  audit: { ok: true, status: 'healthy', warnings: [] },
  proposals: { proposals: [{ id: 'missing-evidence', problem: 'No trace', test: 'Run a test' }] },
  selfTest: { ok: true, status: 'passed', checks: [] }
});
assert.equal(incompletePayload.proposalGate.proposals[0].valid, false);
assert.ok(incompletePayload.proposalGate.proposals[0].errors.includes('evidence-required'));

console.log('LEGION evolution policy and Evolve payload tests passed');
