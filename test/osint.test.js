import assert from 'node:assert/strict';
import osintHandler, { isAllowedDomain, normalizeDomain, parseCdxRecords, parseCtRecords } from '../api/osint.js';

assert.equal(normalizeDomain(' Example.COM. '), 'example.com');
assert.equal(normalizeDomain('https://example.com'), null);
assert.equal(normalizeDomain('localhost'), null);
assert.equal(normalizeDomain('example.com/path'), null);
assert.equal(isAllowedDomain('api.example.com', ['example.com']), true);
assert.equal(isAllowedDomain('notexample.com', ['example.com']), false);

const ct = parseCtRecords([
  { name_value: 'example.com\nwww.example.com\n*.mail.example.com\nbadexample.com' },
  { name_value: 'docs.example.com' }
], 'example.com');
assert.deepEqual(ct, ['docs.example.com', 'mail.example.com', 'www.example.com']);

const cdx = parseCdxRecords([
  ['original', 'timestamp', 'statuscode'],
  ['https://example.com/home', '20240101000000', '200'],
  ['https://api.example.com/docs', '20240202000000', '200'],
  ['https://example.com.evil.test/leak', '20240303000000', '200'],
  ['ftp://example.com/file', '20240404000000', '200']
], 'example.com');
assert.equal(cdx.length, 2);
assert.deepEqual(cdx[0], { host: 'api.example.com', snapshots: 1, oldestSnapshot: '2024-02-02', newestSnapshot: '2024-02-02' });

function response() {
  const headers = new Map();
  return {
    headers,
    statusCode: 200,
    body: '',
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { headers.set(name, value); return this; },
    end(value) { this.body = String(value || ''); }
  };
}

const originalToken = process.env.OSINT_ADMIN_TOKEN;
const originalDomains = process.env.OSINT_ALLOWED_DOMAINS;
const originalFetch = globalThis.fetch;
try {
  process.env.OSINT_ADMIN_TOKEN = 'test-secret';
  process.env.OSINT_ALLOWED_DOMAINS = 'example.com';
  const unauthorizedRes = response();
  await osintHandler({
    method: 'POST',
    headers: { authorization: 'Bearer wrong-secret' },
    socket: { remoteAddress: '203.0.113.201' },
    body: { targetDomain: 'example.com' }
  }, unauthorizedRes);
  assert.equal(unauthorizedRes.statusCode, 401);

  const blockedRes = response();
  await osintHandler({
    method: 'POST',
    headers: { authorization: 'Bearer test-secret' },
    socket: { remoteAddress: '203.0.113.202' },
    body: { targetDomain: 'example.org' }
  }, blockedRes);
  assert.equal(blockedRes.statusCode, 403);

  globalThis.fetch = async (input) => {
    const url = new URL(input);
    if (url.hostname === 'crt.sh') {
      return { ok: true, json: async () => [{ name_value: 'www.example.com\napi.example.com' }] };
    }
    if (url.hostname === 'web.archive.org') {
      return { ok: true, json: async () => [['original', 'timestamp', 'statuscode'], ['https://example.com/', '20250101000000', '200']] };
    }
    throw new Error('Unexpected source');
  };

  const successRes = response();
  await osintHandler({
    method: 'POST',
    headers: { authorization: 'Bearer test-secret' },
    socket: { remoteAddress: '203.0.113.203' },
    body: { targetDomain: 'example.com' }
  }, successRes);
  assert.equal(successRes.statusCode, 200);
  const output = JSON.parse(successRes.body);
  assert.equal(output.ok, true);
  assert.equal(output.findings.subdomains.length, 2);
  assert.equal(output.findings.archivedHosts[0].host, 'example.com');
} finally {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.OSINT_ADMIN_TOKEN;
  else process.env.OSINT_ADMIN_TOKEN = originalToken;
  if (originalDomains === undefined) delete process.env.OSINT_ALLOWED_DOMAINS;
  else process.env.OSINT_ALLOWED_DOMAINS = originalDomains;
}

console.log('OSINT passive-domain tests passed.');
