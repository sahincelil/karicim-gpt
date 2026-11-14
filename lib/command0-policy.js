const RISK = new Set(['low', 'medium', 'high', 'critical']);

export function createPolicyEngine({ rules = [], ownerApprovalVerifier = () => false } = {}) {
  const normalized = rules.map((rule) => ({
    capability: String(rule.capability),
    actions: [...new Set((rule.actions || []).map(String))],
    resources: [...new Set((rule.resources || []).map(String))],
    maxRisk: rule.maxRisk || 'low'
  }));

  return Object.freeze({
    evaluate({ actor, action, resource, capability, riskLevel = 'medium', approvalReference = null } = {}) {
      if (!actor || !action || !resource || !capability || !RISK.has(riskLevel)) {
        return { allowed: false, reason: 'Malformed or incomplete policy request.' };
      }
      const rule = normalized.find((candidate) =>
        candidate.capability === capability &&
        candidate.actions.includes(action) &&
        candidate.resources.includes(resource)
      );
      if (!rule) return { allowed: false, reason: 'Default deny: no matching policy rule.' };

      const rank = { low: 0, medium: 1, high: 2, critical: 3 };
      if (rank[riskLevel] > rank[rule.maxRisk]) {
        if (!approvalReference || !ownerApprovalVerifier({ actor, approvalReference, action, resource, riskLevel })) {
          return { allowed: false, reason: 'Risk exceeds policy ceiling; verified owner approval required.' };
        }
      }
      if (['high', 'critical'].includes(riskLevel) && actor !== 'owner' &&
          (!approvalReference || !ownerApprovalVerifier({ actor, approvalReference, action, resource, riskLevel }))) {
        return { allowed: false, reason: 'High-risk operation requires verified owner approval.' };
      }
      return { allowed: true, reason: 'Matched explicit policy rule.', policy: rule.capability };
    }
  });
}
