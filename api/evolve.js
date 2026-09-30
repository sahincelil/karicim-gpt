import { securityHeaders } from '../lib/security.js';
import { buildAudit } from '../lib/audit.js';
import { buildProposals } from '../lib/proposals.js';
import { buildSelfTest } from '../lib/selftest.js';

function send(res, status, body) {
  securityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'Yalnızca GET destekleniyor.' });
  const [audit, proposals, selfTest] = await Promise.all([buildAudit(), buildProposals(), buildSelfTest()]);
  const blockers = [...new Set([...audit.warnings, ...selfTest.checks.filter((check) => !check.ok).map((check) => check.name)])];
  return send(res, 200, {
    ok: true,
    health: selfTest.ok && audit.ok && audit.status === 'healthy' ? 'ready' : 'attention',
    blockers,
    auditFingerprint: audit.fingerprint,
    selfTest: { ok: selfTest.ok, status: selfTest.status },
    proposalCount: proposals.proposals.length,
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
  });
}
