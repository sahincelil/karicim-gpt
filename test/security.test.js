import assert from 'node:assert/strict';
import { clientKey, rateLimit, securityHeaders } from '../lib/security.js';
import { buildProposals } from '../lib/proposals.js';

const req = { headers: {}, socket: { remoteAddress: '127.0.0.1' } };
assert.equal(clientKey(req), '127.0.0.1');

const first = rateLimit(req);
assert.equal(first.allowed, true);
assert.equal(first.remaining, 19);

const headers = new Map();
const res = { setHeader(name, value) { headers.set(name, value); } };
securityHeaders(res);
assert.equal(headers.get('X-Content-Type-Options'), 'nosniff');
assert.equal(headers.get('X-Frame-Options'), 'DENY');
assert.equal(headers.get('Referrer-Policy'), 'no-referrer');
assert.equal(headers.get('X-Robots-Tag'), 'noindex, nofollow');

const limitedReq = { headers: {}, socket: { remoteAddress: '198.51.100.7' } };
for (let i = 0; i < 20; i += 1) assert.equal(rateLimit(limitedReq).allowed, true);
const blocked = rateLimit(limitedReq);
assert.equal(blocked.allowed, false);
assert.equal(blocked.remaining, 0);
assert.equal(typeof blocked.retryAfter, 'number');

const proposalResult = await buildProposals();
assert.equal(proposalResult.ok, true);
const requiredProposalIds = [
  'authenticated-user-identity',
  'provider-spend-budget',
  'staging-security-evidence'
];
for (const id of requiredProposalIds) {
  const proposal = proposalResult.proposals.find((item) => item.id === id);
  assert.ok(proposal, `missing required proposal: ${id}`);
  assert.equal(proposal.autoApply, false);
  assert.ok(Array.isArray(proposal.evidenceRequired) && proposal.evidenceRequired.length > 0);
  assert.ok(typeof proposal.risk === 'string' && proposal.risk.length > 0);
  assert.ok(typeof proposal.rollbackPlan === 'string' && proposal.rollbackPlan.length > 0);
}
assert.ok(proposalResult.proposals.every((item) => item.autoApply === false));

console.log('Security and evolution-evidence tests passed.');
