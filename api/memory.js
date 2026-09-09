import { memoryHealth, recall, remember } from '../lib/memory.js';
import { securityHeaders } from '../lib/security.js';

function json(res, status, body) {
  securityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
}

function authorized(req) {
  const expected = process.env.BODY_ADMIN_TOKEN;
  if (!expected) return false;
  const provided = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  return provided.length > 0 && provided === expected;
}

export default async function handler(req, res) {
  if (!authorized(req)) return json(res, 401, { error: 'Unauthorized' });
  if (req.method === 'GET') {
    const query = new URL(req.url || '/', 'http://localhost').searchParams;
    return json(res, 200, { memories: await recall(query.get('q') || '', query.get('limit') || 10), health: await memoryHealth() });
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Yalnızca GET ve POST destekleniyor.' });
  const entry = req.body || {};
  if (!String(entry.text || '').trim()) return json(res, 400, { error: 'text gerekli.' });
  return json(res, 201, { memory: await remember(entry) });
}
