import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = await mkdtemp(join(tmpdir(), 'karicim-improvement-'));
process.env.DATA_DIR = dir;
process.env.IMPROVEMENT_FILE = join(dir, 'improvement-proposals.json');
const { proposeImprovement, recordImprovementProposal, improvementSnapshot } = await import('../lib/self-improvement.js');

test('improvement proposal classifies memory weakness', () => {
  const proposal = proposeImprovement({ summary: 'memory recall regression', failures: [{ name: 'recall' }] });
  assert.equal(proposal.area, 'memory');
  assert.match(proposal.verification, /benchmark/i);
  assert.equal(proposal.status, 'proposed');
});

test('improvement proposal preserves safety boundary', () => {
  const proposal = proposeImprovement({ summary: 'provider timeout' });
  assert.equal(proposal.area, 'reliability');
  assert.match(proposal.guardrail, /secrets/i);
  assert.match(proposal.guardrail, /external systems/i);
});

test('proposals persist and expose verification requirements', async () => {
  const proposal = await recordImprovementProposal({ summary: 'timeout in bounded executor' });
  const snapshot = await improvementSnapshot();
  assert.equal(snapshot.metrics.generated, 1);
  assert.equal(snapshot.recentProposals[0].id, proposal.id);
  assert.match(snapshot.recentProposals[0].verification, /regression suite/i);
  const raw = JSON.parse(await readFile(join(dir, 'improvement-proposals.json'), 'utf8'));
  assert.equal(raw.proposals.length, 1);
});

await rm(dir, { recursive: true, force: true });
