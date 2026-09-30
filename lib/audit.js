import { createHash } from 'node:crypto';
import { healthSnapshot } from '../lib/health.js';

export async function buildAudit() {
  const runtime = await healthSnapshot();
  const checks = [
    { name: 'council', ok: runtime.councilReady },
    { name: 'production-mode', ok: !runtime.production || Boolean(process.env.APP_URL) },
    { name: 'provider', ok: runtime.providerReady },
    { name: 'bridge', ok: runtime.bridgeReady },
    { name: 'admin-memory', ok: runtime.adminMemoryReady },
    { name: 'persistent-memory-config', ok: runtime.persistentMemory }
  ];
  const warnings = checks.filter(x => !x.ok).map(x => x.name);
  const status = warnings.length === 0 ? 'healthy' : 'attention';
  const fingerprint = createHash('sha256')
    .update(JSON.stringify({ runtime, checks }))
    .digest('hex')
    .slice(0, 16);
  return {
    ok: true,
    status,
    fingerprint,
    generatedAt: new Date().toISOString(),
    checks,
    warnings,
    policy: {
      autoSourceModification: false,
      autoDeploy: false,
      autoRollback: false,
      destructiveActions: false
    }
  };
}
