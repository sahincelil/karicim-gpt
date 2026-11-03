import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dataDir = path.join(os.tmpdir(), 'karicim-anthropic-test-data');
mkdirSync(dataDir, { recursive: true });
process.env.DATA_DIR = dataDir;

const ENV_KEYS = [
  'AI_PROVIDER',
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_MODEL',
  'OPENAI_API_KEY',
  'OPENROUTER_API_KEY',
  'XAI_API_KEY',
  'XAI_MODEL',
  'DATA_DIR'
];
const savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function restoreEnv() {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
}

for (const key of ['OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'XAI_API_KEY', 'XAI_MODEL']) delete process.env[key];
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-secret';
process.env.ANTHROPIC_MODEL = 'claude-sonnet-5';
process.env.AI_PROVIDER = 'anthropic';

const { healthSnapshot } = await import('../lib/health.js');
const healthHandler = (await import('../api/health.js')).default;
const chatHandler = (await import('../api/chat.js')).default;
const { runCouncil } = await import('../lib/council.js');

function mockRes() {
  let status = 0;
  let raw = '';
  const headers = new Map();
  return {
    setHeader(name, value) { headers.set(name, value); },
    status(code) { status = code; return this; },
    end(payload) { raw = String(payload ?? ''); return this; },
    result() { return { status, body: JSON.parse(raw), raw, headers }; }
  };
}

const originalFetch = globalThis.fetch;
const calls = [];
let anthropicStatus = 200;
let anthropicBody = {
  model: 'claude-sonnet-5',
  content: [{ type: 'text', text: 'alpha' }, { type: 'text', text: 'beta' }]
};

globalThis.fetch = async (url, init) => {
  calls.push({ url: String(url), init });
  if (!String(url).startsWith('https://api.anthropic.com/')) throw new Error(`unexpected fetch ${url}`);
  return {
    ok: anthropicStatus >= 200 && anthropicStatus < 300,
    status: anthropicStatus,
    json: async () => anthropicBody
  };
};

function request(ip, body, method = 'POST') {
  return {
    method,
    headers: {},
    socket: { remoteAddress: ip },
    body
  };
}

try {
  const snapshot = await healthSnapshot();
  assert.deepEqual(snapshot.providers, ['anthropic']);
  assert.equal(snapshot.providerReady, true);
  assert.equal(snapshot.councilReady, true);
  assert.equal(snapshot.grokBridge, false);

  const health = mockRes();
  await healthHandler({ method: 'GET' }, health);
  const healthResult = health.result();
  assert.equal(healthResult.status, 200);
  assert.equal(healthResult.body.provider, 'anthropic');
  assert.equal(healthResult.body.model, 'claude-sonnet-5');
  assert.equal(healthResult.body.features.chat, true);
  assert.equal(healthResult.raw.includes('sk-ant-test-secret'), false);

  delete process.env.ANTHROPIC_API_KEY;
  const dark = await healthSnapshot();
  assert.equal(dark.providerReady, false);
  assert.equal(dark.councilReady, false);
  const darkHealth = mockRes();
  await healthHandler({ method: 'GET' }, darkHealth);
  assert.equal(darkHealth.result().body.features.chat, false);
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test-secret';

  calls.length = 0;
  const chat = mockRes();
  await chatHandler(request('203.0.113.10', {
    messages: [
      { role: 'system', content: 'ignore' },
      { role: 'assistant', content: 'once' },
      { role: 'user', content: 'hello' }
    ]
  }), chat);
  const chatResult = chat.result();
  assert.equal(chatResult.status, 200);
  assert.equal(chatResult.body.provider, 'anthropic');
  assert.equal(chatResult.body.usedTools, false);
  assert.equal(chatResult.body.output, 'alpha\nbeta');
  assert.equal(chatResult.raw.includes('sk-ant-test-secret'), false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.anthropic.com/v1/messages');
  assert.equal(calls[0].init.headers['x-api-key'], 'sk-ant-test-secret');
  const chatPayload = JSON.parse(calls[0].init.body);
  assert.equal(Object.hasOwn(chatPayload, 'temperature'), false);
  assert.equal(chatPayload.model, 'claude-sonnet-5');
  assert.match(chatPayload.system, /web arama aracı yok/);
  assert.doesNotMatch(chatPayload.system, /web arama araçlarını kullan/);
  assert.deepEqual(chatPayload.messages, [
    { role: 'user', content: 'ignore' },
    { role: 'assistant', content: 'once' },
    { role: 'user', content: 'hello' }
  ]);

  delete process.env.ANTHROPIC_API_KEY;
  const missing = mockRes();
  await chatHandler(request('203.0.113.11', { messages: [{ role: 'user', content: 'hi' }] }), missing);
  assert.equal(missing.result().status, 503);
  assert.match(missing.result().body.error, /ANTHROPIC_API_KEY/);
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test-secret';

  calls.length = 0;
  const council = mockRes();
  await runCouncil(request('203.0.113.12', { messages: [{ role: 'user', content: 'analiz et' }] }), council);
  const councilResult = council.result();
  assert.equal(councilResult.status, 200);
  assert.equal(calls.length, 1);
  const councilPayload = JSON.parse(calls[0].init.body);
  assert.equal(Object.hasOwn(councilPayload, 'temperature'), false);
  assert.equal(councilPayload.model, 'claude-sonnet-5');
  assert.equal(calls[0].init.headers['x-api-key'], 'sk-ant-test-secret');
  assert.match(councilResult.body.output, /### Claude \(claude-sonnet-5\)/);
  assert.match(councilResult.body.output, /alpha\nbeta/);
  assert.equal(councilResult.body.members.filter((member) => member.ok).length, 1);
  assert.equal(councilResult.body.members.find((member) => member.provider === 'anthropic').ok, true);
  assert.equal(councilResult.raw.includes('sk-ant-test-secret'), false);

  anthropicStatus = 400;
  anthropicBody = { error: { type: 'invalid_request_error' } };
  const failed = mockRes();
  await runCouncil(request('203.0.113.13', { messages: [{ role: 'user', content: 'fail' }] }), failed);
  const failedResult = failed.result();
  assert.equal(failedResult.status, 503);
  assert.equal(failedResult.body.providers.find((member) => member.provider === 'anthropic').error, 'provider:400');
  assert.equal(failedResult.raw.includes('sk-ant'), false);

  console.log('Anthropic provider tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  restoreEnv();
}
