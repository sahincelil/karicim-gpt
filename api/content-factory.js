import chatHandler from './chat.js';
import { buildContentFactoryPrompt, normalizeContentFactoryInput } from '../lib/content-factory.js';
import { securityHeaders } from '../lib/security.js';

function json(res, status, body) {
  securityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Yalnızca POST destekleniyor.' });
  }

  let input;
  try {
    input = normalizeContentFactoryInput(req.body || {});
  } catch (error) {
    return json(res, error?.status || 400, { error: error?.message || 'Geçersiz içerik talebi.' });
  }

  // Reuse the existing provider routing, server-side secrets, rate limits and timeout handling.
  const forwardedReq = Object.create(req);
  forwardedReq.body = {
    messages: [{ role: 'user', content: buildContentFactoryPrompt(input) }]
  };

  return chatHandler(forwardedReq, res);
}
