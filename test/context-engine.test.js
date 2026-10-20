import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const dir = await mkdtemp(path.join(os.tmpdir(), 'karicim-context-'));
process.env.CONTEXT_FILE = path.join(dir, 'context.json');
const { createContext, deriveContexts, searchContexts, contextHealth } = await import('../lib/context-engine.js');

try {
  const created = await createContext({ text: 'Önceliğim otomatik bağlam yönetimi.', tags: ['preference'] });
  assert.equal(created.text, 'Önceliğim otomatik bağlam yönetimi.');
  const duplicate = await createContext({ text: 'Önceliğim otomatik bağlam yönetimi.' });
  assert.equal(duplicate.deduplicated, true);

  const derived = await deriveContexts({ text: 'Bu sadece sıradan bir cümle. Projede MCP context özelliğini geliştirmek istiyorum. Tercihim kalıcı hafıza.' });
  assert.ok(derived.created >= 1);
  assert.ok((await searchContexts('MCP')).length >= 1);
  assert.equal((await contextHealth()).ok, true);

  await assert.rejects(
    () => createContext({ text: 'api_key=sk-abcdefghijklmnopqrstuvwxyz123456' }),
    /Gizli anahtar/
  );
  console.log('context-engine tests passed');
} finally {
  await rm(dir, { recursive: true, force: true });
}
