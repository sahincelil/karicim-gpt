import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = await mkdtemp(join(tmpdir(), 'karicimgpt-knowledge-'));
process.env.DATA_DIR = dir;
process.env.KNOWLEDGE_FILE = join(dir, 'knowledge.json');
const { loadKnowledgeState, recordKnowledge, recallKnowledge } = await import('../lib/knowledge.js');

test('knowledge rejects non-HTTPS sources', async () => {
  await assert.rejects(() => recordKnowledge({ fact: 'A durable factual finding', sourceUrl: 'http://example.com', evidence: 'evidence' }));
});

test('knowledge merges independent sources and raises confidence', async () => {
  const first = await recordKnowledge({ fact: 'Node supports modern JavaScript modules', sourceUrl: 'https://example.com/a', evidence: 'module evidence', tags: ['node', 'runtime'] });
  assert.equal(first.confidence, 0.5);
  const merged = await recordKnowledge({ fact: 'Node supports modern JavaScript modules', sourceUrl: 'https://example.org/b', evidence: 'independent evidence', tags: ['javascript'] });
  assert.equal(merged.sources.length, 2);
  assert.equal(merged.confidence, 0.7);
});

test('knowledge recall is bounded and relevant', async () => {
  const state = await loadKnowledgeState();
  const results = recallKnowledge(state, 'Node JavaScript runtime', 99);
  assert.equal(results.length, 1);
  assert.match(results[0].fact, /Node/);
  const saved = JSON.parse(await readFile(process.env.KNOWLEDGE_FILE, 'utf8'));
  assert.equal(saved.records.length, 1);
});
