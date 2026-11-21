import { timingSafeEqual } from 'node:crypto';
import { rateLimit, securityHeaders } from '../lib/security.js';

const SOURCE_TIMEOUT_MS = 9000;
const MAX_BODY_BYTES = 4096;
const MAX_SUBDOMAINS = 250;
const MAX_ARCHIVED_HOSTS = 100;

function send(res, status, body) {
  securityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

function authorized(req) {
  const expected = process.env.OSINT_ADMIN_TOKEN;
  const provided = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  return Boolean(expected && provided && safeEqual(provided, expected));
}

export function normalizeDomain(input) {
  if (typeof input !== 'string') return null;
  const domain = input.trim().toLowerCase().replace(/\.$/, '');
  if (domain.length > 253 || !domain || domain.includes('://') || domain.includes('/') || domain.includes(':')) return null;
  const labels = domain.split('.');
  if (labels.length < 2 || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;
  if (!/^[a-z]{2,63}$/.test(labels.at(-1))) return null;
  return domain;
}

export function isAllowedDomain(domain, allowlist) {
  return allowlist.some((entry) => domain === entry || domain.endsWith('.' + entry));
}

export function parseCtRecords(payload, targetDomain) {
  if (!Array.isArray(payload)) return [];
  const names = new Set();
  for (const record of payload) {
    const value = typeof record?.name_value === 'string' ? record.name_value : '';
    for (const rawName of value.split(/\r?\n/)) {
      const name = normalizeDomain(rawName.replace(/^\*\./, ''));
      if (name && name !== targetDomain && name.endsWith('.' + targetDomain)) names.add(name);
    }
  }
  return [...names].sort().slice(0, MAX_SUBDOMAINS);
}

function formatCdxDate(value) {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(String(value || ''));
  return match ? match[1] + '-' + match[2] + '-' + match[3] : null;
}

export function parseCdxRecords(payload, targetDomain) {
  if (!Array.isArray(payload)) return [];
  const hosts = new Map();
  for (const row of payload) {
    if (!Array.isArray(row) || row[0] === 'original') continue;
    const original = row[0];
    const timestamp = row[1];
    try {
      const parsed = new URL(String(original));
      const host = normalizeDomain(parsed.hostname);
      if (!['http:', 'https:'].includes(parsed.protocol) || !host || !(host === targetDomain || host.endsWith('.' + targetDomain))) continue;
      const date = formatCdxDate(timestamp);
      const current = hosts.get(host) || { host, snapshots: 0, oldestSnapshot: null, newestSnapshot: null };
      current.snapshots += 1;
      if (date && (!current.oldestSnapshot || date < current.oldestSnapshot)) current.oldestSnapshot = date;
      if (date && (!current.newestSnapshot || date > current.newestSnapshot)) current.newestSnapshot = date;
      hosts.set(host, current);
    } catch {
      // Ignore malformed or out-of-scope archive rows.
    }
  }
  return [...hosts.values()].sort((a, b) => a.host.localeCompare(b.host)).slice(0, MAX_ARCHIVED_HOSTS);
}

async function fetchJson(url) {
  const response = await globalThis.fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'LEGION-OSINT/0.1 passive-domain-audit' },
    signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error('Source returned HTTP ' + response.status);
  return response.json();
}

function allowedDomainsFromEnv() {
  return String(process.env.OSINT_ALLOWED_DOMAINS || '')
    .split(',')
    .map(normalizeDomain)
    .filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return send(res, 200, {
      ok: true,
      module: 'LEGION OSINT',
      mode: 'passive_authorized_domain_recon',
      configured: Boolean(process.env.OSINT_ADMIN_TOKEN && allowedDomainsFromEnv().length),
      sources: ['crt.sh', 'Internet Archive CDX'],
      activeScanning: false
    });
  }
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Yalnızca GET ve POST destekleniyor.' });

  const limit = rateLimit(req);
  if (!limit.allowed) return send(res, 429, { ok: false, error: 'Rate limit.', retryAfter: limit.retryAfter });
  if (!authorized(req)) return send(res, 401, { ok: false, error: 'OSINT kimlik doğrulaması başarısız.' });

  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) {
    return send(res, 413, { ok: false, error: 'İstek çok büyük.' });
  }

  const targetDomain = normalizeDomain(body.targetDomain);
  if (!targetDomain) return send(res, 400, { ok: false, error: 'Geçerli bir alan adı gerekli.' });

  const allowlist = allowedDomainsFromEnv();
  if (!allowlist.length) return send(res, 503, { ok: false, error: 'OSINT_ALLOWED_DOMAINS sunucu ortamında yapılandırılmalı.' });
  if (!isAllowedDomain(targetDomain, allowlist)) {
    return send(res, 403, { ok: false, error: 'Bu alan adı izin verilen varlık kapsamı dışında.' });
  }

  const ctUrl = 'https://crt.sh/?q=%25.' + encodeURIComponent(targetDomain) + '&output=json';
  const cdxUrl = 'https://web.archive.org/cdx/search/cdx?url=' + encodeURIComponent(targetDomain + '/*') + '&output=json&fl=original,timestamp,statuscode&filter=statuscode:200&collapse=urlkey&limit=500';
  const settled = await Promise.allSettled([fetchJson(ctUrl), fetchJson(cdxUrl)]);

  const ctOk = settled[0].status === 'fulfilled';
  const cdxOk = settled[1].status === 'fulfilled';
  if (!ctOk && !cdxOk) {
    return send(res, 502, {
      ok: false,
      error: 'Pasif veri kaynaklarına şu anda erişilemiyor.',
      sources: [
        { name: 'crt.sh', status: 'unavailable' },
        { name: 'Internet Archive CDX', status: 'unavailable' }
      ]
    });
  }

  const subdomains = ctOk ? parseCtRecords(settled[0].value, targetDomain) : [];
  const archivedHosts = cdxOk ? parseCdxRecords(settled[1].value, targetDomain) : [];
  return send(res, 200, {
    ok: true,
    module: 'LEGION OSINT',
    mode: 'passive_authorized_domain_recon',
    targetDomain,
    collectedAt: new Date().toISOString(),
    sources: [
      { name: 'crt.sh', status: ctOk ? 'ok' : 'unavailable', records: subdomains.length, sourceUrl: ctUrl },
      { name: 'Internet Archive CDX', status: cdxOk ? 'ok' : 'unavailable', hosts: archivedHosts.length, sourceUrl: cdxUrl }
    ],
    findings: { subdomains, archivedHosts },
    caveats: [
      'Yalnızca herkese açık pasif kaynaklar kullanılır; hedef sisteme port taraması veya oturum açma yapılmaz.',
      'Sertifika ve arşiv kayıtları eski olabilir; her bulgu canlı varlık anlamına gelmez.',
      'Otomatik korelasyon kesin kanıt değildir; önemli bulgular bağımsız kaynaklarla doğrulanmalıdır.'
    ]
  });
}
