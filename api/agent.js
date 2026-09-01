const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 12000;
const MAX_TOOL_ROUNDS = 4;
const MAX_OUTPUT_TOKENS = 4096;

function send(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.end(JSON.stringify(body));
}

function clean(messages) {
  return messages.map((m) => ({
    role: m?.role === 'assistant' ? 'assistant' : 'user',
    content: typeof m?.content === 'string' ? m.content.slice(0, MAX_MESSAGE_CHARS) : ''
  })).filter((m) => m.content).slice(-MAX_MESSAGES);
}

async function run(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Yalnızca POST destekleniyor.' });
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return send(res, 503, { error: 'OPENROUTER_API_KEY yapılandırılmamış.' });

  const messages = clean(req.body?.messages || []);
  if (!messages.length || messages[messages.length - 1].role !== 'user') return send(res, 400, { error: 'Geçerli bir kullanıcı mesajı gerekli.' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  const model = process.env.OPENROUTER_AGENT_MODEL || 'openrouter/free';
  const tools = [{ type: 'openrouter:web_search' }];

  try {
    let current = messages;
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json', 'X-Title': 'KaricimGPT Agent' },
        body: JSON.stringify({ model, messages: current, tools, tool_choice: 'auto', temperature: 0.5, max_tokens: MAX_OUTPUT_TOKENS }),
        signal: controller.signal
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) return send(res, r.status >= 400 && r.status < 500 ? r.status : 502, { error: 'Agent sağlayıcısı isteği başarısız oldu.' });
      const msg = data?.choices?.[0]?.message;
      if (!msg) return send(res, 502, { error: 'Agent boş yanıt döndürdü.' });
      current = [...current, msg];
      if (!Array.isArray(msg.tool_calls) || msg.tool_calls.length === 0) {
        return send(res, 200, { output: msg.content || '', model: data.model || model, rounds: round + 1 });
      }
      // Server-side tools are executed by OpenRouter. Preserve the tool call messages;
      // the next model request receives the provider-produced tool results.
      const toolResults = Array.isArray(data?.choices?.[0]?.message?.tool_results) ? data.choices[0].message.tool_results : [];
      if (!toolResults.length) return send(res, 502, { error: 'Tool sonucu alınamadı.' });
      current = [...current, ...toolResults];
    }
    return send(res, 504, { error: 'Agent işlem sınırına ulaştı.' });
  } catch (e) {
    return send(res, e?.name === 'AbortError' ? 504 : 502, { error: e?.name === 'AbortError' ? 'Agent zaman aşımına uğradı.' : 'Agent çalıştırılamadı.' });
  } finally {
    clearTimeout(timeout);
  }
}

export default run;
