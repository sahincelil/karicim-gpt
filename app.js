const chat = document.querySelector('#chat');
const input = document.querySelector('#input');
const form = document.querySelector('#form');
const sendButton = document.querySelector('#send');
const clearButton = document.querySelector('#clear');
const status = document.querySelector('#status');

const state = JSON.parse(localStorage.getItem('karicimgpt') || '{"messages":[]}');

function save() {
  localStorage.setItem('karicimgpt', JSON.stringify({ messages: state.messages.slice(-40) }));
}

function render() {
  chat.replaceChildren();
  if (!state.messages.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.innerHTML = '<strong>KaricimGPT</strong><span>Grok ile güvenli sohbet etmek için mesajını yaz.</span>';
    chat.append(empty);
    return;
  }
  for (const message of state.messages) {
    const el = document.createElement('div');
    el.className = `msg ${message.role === 'user' ? 'user' : 'assistant'}`;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = message.role === 'user' ? 'Sen' : 'KaricimGPT';
    el.append(meta, document.createTextNode(message.content));
    chat.append(el);
  }
  chat.scrollTop = chat.scrollHeight;
}

function setStatus(message = '', isError = false) {
  status.textContent = message;
  status.className = isError ? 'status error' : 'status';
}

async function send(text) {
  state.messages.push({ role: 'user', content: text });
  const pending = { role: 'assistant', content: '…' };
  state.messages.push(pending);
  save();
  render();
  sendButton.disabled = true;
  setStatus('Grok düşünüyor…');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: state.messages.slice(0, -1).slice(-20) })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Sunucu hatası (${response.status})`);
    pending.content = data.output || 'Yanıt alınamadı.';
    setStatus('');
  } catch (error) {
    pending.content = `Hata: ${error.message}`;
    setStatus(error.message, true);
  } finally {
    save();
    render();
    sendButton.disabled = false;
    input.focus();
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || sendButton.disabled) return;
  input.value = '';
  send(text);
});

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

clearButton.addEventListener('click', () => {
  state.messages.length = 0;
  save();
  render();
  setStatus('Sohbet temizlendi.');
  input.focus();
});

render();
