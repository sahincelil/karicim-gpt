import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const TASK_STATES = Object.freeze([
  'QUEUED', 'INSPECTING', 'PLANNING', 'AUTHORIZED',
  'RUNNING', 'TESTING', 'VERIFIED', 'COMPLETED', 'FAILED', 'RECOVERY'
]);

const TRANSITIONS = Object.freeze({
  QUEUED: ['INSPECTING', 'FAILED'],
  INSPECTING: ['PLANNING', 'FAILED'],
  PLANNING: ['AUTHORIZED', 'FAILED'],
  AUTHORIZED: ['RUNNING', 'FAILED'],
  RUNNING: ['TESTING', 'FAILED', 'RECOVERY'],
  TESTING: ['VERIFIED', 'FAILED', 'RECOVERY'],
  VERIFIED: ['COMPLETED', 'FAILED'],
  RECOVERY: ['INSPECTING', 'FAILED'],
  FAILED: [],
  COMPLETED: []
});

const RISK_LEVELS = new Set(['low', 'medium', 'high', 'critical']);
const DEFAULT_LIMITS = Object.freeze({
  maxTasks: 1000,
  maxObjectiveLength: 4000,
  maxRuntimeMs: 300000,
  maxMemoryMb: 512,
  maxStorageMb: 100
});

function safeTask(task) {
  return {
    ...task,
    events: task.events.map(({ signature, ...event }) => event)
  };
}

function signRecord(record, key) {
  if (!key) return null;
  return createHmac('sha256', key).update(JSON.stringify(record)).digest('hex');
}

function verifyRecord(record, signature, key) {
  if (!key || !signature) return false;
  const expected = Buffer.from(signRecord(record, key), 'hex');
  const actual = Buffer.from(signature, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function verifyAuditEvent(event, key) {
  if (!event || typeof event !== 'object') return false;
  const { signature, hash, signatureValid, ...record } = event;
  const expectedHash = createHash('sha256').update(JSON.stringify(record)).digest('hex');
  if (hash !== expectedHash) return false;
  return verifyRecord({ ...record, hash }, signature, key);
}

export function createCommand0Kernel({
  filePath = path.resolve('./data/command0-kernel.json'),
  signingKey = process.env.COMMAND0_AUDIT_KEY || '',
  limits = {},
  allowedCapabilities = [],
  authorizeOwner = async () => false,
  clock = () => new Date().toISOString()
} = {}) {
  const resourceLimits = { ...DEFAULT_LIMITS, ...limits };
  const capabilities = new Set(allowedCapabilities);
  let state;
  let halted = false;
  let writeChain = Promise.resolve();

  async function load() {
    if (state) return state;
    try {
      const parsed = JSON.parse(await readFile(filePath, 'utf8'));
      state = {
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        idempotency: parsed.idempotency && typeof parsed.idempotency === 'object' ? parsed.idempotency : {},
        audit: Array.isArray(parsed.audit) ? parsed.audit : []
      };
      halted = parsed.halted === true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      state = { tasks: [], idempotency: {}, audit: [] };
    }
    return state;
  }

  async function persist() {
    await load();
    const snapshot = JSON.stringify({ ...state, halted }, null, 2);
    const directory = path.dirname(filePath);
    await mkdir(directory, { recursive: true });
    const temporary = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(temporary, snapshot, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    await rename(temporary, filePath);
  }

  function audit(actor, action, taskId, details = {}) {
    const record = {
      id: randomUUID(),
      at: clock(),
      actor,
      action,
      taskId: taskId || null,
      details,
      previousHash: state.audit.at(-1)?.hash || null
    };
    const hash = createHash('sha256').update(JSON.stringify(record)).digest('hex');
    const signed = { ...record, hash };
    signed.signature = signRecord(signed, signingKey);
    state.audit.push(signed);
    return signed;
  }

  async function serialized(operation) {
    const run = writeChain.then(operation);
    writeChain = run.catch(() => {});
    return run;
  }

  return Object.freeze({
    async createTask(input = {}) {
      return serialized(async () => {
        await load();
        if (halted) throw new Error('Kernel is halted.');
        const objective = String(input.objective || '').trim();
        if (!objective || objective.length > resourceLimits.maxObjectiveLength) {
          throw new Error('A valid task objective is required.');
        }
        const idempotencyKey = String(input.idempotencyKey || '').trim();
        if (!idempotencyKey || idempotencyKey.length > 200) {
          throw new Error('A bounded idempotencyKey is required.');
        }
        const existingId = state.idempotency[idempotencyKey];
        if (existingId) return safeTask(state.tasks.find((task) => task.id === existingId));
        if (state.tasks.length >= resourceLimits.maxTasks) throw new Error('Task quota exceeded.');

        const riskLevel = input.riskLevel || 'medium';
        if (!RISK_LEVELS.has(riskLevel)) throw new Error('Invalid risk level.');
        const budget = {
          runtimeMs: Number(input.resourceBudget?.runtimeMs ?? 30000),
          memoryMb: Number(input.resourceBudget?.memoryMb ?? 128),
          storageMb: Number(input.resourceBudget?.storageMb ?? 10)
        };
        if (!Object.values(budget).every(Number.isFinite) ||
            budget.runtimeMs < 1 || budget.runtimeMs > resourceLimits.maxRuntimeMs ||
            budget.memoryMb < 1 || budget.memoryMb > resourceLimits.maxMemoryMb ||
            budget.storageMb < 1 || budget.storageMb > resourceLimits.maxStorageMb) {
          throw new Error('Task resource budget exceeds kernel limits.');
        }

        const requiredCapabilities = [...new Set((input.requiredCapabilities || []).map(String))];
        const task = {
          id: randomUUID(),
          idempotencyKey,
          objective,
          requiredCapabilities,
          riskLevel,
          resourceBudget: budget,
          status: 'QUEUED',
          createdAt: clock(),
          updatedAt: clock(),
          result: null,
          verification: null,
          events: []
        };
        state.tasks.push(task);
        state.idempotency[idempotencyKey] = task.id;
        const event = audit('owner-request', 'TASK_CREATED', task.id, { riskLevel, requiredCapabilities });
        task.events.push(event);
        await persist();
        return safeTask(task);
      });
    },

    async transitionTask(taskId, nextState, { actor = 'system', evidence = null } = {}) {
      return serialized(async () => {
        await load();
        if (halted && nextState === 'RUNNING') throw new Error('Emergency halt is active.');
        const task = state.tasks.find((item) => item.id === taskId);
        if (!task) throw new Error('Task not found.');
        if (!TASK_STATES.includes(nextState) || !TRANSITIONS[task.status].includes(nextState)) {
          throw new Error(`Invalid task transition: ${task.status} -> ${nextState}`);
        }
        if (nextState === 'AUTHORIZED') {
          if (actor !== 'owner' || !(await authorizeOwner({ action: 'authorize-task', taskId, evidence }))) {
            throw new Error('Authenticated owner approval is required.');
          }
          const missing = task.requiredCapabilities.filter((capability) => !capabilities.has(capability));
          if (missing.length) throw new Error(`Capabilities not granted: ${missing.join(', ')}`);
          if (['high', 'critical'].includes(task.riskLevel) && !evidence?.approvalReference) {
            throw new Error('High-risk tasks require an explicit owner approval reference.');
          }
        }
        if (nextState === 'VERIFIED' && (!evidence || !evidence.testPassed || !evidence.evidenceRef)) {
          throw new Error('Verification requires passing test evidence and an evidence reference.');
        }
        const previousState = task.status;
        task.status = nextState;
        task.updatedAt = clock();
        if (nextState === 'VERIFIED') task.verification = evidence;
        if (nextState === 'COMPLETED') task.result = evidence?.summary || 'Completed with verification evidence.';
        const event = audit(actor, 'TASK_TRANSITION', task.id, { from: previousState, to: nextState, evidenceRef: evidence?.evidenceRef || null });
        task.events.push(event);
        await persist();
        return safeTask(task);
      });
    },

    async getTask(taskId) {
      await load();
      const task = state.tasks.find((item) => item.id === taskId);
      return task ? safeTask(task) : null;
    },

    async listTasks() {
      await load();
      return state.tasks.map(safeTask);
    },

    async getAudit() {
      await load();
      return state.audit.map((event) => ({ ...event, signatureValid: signingKey ? verifyAuditEvent(event, signingKey) : null }));
    },

    async emergencyHalt(actor = 'owner') {
      if (actor !== 'owner' || !(await authorizeOwner({ action: 'emergency-halt' }))) {
        throw new Error('Authenticated owner approval is required.');
      }
      await serialized(async () => {
        await load();
        halted = true;
        audit(actor, 'EMERGENCY_HALT', null);
        await persist();
      });
      return { halted: true };
    },

    async resume(actor = 'owner') {
      if (actor !== 'owner' || !(await authorizeOwner({ action: 'resume-kernel' }))) {
        throw new Error('Authenticated owner approval is required.');
      }
      await serialized(async () => {
        await load();
        halted = false;
        audit(actor, 'KERNEL_RESUMED', null);
        await persist();
      });
      return { halted: false };
    },

    getStatus() {
      return { halted, state: 'local-kernel', signingEnabled: Boolean(signingKey), allowedCapabilities: [...capabilities] };
    }
  });
}
