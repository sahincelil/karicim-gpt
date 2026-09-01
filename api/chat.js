const MAX_MESSAGE_CHARS = 12000;
const MAX_MESSAGES = 20;
const MAX_OUTPUT_TOKENS = 4096;
const FREE_MODEL = 'z-ai/glm-5.2:free';

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

function normalizeMessages(messages) {
  return messages.map((m) => ({
    role: m?.role === 'assistant' ? 'assistant' : 'user',
    content: typeof m?.content === 'string' ? m.content.slice(0, MAX_MESSAGE_CHARS) : ''
  })).filter((m) => m.content.length > 0);
}

async function callOpenRouter(messages, apiKey, controller) {
  const model = process.env.OPENROUTER_MODEL || FREE_MODEL;
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'https://karicim-gpt.vercel.app',
      'X-Title': 'KaricimGPT'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: MAX_OUTPUT_TOKENS
    }),
    signal: controller.signal
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error('OpenRouter request failed'), { status: response.status, data });
  return { output: data?.choices?.[0]?.message?.content || '', model: data?.model || model };
}

async function callXai(messages, apiKey, controller) {
  const response = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ model: 'grok-4.6', input: messages, temperature: 0.7, max_output_tokens: MAX_OUTPUT_TOKENS }),
    signal: controller.signal
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error('xAI request failed'), { status: response.status, data });
  const output = typeof data.output_text === 'string' ? data.output_text : Array.isArray(data.output)
    ? data.output.flatMap((item) => Array.isArray(item.content) ? item.content : []).map((item) => item?.text || '').filter(Boolean).join('\n') : '';
  return { output, model: 'grok-4.6' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Yalnızca POST destekleniyor.' });

  const messages = normalizeMessages(Array.isArray(req.body?.messages) ? req.body.messages : []);
  if (!messages.length || messages.length > MAX_MESSAGES) return json(res, 400, { error: `Mesaj geçmişi 1-${MAX_MESSAGES} mesaj arasında olmalı.` });
  if (messages[messages.length - 1].role !== 'user') return json(res, 400, { error: 'Son mesaj kullanıcı mesajı olmalı.' });

  const provider = (process.env.AI_PROVIDER || 'openrouter').toLowerCase();
  const apiKey = provider === 'xai' ? process.env.XAI_API_KEY : process.env.OPENROUTER_API_KEY;
  if (!apiKey) return json(res, 503, { error: `${provider === 'xai' ? 'XAI_API_KEY' : 'OPENROUTER_API_KEY'} sunucuda yapılandırılmamış.` });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const result = provider === 'xai'
      ? await callXai(messages, apiKey, controller)
      : await callOpenRouter(messages, apiKey, controller);
    if (!result.output) return json(res, 502, { error: 'Model boş yanıt döndürdü.' });
    return json(res, 200, result);
  } catch (error) {
    console.error('AI backend error:', { provider, status: error?.status, message: error?.message });
    const status = error?.name === 'AbortError' ? 504 : (error?.status >= 400 && error?.status < 500 ? error.status : 502);
    return json(res, status, { error: error?.name === 'AbortError' ? 'Model yanıtı zaman aşımına uğradı.' : 'AI sağlayıcısı isteği başarısız oldu.' });
  } finally {
    clearTimeout(timeout);
  }
}
