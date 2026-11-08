import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentRegistry } from '../lib/command0-agent-registry.js';
import { createPolicyEngine } from '../lib/command0-policy.js';
import { createRecoveryEngine } from '../lib/command0-recovery.js';

test('only owner registers agents and grants pre-approved capabilities', () => {
  const registry = createAgentRegistry({ grantedCapabilities: ['read:docs'] });
  assert.throws(() => registry.register({ id: 'worker' }), /Only the owner/);
  assert.throws(() => registry.register({ id: 'worker', capabilities: ['admin'] }, { actor: 'owner' }), /not granted/);
  const agent = registry.register({ id: 'worker', capabilities: ['read:docs'] }, { actor: 'owner' });
  assert.equal(agent.status, 'healthy');
});

test('agent leases enforce capability and concurrency limits', () => {
  const registry = createAgentRegistry({ grantedCapabilities: ['read:docs'] });
  registry.register({ id: 'reader', capabilities: ['read:docs'], maxConcurrency: 1 }, { actor: 'owner' });
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
