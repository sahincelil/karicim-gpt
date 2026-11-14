import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyProviderRequest, providerRequestBytes } from '../lib/provider-auth.js';

const previous = process.env.PROVIDER_SHARED_SECRET;
const secret = 'provider-auth-test-secret-with-sufficient-entropy';
process.env.PROVIDER_SHARED_SECRET = secret;

function makeRequest({ body = { messages: [{ role: 'user', content: 'hello' }] }, timestamp = String(Date.now()), signatureOverride } = {}) {
  const serialized = JSON.stringify(body);
  const signature = crypto.createHmac('sha256', secret)
    .update(`${timestamp}.${serialized}`)
    .digest('hex');
  return {
    headers: {
      'x-provider-timestamp': timestamp,
      'x-provider-signature': signatureOverride ?? signature
    },
    body
  };
}

try {
  const valid = makeRequest();
  assert.equal(verifyProviderRequest(valid), true, 'accepts a correctly signed request');
  assert.equal(providerRequestBytes(valid), Buffer.byteLength(JSON.stringify(valid.body), 'utf8'));

  const tampered = makeRequest({ signatureOverride: '0'.repeat(64) });
  assert.equal(verifyProviderRequest(tampered), false, 'rejects an incorrect signature');

  const expired = makeRequest({ timestamp: String(Date.now() - (6 * 60 * 1000)) });
  assert.equal(verifyProviderRequest(expired), false, 'rejects a timestamp outside the freshness window');

  const arrayBody = makeRequest({ body: [] });
  assert.equal(verifyProviderRequest(arrayBody), false, 'rejects array request bodies');

  const missingSecret = makeRequest();
  delete process.env.PROVIDER_SHARED_SECRET;
  assert.equal(verifyProviderRequest(missingSecret), false, 'rejects requests when the shared secret is absent');

  console.log('Provider request authentication tests: OK');
} finally {
  if (previous === undefined) delete process.env.PROVIDER_SHARED_SECRET;
  else process.env.PROVIDER_SHARED_SECRET = previous;
}
