import { buildAudit } from './audit.js';
import { buildProposals } from './proposals.js';
import { buildSelfTest } from './selftest.js';

export async function buildMaintenanceReport() {
  const [selfTest, audit, proposals] = await Promise.all([
    buildSelfTest(),
    buildAudit(),
    buildProposals()
  ]);
  const healthy = selfTest.ok && audit.ok && audit.status === 'healthy' && proposals.ok;
  return {
    ok: healthy,
    status: healthy ? 'healthy' : 'attention',
    generatedAt: new Date().toISOString(),
    selfTest: {
      ok: selfTest.ok,
      status: selfTest.status,
      failedChecks: selfTest.checks.filter((check) => !check.ok).map((check) => check.name)
    },
    audit: {
      status: audit.status,
      fingerprint: audit.fingerprint,
      warnings: audit.warnings
    },
    proposals: proposals.proposals.map(({ id, priority, problem, proposal, autoApply }) => ({
      id, priority, problem, proposal, autoApply
    })),
    policy: {
      autonomousObservation: true,
      autonomousAnalysis: true,
      autonomousProposal: true,
      autonomousSourceWrite: false,
      autonomousDeploy: false,
      autonomousRollback: false,
      destructiveActions: false
    }
  };
}
