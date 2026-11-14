import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyProviderRequest, providerRequestBytes } from '../lib/provider-auth.js';

const secret = 'test-only-provider-secret-that-is-long-enough';
process.env.PROVIDER_SHARED_SECRET = secret;

function signedRequest(body, timestamp = String(Date.now())) {
  const serialized = JSON.stringify(body);
  const signature = crypto.createHmac('sha256', secret)
    .update(`${timestamp}.${serialized}`)
    .digest('hex');
  return { method: 'POST', headers: {
    'x-provider-timestamp': timestamp,
    'x-provider-signature': signature
  }, body };
}

const body = { messages: [{ role: 'user', content: 'hello' }] };
const valid = signedRequest(body);
assert.equal(verifyProviderRequest(valid), true, 'valid signature should pass');
assert.equal(providerRequestBytes(valid), Buffer.byteLength(JSON.stringify(body)), 'body size should be measured from canonical JSON');

const tampered = { ...valid, body: { messages: [{ role: 'user', content: 'tampered' }] } };
assert.equal(verifyProviderRequest(tampered), false, 'tampered body should fail');

const stale = signedRequest(body, String(Date.now() - 6 * 60 * 1000));
assert.equal(verifyProviderRequest(stale), false, 'stale timestamp should fail');

const missing = { method: 'POST', headers: {}, body };
assert.equal(verifyProviderRequest(missing), false, 'missing signature should fail');

const arrayBody = signedRequest([]);
assert.equal(verifyProviderRequest(arrayBody), false, 'array body should fail');

console.log('LEGION provider authentication tests: OK');
