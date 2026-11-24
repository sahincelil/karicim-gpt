const inventoryInput = document.querySelector('#inventory');
const analyzeButton = document.querySelector('#analyze');
const demoButton = document.querySelector('#demo');
const statusNode = document.querySelector('#status');
const resultsNode = document.querySelector('#results');
const summaryText = document.querySelector('#summary-text');
const metricsNode = document.querySelector('#metrics');
const findingList = document.querySelector('#finding-list');
const sourceLinks = document.querySelector('#source-links');

const demoInventory = {
  assets: [{
    assetId: 'demo-web-01',
    name: 'DEMO ONLY / Apache test application',
    criticality: 'critical',
    internetExposed: true,
    environment: 'staging',
    findings: [{ cveId: 'CVE-2021-44228', detectedAt: '2026-11-21T08:00:00Z', patchAvailableAt: '2021-12-10T00:00:00Z' }]
  }]
};

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.classList.toggle('error', isError);
}

function makeCell(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text ?? '';
  if (className) node.className = className;
  return node;
}

function renderResults(data) {
  resultsNode.hidden = false;
  const s = data.summary;
  summaryText.textContent = `${data.inventory.assets} varlık ve ${data.inventory.findings} CVE kaydı incelendi. Eşsiz CVE: ${data.inventory.uniqueCves}. Sıralama yalnızca verilen bulguları kapsar.`;
  metricsNode.replaceChildren();
  const metricItems = [
    ['Kritik', s.critical],
    ['Yüksek', s.high],
    ['Orta', s.medium],
    ['Düşük', s.low],
    ['Doğrulanmış', s.resolved]
  ];
  for (const [label, value] of metricItems) {
    const card = document.createElement('div');
    card.className = 'metric';
    card.append(makeCell('strong', String(value)), makeCell('span', label));
    metricsNode.append(card);
  }

  findingList.replaceChildren();
  if (!data.findings.length) {
    findingList.append(makeCell('p', 'Envanterde analiz edilecek CVE kaydı yok.'));
  }
  for (const item of data.findings) {
    const card = document.createElement('article');
    card.className = 'finding';
    const top = document.createElement('div');
    top.className = 'finding-top';
    const left = document.createElement('div');
    left.append(makeCell('h3', `${item.cveId} · ${item.assetName}`));
    left.append(makeCell('div', `${item.assetId} | ${item.environment} | ${item.criticality} | ${item.internetExposed ? 'İnternete açık' : 'İnternete kapalı'}`, 'meta'));
    const pill = makeCell('span', item.priority === 'resolved' ? 'Doğrulandı' : item.priority, `priority ${item.priority}`);
    top.append(left, pill);
    card.append(top);
    card.append(makeCell('div', `Risk puanı: ${item.score}/100 · KEV: ${item.kev.listed ? 'Evet' : 'Hayır'} · EPSS: ${item.epss ? (item.epss.score * 100).toFixed(2) + '%' : 'Bilinmiyor'} · Yama: ${item.patchStatus}`, 'meta'));
    const evidence = document.createElement('ul');
    evidence.className = 'evidence';
    for (const line of item.evidence) evidence.append(makeCell('li', line));
    card.append(evidence);
    card.append(makeCell('p', item.recommendation, 'recommend'));
    findingList.append(card);
  }

  sourceLinks.replaceChildren();
  const cisa = document.createElement('a');
  cisa.href = 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog';
  cisa.target = '_blank';
  cisa.rel = 'noopener noreferrer';
  cisa.textContent = `CISA KEV: ${data.sources.cisaKev.ok ? 'erişildi' : 'erişilemedi'}`;
  sourceLinks.append(cisa);
  const epss = document.createElement('a');
  epss.href = 'https://api.first.org/epss/';
  epss.target = '_blank';
  epss.rel = 'noopener noreferrer';
  epss.textContent = `FIRST EPSS: ${data.sources.firstEpss.ok ? 'erişildi' : 'erişilemedi'}`;
  sourceLinks.append(epss);
}

demoButton.addEventListener('click', () => {
  inventoryInput.value = JSON.stringify(demoInventory, null, 2);
  setStatus('Sentetik demo envanteri yüklendi. Gerçek bir sisteme ait değildir.');
});

analyzeButton.addEventListener('click', async () => {
  let payload;
  try {
    payload = JSON.parse(inventoryInput.value);
  } catch {
    setStatus('JSON biçimi geçersiz. Virgül, tırnak ve köşeli parantezleri kontrol et.', true);
    return;
  }
  analyzeButton.disabled = true;
  demoButton.disabled = true;
  resultsNode.hidden = true;
  setStatus('CISA KEV ve FIRST EPSS verileri alınıyor…');
  try {
    const response = await fetch('/api/cyber-shield', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || `İstek başarısız (${response.status}).`);
    renderResults(data);
    setStatus('Analiz tamamlandı. Sonuçlar kaynak verileri ve envanter kayıtlarıyla sınırlıdır.');
  } catch (error) {
    setStatus(error.message || 'Analiz tamamlanamadı.', true);
  } finally {
    analyzeButton.disabled = false;
    demoButton.disabled = false;
  }
});

inventoryInput.value = JSON.stringify(demoInventory, null, 2);
