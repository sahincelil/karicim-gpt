import { securityHeaders, rateLimit } from '../lib/security.js';
import { analyzeCyberInventory, cyberShieldLimits } from '../lib/cyber-shield.js';

function send(res, status, body) {
  securityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return send(res, 200, {
      ok: true,
      service: 'LEGION CYBER SHIELD / Patch Window Sentinel',
      status: 'read_only_mvp',
      accepts: 'POST JSON inventory containing explicit CVE findings',
      sources: [
        'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
        'https://api.first.org/epss/'
      ],
      limits: cyberShieldLimits,
      capabilities: ['CISA KEV enrichment', 'FIRST EPSS enrichment', 'explainable prioritization', 'patch lifecycle evidence'],
      boundaries: {
        networkScanning: false,
        exploitExecution: false,
        productionChanges: false,
        inventoryPersistence: false,
        humanApprovalRequiredForAnyRemediation: true
      }
    });
  }
  if (req.method !== 'POST') {
    return send(res, 405, { ok: false, error: 'Yalnızca GET ve POST destekleniyor.' });
  }
  const limit = rateLimit(req);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    return send(res, 429, { ok: false, error: 'İstek sınırına ulaşıldı. Daha sonra tekrar deneyin.' });
  }
  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch { return send(res, 400, { ok: false, error: 'Geçersiz JSON.' }); }
    }
    const result = await analyzeCyberInventory(payload);
    return send(res, 200, result);
  } catch (error) {
    return send(res, error?.status || 502, { ok: false, error: error?.message || 'Cyber Shield analizi tamamlanamadı.' });
  }
}
