import { timingSafeEqual } from 'node:crypto';
import { createContext, deriveContexts, searchContexts, contextHealth } from '../lib/context-engine.js';
import { securityHeaders } from '../lib/security.js';

function json(res, status, body) {
  securityHeaders(res);
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
}

function authorized(req) {
  const expected = process.env.BODY_ADMIN_TOKEN;
  const provided = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(provided);
  const b = Buffer.from(expected || '');
  return Boolean(expected && provided && a.length === b.length && timingSafeEqual(a, b));
}

export default async function handler(req, res) {
  if (!authorized(req)) return json(res, 401, { error: 'Unauthorized' });
  try {
    if (req.method === 'GET') {
      const query = new URL(req.url || '/', 'http://localhost').searchParams;
      return json(res, 200, { contexts: await searchContexts(query.get('q') || '', query.get('limit') || 10), health: await contextHealth() });
    }
    if (req.method !== 'POST') return json(res, 405, { error: 'Yalnızca GET ve POST destekleniyor.' });
    const input = req.body || {};
    if (input.action === 'auto') return json(res, 200, await deriveContexts(input));
    if (input.action === 'create') return json(res, 201, { context: await createContext(input) });
    if (input.action === 'search') return json(res, 200, { contexts: await searchContexts(input.query || '', input.limit || 10) });
    return json(res, 400, { error: 'action: create, auto veya search olmalı.' });
  } catch (error) {
    return json(res, error?.status || 500, { error: error?.message || 'Context error' });
  }
}
