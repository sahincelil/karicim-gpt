import { createHash, timingSafeEqual } from 'node:crypto';

const SEVERITIES = new Set(['critical', 'high', 'medium', 'low', 'informational']);
const MAX_EVENTS = 500;
const MAX_TEXT = 2000;

function text(value, fallback = '') {
  return String(value ?? fallback).slice(0, MAX_TEXT);
}
function wazuhSeverity(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'informational';
  if (n >= 12 || n === 1) return 'critical';
  if (n >= 8 || n === 2) return 'high';
  if (n >= 5 || n === 3) return 'medium';
  if (n > 0) return 'low';
  return 'informational';
}
function normalizeSeverity(value) {
  const v = String(value ?? '').toLowerCase();
  if (SEVERITIES.has(v)) return v;
  if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(v)) return severityFromNumber(v);
  if (v.includes('critical') || v.includes('fatal')) return 'critical';
  if (v.includes('high')) return 'high';
  if (v.includes('medium') || v.includes('moderate')) return 'medium';
  if (v.includes('low')) return 'low';
  return 'informational';
}
function iso(value) {
  const date = new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid event timestamp.');
  return date.toISOString();
}
function technique(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = String(raw ?? '').match(/T\d{4}(?:\.\d{3})?/);
  return id ? id[0] : null;
}
function normalized({ id, timestamp, severity, title, assetId, assetName, source, description, techniqueId, tactic, sourceIp, destinationIp, evidenceRef }) {
  return {
    id: text(id || createHash('sha256').update(JSON.stringify({timestamp,title,assetId,source})).digest('hex').slice(0, 16)),
    timestamp: iso(timestamp),
    severity: normalizeSeverity(severity),
    title: text(title || 'Untitled security event', 160),
    asset_id: text(assetId || 'unknown', 128),
    asset_name: text(assetName || assetId || 'Unknown asset', 160),
    source: text(source, 80),
    description: text(description),
    technique_id: technique(techniqueId),
    tactic: text(tactic, 100) || null,
    source_ip: text(sourceIp, 64) || null,
    destination_ip: text(destinationIp, 64) || null,
    evidence_ref: text(evidenceRef, 256) || null,
    status: 'open'
  };
}

export function normalizeWazuhAlert(alert = {}) {
  const rule = alert.rule || {};
  const agent = alert.agent || {};
  const data = alert.data || {};
  return normalized({
    id: alert.id || alert._id,
    timestamp: alert.timestamp,
    severity: wazuhSeverity(rule.level),
    title: rule.description || 'Wazuh alert',
    assetId: agent.id || agent.name || data.hostname,
    assetName: agent.name || data.hostname,
    source: 'wazuh',
    description: alert.full_log || rule.description || 'Wazuh alert received.',
    techniqueId: rule.mitre?.id || rule.mitre,
    tactic: Array.isArray(rule.mitre?.tactic) ? rule.mitre.tactic.join(', ') : rule.mitre?.tactic,
    sourceIp: data.srcip || data.src_ip,
    destinationIp: data.dstip || data.dest_ip,
    evidenceRef: alert.id || alert._id
  });
}

export function normalizeSuricataEvent(event = {}) {
  const alert = event.alert || {};
  return normalized({
    id: event.flow_id ? `suricata-${event.flow_id}-${event.timestamp || ''}` : undefined,
    timestamp: event.timestamp,
    severity: ({ 1: 'critical', 2: 'high', 3: 'medium', 4: 'low' })[Number(alert.severity)] || 'informational',
    title: alert.signature || `Suricata ${event.event_type || 'event'}`,
    assetId: event.host || event.dest_ip || event.src_ip,
    assetName: event.host || event.dest_ip || event.src_ip,
    source: 'suricata',
    description: [event.event_type, alert.category, alert.signature].filter(Boolean).join(' · '),
    techniqueId: alert.metadata?.mitre_technique_id || alert.metadata?.mitre?.technique,
    tactic: alert.metadata?.mitre_tactic,
    sourceIp: event.src_ip,
    destinationIp: event.dest_ip,
    evidenceRef: event.flow_id
  });
}

export function normalizeSentinelEvent(event = {}) {
  const severity = event.AlertSeverity || event.Severity || event.severity || event.AlertSeverityName;
  const title = event.AlertName || event.Activity || event.DeviceAction || event.Description || event.OperationName || 'Microsoft Sentinel event';
  const asset = event.CompromisedEntity || event.DeviceName || event.Computer || event.HostName || event.SourceHostName;
  return normalized({
    id: event.SystemAlertId || event.AlertId || event.EventID || event.Id,
    timestamp: event.TimeGenerated || event.StartTime || event.TimeCreated || event.timestamp,
    severity,
    title,
    assetId: asset || event.SourceIP || event.SourceIp,
    assetName: asset,
    source: 'microsoft-sentinel',
    description: event.Description || event.AdditionalFields || event.Activity || title,
    techniqueId: event.TechniqueId || event.MitreTechniqueId || event.AttackTechniques,
    tactic: event.Tactic || event.AttackTactics,
    sourceIp: event.SourceIP || event.SourceIp || event.SourceAddress,
    destinationIp: event.DestinationIP || event.DestinationIp || event.DestinationAddress,
    evidenceRef: event.SystemAlertId || event.AlertId || event.EventID || event.Id
  });
}

export function normalizeBatch(source, events) {
  if (!Array.isArray(events) || events.length === 0 || events.length > MAX_EVENTS) {
    throw Object.assign(new Error(`events must contain 1-${MAX_EVENTS} records`), { status: 400 });
  }
  const adapters = {
    wazuh: normalizeWazuhAlert,
    suricata: normalizeSuricataEvent,
    sentinel: normalizeSentinelEvent
  };
  const adapter = adapters[String(source || '').toLowerCase()];
  if (!adapter) throw Object.assign(new Error('source must be wazuh, suricata, or sentinel'), { status: 400 });
  return events.map((event) => adapter(event));
}

export function correlateEvents(events, windowMinutes = 10) {
  const windowMs = Math.min(Math.max(Number(windowMinutes) || 10, 1), 60) * 60_000;
  const groups = new Map();
  for (const event of events) {
    const key = event.source_ip || event.asset_id || 'unknown';
    const list = groups.get(key) || [];
    list.push(event);
    groups.set(key, list);
  }
  const correlations = [];
  for (const [key, items] of groups) {
    const sorted = [...items].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    let cluster = [];
    for (const item of sorted) {
      if (cluster.length && Date.parse(item.timestamp) - Date.parse(cluster.at(-1).timestamp) > windowMs) {
        if (cluster.length > 1) correlations.push(makeCorrelation(key, cluster));
        cluster = [];
      }
      cluster.push(item);
    }
    if (cluster.length > 1) correlations.push(makeCorrelation(key, cluster));
  }
  return correlations.sort((a, b) => b.event_count - a.event_count);
}

function makeCorrelation(key, events) {
  const severityRank = { informational: 0, low: 1, medium: 2, high: 3, critical: 4 };
  const highest = events.reduce((best, event) => severityRank[event.severity] > severityRank[best] ? event.severity : best, 'informational');
  return {
    id: createHash('sha256').update(events.map((e) => e.id).sort().join('|')).digest('hex').slice(0, 16),
    correlation_key: key,
    event_count: events.length,
    highest_severity: highest,
    first_seen: events[0].timestamp,
    last_seen: events.at(-1).timestamp,
    event_ids: events.map((e) => e.id)
  };
}

export function safeTokenEqual(supplied, expected) {
  if (!supplied || !expected) return false;
  const a = Buffer.from(String(supplied));
  const b = Buffer.from(String(expected));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function cyberShieldStatus() {
  return {
    ok: true,
    service: 'LEGION CYBER SHIELD',
    mode: 'read-only-ingest',
    adapters: {
      wazuh: { parser: true, liveConnection: false },
      suricata: { parser: true, liveConnection: false },
      sentinel: { parser: true, liveConnection: false }
    },
    correlation: true,
    automatedResponse: false,
    ingestEnabled: Boolean(process.env.CYBER_SHIELD_INGEST_TOKEN),
    note: 'Parsers accept caller-supplied events. Live polling/webhooks are not configured.'
  };
}
