import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, [
  '--input-type=module',
  '-e',
  "import('./lib/memory.js').then(({ memoryHealth }) => memoryHealth())"
], {
  encoding: 'utf8',
  env: { ...process.env, NODE_ENV: 'production', DATABASE_URL: '' }
});

assert.notEqual(result.status, 0, 'production memory must fail closed without DATABASE_URL');
assert.match(result.stderr, /DATABASE_URL is required in production/);
console.log('Production memory configuration guard test passed.');
