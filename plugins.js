const state = { providers: [], category: '', query: '' };
const $ = (id) => document.getElementById(id);

function render(items) {
  $('resultCount').textContent = `${items.length} sağlayıcı`;
  const root = $('providers');
  if (!items.length) {
    root.innerHTML = '<div class="empty">Bu arama ile eşleşen sağlayıcı bulunamadı.</div>';
    return;
  }
  root.replaceChildren(...items.map((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    const top = document.createElement('div');
    top.className = 'card-top';
    const initial = document.createElement('span');
    initial.className = 'initial';
    initial.textContent = item.name.slice(0, 1).toLocaleUpperCase('tr-TR');
    const phase = document.createElement('span');
    phase.className = item.adapterPhase === 'existing-code' ? 'phase existing' : 'phase';
    phase.textContent = item.adapterPhase === 'existing-code' ? 'Mevcut kaynak kodu' : 'Katalog kaydı';
    top.append(initial, phase);
    const title = document.createElement('h3');
    title.textContent = item.name;
    const meta = document.createElement('div');
    meta.className = 'meta';
    const category = document.createElement('span');
    category.textContent = item.category;
    const count = document.createElement('span');
    count.textContent = `${item.toolCount} araç`;
    meta.append(category, count);
    const status = document.createElement('div');
    status.className = 'state';
    const dot = document.createElement('span');
    dot.className = item.adapterPhase === 'existing-code' ? 'dot green' : 'dot';
    const statusText = document.createElement('span');
    statusText.textContent = item.adapterPhase === 'existing-code'
      ? 'Kod mevcut · canlı bağlantı doğrulanmadı'
      : 'Özel adaptör ve sağlayıcı testi bekliyor';
    status.append(dot, statusText);
    card.append(top, title, meta, status);
    return card;
  }));
}

function applyFilters() {
  const q = state.query.toLocaleLowerCase('tr-TR');
  const results = state.providers.filter((p) => {
    const text = `${p.name} ${p.key} ${p.category} ${p.id}`.toLocaleLowerCase('tr-TR');
    return (!q || text.includes(q)) && (!state.category || p.category === state.category);
  });
  render(results);
}

async function init() {
  const response = await fetch('/api/plugin-catalog', { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Katalog API isteği başarısız: ' + response.status);
  const data = await response.json();
  state.providers = data.providers || [];
  $('providerCount').textContent = data.snapshot.providerCount;
  $('toolCount').textContent = data.snapshot.observedToolCount.toLocaleString('tr-TR');
  $('existingCount').textContent = state.providers.filter(p => p.adapterPhase === 'existing-code').length;
  $('snapshot').textContent = 'Envanter: ' + data.snapshot.generatedAt;
  const select = $('category');
  for (const category of data.categories) {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    select.append(option);
  }
  render(state.providers);
}

$('search').addEventListener('input', (event) => {
  state.query = event.target.value;
  applyFilters();
});
$('category').addEventListener('change', (event) => {
  state.category = event.target.value;
  applyFilters();
});
$('clear').addEventListener('click', () => {
  state.query = '';
  state.category = '';
  $('search').value = '';
  $('category').value = '';
  applyFilters();
});

init().catch((error) => {
  $('snapshot').textContent = 'Katalog erişilemiyor';
  $('providers').textContent = error.message;
  $('providers').className = 'empty';
});
