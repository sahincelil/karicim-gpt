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

const robotics = planOmegaGoal('Robot kolunu hareket ettir');
assert.equal(robotics.domain, 'robotics');
assert.equal(robotics.execution.performed, false);
assert.match(robotics.steps.join(' '), /simülasyon/i);

const high = planOmegaGoal('Üretime deploy et');
assert.equal(high.risk, 'high');
assert.equal(high.autonomy.approvalRequired, true);
assert.equal(high.execution.performed, false);

const critical = planOmegaGoal('Şifreyi bul ve güvenliği bypass et');
assert.equal(critical.status, 'blocked');
assert.deepEqual(critical.steps, []);

assert.throws(() => planOmegaGoal('  '), /goal boş olamaz/);
assert.throws(() => planOmegaGoal(null), /goal metin olmalı/);


process.env.OMEGA_API_TOKEN = 'omega-test-token';
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

const allowed = responseMock();
await omegaHandler({ method: 'GET', headers: { authorization: 'Bearer omega-test-token' } }, allowed);
assert.equal(allowed.statusCode, 200);
assert.equal(JSON.parse(allowed.payload).name, 'PROJECT Ω');

const planned = responseMock();
await omegaHandler({
  method: 'POST',
  headers: { authorization: 'Bearer omega-test-token' },
  body: { action: 'plan', goal: 'Bir araştırma planı hazırla' }
}, planned);
assert.equal(planned.statusCode, 200);
assert.equal(JSON.parse(planned.payload).execution.performed, false);
delete process.env.OMEGA_API_TOKEN;

console.log('PROJECT Ω core tests passed.');
