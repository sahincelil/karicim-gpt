import { securityHeaders } from '../lib/security.js';

function send(res, status, body) {
  securityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'Yalnızca GET destekleniyor.' });
  return send(res, 200, {
    ok: true,
    component: 'evolve',
    mode: 'controlled',
    pipeline: ['observe', 'analyze', 'propose', 'test', 'review', 'deploy', 'verify', 'rollback'],
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
