export function healthPayload(now = new Date()) {
  return {
    service: 'LEGION Independent AI Gateway',
    status: 'online',
    version: '0.1.0',
    deployment: 'hybrid-ready',
    capabilities: ['healthcheck'],
    integrations: {
      localOllama: 'client-managed',
      cloudModelProviders: 'not-configured',
      persistentMemory: 'not-configured',
      agentExecution: 'manual-queue-mvp'
    },
    timestamp: now.toISOString()
  };
}

export default function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).json(healthPayload());
}
