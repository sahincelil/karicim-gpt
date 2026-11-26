import { securityHeaders } from '../lib/security.js';
import { buildAudit } from '../lib/audit.js';
import { buildProposals } from '../lib/proposals.js';
import { buildSelfTest } from '../lib/selftest.js';
import { evaluateEvolutionProposal, summarizeEvolutionRun } from '../lib/evolution-policy.js';

function send(res, status, body) {
  securityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

export function buildEvolvePayload({ audit, proposals, selfTest }) {
  const proposalItems = Array.isArray(proposals?.proposals) ? proposals.proposals : [];
  const blockers = [
    ...new Set([
      ...(Array.isArray(audit?.warnings) ? audit.warnings : []),
      ...(Array.isArray(selfTest?.checks)
        ? selfTest.checks.filter((check) => !check.ok).map((check) => check.name)
        : [])
    ])
  ];

  const evaluatedProposals = proposalItems.map((proposal) => {
    const evidence = Array.isArray(proposal.evidence)
      ? proposal.evidence
      : audit?.fingerprint
        ? [`audit-fingerprint:${audit.fingerprint}`]
        : [];
    const tests = Array.isArray(proposal.tests)
      ? proposal.tests
      : typeof proposal.test === 'string' && proposal.test.trim()
        ? [proposal.test]
        : [];
    const summary = [proposal.problem, proposal.proposal]
      .filter((part) => typeof part === 'string' && part.trim())
      .join(' ');

    return {
      ...evaluateEvolutionProposal({
        id: proposal.id,
        summary: proposal.summary || summary,
        action: proposal.action || 'refactor_proposal',
        evidence,
        tests,
        // A test plan is not a test result. The generator does not execute proposal-specific tests.
        testsPassed: proposal.testsPassed === true,
        // Approval is deliberately not inferred from model or workflow output.
        humanApproved: false,
        status: 'draft'
      }),
      priority: proposal.priority || 'normal'
    };
  });

  const health = selfTest?.ok && audit?.ok && audit?.status === 'healthy' ? 'ready' : 'attention';
  return {
    ok: health === 'ready',
    health,
    blockers,
    auditFingerprint: audit?.fingerprint || null,
    selfTest: { ok: selfTest?.ok === true, status: selfTest?.status || 'unknown' },
    proposalCount: proposalItems.length,
    proposalGate: {
      summary: summarizeEvolutionRun(evaluatedProposals),
      proposals: evaluatedProposals
    },
    component: 'evolve',
    mode: 'controlled',
    pipeline: ['observe', 'analyze', 'propose', 'test', 'review', 'coordinate', 'deploy', 'verify', 'rollback'],
    automatic: {
      observe: true,
      analyze: true,
      test: true,
      verify: true,
      deploy: false,
      rollback: false
    },
    guardrails: {
      arbitraryShell: false,
      secretDisclosure: false,
      unrestrictedWrites: false,
      destructiveActions: false
    },
    timestamp: new Date().toISOString()
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'Yalnızca GET destekleniyor.' });
  const [audit, proposals, selfTest] = await Promise.all([buildAudit(), buildProposals(), buildSelfTest()]);
  return send(res, 200, buildEvolvePayload({ audit, proposals, selfTest }));
}
