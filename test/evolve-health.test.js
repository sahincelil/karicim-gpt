import assert from 'node:assert/strict';
import evolveHandler from '../api/evolve.js';
import { buildMaintenanceReport } from '../lib/maintenance.js';

const keys = [
  'NODE_ENV', 'APP_URL', 'OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'XAI_API_KEY',
  'BRIDGE_REQUIRED', 'BRIDGE_SHARED_SECRET', 'MEMORY_ADMIN_REQUIRED',
  'BODY_ADMIN_TOKEN', 'PERSISTENT_MEMORY_REQUIRED', 'MEMORY_FILE', 'DATA_DIR'
];
const previous = new Map(keys.map((key) => [key, process.env[key]]));

for (const key of keys) delete process.env[key];
process.env.NODE_ENV = 'production';
process.env.BRIDGE_REQUIRED = 'true';
process.env.MEMORY_ADMIN_REQUIRED = 'true';
process.env.PERSISTENT_MEMORY_REQUIRED = 'true';

function response() {
  return {
    statusCode: 200,
    headers: new Map(),
    body: '',
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers.set(name, value); return this; },
    end(value) { this.body = value; return this; }
  };
}

try {
  const maintenance = await buildMaintenanceReport();
  assert.equal(maintenance.status, 'attention');
  assert.equal(maintenance.ok, false, 'maintenance ok must be false when audit blockers exist');
  assert.ok(maintenance.audit.warnings.length > 0);

  const res = response();
  await evolveHandler({ method: 'GET' }, res);
  assert.equal(res.statusCode, 200);
  const evolve = JSON.parse(res.body);
  assert.equal(evolve.health, 'attention');
  assert.equal(evolve.ok, false, 'evolve ok must be false when readiness is attention');
  assert.ok(evolve.blockers.length > 0);

  const methodRes = response();
  await evolveHandler({ method: 'POST' }, methodRes);
  assert.equal(methodRes.statusCode, 405);
  assert.equal(JSON.parse(methodRes.body).ok, false);
} finally {
  for (const key of keys) {
    const value = previous.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

console.log('Evolve health regression tests passed.');
