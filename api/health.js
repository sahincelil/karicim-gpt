import { securityHeaders } from '../lib/security.js';

function send(res, status, body) {
  securityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'Yalnızca GET destekleniyor.' });

  const provider = (process.env.AI_PROVIDER || 'openrouter').toLowerCase();
  const configuredModel = process.env.OPENROUTER_AGENT_MODEL || process.env.OPENROUTER_MODEL || 'openrouter/free';
  const webEnabled = Boolean(process.env.OPENROUTER_API_KEY) && process.env.OPENROUTER_WEB_ENABLED !== 'false';
  const webEngine = process.env.OPENROUTER_WEB_ENGINE || 'auto';

  return send(res, 200, {
    ok: true,
    service: 'karicimgpt',
    provider,
    model: configuredModel,
    mode: configuredModel === 'openrouter/free' ? 'free-router' : 'configured-model',
    web: { enabled: webEnabled, engine: webEnabled ? webEngine : null },
    features: {
      chat: Boolean(process.env.OPENROUTER_API_KEY || process.env.XAI_API_KEY),
      agent: Boolean(process.env.OPENROUTER_API_KEY),
      webTools: webEnabled,
      githubRead: Boolean(process.env.OPENROUTER_API_KEY)
    }
  });
}
