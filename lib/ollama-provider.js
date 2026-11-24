const DEFAULT_OLLAMA_MODEL = 'llama3.2';

function endpoint() {
  const base = process.env.OLLAMA_BASE_URL;
  if (!base) throw Object.assign(new Error('OLLAMA_BASE_URL is not configured'), { status: 503 });
  let parsed;
  try { parsed = new URL(base); } catch { throw Object.assign(new Error('OLLAMA_BASE_URL must be a valid URL'), { status: 503 }); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw Object.assign(new Error('OLLAMA_BASE_URL must use HTTP or HTTPS'), { status: 503 });
  return `${base.replace(/\/+$/, '')}/api/chat`;
}

export async function callOllama(messages, system, controller) {
  const model = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
  const response = await fetch(endpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, ...messages],
      stream: false,
      options: { num_predict: 4096 }
    }),
    signal: controller.signal
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error('Ollama request failed'), { status: response.status });
  const output = typeof data?.message?.content === 'string' ? data.message.content.trim() : '';
  if (!output) throw Object.assign(new Error('Ollama returned no text output'), { status: 502 });
  return { output, model: data?.model || model, provider: 'ollama', usedTools: false };
}
