const tasks = new Map();
let timer = null;

const ALLOWED = new Set(['health', 'memory-maintenance']);

export function scheduleTask(name, intervalMs, run) {
  if (!ALLOWED.has(name)) throw new Error('Task type is not allowed');
  if (!Number.isFinite(intervalMs) || intervalMs < 30_000) throw new Error('Interval must be at least 30000ms');
  if (tasks.has(name)) clearInterval(tasks.get(name));
  const handle = setInterval(async () => {
    try { await run(); } catch (error) { console.error(`heartbeat:${name}`, error?.message || error); }
  }, intervalMs);
  tasks.set(name, handle);
  return name;
}

export function heartbeatStatus() {
  return { running: Boolean(timer), tasks: [...tasks.keys()] };
}

export function startHeartbeat(callbacks = {}) {
  if (timer) return heartbeatStatus();
  const interval = Math.max(Number(process.env.HEARTBEAT_INTERVAL_MS) || 300_000, 30_000);
  scheduleTask('health', interval, callbacks.health || (async () => {}));
  scheduleTask('memory-maintenance', interval * 2, callbacks.memoryMaintenance || (async () => {}));
  timer = true;
  return heartbeatStatus();
}

export function stopHeartbeat() {
  for (const handle of tasks.values()) clearInterval(handle);
  tasks.clear();
  timer = null;
}
