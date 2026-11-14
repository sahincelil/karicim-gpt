// Minimal Node.js 24 client for the existing authenticated POST /api/bridge endpoint.
// Configure BRIDGE_URL and BRIDGE_SHARED_SECRET in your local/server environment.
// Never commit secrets or print the signature/secret to logs.
import crypto from 'node:crypto';

const baseUrl = process.env.BRIDGE_URL;
const secret = process.env.BRIDGE_SHARED_SECRET;
if (!baseUrl || !secret) {
  throw new Error('Set BRIDGE_URL and BRIDGE_SHARED_SECRET in the environment.');
}

async function callBridge(payload) {
  const raw = JSON.stringify(payload);
  const timestamp = String(Date.now());
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${raw}`)
    .digest('hex');

  const response = await fetch(new URL('/api/bridge', baseUrl), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-bridge-timestamp': timestamp,
      'x-bridge-signature': signature
    },
    body: raw,
    signal: AbortSignal.timeout(45000)
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Bridge returned HTTP ${response.status}: ${result.error || 'request failed'}`);
  }
  return result;
}

const prompt = process.argv.slice(2).join(' ').trim();
if (!prompt) {
  console.error('Usage: node examples/bridge-client.mjs "Your bounded task"');
  process.exitCode = 2;
} else {
  const result = await callBridge({
    action: 'agent',
    messages: [{ role: 'user', content: prompt }]
  });
  // Provider output is untrusted data. Display it; do not execute it.
  process.log ? console.log(JSON.stringify(result, null, 2)) : undefined;
}
