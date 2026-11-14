const TERMINAL = new Set(['COMPLETED', 'FAILED']);

export function createRecoveryEngine({ maxAttempts = 2, backoffMs = 0, clock = () => new Date().toISOString() } = {}) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 0 || maxAttempts > 5) {
    throw new Error('maxAttempts must be an integer from 0 to 5.');
  }
  const attempts = new Map();
  const checkpoints = new Map();

  return Object.freeze({
    checkpoint(taskId, data, { actor = 'system' } = {}) {
      if (!taskId || !data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('A task id and checkpoint object are required.');
      }
      if (TERMINAL.has(data.status)) throw new Error('Cannot checkpoint a terminal task.');
      const record = { taskId, data: structuredClone(data), actor, savedAt: clock() };
      checkpoints.set(taskId, record);
      return structuredClone(record);
    },

    getCheckpoint(taskId) {
      const record = checkpoints.get(taskId);
      return record ? structuredClone(record) : null;
    },

    async recover(taskId, handler) {
      if (typeof handler !== 'function') throw new Error('Recovery handler is required.');
      const current = attempts.get(taskId) || 0;
      if (current >= maxAttempts) return { recovered: false, attempts: current, reason: 'Retry budget exhausted.' };
      const checkpoint = checkpoints.get(taskId);
      if (!checkpoint) return { recovered: false, attempts: current, reason: 'No verified checkpoint available.' };
      attempts.set(taskId, current + 1);
      if (backoffMs > 0) await new Promise((resolve) => setTimeout(resolve, backoffMs));
      try {
        const result = await handler(structuredClone(checkpoint.data), current + 1);
        return { recovered: true, attempts: current + 1, result };
      } catch (error) {
        return { recovered: false, attempts: current + 1, reason: String(error?.message || error) };
      }
    },

    getAttempts(taskId) {
      return attempts.get(taskId) || 0;
    }
  });
}
