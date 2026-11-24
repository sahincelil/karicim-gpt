import assert from 'node:assert/strict';
import { healthPayload } from '../api/legion-health.js';

const fixed = new Date('2026-11-24T12:00:00.000Z');
const payload = healthPayload(fixed);

assert.equal(payload.service, 'LEGION Independent AI Gateway');
assert.equal(payload.status, 'online');
assert.equal(payload.version, '0.1.0');
assert.equal(payload.deployment, 'hybrid-ready');
assert.ok(payload.capabilities.includes('healthcheck'));
assert.equal(payload.integrations.localOllama, 'client-managed');
assert.equal(payload.integrations.persistentMemory, 'not-configured');
assert.equal(payload.timestamp, fixed.toISOString());

console.log('LEGION Independent AI health contract: PASS');
