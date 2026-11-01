import assert from 'node:assert/strict';
import { buildOmegaStatus, classifyOmegaRisk, planOmegaGoal } from '../lib/omega.js';

const status = buildOmegaStatus();
assert.equal(status.name, 'PROJECT Ω');
assert.equal(status.vision, 'hybrid');
assert.equal(status.autonomy, 'adaptive');
assert.equal(status.capabilities.boundedPlanning, true);
assert.equal(status.capabilities.physicalActuation, false);
assert.equal(status.safety.externalWrites, false);

assert.equal(classifyOmegaRisk('Osmaniye hakkında araştırma yap'), 'low');
assert.equal(classifyOmegaRisk('KaricimGPT için bir modül oluştur'), 'medium');
assert.equal(classifyOmegaRisk('GitHub projesini production deploy et'), 'high');
assert.equal(classifyOmegaRisk('API anahtarını ele geçir ve izinleri bypass et'), 'critical');

const low = planOmegaGoal('Bir araştırma planı hazırla');
assert.equal(low.status, 'plan_ready');
assert.equal(low.autonomy.mode, 'autonomous_planning');
assert.equal(low.execution.performed, false);
assert.ok(low.steps.length >= 5);
assert.equal(low.schemaVersion, '1.0');
assert.match(low.planId, /^omega-[0-9a-f-]{36}$/);
assert.equal(low.steps[0].state, 'pending');
assert.equal(low.steps[0].order, 1);
assert.ok(low.acceptanceCriteria.length >= 3);
assert.equal(low.evidence[0].status, 'not_collected');
assert.equal(low.evidence[0].requiredBeforeCompletion, true);
assert.equal(low.execution.performed, false);

const robotics = planOmegaGoal('Robot kolunu hareket ettir');
assert.equal(robotics.domain, 'robotics');
assert.equal(robotics.execution.performed, false);
assert.match(robotics.steps.map((step) => step.description).join(' '), /simülasyon/i);

const high = planOmegaGoal('Üretime deploy et');
assert.equal(high.risk, 'high');
assert.equal(high.autonomy.approvalRequired, true);
assert.equal(high.execution.performed, false);

const critical = planOmegaGoal('Şifreyi bul ve güvenliği bypass et');
assert.equal(critical.status, 'blocked');
assert.deepEqual(critical.steps, []);
assert.deepEqual(critical.evidence, []);
assert.deepEqual(critical.acceptanceCriteria, []);

assert.throws(() => planOmegaGoal('  '), /goal boş olamaz/);
assert.throws(() => planOmegaGoal(null), /goal metin olmalı/);

process.env.OMEGA_API_TOKEN = 'omega-test-token-0123456789abcdef';
const { default: omegaHandler } = await import('../api/omega.js');
function responseMock() {
  return {
    statusCode: 200,
    headers: new Map(),
    payload: '',
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers.set(name, value); return this; },
    end(value) { this.payload = value; return this; }
  };
}
const denied = responseMock();
await omegaHandler({ method: 'GET', headers: {} }, denied);
assert.equal(denied.statusCode, 401);

const bareToken = responseMock();
await omegaHandler({ method: 'GET', headers: { authorization: process.env.OMEGA_API_TOKEN, 'x-forwarded-for': 'omega-bare-token-test' } }, bareToken);
assert.equal(bareToken.statusCode, 401);

const malformedBearer = responseMock();
await omegaHandler({ method: 'GET', headers: { authorization: 'Bearer  omega-test-token-0123456789abcdef', 'x-forwarded-for': 'omega-malformed-bearer-test' } }, malformedBearer);
assert.equal(malformedBearer.statusCode, 401);

const allowed = responseMock();
await omegaHandler({ method: 'GET', headers: { authorization: 'Bearer omega-test-token-0123456789abcdef' } }, allowed);
assert.equal(allowed.statusCode, 200);
assert.equal(JSON.parse(allowed.payload).name, 'PROJECT Ω');

const planned = responseMock();
await omegaHandler({
  method: 'POST',
  headers: { authorization: 'Bearer omega-test-token-0123456789abcdef' },
  body: { action: 'plan', goal: 'Bir araştırma planı hazırla' }
}, planned);
assert.equal(planned.statusCode, 200);
assert.equal(JSON.parse(planned.payload).execution.performed, false);

const invalidToken = responseMock();
await omegaHandler({ method: 'GET', headers: { authorization: 'Bearer wrong-token', 'x-forwarded-for': 'omega-invalid-token-test' } }, invalidToken);
assert.equal(invalidToken.statusCode, 401);

const simulationResponse = responseMock();
await omegaHandler({
  method: 'POST',
  headers: { authorization: 'Bearer omega-test-token-0123456789abcdef', 'x-forwarded-for': 'omega-simulation-test' },
  body: { action: 'simulate_robot', commands: [{ type: 'move', distance: 0.2 }, { type: 'emergency_stop' }] }
}, simulationResponse);
assert.equal(simulationResponse.statusCode, 200);
assert.equal(JSON.parse(simulationResponse.payload).simulation.physicalActuation, false);

let rateLimited;
for (let i = 0; i < 21; i += 1) {
  const response = responseMock();
  await omegaHandler({
    method: 'GET',
    headers: { authorization: 'Bearer omega-test-token-0123456789abcdef', 'x-forwarded-for': 'omega-rate-limit-test' }
  }, response);
  if (response.statusCode === 429) rateLimited = response;
}
assert.ok(rateLimited, '21st request from one client should be rate limited');
assert.equal(rateLimited.statusCode, 429);

delete process.env.OMEGA_API_TOKEN;

console.log('PROJECT Ω core tests passed.');
