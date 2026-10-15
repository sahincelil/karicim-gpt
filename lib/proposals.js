import { buildAudit } from './audit.js';

const MAX_PROPOSALS = 12;

// These controls require implementation and deployment evidence. Environment
// flags alone are deliberately not treated as proof that a control is active.
const SECURITY_READINESS_PROPOSALS = [
  {
    id: 'authenticated-user-identity',
    priority: 'critical',
    problem: 'API rotalarında doğrulanmış son kullanıcı kimliği ve kullanıcı bazlı yetkilendirme kanıtı yok.',
    proposal: 'Model ve bellek rotalarına sunucu tarafında doğrulanan kimlik ekle; her istekte kaynak sahipliğini kontrol et.',
    test: 'Kimliksiz istekler reddedilmeli; kullanıcı A, kullanıcı B verisini okuyamamalı veya değiştirememeli.',
    autoApply: false
  },
  {
    id: 'provider-spend-budget',
    priority: 'critical',
    problem: 'IP hız sınırları sağlayıcı harcama bütçesi veya kullanıcı bazlı kota değildir.',
    proposal: 'Sağlayıcı çağrısından önce atomik kullanıcı/uygulama kotası ve parasal harcama tavanı uygula; kota deposu erişilemezse üretimde güvenli biçimde reddet.',
    test: 'Limit aşımı sağlayıcı çağrısını engellemeli; eşzamanlı istekler kotayı aşmamalı; ret ve bütçe tükenmesi kayıt altına alınmalı.',
    autoApply: false
  },
  {
    id: 'staging-security-evidence',
    priority: 'high',
    problem: 'Başarılı CI, canlı PostgreSQL kalıcılığını veya güvenilir gateway yapılandırmasını kanıtlamaz.',
    proposal: 'Üretim dışı ortamda gateway başlıklarının sunucuda enjekte edildiğini, sahte X-Forwarded-For değerlerinin silindiğini, bellek kalıcılığını ve geri yüklemeyi doğrula.',
    test: 'Dağıtım öncesi otomatik kabul testleri gerçek staging ortamında geçmeli; kanıt yoksa üretim dağıtımı kapalı kalmalı.',
    autoApply: false
  }
];

export async function buildProposals() {
  const audit = await buildAudit();
  const proposals = [...SECURITY_READINESS_PROPOSALS];

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

  if (proposals.length === SECURITY_READINESS_PROPOSALS.length) {
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
