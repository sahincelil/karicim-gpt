import { securityHeaders } from '../lib/security.js';
import { getPlausibleConfig } from '../lib/plausible.js';

function json(res, status, body) {
  securityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
}

export default function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Yalnızca GET destekleniyor.' });
  const config = getPlausibleConfig({
    configuredDomain: process.env.PLAUSIBLE_DOMAIN,
    requestHost: req.headers?.host,
    nodeEnv: process.env.NODE_ENV
  });
  return json(res, 200, config);
}
