import crypto from 'node:crypto';

const MAX_SKEW_MS = 5 * 60 * 1000;

// Signs the timestamp and the exact JSON.stringify(req.body) representation.
export function verifyProviderRequest(req) {
  const secret = process.env.PROVIDER_SHARED_SECRET;
  const timestamp = req.headers['x-provider-timestamp'];
  const signature = req.headers['x-provider-signature'];
  if (!secret || !timestamp || typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return false;

  const ts = Number(timestamp);
  if (!Number.isSafeInteger(ts) || Math.abs(Date.now() - ts) > MAX_SKEW_MS) return false;
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return false;

  const body = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest();
  const supplied = Buffer.from(signature, 'hex');
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

export function providerRequestBytes(req) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return 0;
  return Buffer.byteLength(JSON.stringify(req.body), 'utf8');
}
