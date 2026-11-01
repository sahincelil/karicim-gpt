import assert from 'node:assert/strict';
import { clientKey, rateLimit, securityHeaders } from '../lib/security.js';

delete process.env.TRUST_PROXY_HOPS;
const req = { headers: { 'x-forwarded-for': '203.0.113.9' }, socket: { remoteAddress: '127.0.0.1' } };
assert.equal(clientKey(req), '127.0.0.1', 'untrusted forwarded headers must be ignored');

process.env.TRUST_PROXY_HOPS = '1';
assert.equal(clientKey({
  headers: { 'x-forwarded-for': '203.0.113.9' },
  socket: { remoteAddress: '10.0.0.1' }
}), '203.0.113.9', 'one explicitly trusted proxy hop should expose the client address');

process.env.TRUST_PROXY_HOPS = '2';
assert.equal(clientKey({
  headers: { 'x-forwarded-for': '198.51.100.4, 203.0.113.9' },
  socket: { remoteAddress: '10.0.0.1' }
}), '198.51.100.4', 'select the client address before two trusted proxy hops');
process.env.TRUST_PROXY_HOPS = '1';

assert.equal(clientKey({
  headers: { 'x-forwarded-for': 'attacker.invalid' },
  socket: { remoteAddress: '10.0.0.1' }
}), '10.0.0.1', 'invalid forwarded addresses must fall back to the socket peer');

process.env.TRUST_PROXY_HOPS = '0';
assert.equal(clientKey({
  headers: { 'x-forwarded-for': '203.0.113.9' },
  socket: { remoteAddress: '192.0.2.8' }
}), '192.0.2.8', 'zero trusted hops must ignore forwarded headers');
process.env.TRUST_PROXY_HOPS = '1garbage';
assert.equal(clientKey({
  headers: { 'x-forwarded-for': '203.0.113.9' },
  socket: { remoteAddress: '192.0.2.9' }
}), '192.0.2.9', 'malformed proxy hop configuration must not enable trust');
delete process.env.TRUST_PROXY_HOPS;

const first = rateLimit(req);
assert.equal(first.allowed, true);
assert.equal(first.remaining, 19);

const headers = new Map();
const res = { setHeader(name, value) { headers.set(name, value); } };
securityHeaders(res);
assert.equal(headers.get('X-Content-Type-Options'), 'nosniff');
assert.equal(headers.get('X-Frame-Options'), 'DENY');
assert.equal(headers.get('Referrer-Policy'), 'no-referrer');
assert.equal(headers.get('X-Robots-Tag'), 'noindex, nofollow');

const limitedReq = { headers: {}, socket: { remoteAddress: '198.51.100.7' } };
for (let i = 0; i < 20; i += 1) assert.equal(rateLimit(limitedReq).allowed, true);
const blocked = rateLimit(limitedReq);
assert.equal(blocked.allowed, false);
assert.equal(blocked.remaining, 0);
assert.equal(typeof blocked.retryAfter, 'number');

console.log('Security unit tests passed.');
