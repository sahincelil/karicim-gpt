import assert from 'node:assert/strict';
import { normalizeEvidence, normalizeSynthesis, parseSynthesis } from '../lib/council.js';

const evidence = normalizeEvidence({
  claims: ['  claim one  ', '', 42, null, 'claim two'],
  uncertainty: [' unclear ', '', 7]
});
assert.deepEqual(evidence.claims, ['claim one', '42', 'claim two']);
assert.deepEqual(evidence.uncertainty, ['unclear', '7']);

const oversized = normalizeEvidence({
  claims: Array.from({ length: 20 }, (_, i) => 'claim-' + i),
  uncertainty: Array.from({ length: 20 }, (_, i) => 'unknown-' + i)
});
assert.equal(oversized.claims.length, 8);
assert.equal(oversized.uncertainty.length, 5);

const synthesis = normalizeSynthesis({
  agreements: [' A ', '', 1],
  disagreements: [
    { topic: ' conflict ', providers: ['xai', 'openrouter', ''] },
    { topic: '', providers: ['ignored'] },
    'invalid'
  ],
  unknowns: [' unknown '],
  nextChecks: [' verify ']
});
assert.deepEqual(synthesis.agreements, ['A', '1']);
assert.deepEqual(synthesis.disagreements, [{ topic: 'conflict', providers: ['xai', 'openrouter'] }]);
assert.deepEqual(synthesis.unknowns, ['unknown']);
assert.deepEqual(synthesis.nextChecks, ['verify']);

assert.deepEqual(normalizeSynthesis(null), {
  agreements: [],
  disagreements: [],
  unknowns: [],
  nextChecks: []
});

console.log('Council schema tests passed.');

assert.equal(parseSynthesis('{"agreements":["ok"]}').ok, true);
assert.deepEqual(parseSynthesis('{bad-json').structured, { agreements: [], disagreements: [], unknowns: [], nextChecks: [] });
assert.equal(parseSynthesis('{"agreements":[null]}').ok, true);

console.log('Council parse regression tests passed.');
