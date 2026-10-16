import { securityHeaders } from '../lib/security.js';
import { buildMaintenanceReport } from '../lib/maintenance.js';

export default async function handler(req, res) {
  securityHeaders(res);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    return res.end(JSON.stringify({ ok: false, error: 'Yalnızca GET destekleniyor.' }));
  }
  try {
    const report = await buildMaintenanceReport();
    res.statusCode = 200;
    return res.end(JSON.stringify(report));
  } catch {
    res.statusCode = 503;
    return res.end(JSON.stringify({ ok: false, status: 'attention', error: 'Bakım raporu oluşturulamadı.' }));
  }
}
