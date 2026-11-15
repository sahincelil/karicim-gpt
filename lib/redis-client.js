import { createClient } from 'redis';

export function createRedisService({
  env = process.env,
  clientFactory = createClient
} = {}) {
  const url = typeof env.REDIS_URL === 'string' ? env.REDIS_URL.trim() : '';
  let client = null;

  async function health() {
    if (!url) return { configured: false, status: 'disabled' };

    try {
      if (!client) {
        client = clientFactory({
          url,
          socket: { connectTimeout: 3000 }
        });
        client.on('error', () => {});
      }

      if (!client.isOpen) await client.connect();
      const ping = await client.ping();
      return ping === 'PONG'
        ? { configured: true, status: 'ready', ping }
        : { configured: true, status: 'degraded' };
    } catch {
      return { configured: true, status: 'unavailable' };
    }
  }

  async function close() {
    if (!client) return;

    try {
      if (client.isOpen && typeof client.close === 'function') {
        await client.close();
      } else if (typeof client.destroy === 'function') {
        client.destroy();
      }
    } finally {
      client = null;
    }
  }

  return { health, close };
}

const redisService = createRedisService();

export const redisHealth = () => redisService.health();
export const closeRedis = () => redisService.close();
