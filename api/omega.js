import { timingSafeEqual } from 'node:crypto';
import { buildOmegaStatus, planOmegaGoal } from '../lib/omega.js';
import { rateLimit, securityHeaders } from '../lib/security.js';
import { simulateRobotCommands } from '../lib/robotics-sim.js';

function json(res, status, body) {
  securityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

function authorized(req) {
  const expected = process.env.OMEGA_API_TOKEN;
  if (!expected) return false;
  const provided = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export default async function handler(req, res) {
  const limit = rateLimit(req);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    return json(res, 429, { ok: false, error: 'Rate limit exceeded' });
  }
  if (!authorized(req)) return json(res, 401, { ok: false, error: 'Unauthorized' });
  if (req.method === 'GET') return json(res, 200, buildOmegaStatus());
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Yalnızca GET ve POST destekleniyor.' });
  try {
    const body = req.body || {};
    if (body.action === 'plan') return json(res, 200, planOmegaGoal(body.goal));
    if (body.action === 'simulate_robot') {
      return json(res, 200, { ok: true, project: 'PROJECT Ω', simulation: simulateRobotCommands(body.commands) });
    }
    return json(res, 400, { ok: false, error: 'action=plan veya simulate_robot olmalı.' });
  } catch (error) {
    return json(res, error?.status || 500, { ok: false, error: error?.status ? error.message : 'Omega planning error' });
  }
}
