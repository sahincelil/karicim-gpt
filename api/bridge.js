import crypto from 'node:crypto';
import { securityHeaders, rateLimit } from '../lib/security.js';
import agentHandler from './agent.js';

const MAX_BODY = 180000;
const MAX_SKEW_MS = 5 * 60 * 1000;

function send(res, status, body) {
  securityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

function timingSafeEqual(a, b) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function verify(req, raw) {
  const secret = process.env.BRIDGE_SHARED_SECRET;
  const timestamp = req.headers['x-bridge-timestamp'];
  const signature = req.headers['x-bridge-signature'];
  if (!secret || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_SKEW_MS) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex');
  return timingSafeEqual(signature, expected);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Yalnızca POST destekleniyor.' });
  const limit = rateLimit(req);
  if (!limit.allowed) return send(res, 429, { ok: false, error: 'Rate limit.' });
  const raw = typeof req.rawBody === 'string' ? req.rawBody : JSON.stringify(req.body || {});
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY) return send(res, 413, { ok: false, error: 'İstek çok büyük.' });
  if (!verify(req, raw)) return send(res, 401, { ok: false, error: 'Bridge kimlik doğrulaması başarısız.' });

  const input = req.body || {};
  const action = input.action;
  if (action === 'health') {
    return send(res, 200, { ok: true, bridge: 'karicimgpt-bridge', actions: ['health', 'agent'], timestamp: new Date().toISOString() });
  }
  if (action === 'agent') {
    const messages = Array.isArray(input.messages) ? input.messages : [];
    if (!messages.length || messages.length > 20) return send(res, 400, { ok: false, error: 'messages gerekli.' });
    const cleanMessages = messages.map((m) => ({ role: m?.role === 'assistant' ? 'assistant' : 'user', content: typeof m?.content === 'string' ? m.content.slice(0, 12000) : '' })).filter((m) => m.content).slice(-20);
    if (!cleanMessages.length || cleanMessages[cleanMessages.length - 1].role !== 'user') return send(res, 400, { ok: false, error: 'Geçerli bir son kullanıcı mesajı gerekli.' });
    const context = {
      ...res,
      req: { ...req, body: { messages: cleanMessages } },
      body: { messages: cleanMessages },
      status(code) { res.statusCode = code; return this; },
      setHeader(name, value) { res.setHeader(name, value); return this; },
      end(data) { res.end(data); }
    };
    return agentHandler(context, res);
  }
  return send(res, 400, { ok: false, error: 'İzin verilen action: health, agent.' });
}
