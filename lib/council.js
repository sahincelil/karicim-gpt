import { rateLimit, securityHeaders } from './security.js';

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 12000;
const MAX_OUTPUT_TOKENS = 3072;
const MAX_REQUEST_BYTES = 180000;
const TIMEOUT_MS = 60000;

function send(res, status, body, extra = {}) {
  securityHeaders(res);
  Object.entries(extra).forEach(([key, value]) => res.setHeader(key, String(value)));
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
}

function clean(messages) {
  return messages.map((m) => ({
    role: m?.role === 'assistant' ? 'assistant' : 'user',
    content: typeof m?.content === 'string' ? m.content.slice(0, MAX_MESSAGE_CHARS) : ''
  })).filter((m) => m.content).slice(-MAX_MESSAGES);
}

async function askOpenRouter(messages, signal) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { provider: 'openrouter', ok: false, error: 'OPENROUTER_API_KEY yapılandırılmamış.' };
  const model = process.env.OPENROUTER_COUNCIL_MODEL || process.env.OPENROUTER_AGENT_MODEL || 'openrouter/free';
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json', 'HTTP-Referer': process.env.APP_URL || 'https://karicim-gpt.vercel.app', 'X-Title': 'KaricimGPT Council' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: 'KaricimGPT Council üyesisin. Bağımsız analiz yap. Diğer modelleri taklit etme. Belirsizlikleri belirt. Gizli bilgi isteme veya açıklama; dış sistemlerde değişiklik yapma.' }, ...messages],
        temperature: 0.3,
        max_tokens: MAX_OUTPUT_TOKENS
      }),
      signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { provider: 'openrouter', ok: false, error: `provider:${response.status}` };
    const output = data?.choices?.[0]?.message?.content?.trim();
    return output ? { provider: 'openrouter', ok: true, model: data?.model || model, output } : { provider: 'openrouter', ok: false, error: 'empty-output' };
  } catch (error) {
    return { provider: 'openrouter', ok: false, error: error?.name === 'AbortError' ? 'timeout' : 'request-failed' };
  }
}

async function askGrok(messages, signal) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { provider: 'xai', ok: false, error: 'XAI_API_KEY yapılandırılmamış.' };
  const model = process.env.XAI_MODEL || 'grok-4.6';
  try {
    const response = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        model,
        input: [{ role: 'system', content: 'KaricimGPT Council üyesisin. Bağımsız analiz yap. Belirsizlikleri belirt. Web verisi varsa kaynak bağlamını ayır. Gizli bilgi isteme veya açıklama; dış sistemlerde değişiklik yapma.' }, ...messages],
        max_output_tokens: MAX_OUTPUT_TOKENS,
        tools: [{ type: 'web_search' }, { type: 'x_search' }]
      }),
      signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { provider: 'xai', ok: false, error: `provider:${response.status}` };
    const output = typeof data.output_text === 'string' ? data.output_text.trim() : Array.isArray(data.output)
      ? data.output.flatMap((item) => Array.isArray(item.content) ? item.content : []).map((item) => item?.text || '').filter(Boolean).join('\\n').trim()
      : '';
    return output ? { provider: 'xai', ok: true, model: data?.model || model, output } : { provider: 'xai', ok: false, error: 'empty-output' };
  } catch (error) {
    return { provider: 'xai', ok: false, error: error?.name === 'AbortError' ? 'timeout' : 'request-failed' };
  }
}

export async function runCouncil(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Yalnızca POST destekleniyor.' }, { Allow: 'POST' });
  const limit = rateLimit(req);
  if (!limit.allowed) return send(res, 429, { ok: false, error: 'Çok fazla istek.' }, { 'Retry-After': limit.retryAfter });
  if (Number(req.headers['content-length'] || 0) > MAX_REQUEST_BYTES) return send(res, 413, { ok: false, error: 'İstek çok büyük.' });
  const messages = clean(Array.isArray(req.body?.messages) ? req.body.messages : []);
  if (!messages.length || messages[messages.length - 1].role !== 'user') return send(res, 400, { ok: false, error: 'Geçerli bir kullanıcı mesajı gerekli.' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const [grok, openrouter] = await Promise.all([
      askGrok(messages, controller.signal),
      askOpenRouter(messages, controller.signal)
    ]);
    const members = [grok, openrouter];
    const available = members.filter((m) => m.ok);
    if (!available.length) return send(res, 503, { ok: false, error: 'Council için en az bir model sağlayıcısı yapılandırılmalı.', providers: members.map(({ provider, error }) => ({ provider, error })) });
    const output = available.map((m) => `## ${m.provider === 'xai' ? 'Grok' : 'OpenRouter'}${m.model ? ` (${m.model})` : ''}\n\n${m.output}`).join('\n\n---\n\n');
    return send(res, 200, {
      ok: true,
      mode: 'council',
      output,
      members: members.map(({ provider, ok, model, error }) => ({ provider, ok, ...(model ? { model } : {}), ...(error ? { error } : {}) })),
      coordination: { strategy: 'parallel-independent-analysis', synthesis: false, automaticDecision: false },
      guardrails: { externalWrites: false, shellExecution: false, secretDisclosure: false, destructiveActions: false }
    }, { 'X-RateLimit-Remaining': limit.remaining });
  } finally {
    clearTimeout(timeout);
  }
}
