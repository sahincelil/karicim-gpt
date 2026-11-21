import assert from 'node:assert/strict';
import { normalizeInventory, scoreFindings, cyberShieldLimits } from '../lib/cyber-shield.js';

const sample = {
  assets: [
    {
      assetId: 'prod-edge-01',
      name: 'Production edge server',
      criticality: 'critical',
      internetExposed: true,
      environment: 'production',
      findings: [{ cveId: 'CVE-2021-44228', patchAvailableAt: '2026-10-01T00:00:00Z' }]
    },
    {
      assetId: 'internal-test-01',
      name: 'Internal test server',
      criticality: 'low',
      internetExposed: false,
      environment: 'development',
      findings: [{ cveId: 'CVE-2024-12345' }]
    },
    {
      assetId: 'verified-01',
      name: 'Patched server',
      criticality: 'critical',
      internetExposed: true,
      environment: 'production',
      findings: [{
        cveId: 'CVE-2023-12345',
        patchAppliedAt: '2026-11-18T00:00:00Z',
        verifiedAt: '2026-11-19T00:00:00Z'
      }]
    }
  ]
};

const normalized = normalizeInventory(sample);
assert.equal(normalized.assets.length, 3);
assert.equal(normalized.totalFindings, 3);
assert.equal(normalized.uniqueCves.length, 3);
assert.equal(cyberShieldLimits.maxAssets, 100);

assert.throws(() => normalizeInventory({ assets: [] }), /assets alanı/);
assert.throws(() => normalizeInventory({ assets: [{ ...sample.assets[0], assetId: '../invalid' }] }), /assetId/);
assert.throws(() => normalizeInventory({ assets: [{ ...sample.assets[0], findings: [{ cveId: 'NOT-A-CVE' }] }] }), /Geçersiz CVE/);
assert.throws(() => normalizeInventory({ assets: [{ ...sample.assets[0], findings: [{ cveId: 'CVE-2023-12345', verifiedAt: '2026-11-20T00:00:00Z' }] }] }), /patchAppliedAt/);

const intel = {
  kev: { map: new Map([['CVE-2021-44228', { dateAdded: '2021-12-10', dueDate: '2021-12-24', vendorProject: 'Apache', product: 'Log4j' }]]) },
  epss: new Map([
    ['CVE-2021-44228', { score: 0.98, percentile: 0.999, date: '2026-11-20' }],
    ['CVE-2024-12345', { score: 0.01, percentile: 0.1, date: '2026-11-20' }]
  ])
};
const results = scoreFindings(normalized.assets, intel, Date.parse('2026-11-21T00:00:00Z'));
assert.equal(results[0].cveId, 'CVE-2021-44228');
assert.equal(results[0].priority, 'critical');
assert.equal(results[0].kev.listed, true);
assert.equal(results[1].cveId, 'CVE-2024-12345');
assert.equal(results.find(item => item.assetId === 'verified-01').patchStatus, 'verified_remediated');
assert.equal(results.find(item => item.assetId === 'verified-01').score, 0);
console.log('Cyber Shield unit tests passed.');
