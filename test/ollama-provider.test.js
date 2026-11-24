import test from 'node:test';
import assert from 'node:assert/strict';
import { callOllama } from '../lib/ollama-provider.js';

test('Ollama adapter sends normalized messages to the configured local runtime', async () => {
  const previous = { url: process.env.OLLAMA_BASE_URL, model: process.env.OLLAMA_MODEL, fetch: globalThis.fetch };
  process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:11434/';
  process.env.OLLAMA_MODEL = 'qwen2.5:7b';
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ model: 'qwen2.5:7b', message: { content: 'Merhaba LEGION' } }) };
  };
  try {
    const result = await callOllama([{ role: 'user', content: 'Selam' }], 'Sistem', new AbortController());
    assert.equal(request.url, 'http://127.0.0.1:11434/api/chat');
    assert.equal(JSON.parse(request.options.body).messages[0].role, 'system');
    assert.equal(JSON.parse(request.options.body).messages[1].content, 'Selam');
    assert.equal(result.provider, 'ollama');
    assert.equal(result.output, 'Merhaba LEGION');
  } finally {
    globalThis.fetch = previous.fetch;
    if (previous.url === undefined) delete process.env.OLLAMA_BASE_URL; else process.env.OLLAMA_BASE_URL = previous.url;
    if (previous.model === undefined) delete process.env.OLLAMA_MODEL; else process.env.OLLAMA_MODEL = previous.model;
  }
});

test('Ollama adapter rejects an unconfigured endpoint', async () => {
  const previous = process.env.OLLAMA_BASE_URL;
  delete process.env.OLLAMA_BASE_URL;
  try {
    await assert.rejects(() => callOllama([], 'Sistem', new AbortController()), { status: 503 });
  } finally {
    if (previous !== undefined) process.env.OLLAMA_BASE_URL = previous;
  }
});
