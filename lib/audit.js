import { createHash } from 'node:crypto';
import { healthSnapshot } from '../lib/health.js';

export async function buildAudit() {
  const runtime = await healthSnapshot();
  const production = runtime.production;
  const checks = [
    { name: 'council', ok: runtime.councilReady, required: production },
    { name: 'production-mode', ok: !production || Boolean(process.env.APP_URL), required: production },
    { name: 'provider', ok: runtime.providerReady, required: production },
    { name: 'bridge', ok: runtime.bridgeReady, required: process.env.BRIDGE_REQUIRED === 'true' },
    { name: 'admin-memory', ok: runtime.adminMemoryReady, required: process.env.MEMORY_ADMIN_REQUIRED === 'true' },
    { name: 'persistent-memory-config', ok: runtime.persistentMemory, required: process.env.PERSISTENT_MEMORY_REQUIRED === 'true' }
  ];
  const warnings = checks.filter((x) => x.required && !x.ok).map((x) => x.name);
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
