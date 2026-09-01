const MAX_MESSAGE_CHARS = 12000;
const MAX_MESSAGES = 20;
const MODEL = 'grok-4.6';

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', 'null');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Yalnızca POST destekleniyor.' });

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return json(res, 503, { error: 'XAI_API_KEY sunucuda yapılandırılmamış.' });

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  if (!messages.length || messages.length > MAX_MESSAGES) {
    return json(res, 400, { error: `Mesaj geçmişi 1-${MAX_MESSAGES} mesaj arasında olmalı.` });
  }

  const safeMessages = messages.map((m) => ({
    role: m?.role === 'assistant' ? 'assistant' : 'user',
    content: typeof m?.content === 'string' ? m.content.slice(0, MAX_MESSAGE_CHARS) : ''
  })).filter((m) => m.content.length > 0);

  if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== 'user') {
    return json(res, 400, { error: 'Son mesaj kullanıcı mesajı olmalı.' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        input: safeMessages,
        temperature: 0.7,
        max_output_tokens: 4096
      }),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('xAI request failed:', response.status, data?.error?.message || data);
      return json(res, response.status >= 500 ? 502 : response.status, { error: 'Grok isteği başarısız oldu.' });
    }

    const output = typeof data.output_text === 'string'
      ? data.output_text
      : Array.isArray(data.output)
        ? data.output.flatMap((item) => Array.isArray(item.content) ? item.content : [])
            .map((item) => item?.text || '').filter(Boolean).join('\n')
        : '';

    if (!output) return json(res, 502, { error: 'Grok boş yanıt döndürdü.' });
    return json(res, 200, { output, model: MODEL });
  } catch (error) {
    console.error('chat backend error:', error);
    return json(res, 504, { error: error?.name === 'AbortError' ? 'Grok yanıtı zaman aşımına uğradı.' : 'Sunucu bağlantı hatası.' });
  } finally {
    clearTimeout(timeout);
  }
}
