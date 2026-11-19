import { cyberShieldStatus, normalizeBatch, correlateEvents, safeTokenEqual } from '../lib/cyber-shield.js';
import { securityHeaders } from '../lib/security.js';

function send(res, status, body) {
  securityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  const url = new URL(req.url || '/api/cyber-shield', 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/api/cyber-shield') {
    return send(res, 200, cyberShieldStatus());
  }
  if (req.method !== 'POST' || url.pathname !== '/api/cyber-shield/ingest') {
    return send(res, 405, { ok: false, error: 'Unsupported method or path.' });
  }
  const expected = process.env.CYBER_SHIELD_INGEST_TOKEN;
  if (!expected) return send(res, 503, { ok: false, error: 'Ingestion is disabled. Configure CYBER_SHIELD_INGEST_TOKEN server-side.' });
  const authorization = req.headers?.authorization || '';
  const supplied = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!safeTokenEqual(supplied, expected)) return send(res, 401, { ok: false, error: 'Unauthorized.' });
  try {
    const payload = req.body || {};
    const events = normalizeBatch(payload.source, payload.events);
    const correlations = correlateEvents(events, payload.correlationWindowMinutes);
    return send(res, 200, {
      ok: true,
      accepted: events.length,
      persisted: false,
      responseActions: false,
      events,
      correlations,
      note: 'Events were normalized and correlated in memory only; nothing was persisted or acted upon.'
    });
  } catch (error) {
    return send(res, error?.status || 400, { ok: false, error: error?.message || 'Invalid event payload.' });
  }
}
