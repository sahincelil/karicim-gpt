const KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const EPSS_URL = 'https://api.first.org/data/v1/epss';
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_ASSETS = 100;
const MAX_FINDINGS = 500;
const MAX_UNIQUE_CVES = 100;
const CVE_PATTERN = /^CVE-[0-9]{4}-[0-9]{4,}$/;
const CRITICALITY_POINTS = { critical: 20, high: 15, medium: 10, low: 5 };

let kevCache = { expiresAt: 0, value: null };
const epssCache = new Map();

function validationError(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function parseOptionalDate(value, fieldName) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 40 || !Number.isFinite(Date.parse(value))) {
    throw validationError(`${fieldName} geçerli bir ISO tarih/saat olmalı.`);
  }
  return new Date(value).toISOString();
}

export function normalizeInventory(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw validationError('JSON gövdesi bir nesne olmalı.');
  }
  if (!Array.isArray(payload.assets) || payload.assets.length < 1 || payload.assets.length > MAX_ASSETS) {
    throw validationError(`assets alanı 1-${MAX_ASSETS} arası kayıt içermeli.`);
  }

  const assetIds = new Set();
  let totalFindings = 0;
  const assets = payload.assets.map((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw validationError(`assets[${index}] bir nesne olmalı.`);
    }
    const assetId = typeof raw.assetId === 'string' ? raw.assetId.trim() : '';
    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    if (!/^[a-zA-Z0-9._:-]{1,80}$/.test(assetId)) {
      throw validationError(`assets[${index}].assetId 1-80 karakterli güvenli bir kimlik olmalı.`);
    }
    if (!name || name.length > 120) {
      throw validationError(`assets[${index}].name 1-120 karakter olmalı.`);
    }
    if (assetIds.has(assetId)) throw validationError(`Tekrarlanan assetId: ${assetId}`);
    assetIds.add(assetId);

    const criticality = String(raw.criticality || '').toLowerCase();
    if (!Object.hasOwn(CRITICALITY_POINTS, criticality)) {
      throw validationError(`assets[${index}].criticality critical, high, medium veya low olmalı.`);
    }
    if (typeof raw.internetExposed !== 'boolean') {
      throw validationError(`assets[${index}].internetExposed true/false olmalı.`);
    }
    if (!Array.isArray(raw.findings) || raw.findings.length > 100) {
      throw validationError(`assets[${index}].findings en fazla 100 kayıt içeren bir dizi olmalı.`);
    }

    const findings = raw.findings.map((finding, findingIndex) => {
      if (!finding || typeof finding !== 'object' || Array.isArray(finding)) {
        throw validationError(`assets[${index}].findings[${findingIndex}] bir nesne olmalı.`);
      }
      const cveId = typeof finding.cveId === 'string' ? finding.cveId.trim().toUpperCase() : '';
      if (!CVE_PATTERN.test(cveId)) {
        throw validationError(`Geçersiz CVE kimliği: assets[${index}].findings[${findingIndex}].cveId`);
      }
      const detectedAt = parseOptionalDate(finding.detectedAt, 'detectedAt');
      const patchAvailableAt = parseOptionalDate(finding.patchAvailableAt, 'patchAvailableAt');
      const patchAppliedAt = parseOptionalDate(finding.patchAppliedAt, 'patchAppliedAt');
      const verifiedAt = parseOptionalDate(finding.verifiedAt, 'verifiedAt');
      if (verifiedAt && !patchAppliedAt) {
        throw validationError('verifiedAt verilmişse patchAppliedAt da verilmelidir.');
      }
      if (verifiedAt && Date.parse(verifiedAt) < Date.parse(patchAppliedAt)) {
        throw validationError('verifiedAt, patchAppliedAt tarihinden önce olamaz.');
      }
      return { cveId, detectedAt, patchAvailableAt, patchAppliedAt, verifiedAt };
    });
    totalFindings += findings.length;
    return {
      assetId,
      name,
      criticality,
      internetExposed: raw.internetExposed,
      environment: ['production', 'staging', 'development', 'unknown'].includes(raw.environment) ? raw.environment : 'unknown',
      findings
    };
  });

  if (totalFindings > MAX_FINDINGS) throw validationError(`Toplam bulgu sayısı ${MAX_FINDINGS} sınırını aşamaz.`);
  const uniqueCves = [...new Set(assets.flatMap(asset => asset.findings.map(item => item.cveId)))];
  if (uniqueCves.length > MAX_UNIQUE_CVES) {
    throw validationError(`Tekil CVE sayısı ${MAX_UNIQUE_CVES} sınırını aşamaz.`);
  }
  return { assets, uniqueCves, totalFindings };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'LEGION-Cyber-Shield/0.1' },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(`Kaynak HTTP ${response.status} döndürdü.`);
  return response.json();
}

async function loadKev() {
  if (kevCache.value && kevCache.expiresAt > Date.now()) return kevCache.value;
  const payload = await fetchJson(KEV_URL);
  if (!Array.isArray(payload?.vulnerabilities)) throw new Error('CISA KEV yanıt biçimi beklenenden farklı.');
  const map = new Map();
  for (const item of payload.vulnerabilities) {
    if (typeof item?.cveID === 'string' && CVE_PATTERN.test(item.cveID)) {
      map.set(item.cveID, {
        dateAdded: item.dateAdded || null,
        dueDate: item.dueDate || null,
        vendorProject: item.vendorProject || null,
        product: item.product || null,
        vulnerabilityName: item.vulnerabilityName || null,
        requiredAction: item.requiredAction || null,
        knownRansomwareCampaignUse: item.knownRansomwareCampaignUse || 'Unknown'
      });
    }
  }
  kevCache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value: { map, catalogVersion: payload.catalogVersion || null, dateReleased: payload.dateReleased || null, count: payload.count ?? map.size }
  };
  return kevCache.value;
}

async function loadEpss(cves) {
  if (!cves.length) return new Map();
  const cacheKey = [...cves].sort().join(',');
  const cached = epssCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const url = new URL(EPSS_URL);
  url.searchParams.set('cve', cves.join(','));
  url.searchParams.set('pretty', 'false');
  const payload = await fetchJson(url);
  if (!Array.isArray(payload?.data)) throw new Error('FIRST EPSS yanıt biçimi beklenenden farklı.');
  const map = new Map();
  for (const item of payload.data) {
    const score = Number(item.epss);
    const percentile = Number(item.percentile);
    if (typeof item.cve === 'string' && Number.isFinite(score) && Number.isFinite(percentile)) {
      map.set(item.cve.toUpperCase(), {
        score: Math.min(1, Math.max(0, score)),
        percentile: Math.min(1, Math.max(0, percentile)),
        date: item.date || null
      });
    }
  }
  epssCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value: map });
  return map;
}

export function scoreFindings(assets, intel, now = Date.now()) {
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const results = [];
  for (const asset of assets) {
    for (const finding of asset.findings) {
      const kevRecord = intel.kev?.map?.get(finding.cveId) || null;
      const epssRecord = intel.epss?.get(finding.cveId) || null;
      const verified = Boolean(finding.verifiedAt);
      const applied = Boolean(finding.patchAppliedAt);
      let score = 0;
      const evidence = [];

      if (verified) {
        evidence.push('Yama uygulandı ve doğrulandı.');
      } else {
        if (kevRecord) {
          score += 45;
          evidence.push(`CISA KEV kataloğunda yer alıyor (eklenme: ${kevRecord.dateAdded || 'bilinmiyor'}).`);
        }
        score += CRITICALITY_POINTS[asset.criticality];
        evidence.push(`Varlık kritiklik seviyesi: ${asset.criticality}.`);
        if (asset.internetExposed) {
          score += 15;
          evidence.push('Varlık internete açık olarak işaretlenmiş.');
        }
        if (epssRecord) {
          if (epssRecord.score >= 0.7) score += 10;
          else if (epssRecord.score >= 0.3) score += 8;
          else if (epssRecord.score >= 0.1) score += 5;
          else if (epssRecord.score > 0) score += 2;
          evidence.push(`FIRST EPSS olasılık skoru: ${(epssRecord.score * 100).toFixed(2)}%.`);
        } else {
          evidence.push('EPSS skoru bulunamadı; bu durum düşük risk anlamına gelmez.');
        }
        if (applied) {
          score += 4;
          evidence.push('Yama uygulanmış, ancak doğrulama kaydı bulunmuyor.');
        } else if (finding.patchAvailableAt) {
          const delayDays = Math.max(0, (nowMs - Date.parse(finding.patchAvailableAt)) / 86400000);
          if (delayDays >= 30) score += 10;
          else if (delayDays >= 7) score += 6;
          else if (delayDays > 0) score += 3;
          evidence.push(`Yama mevcut; ${Math.floor(delayDays)} gündür uygulanma/doğrulama kaydı bekleniyor.`);
        } else {
          evidence.push('Yama kullanılabilirliği doğrulanmamış.');
        }
      }

      score = Math.min(100, score);
      const priority = verified ? 'resolved' : score >= 75 ? 'critical' : score >= 55 ? 'high' : score >= 35 ? 'medium' : 'low';
      const patchStatus = verified ? 'verified_remediated' : applied ? 'applied_pending_verification' : finding.patchAvailableAt ? 'patch_available_unpatched' : 'patch_status_unknown';
      let recommendation;
      if (verified) {
        recommendation = 'Varlık sürümünü ve doğrulama kanıtını saklayın; yalnızca bu bulgu için kapatma koşulları karşılanmış görünüyor.';
      } else if (kevRecord) {
        recommendation = 'Öncelikli inceleme: etkilenen bileşeni ve sürümü doğrulayın, üretici yamasını veya önerilen geçici önlemi planlayın; internete açık sistemlerde ilgili günlükleri inceleyin.';
      } else if (epssRecord?.score >= 0.7) {
        recommendation = 'EPSS skoru yüksek. Etkilenen sürümü doğrulayın, yama/azaltım planını öne alın ve erişim yüzeyini gözden geçirin.';
      } else if (applied) {
        recommendation = 'Yama uygulanmış görünüyor; envanter veya bağımsız sürüm kanıtıyla doğrulamayı tamamlayın.';
      } else if (finding.patchAvailableAt) {
        recommendation = 'Üretici yamasını değişiklik yönetimi üzerinden planlayın ve kurulum sonrası sürümü doğrulayın.';
      } else {
        recommendation = 'Üretici danışma bültenini kontrol edin; yama yoksa üreticinin önerdiği geçici azaltımları ve izleme kurallarını değerlendirin.';
      }

      results.push({
        assetId: asset.assetId,
        assetName: asset.name,
        environment: asset.environment,
        criticality: asset.criticality,
        internetExposed: asset.internetExposed,
        cveId: finding.cveId,
        score,
        priority,
        patchStatus,
        kev: kevRecord ? {
          listed: true,
          dateAdded: kevRecord.dateAdded,
          dueDate: kevRecord.dueDate,
          vendorProject: kevRecord.vendorProject,
          product: kevRecord.product,
          vulnerabilityName: kevRecord.vulnerabilityName,
          requiredAction: kevRecord.requiredAction,
          knownRansomwareCampaignUse: kevRecord.knownRansomwareCampaignUse
        } : { listed: false },
        epss: epssRecord ? { score: epssRecord.score, percentile: epssRecord.percentile, date: epssRecord.date } : null,
        evidence,
        recommendation,
        timestamps: {
          detectedAt: finding.detectedAt,
          patchAvailableAt: finding.patchAvailableAt,
          patchAppliedAt: finding.patchAppliedAt,
          verifiedAt: finding.verifiedAt
        }
      });
    }
  }
  const order = { critical: 0, high: 1, medium: 2, low: 3, resolved: 4 };
  return results.sort((a, b) => order[a.priority] - order[b.priority] || b.score - a.score || a.cveId.localeCompare(b.cveId));
}

export async function analyzeCyberInventory(payload, now = Date.now()) {
  const normalized = normalizeInventory(payload);
  if (!normalized.uniqueCves.length) {
    return {
      ok: true,
      generatedAt: new Date(now).toISOString(),
      inventory: { assets: normalized.assets.length, findings: 0, uniqueCves: 0 },
      sources: { cisaKev: { ok: true, skipped: true }, firstEpss: { ok: true, skipped: true } },
      summary: { critical: 0, high: 0, medium: 0, low: 0, resolved: 0 },
      findings: []
    };
  }

  const [kevResult, epssResult] = await Promise.allSettled([
    loadKev(),
    loadEpss(normalized.uniqueCves)
  ]);
  const kev = kevResult.status === 'fulfilled' ? kevResult.value : null;
  const epss = epssResult.status === 'fulfilled' ? epssResult.value : null;
  if (!kev && !epss) {
    throw Object.assign(new Error('CISA KEV ve FIRST EPSS kaynaklarına şu anda ulaşılamıyor.'), { status: 503 });
  }

  const findings = scoreFindings(normalized.assets, { kev, epss }, now);
  const summary = { critical: 0, high: 0, medium: 0, low: 0, resolved: 0 };
  for (const item of findings) summary[item.priority] += 1;

  return {
    ok: true,
    generatedAt: new Date(now).toISOString(),
    inventory: { assets: normalized.assets.length, findings: normalized.totalFindings, uniqueCves: normalized.uniqueCves.length },
    matchingBasis: 'Yalnızca envanterde açıkça verilen CVE kimlikleri zenginleştirilir. Ürün/sürüm eşlemesi veya ağ taraması yapılmaz.',
    sources: {
      cisaKev: kev ? { ok: true, catalogVersion: kev.catalogVersion, dateReleased: kev.dateReleased, count: kev.count, url: KEV_URL } : { ok: false, error: 'CISA KEV kaynağı okunamadı.' },
      firstEpss: epss ? { ok: true, queriedCves: normalized.uniqueCves.length, url: EPSS_URL } : { ok: false, error: 'FIRST EPSS kaynağı okunamadı.' }
    },
    summary,
    findings
  };
}

export const cyberShieldLimits = {
  maxAssets: MAX_ASSETS,
  maxFindings: MAX_FINDINGS,
  maxUniqueCves: MAX_UNIQUE_CVES,
  cacheTtlSeconds: CACHE_TTL_MS / 1000
};
