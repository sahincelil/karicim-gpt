import { createHash } from 'node:crypto';

const MAX_STEPS = 8;
const PRIORITY = { high: 0, medium: 1, low: 2 };
const SOURCE_PRIORITY = { 'self-test': 0, audit: 1, proposal: 2, baseline: 3 };

function safeText(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 240);
}

function priorityOf(value) {
  return Object.hasOwn(PRIORITY, value) ? value : 'medium';
}

/**
 * Build a deterministic, bounded self-improvement plan from existing diagnostics.
 * This module plans and evaluates only: it never writes source code, executes tools,
 * deploys, rolls back, or performs external side effects.
 */
export function buildImprovementPlan({ audit = {}, selfTest = {}, proposals = {} } = {}) {
  const steps = [];
  const failedChecks = Array.isArray(selfTest.checks)
    ? selfTest.checks.filter((check) => check && check.ok === false)
    : [];
  const warnings = Array.isArray(audit.warnings) ? audit.warnings : [];

  for (const check of failedChecks) {
    const name = safeText(check.name, 'unnamed-self-test');
    steps.push({
      id: `repair-test-${name}`,
      priority: 'high',
      source: 'self-test',
      objective: `Repair failing check: ${name}`,
      evidence: name,
      acceptanceCriteria: ['Add or update a regression test', 'All repository checks pass'],
      executionBoundary: 'isolated-branch-and-pull-request'
    });
  }

  for (const warning of warnings) {
    const name = safeText(warning, 'unnamed-audit-warning');
    steps.push({
      id: `resolve-audit-${name}`,
      priority: 'high',
      source: 'audit',
      objective: `Resolve required runtime warning: ${name}`,
      evidence: name,
      acceptanceCriteria: ['Verify the underlying configuration or implementation', 'Add a regression check'],
      executionBoundary: 'isolated-branch-and-pull-request'
    });
  }

  const candidates = Array.isArray(proposals.proposals) ? proposals.proposals : [];
  for (const proposal of candidates) {
    if (!proposal || typeof proposal !== 'object') continue;
    const id = safeText(proposal.id, '');
    if (!id) continue;
    steps.push({
      id: `proposal-${id}`,
      priority: priorityOf(proposal.priority),
      source: 'proposal',
      objective: safeText(proposal.problem || proposal.proposal, `Review proposal: ${id}`),
      evidence: id,
      acceptanceCriteria: [safeText(proposal.test, 'Add tests and verify the change')],
      executionBoundary: 'isolated-branch-and-pull-request'
    });
  }

  if (steps.length === 0) {
    steps.push({
      id: 'expand-regression-benchmarks',
      priority: 'low',
      source: 'baseline',
      objective: 'Expand regression benchmarks to detect quality and reliability regressions.',
      evidence: 'No failing self-tests or required audit warnings were reported.',
      acceptanceCriteria: ['Add representative benchmark cases', 'Record baseline results'],
      executionBoundary: 'isolated-branch-and-pull-request'
    });
  }

  const unique = [...new Map(steps.map((step) => [step.id, step])).values()]
    .sort((a, b) => PRIORITY[a.priority] - PRIORITY[b.priority] || SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source] || a.id.localeCompare(b.id))
    .slice(0, MAX_STEPS);

  const fingerprint = createHash('sha256')
    .update(JSON.stringify(unique))
    .digest('hex')
    .slice(0, 16);

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    status: failedChecks.length || warnings.length ? 'attention' : 'planned',
    fingerprint,
    steps: unique,
    policy: {
      autonomousObservation: true,
      autonomousAnalysis: true,
      autonomousPlanning: true,
      autonomousSourceWrite: false,
      arbitraryShell: false,
      secretDisclosure: false,
      autonomousDeploy: false,
      autonomousRollback: false,
      destructiveActions: false,
      maxSteps: MAX_STEPS,
      requiredPromotionPath: 'tests -> review -> pull-request -> explicit-deployment-authorization'
    }
  };
}
