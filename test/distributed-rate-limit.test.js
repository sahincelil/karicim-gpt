import assert from 'node:assert/strict';
import { checkDistributedRateLimit } from '../lib/distributed-rate-limit.js';

const previousDatabaseUrl = process.env.DATABASE_URL;
const previousNodeEnv = process.env.NODE_ENV;
delete process.env.DATABASE_URL;
process.env.NODE_ENV = 'test';

try {
  const req = { headers: {}, socket: { remoteAddress: '198.51.100.234' } };
  const first = await checkDistributedRateLimit(req, '/api/chat');
  assert.equal(first.allowed, true);
  assert.equal(first.backend, 'local');
  assert.equal(first.limit, 20);
  console.log('Distributed rate-limit local fallback tests passed.');
} finally {
  if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = previousDatabaseUrl;
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousNodeEnv;
}
