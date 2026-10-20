import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const dir = await mkdtemp(path.join(os.tmpdir(), 'karicim-context-'));
process.env.CONTEXT_FILE = path.join(dir, 'context.json');
delete process.env.VERCEL;
const { createContext, deriveContexts, searchContexts, contextHealth } = await import('../lib/context-engine.js');

try {
  const created = await createContext({ text: 'Önceliğim otomatik bağlam yönetimi.', tags: ['preference'] });
  assert.equal(created.text, 'Önceliğim otomatik bağlam yönetimi.');
  const duplicate = await createContext({ text: 'Önceliğim otomatik bağlam yönetimi.' });
  assert.equal(duplicate.deduplicated, true);

  const derived = await deriveContexts({ text: 'Bu sadece sıradan bir cümle. Projede MCP context özelliğini geliştirmek istiyorum. Tercihim kalıcı hafıza.' });
  assert.ok(derived.created >= 1, 'Turkish inflected cues should derive at least one context');
  assert.ok((await searchContexts('MCP')).length >= 1);
  await createContext({ text: 'İstanbul için bağlam araması testi.' });
  assert.equal((await searchContexts('istanbul')).length, 1, 'dotted-I Turkish search should be case-insensitive');
  assert.equal((await contextHealth()).ok, true);

  const parallel = await Promise.all(
    Array.from({ length: 30 }, (_, index) => createContext({ text: `Concurrent unique record number ${index}.` }))
  );
  assert.equal(parallel.length, 30);
  const concurrentSearch = await searchContexts('Concurrent unique record', 50);
  assert.equal(concurrentSearch.length, 30, 'parallel writes must not overwrite one another within the process');

  for (const secret of [
    'api_key=sk-abcdefghijklmnopqrstuvwxyz123456',
    'xai-abcdefghijklmnopqrstuvwxyz1234567890',
    'ghp_abcdefghijklmnopqrstuvwxyz1234567890',
    'github_pat_abcdefghijklmnopqrstuvwxyz1234567890'
  ]) {
    await assert.rejects(() => createContext({ text: secret }), /Gizli anahtar/);
  }

  const repeated = 'Tercihim bağlamın yinelenmeden kaydedilmesi.';
  const firstAuto = await deriveContexts({ text: repeated });
  const secondAuto = await deriveContexts({ text: repeated });
  assert.equal(firstAuto.created, 1);
  assert.equal(secondAuto.created, 0, 'created must count only newly inserted records');

  process.env.VERCEL = '1';
  await assert.rejects(
    () => createContext({ text: 'Production storage must fail closed.' }),
    /Kalıcı bağlam deposu yapılandırılmadı/
  );
  assert.equal((await contextHealth()).ok, false);
  console.log('context-engine tests passed');
} finally {
  delete process.env.VERCEL;
  await rm(dir, { recursive: true, force: true });
}
