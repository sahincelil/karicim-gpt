import assert from 'node:assert/strict';
import { evaluateEvolutionProposal, summarizeEvolutionRun } from '../lib/evolution-policy.js';

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

console.log('LEGION evolution policy tests passed');
