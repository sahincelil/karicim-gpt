import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';

const port = 34567;
const secret = 'integration-test-secret';

function request(path, { method = 'GET', body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? '' : JSON.stringify(body);
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers: {
      ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
      ...headers
    }}, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : null }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function signedHeaders(raw, timestamp = Date.now()) {
  const ts = String(timestamp);
  const signature = crypto.createHmac('sha256', secret).update(`${ts}.${raw}`).digest('hex');
  return { 'X-Bridge-Timestamp': ts, 'X-Bridge-Signature': signature };
}

const child = spawn(process.execPath, ['server.js'], {
  env: { ...process.env, PORT: String(port), BRIDGE_SHARED_SECRET: secret, NODE_ENV: 'test' },
  stdio: ['ignore', 'pipe', 'pipe']
});

let stderr = '';
child.stderr.on('data', d => { stderr += d.toString(); });

try {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try { if ((await request('/health')).status === 200) { ready = true; break; } } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  assert.equal(ready, true, `server failed to start: ${stderr}`);

  assert.equal((await request('/api/bridge', { method: 'GET' })).status, 404);
  assert.equal((await request('/api/bridge', { method: 'POST', body: { action: 'health' } })).status, 401);

  const staleRaw = JSON.stringify({ action: 'health' });
  assert.equal((await request('/api/bridge', {
    method: 'POST', body: JSON.parse(staleRaw),
    headers: signedHeaders(staleRaw, Date.now() - 10 * 60 * 1000)
  })).status, 401);

  const raw = JSON.stringify({ action: 'health' });
  const good = await request('/api/bridge', {
    method: 'POST', body: JSON.parse(raw), headers: signedHeaders(raw)
  });
  assert.equal(good.status, 200);
  assert.equal(good.body.ok, true);
  assert.deepEqual(good.body.actions, ['health', 'agent']);

  const badSignature = await request('/api/bridge', {
    method: 'POST', body: JSON.parse(raw), headers: { ...signedHeaders(raw), 'X-Bridge-Signature': '00' }
  });
  assert.equal(badSignature.status, 401);

  const malformed = await request('/api/bridge', {
    method: 'POST',
    headers: { ...signedHeaders('{bad-json') , 'Content-Type': 'application/json', 'Content-Length': 9 },
    body: undefined
  });
  assert.equal(malformed.status, 400);

  const evolve = await request('/api/evolve');
  assert.equal(evolve.status, 200);
  assert.equal(evolve.body.component, 'evolve');
  assert.equal(evolve.body.automatic.deploy, false);
  assert.equal(evolve.body.guardrails.arbitraryShell, false);

  console.log('Integration tests passed.');
} finally {
  child.kill('SIGTERM');
}
