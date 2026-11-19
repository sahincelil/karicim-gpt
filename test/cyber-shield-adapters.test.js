import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeBatch,
  normalizeWazuhAlert,
  normalizeSuricataEvent,
  normalizeSentinelEvent,
  correlateEvents,
  safeTokenEqual,
  cyberShieldStatus
} from '../lib/cyber-shield.js';

test('Wazuh alerts normalize to the common event contract', () => {
  const event = normalizeWazuhAlert({
    id: 'w-1',
    timestamp: '2026-11-19T10:00:00Z',
    rule: { level: 12, description: 'Repeated login failures', mitre: { id: ['T1110'], tactic: ['Credential Access'] } },
    agent: { id: '007', name: 'host-7' },
    data: { srcip: '192.0.2.10' }
  });
  assert.equal(event.source, 'wazuh');
  assert.equal(event.severity, 'critical');
  assert.equal(event.technique_id, 'T1110');
  assert.equal(event.asset_id, '007');
  assert.equal(event.source_ip, '192.0.2.10');
});

test('Suricata EVE alert severity maps source levels correctly', () => {
  const event = normalizeSuricataEvent({
    timestamp: '2026-11-19T10:01:00Z',
    event_type: 'alert',
    src_ip: '198.51.100.4',
    dest_ip: '203.0.113.9',
    alert: { severity: 1, signature: 'ET TEST alert', metadata: { mitre_technique_id: 'T1071' } }
  });
  assert.equal(event.severity, 'critical');
  assert.equal(event.technique_id, 'T1071');
  assert.equal(event.destination_ip, '203.0.113.9');
});

test('Microsoft Sentinel common alert fields normalize', () => {
  const event = normalizeSentinelEvent({
    SystemAlertId: 's-1',
    TimeGenerated: '2026-11-19T10:02:00Z',
    AlertSeverity: 'High',
    AlertName: 'Suspicious sign-in',
    CompromisedEntity: 'user-device',
    SourceIP: '192.0.2.10',
    TechniqueId: 'T1078'
  });
  assert.equal(event.source, 'microsoft-sentinel');
  assert.equal(event.severity, 'high');
  assert.equal(event.asset_name, 'user-device');
  assert.equal(event.technique_id, 'T1078');
});

test('batch rejects unsupported source and oversized or empty input', () => {
  assert.throws(() => normalizeBatch('unknown', [{}]), /source must be/);
  assert.throws(() => normalizeBatch('wazuh', []), /events must contain/);
  assert.throws(() => normalizeBatch('wazuh', Array.from({ length: 501 }, () => ({}))), /events must contain/);
});

test('correlation groups related events by source IP within the time window', () => {
  const events = [
    { id: 'a', timestamp: '2026-11-19T10:00:00Z', source_ip: '192.0.2.10', asset_id: 'a', severity: 'medium' },
    { id: 'b', timestamp: '2026-11-19T10:04:00Z', source_ip: '192.0.2.10', asset_id: 'b', severity: 'critical' },
    { id: 'c', timestamp: '2026-11-19T10:30:00Z', source_ip: '198.51.100.8', asset_id: 'c', severity: 'low' }
  ];
  const result = correlateEvents(events, 10);
  assert.equal(result.length, 1);
  assert.equal(result[0].event_count, 2);
  assert.equal(result[0].highest_severity, 'critical');
});

test('ingest token comparison rejects missing and mismatched values', () => {
  assert.equal(safeTokenEqual('', 'secret'), false);
  assert.equal(safeTokenEqual('wrong', 'secret'), false);
  assert.equal(safeTokenEqual('secret', 'secret'), true);
});

test('status clearly reports parser readiness without claiming live connections', () => {
  const status = cyberShieldStatus();
  assert.equal(status.adapters.wazuh.parser, true);
  assert.equal(status.adapters.wazuh.liveConnection, false);
  assert.equal(status.automatedResponse, false);
});
