const RISK = new Set(['low', 'medium', 'high', 'critical']);

export function createAgentRegistry({ grantedCapabilities = [], maxAgents = 32 } = {}) {
  const grantable = new Set(grantedCapabilities);
  const agents = new Map();
  const active = new Map();

  return Object.freeze({
    register(descriptor, { actor = 'system' } = {}) {
      if (actor !== 'owner') throw new Error('Only the owner can register agents.');
      const id = String(descriptor?.id || '').trim();
      if (!/^[a-zA-Z0-9._-]{1,80}$/.test(id)) throw new Error('Invalid agent id.');
      if (agents.size >= maxAgents && !agents.has(id)) throw new Error('Agent registry quota exceeded.');
      const capabilities = [...new Set((descriptor.capabilities || []).map(String))];
      const denied = capabilities.filter((capability) => !grantable.has(capability));
      if (denied.length) throw new Error(`Capabilities not granted by owner: ${denied.join(', ')}`);
      const maxConcurrency = Number(descriptor.maxConcurrency ?? 1);
      if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1 || maxConcurrency > 16) {
        throw new Error('maxConcurrency must be an integer from 1 to 16.');
      }
      const agent = {
        id,
        capabilities,
        maxConcurrency,
        status: 'healthy',
        registeredAt: new Date().toISOString()
      };
      agents.set(id, agent);
      active.set(id, 0);
      return { ...agent };
    },

    setHealth(id, status, { actor = 'system' } = {}) {
      if (!['healthy', 'degraded', 'offline'].includes(status)) throw new Error('Invalid health status.');
      if (actor !== 'owner' && actor !== id) throw new Error('Agent may only report its own health.');
      const agent = agents.get(id);
      if (!agent) throw new Error('Unknown agent.');
      agent.status = status;
      return { ...agent };
    },

    acquire(id, requiredCapabilities = []) {
      const agent = agents.get(id);
      if (!agent) throw new Error('Unknown agent.');
      if (agent.status !== 'healthy') throw new Error('Agent is not healthy.');
      if ((active.get(id) || 0) >= agent.maxConcurrency) throw new Error('Agent concurrency limit reached.');
      const missing = requiredCapabilities.filter((capability) => !agent.capabilities.includes(capability));
      if (missing.length) throw new Error(`Agent lacks capabilities: ${missing.join(', ')}`);
      active.set(id, (active.get(id) || 0) + 1);
      let released = false;
      return Object.freeze({
        agent: { ...agent },
        release() {
          if (released) return false;
          released = true;
          active.set(id, Math.max(0, (active.get(id) || 0) - 1));
          return true;
        }
      });
    },

    list() {
      return [...agents.values()].map((agent) => ({ ...agent, activeTasks: active.get(agent.id) || 0 }));
    }
  });
}
