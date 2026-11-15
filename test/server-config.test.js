import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveListenHost } from '../lib/server-config.js';

test('local server defaults to loopback instead of exposing all interfaces', () => {
  assert.equal(resolveListenHost({}), '127.0.0.1');
});

test('local server accepts an explicit host override', () => {
  assert.equal(resolveListenHost({ HOST: '0.0.0.0' }), '0.0.0.0');
});

test('blank host configuration falls back to loopback', () => {
  assert.equal(resolveListenHost({ HOST: '   ' }), '127.0.0.1');
});
