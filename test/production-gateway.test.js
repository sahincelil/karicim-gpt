import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function scenario({ configuredSecret, suppliedSecret, expectedStatus, expectedText }) {
  const port = await freePort();
  const env = { ...process.env, NODE_ENV: 'production', PORT: String(port), CORS_ORIGIN: '' };
  delete env.DATABASE_URL;
  if (configuredSecret === undefined) delete env.TRUSTED_GATEWAY_SECRET;
  else env.TRUSTED_GATEWAY_SECRET = configuredSecret;

  const child = spawn(process.execPath, ['server.js'], { env, stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });

  try {
    let response;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (child.exitCode !== null) throw new Error(`Server exited early: ${stderr}`);
      try {
        const headers = suppliedSecret === undefined ? {} : { 'x-karicimgpt-gateway-secret': suppliedSecret };
        response = await fetch(`http://127.0.0.1:${port}/api/body`, { headers, signal: AbortSignal.timeout(500) });
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    assert.ok(response, `Server did not become ready: ${stderr}`);
    assert.equal(response.status, expectedStatus);
    const body = await response.json();
    assert.match(body.error, new RegExp(expectedText));
  } finally {
    child.kill('SIGTERM');
    await Promise.race([
      new Promise((resolve) => child.once('exit', resolve)),
      new Promise((resolve) => setTimeout(resolve, 2000))
    ]);
    if (child.exitCode === null) child.kill('SIGKILL');
  }
}

await scenario({
  configuredSecret: undefined,
  suppliedSecret: undefined,
  expectedStatus: 503,
  expectedText: 'gateway authentication is not configured'
});
await scenario({
  configuredSecret: 'a-test-secret-that-is-at-least-32-characters-long',
  suppliedSecret: 'incorrect',
  expectedStatus: 401,
  expectedText: 'Unauthorized gateway request'
});
await scenario({
  configuredSecret: 'a-test-secret-that-is-at-least-32-characters-long',
  suppliedSecret: 'a-test-secret-that-is-at-least-32-characters-long',
  expectedStatus: 503,
  expectedText: 'API rate limit service unavailable'
});

console.log('Production gateway integration tests passed.');
