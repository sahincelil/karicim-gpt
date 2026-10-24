import { timingSafeEqual } from 'node:crypto';
import { addDecisionExample, getDigitalTwin, updateDigitalTwinProfile } from '../lib/digital-twin.js';
import { securityHeaders } from '../lib/security.js';

function json(res, status, body) {
  securityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
}

function authorized(req) {
  const expected = process.env.BODY_ADMIN_TOKEN;
  if (!expected) return false;
  const provided = String(req.headers.authorization || '').replace(/^Bearer\\s+/i, '');
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export default async function handler(req, res) {
  if (!authorized(req)) return json(res, 401, { error: 'Unauthorized' });
  try {
    if (req.method === 'GET') return json(res, 200, await getDigitalTwin());
    if (req.method !== 'POST') return json(res, 405, { error: 'Yalnızca GET ve POST destekleniyor.' });
    const body = req.body || {};
    if (body.action === 'update_profile') {
      const profile = await updateDigitalTwinProfile(body.profile, body.note);
      return json(res, 200, { profile });
    }
    if (body.action === 'add_example') {
      const example = await addDecisionExample(body.example);
      return json(res, 201, { example });
    }
    return json(res, 400, { error: 'action update_profile veya add_example olmalı.' });
  } catch (error) {
    return json(res, error?.status || 500, { error: error?.status ? error.message : 'Digital twin storage error' });
  }
}
