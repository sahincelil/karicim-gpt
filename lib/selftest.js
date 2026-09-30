import { buildAudit } from './audit.js';
import { buildProposals } from './proposals.js';
import { normalizeEvidence, normalizeSynthesis, parseSynthesis } from './council.js';

export async function buildSelfTest() {
  const checks = [];
  const run = (name, fn) => {
    try {
      fn();
      checks.push({ name, ok: true });
    } catch (error) {
      checks.push({ name, ok: false, error: error?.message || 'failed' });
    }
  };

  run('council-evidence-schema', () => {
    const value = normalizeEvidence({ claims: ['a'], uncertainty: ['b'] });
    if (value.claims.length !== 1 || value.uncertainty.length !== 1) throw new Error('invalid evidence schema');
  });
  run('council-structured-parse', () => {
    if (!parseSynthesis('{"agreements":["ok"]}').ok) throw new Error('valid JSON rejected');
    if (parseSynthesis('{broken').ok) throw new Error('invalid JSON accepted');
  });
  run('council-synthesis-schema', () => {
    const value = normalizeSynthesis({ agreements: ['a'], disagreements: [{ topic: 'b', providers: ['xai'] }], unknowns: ['c'], nextChecks: ['d'] });
    if (!value.agreements.length || !value.disagreements.length || !value.unknowns.length || !value.nextChecks.length) throw new Error('invalid synthesis schema');
  });

  const audit = await buildAudit();
  const proposals = await buildProposals();
  checks.push({ name: 'audit', ok: audit.ok === true && typeof audit.fingerprint === 'string' });
  checks.push({ name: 'proposal-engine', ok: proposals.ok === true && Array.isArray(proposals.proposals) });

  run('autonomy-policy', () => {
    const auditPolicy = audit.policy || {};
    const proposalPolicy = proposals.policy || {};
    if (auditPolicy.autoSourceModification !== false ||
        auditPolicy.autoDeploy !== false ||
        auditPolicy.autoRollback !== false ||
        auditPolicy.destructiveActions !== false) {
      throw new Error('audit autonomy guardrail drift');
    }
    if (proposalPolicy.autonomousSourceWrite !== false ||
        proposalPolicy.autonomousDeploy !== false ||
        proposalPolicy.autonomousRollback !== false) {
      throw new Error('proposal autonomy guardrail drift');
    }
    if (proposals.proposals.some((proposal) => proposal.autoApply !== false)) {
      throw new Error('proposal auto-apply drift');
    }
  });

  const failed = checks.filter((check) => !check.ok);
  return {
    ok: failed.length === 0,
    status: failed.length === 0 ? 'passed' : 'attention',
    generatedAt: new Date().toISOString(),
    checks,
    audit: { status: audit.status, fingerprint: audit.fingerprint, warnings: audit.warnings },
    proposals: proposals.proposals.map(({ id, priority, autoApply }) => ({ id, priority, autoApply })),
    policy: {
      automaticDecision: false,
      autonomousSourceWrite: false,
      autonomousDeploy: false,
      autonomousRollback: false,
      destructiveActions: false
    }
  };
}
