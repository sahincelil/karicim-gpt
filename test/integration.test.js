import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';

const port = Number(process.env.PORT || 3000);
const secret = process.env.BRIDGE_SHARED_SECRET;
if (!secret) throw new Error('BRIDGE_SHARED_SECRET is required for integration tests.');

function request(path, { method = 'GET', body, rawBody, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const data = rawBody !== undefined ? rawBody : body === undefined ? '' : JSON.stringify(body);
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers: {
      ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
      ...headers
    }}, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: raw ? JSON.parse(raw) : null }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function signedHeaders(raw, timestamp = Date.now()) {
  const ts = String(timestamp);
  return {
    'X-Bridge-Timestamp': ts,
    'X-Bridge-Signature': crypto.createHmac('sha256', secret).update(`${ts}.${raw}`).digest('hex')
  };
}

const body = await request('/api/body');
assert.equal(body.status, 200);
assert.equal(body.body.capabilities.includes('self-test'), true);
assert.equal(body.body.capabilities.includes('audit'), true);
assert.equal(body.body.capabilities.includes('maintenance'), true);

const health = await request('/health');
assert.equal(health.status, 200);
assert.equal(health.body.ok, true);

assert.equal((await request('/api/bridge', { method: 'GET' })).status, 404);
assert.equal((await request('/api/bridge', { method: 'POST', body: { action: 'health' } })).status, 401);

const raw = JSON.stringify({ action: 'health' });
assert.equal((await request('/api/bridge', {
  method: 'POST', body: JSON.parse(raw),
  headers: signedHeaders(raw, Date.now() - 10 * 60 * 1000)
})).status, 401);

const good = await request('/api/bridge', { method: 'POST', body: JSON.parse(raw), headers: signedHeaders(raw) });
assert.equal(good.status, 200);
assert.equal(good.body.ok, true);
assert.equal(good.headers?.['x-content-type-options'], 'nosniff');
assert.equal(good.headers?.['x-frame-options'], 'DENY');
assert.deepEqual(good.body.actions, ['health', 'agent']);

assert.equal((await request('/api/bridge', {
  method: 'POST', body: JSON.parse(raw),
  headers: { ...signedHeaders(raw), 'X-Bridge-Signature': '00' }
})).status, 401);

const malformedRaw = '{bad-json';
assert.equal((await request('/api/bridge', {
  method: 'POST', rawBody: malformedRaw, headers: signedHeaders(malformedRaw)
})).status, 400);

const chatMethod = await request('/api/chat', { method: 'GET' });
assert.equal(chatMethod.status, 404);
assert.equal(chatMethod.headers?.['x-content-type-options'], 'nosniff');
assert.equal(chatMethod.headers?.['x-frame-options'], 'DENY');

const agentMethod = await request('/api/agent', { method: 'GET' });
assert.equal(agentMethod.status, 404);
assert.equal(agentMethod.headers?.['x-content-type-options'], 'nosniff');
assert.equal(agentMethod.headers?.['x-frame-options'], 'DENY');

const councilMethod = await request('/api/council', { method: 'GET' });
assert.equal(councilMethod.status, 404);
assert.equal(councilMethod.headers?.['x-content-type-options'], 'nosniff');

const council = await request('/api/council', { method: 'POST', body: { messages: [{ role: 'user', content: 'ping' }] } });
assert.equal(council.status, 503);
assert.equal(council.body.ok, false);
assert.equal(council.body.error.includes('en az bir model'), true);
assert.equal(council.body.guardrails, undefined);

const grokMethod = await request('/api/grok', { method: 'GET' });
assert.equal(grokMethod.status, 404);
assert.equal(grokMethod.headers?.['x-content-type-options'], 'nosniff');

const grok = await request('/api/grok', { method: 'POST', body: { messages: [{ role: 'user', content: 'ping' }] } });
assert.equal(grok.status, 503);
assert.equal(grok.body.ok, false);

const proposals = await request('/api/proposals');
assert.equal(proposals.status, 200);
assert.equal(proposals.body.ok, true);
assert.equal(Array.isArray(proposals.body.proposals), true);
assert.equal(proposals.body.policy.autonomousSourceWrite, false);
assert.equal(proposals.body.policy.autonomousDeploy, false);
assert.equal(proposals.body.policy.autonomousRollback, false);
assert.equal(proposals.body.proposals.every((proposal) => proposal.autoApply === false), true);

const selfTest = await request('/api/self-test');
assert.equal(selfTest.status, 200);
assert.equal(selfTest.body.ok, true);
assert.equal(selfTest.body.status, 'passed');
assert.equal(selfTest.body.policy.automaticDecision, false);
assert.equal(selfTest.body.policy.autonomousRollback, false);
assert.equal(selfTest.body.policy.destructiveActions, false);

const maintenance = await request('/api/maintenance');
assert.equal(maintenance.status, 200);
assert.equal(typeof maintenance.body.status, 'string');
assert.equal(maintenance.body.policy.autonomousSourceWrite, false);
assert.equal(maintenance.body.policy.autonomousDeploy, false);
assert.equal(maintenance.body.policy.autonomousRollback, false);
assert.equal(maintenance.body.policy.destructiveActions, false);

const audit = await request('/api/audit');
assert.equal(audit.status, 200);
assert.equal(audit.body.ok, true);
assert.equal(typeof audit.body.fingerprint, 'string');
assert.equal(audit.body.policy.autoSourceModification, false);
assert.equal(audit.body.policy.autoDeploy, false);
assert.equal(audit.body.policy.autoRollback, false);
assert.equal(audit.body.policy.destructiveActions, false);

const evolve = await request('/api/evolve');
assert.equal(evolve.status, 200);
assert.equal(evolve.body.component, 'evolve');
assert.equal(typeof evolve.body.health, 'string');
assert.equal(Array.isArray(evolve.body.blockers), true);
assert.equal(typeof evolve.body.auditFingerprint, 'string');
assert.equal(typeof evolve.body.selfTest.ok, 'boolean');
assert.equal(evolve.body.automatic.deploy, false);
assert.equal(evolve.body.pipeline.includes('coordinate'), true);
assert.equal(evolve.body.guardrails.arbitraryShell, false);
assert.equal(evolve.body.guardrails.unrestrictedWrites, false);
assert.equal(evolve.body.guardrails.destructiveActions, false);
assert.equal(evolve.body.automatic.deploy, false);
assert.equal(evolve.body.automatic.rollback, false);

console.log('Integration tests passed.');
