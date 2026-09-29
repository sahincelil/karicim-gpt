import { buildAudit } from './audit.js';

const MAX_PROPOSALS = 12;

export async function buildProposals() {
  const audit = await buildAudit();
  const proposals = [];

  if (audit.warnings.includes('persistent-memory-config')) {
    proposals.push({
      id: 'memory-durable-backend',
      priority: 'high',
      problem: 'Serverless ortamda dosya tabanlı memory kalıcı olmayabilir.',
      proposal: 'Harici durable storage için yapılandırılabilir backend ekle.',
      test: 'Backend health, read/write round-trip ve failure fallback testleri.',
      autoApply: false
    });
  }

  if (audit.warnings.includes('bridge')) {
    proposals.push({
      id: 'bridge-secret',
      priority: 'high',
      problem: 'Bridge ortak sırrı yapılandırılmamış.',
      proposal: 'BRIDGE_SHARED_SECRET secretını deployment ortamında tanımla.',
      test: 'İmzalı health isteği ve replay rejection integration testleri.',
      autoApply: false
    });
  }

  if (!proposals.length) {
    proposals.push({
      id: 'baseline-regression-suite',
      priority: 'low',
      problem: 'Mevcut runtime için sürekli regression kapsamı artırılabilir.',
      proposal: 'Yeni endpoint ve güvenlik sınırları için test kapsamını genişlet.',
      test: 'npm test ve integration suite.',
      autoApply: false
    });
  }

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    auditFingerprint: audit.fingerprint,
    proposals: proposals.slice(0, MAX_PROPOSALS),
    policy: {
      autonomousAnalysis: true,
      autonomousProposal: true,
      autonomousSourceWrite: false,
      autonomousDeploy: false,
      autonomousRollback: false
    }
  };
}
