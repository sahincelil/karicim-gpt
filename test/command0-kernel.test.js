import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createCommand0Kernel, verifyAuditEvent } from '../lib/command0-kernel.js';

async function fixture(t, options = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'command0-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return createCommand0Kernel({ filePath: path.join(directory, 'kernel.json'), signingKey: 'test-only-key', ...options });
}

test('idempotency key returns the original task', async (t) => {
  const kernel = await fixture(t);
  const first = await kernel.createTask({ objective: 'inspect', idempotencyKey: 'same-request' });
  const second = await kernel.createTask({ objective: 'inspect', idempotencyKey: 'same-request' });
  assert.equal(first.id, second.id);
  assert.equal((await kernel.listTasks()).length, 1);
});

test('agents cannot authorize tasks and capabilities are checked', async (t) => {
  const kernel = await fixture(t, { allowedCapabilities: ['read:project'] });
  const task = await kernel.createTask({
    objective: 'inspect project',
    idempotencyKey: 'capability-test',
    requiredCapabilities: ['read:project', 'write:production']
  });
  await kernel.transitionTask(task.id, 'INSPECTING');
  await kernel.transitionTask(task.id, 'PLANNING');
  await assert.rejects(kernel.transitionTask(task.id, 'AUTHORIZED', { actor: 'agent-1' }), /Only the owner/);
  await assert.rejects(kernel.transitionTask(task.id, 'AUTHORIZED', { actor: 'owner' }), /Capabilities not granted/);
});

test('high-risk tasks require explicit approval reference', async (t) => {
  const kernel = await fixture(t);
  const task = await kernel.createTask({ objective: 'deploy', idempotencyKey: 'risk-test', riskLevel: 'high' });
  await kernel.transitionTask(task.id, 'INSPECTING');
  await kernel.transitionTask(task.id, 'PLANNING');
  await assert.rejects(kernel.transitionTask(task.id, 'AUTHORIZED', { actor: 'owner' }), /approval reference/);
  const authorized = await kernel.transitionTask(task.id, 'AUTHORIZED', {
    actor: 'owner', evidence: { approvalReference: 'human-approval-001' }
  });
  assert.equal(authorized.status, 'AUTHORIZED');
});

test('verification requires evidence and emergency halt blocks execution', async (t) => {
  const kernel = await fixture(t);
  const task = await kernel.createTask({ objective: 'test task', idempotencyKey: 'verify-test' });
  await kernel.transitionTask(task.id, 'INSPECTING');
  await kernel.transitionTask(task.id, 'PLANNING');
  await kernel.transitionTask(task.id, 'AUTHORIZED', { actor: 'owner' });
  await kernel.emergencyHalt();
  await assert.rejects(kernel.transitionTask(task.id, 'RUNNING'), /Emergency halt/);
  await kernel.resume();
  await kernel.transitionTask(task.id, 'RUNNING');
  await kernel.transitionTask(task.id, 'TESTING');
  await assert.rejects(kernel.transitionTask(task.id, 'VERIFIED'), /Verification requires/);
  await kernel.transitionTask(task.id, 'VERIFIED', { evidence: { testPassed: true, evidenceRef: 'test-run-42' } });
  assert.equal((await kernel.getTask(task.id)).status, 'VERIFIED');
});

test('audit events are HMAC verifiable', async (t) => {
  const kernel = await fixture(t);
  await kernel.createTask({ objective: 'audit', idempotencyKey: 'audit-test' });
  const [event] = await kernel.getAudit();
  assert.equal(verifyAuditEvent(event, 'test-only-key'), true);
  assert.equal(verifyAuditEvent(event, 'wrong-key'), false);
});
