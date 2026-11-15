import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createRedisService } from '../lib/redis-client.js';

test('Redis remains disabled when REDIS_URL is absent', async () => {
  let clientCreated = false;
  const service = createRedisService({
    env: {},
    clientFactory: () => {
      clientCreated = true;
      throw new Error('should not create a client');
    }
  });

  assert.deepEqual(await service.health(), {
    configured: false,
    status: 'disabled'
  });
  assert.equal(clientCreated, false);
});

test('Redis health connects once and checks PING on each request', async () => {
  let connectCalls = 0;
  let pingCalls = 0;
  let closeCalls = 0;
  let options;
  const fakeClient = new EventEmitter();
  fakeClient.isOpen = false;
  fakeClient.connect = async () => {
    connectCalls += 1;
    fakeClient.isOpen = true;
  };
  fakeClient.ping = async () => {
    pingCalls += 1;
    return 'PONG';
  };
  fakeClient.close = async () => {
    closeCalls += 1;
    fakeClient.isOpen = false;
  };

  const service = createRedisService({
    env: { REDIS_URL: 'redis://legion:secret@127.0.0.1:6379' },
    clientFactory: (config) => {
      options = config;
      return fakeClient;
    }
  });

  assert.deepEqual(await service.health(), {
    configured: true,
    status: 'ready',
    ping: 'PONG'
  });
  assert.deepEqual(await service.health(), {
    configured: true,
    status: 'ready',
    ping: 'PONG'
  });
  assert.equal(connectCalls, 1);
  assert.equal(pingCalls, 2);
  assert.equal(options.url, 'redis://legion:secret@127.0.0.1:6379');

  await service.close();
  assert.equal(closeCalls, 1);
});

test('Redis health reports a safe unavailable state when connection fails', async () => {
  const fakeClient = new EventEmitter();
  fakeClient.isOpen = false;
  fakeClient.connect = async () => {
    throw new Error('secret-bearing connection error');
  };
  fakeClient.destroy = () => {};

  const service = createRedisService({
    env: { REDIS_URL: 'redis://legion:secret@127.0.0.1:6379' },
    clientFactory: () => fakeClient
  });

  const result = await service.health();
  assert.deepEqual(result, {
    configured: true,
    status: 'unavailable'
  });
  assert.equal(JSON.stringify(result).includes('secret'), false);
  await service.close();
});
