import assert from 'node:assert/strict';
import { getPlausibleConfig } from '../lib/plausible.js';

const configured = getPlausibleConfig({
  configuredDomain: 'example.com',
  requestHost: 'example.com',
  nodeEnv: 'production'
});
assert.deepEqual(configured, {
  enabled: true,
  domain: 'example.com',
  scriptUrl: 'https://plausible.io/js/script.js'
});

assert.equal(getPlausibleConfig({
  configuredDomain: 'example.com',
  requestHost: 'preview.example.com',
  nodeEnv: 'production'
}).enabled, false, 'preview subdomains must not be tracked');

assert.equal(getPlausibleConfig({
  configuredDomain: 'example.com',
  requestHost: 'example.com:443',
  nodeEnv: 'development'
}).enabled, false, 'development must not be tracked');

assert.equal(getPlausibleConfig({
  configuredDomain: 'https://example.com/path',
  requestHost: 'example.com',
  nodeEnv: 'production'
}).enabled, false, 'URLs and paths are invalid domain settings');

assert.equal(getPlausibleConfig({
  configuredDomain: 'example.com',
  requestHost: 'example.com.evil.test',
  nodeEnv: 'production'
}).enabled, false, 'lookalike domains must not be tracked');

assert.equal(getPlausibleConfig({
  configuredDomain: 'example.com',
  requestHost: 'www.example.com',
  nodeEnv: 'production'
}).enabled, false, 'host matching must be exact');

console.log('LEGION Plausible configuration tests: OK');
