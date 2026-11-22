const openButton = document.querySelector('#factory-open');
const dialog = document.querySelector('#factory-dialog');
const form = document.querySelector('#factory-form');
const topicInput = document.querySelector('#factory-topic');
const briefInput = document.querySelector('#factory-brief');
const output = document.querySelector('#factory-output');
const status = document.querySelector('#factory-status');
const runButton = document.querySelector('#factory-run');
const copyButton = document.querySelector('#factory-copy');

if (openButton && dialog && form) {
  openButton.addEventListener('click', () => {
    if (!dialog.open) dialog.showModal();
    topicInput?.focus();
  });

  dialog.querySelector('[data-factory-close]')?.addEventListener('click', () => dialog.close());

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const topic = topicInput?.value.trim() || '';
    const brief = briefInput?.value.trim() || '';
    if (topic.length < 4) {
      status.textContent = 'En az 4 karakterlik bir konu gir.';
      return;
    }

    runButton.disabled = true;
    copyButton.disabled = true;
    output.textContent = '';
    status.textContent = 'Araştırma ve iki formatlı üretim hazırlanıyor…';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 65000);
    try {
      const response = await fetch('/api/content-factory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ topic, brief }),
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Sunucu hatası (${response.status})`);
      if (typeof data.output !== 'string' || !data.output.trim()) {
        throw new Error('Üretim motoru boş yanıt döndürdü.');
      }
      output.textContent = data.output;
      copyButton.disabled = false;
      status.textContent = data.model ? `Hazır · ${data.model}` : 'İçerik paketi hazır.';
    } catch (error) {
      status.textContent = error.name === 'AbortError'
        ? 'İstek zaman aşımına uğradı. Daha kısa bir konu/notla tekrar dene.'
        : (error.message || 'İçerik üretimi başarısız.');
    } finally {
      clearTimeout(timeout);
      runButton.disabled = false;
    }
  });

  copyButton?.addEventListener('click', async () => {
    const value = output.textContent || '';
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      status.textContent = 'İçerik paketi panoya kopyalandı.';
    } catch {
      status.textContent = 'Kopyalama desteklenmiyor. Metni seçip kopyalayabilirsin.';
    }
  });
}
