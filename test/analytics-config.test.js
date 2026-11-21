import assert from 'node:assert/strict';
import handler from '../api/analytics-config.js';

function invoke(req) {
  const res = {
    headers: {},
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; return this; },
    end(body) { this.body = body; return this; }
  };
  handler(req, res);
  return res;
}

const previousDomain = process.env.PLAUSIBLE_DOMAIN;
const previousNodeEnv = process.env.NODE_ENV;

try {
  process.env.PLAUSIBLE_DOMAIN = 'example.com';
  process.env.NODE_ENV = 'production';

  const active = invoke({ method: 'GET', headers: { host: 'example.com' } });
  assert.equal(active.statusCode, 200);
  assert.deepEqual(JSON.parse(active.body), {
    enabled: true,
    domain: 'example.com',
    scriptUrl: 'https://plausible.io/js/script.js'
  });

  const preview = invoke({ method: 'GET', headers: { host: 'preview.example.com' } });
  assert.equal(JSON.parse(preview.body).enabled, false);

  const lookalike = invoke({ method: 'GET', headers: { host: 'example.com.evil.test' } });
  assert.equal(JSON.parse(lookalike.body).enabled, false);

  const forbiddenMethod = invoke({ method: 'POST', headers: { host: 'example.com' } });
  assert.equal(forbiddenMethod.statusCode, 405);

  delete process.env.PLAUSIBLE_DOMAIN;
  const defaultOff = invoke({ method: 'GET', headers: { host: 'example.com' } });
  assert.equal(JSON.parse(defaultOff.body).enabled, false);
} finally {
  if (previousDomain === undefined) delete process.env.PLAUSIBLE_DOMAIN;
  else process.env.PLAUSIBLE_DOMAIN = previousDomain;
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousNodeEnv;
}

console.log('LEGION analytics endpoint tests: OK');
