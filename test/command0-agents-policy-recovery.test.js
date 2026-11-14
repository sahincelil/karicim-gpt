import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentRegistry } from '../lib/command0-agent-registry.js';
import { createPolicyEngine } from '../lib/command0-policy.js';
import { createRecoveryEngine } from '../lib/command0-recovery.js';

const ownerAuth = async ({ action, proof }) => ['register-agent', 'revoke-agent'].includes(action) && proof === 'valid-owner-proof';
const agentAuth = async ({ action, agentId, proof }) => action === 'report-agent-health' && proof === `signed:${agentId}`;

test('agent registry requires authenticated owner proof for registration and revocation', async () => {
  const registry = createAgentRegistry({ grantedCapabilities: ['read:docs'], authorizeOwner: ownerAuth });
  await assert.rejects(registry.register({ id: 'worker' }, { actor: 'owner' }), /Authenticated owner/);
  await assert.rejects(registry.register({ id: 'worker', capabilities: ['admin'] }, { actor: 'owner', proof: 'valid-owner-proof' }), /Capabilities not granted/);
  const agent = await registry.register({ id: 'worker', capabilities: ['read:docs'] }, { actor: 'owner', proof: 'valid-owner-proof' });
  assert.equal(agent.status, 'healthy');
  await assert.rejects(registry.revoke('worker'), /Authenticated owner/);
  assert.equal(await registry.revoke('worker', { actor: 'owner', proof: 'valid-owner-proof' }), true);
  assert.throws(() => registry.acquire('worker'), /not healthy/);
});

test('agent health reports require a verifiable agent proof', async () => {
  const registry = createAgentRegistry({
    grantedCapabilities: ['read:docs'],
    authorizeOwner: ownerAuth,
    authorizeAgent: agentAuth
  });
  await registry.register({ id: 'reader', capabilities: ['read:docs'] }, { actor: 'owner', proof: 'valid-owner-proof' });
  await assert.rejects(registry.setHealth('reader', 'offline', { actor: 'reader' }), /proof/);
  const updated = await registry.setHealth('reader', 'degraded', { actor: 'reader', proof: 'signed:reader' });
  assert.equal(updated.status, 'degraded');
});

test('agent leases enforce capability and concurrency limits', async () => {
  const registry = createAgentRegistry({ grantedCapabilities: ['read:docs'], authorizeOwner: ownerAuth });
  await registry.register({ id: 'reader', capabilities: ['read:docs'], maxConcurrency: 1 }, { actor: 'owner', proof: 'valid-owner-proof' });
  const lease = registry.acquire('reader', ['read:docs']);
  assert.throws(() => registry.acquire('reader'), /concurrency limit/);
  assert.equal(lease.release(), true);
  assert.equal(lease.release(), false);
  assert.equal(registry.acquire('reader').agent.id, 'reader');
});

test('policy engine defaults to deny and requires verified approval above risk ceiling', () => {
  const policy = createPolicyEngine({
    rules: [{ capability: 'read:docs', actions: ['read'], resources: ['project-docs'], maxRisk: 'low' }],
    ownerApprovalVerifier: ({ approvalReference }) => approvalReference === 'approved-123'
  });
  assert.equal(policy.evaluate({ actor: 'agent-1', action: 'delete', resource: 'project-docs', capability: 'read:docs' }).allowed, false);
  assert.equal(policy.evaluate({ actor: 'agent-1', action: 'read', resource: 'project-docs', capability: 'read:docs', riskLevel: 'low' }).allowed, true);
  assert.equal(policy.evaluate({ actor: 'agent-1', action: 'read', resource: 'project-docs', capability: 'read:docs', riskLevel: 'critical' }).allowed, false);
  assert.equal(policy.evaluate({ actor: 'owner', action: 'read', resource: 'project-docs', capability: 'read:docs', riskLevel: 'critical', approvalReference: 'approved-123' }).allowed, true);
});

test('recovery engine requires a checkpoint and enforces retry budget', async () => {
  const recovery = createRecoveryEngine({ maxAttempts: 1 });
  assert.equal((await recovery.recover('task-1', async () => 'ok')).recovered, false);
  recovery.checkpoint('task-1', { status: 'RECOVERY', cursor: 4 });
  const first = await recovery.recover('task-1', async (checkpoint) => checkpoint.cursor + 1);
  assert.equal(first.result, 5);
  const second = await recovery.recover('task-1', async () => 'again');
  assert.equal(second.recovered, false);
  assert.equal(second.reason, 'Retry budget exhausted.');
});
