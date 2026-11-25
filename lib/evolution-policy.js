const ALLOWED_STATUSES = new Set(['draft', 'tested', 'approved', 'rejected']);
const ALLOWED_ACTIONS = new Set(['documentation', 'test', 'refactor_proposal', 'bugfix_proposal']);

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function evaluateEvolutionProposal(input = {}) {
  const proposal = input && typeof input === 'object' ? input : {};
  const errors = [];
  if (!nonEmptyString(proposal.id)) errors.push('id-required');
  if (!nonEmptyString(proposal.summary)) errors.push('summary-required');
  if (!ALLOWED_ACTIONS.has(proposal.action)) errors.push('action-not-allowed');
  if (!Array.isArray(proposal.evidence) || proposal.evidence.length === 0 ||
      proposal.evidence.some((item) => !nonEmptyString(item))) errors.push('evidence-required');
  if (!Array.isArray(proposal.tests) || proposal.tests.length === 0 ||
      proposal.tests.some((item) => !nonEmptyString(item))) errors.push('tests-required');

  const testsPassed = proposal.testsPassed === true;
  const humanApproved = proposal.humanApproved === true;
  const requestedStatus = ALLOWED_STATUSES.has(proposal.status) ? proposal.status : 'draft';
  const valid = errors.length === 0;
  const eligibleForReview = valid && testsPassed && requestedStatus !== 'rejected';
  const eligibleForMerge = eligibleForReview && humanApproved && requestedStatus === 'approved';

  return {
    id: nonEmptyString(proposal.id) ? proposal.id.trim() : null,
    valid,
    errors,
    status: requestedStatus,
    eligibleForReview,
    eligibleForMerge,
    permissions: {
      sourceWrite: false,
      shellExecution: false,
      secretAccess: false,
      productionDeploy: false,
      rollback: false
    },
    requiredHumanActions: eligibleForMerge ? [] : [
      ...(!testsPassed ? ['run-and-pass-tests'] : []),
      ...(!humanApproved ? ['human-approval'] : []),
      ...(requestedStatus !== 'approved' ? ['mark-approved-after-review'] : [])
    ]
  };
}

export function summarizeEvolutionRun(results = []) {
  const items = Array.isArray(results) ? results : [];
  const valid = items.filter((item) => item && item.valid === true).length;
  const reviewable = items.filter((item) => item && item.eligibleForReview === true).length;
  const mergeable = items.filter((item) => item && item.eligibleForMerge === true).length;
  return {
    total: items.length,
    valid,
    reviewable,
    mergeable,
    rejectedOrIncomplete: items.length - valid
  };
}
