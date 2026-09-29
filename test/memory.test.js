import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const dir = await mkdtemp(path.join(os.tmpdir(), 'karicimgpt-memory-'));
process.env.MEMORY_FILE = path.join(dir, 'memory.json');

const { remember, recall, memoryHealth } = await import('../lib/memory.js');

try {
  const empty = await memoryHealth();
  assert.deepEqual(empty, { ok: true, count: 0, backend: 'file' });

  const first = await remember({ text: 'Bridge güvenlik testi', tags: ['security', 'bridge'] });
  assert.equal(typeof first.id, 'string');
  assert.equal(first.text, 'Bridge güvenlik testi');
  assert.deepEqual(first.tags, ['security', 'bridge']);

  const found = await recall('SECURITY', 10);
  assert.equal(found.length, 1);
  assert.equal(found[0].id, first.id);

  const latest = await recall('', 1);
  assert.equal(latest.length, 1);
  assert.equal(latest[0].id, first.id);

  await assert.rejects(() => remember({ text: '   ' }), /Memory text is required/);

  const stored = JSON.parse(await readFile(process.env.MEMORY_FILE, 'utf8'));
  assert.equal(stored.length, 1);

  const healthy = await memoryHealth();
  assert.equal(healthy.count, 1);
} finally {
  await rm(dir, { recursive: true, force: true });
}

console.log('Memory unit tests passed.');
