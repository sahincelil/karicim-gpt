const chat = document.querySelector('#chat');
const input = document.querySelector('#input');
const form = document.querySelector('#form');
const sendButton = document.querySelector('#send');
const clearButton = document.querySelector('#clear');
const status = document.querySelector('#status');
const STORAGE_KEY = 'karicimgpt-messages';
const MAX_MESSAGES = 20;

let messages = load();
function load(){try{const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(v)?v.filter(m=>(m?.role==='user'||m?.role==='assistant')&&typeof m?.content==='string').slice(-MAX_MESSAGES):[]}catch{return[]}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(messages.slice(-MAX_MESSAGES)))}
function render(){chat.replaceChildren();if(!messages.length){const e=document.createElement('div');e.className='empty';const t=document.createElement('strong');t.textContent='KaricimGPT';const s=document.createElement('span');s.textContent='Ücretsiz açık model yönlendiricisiyle sohbet et.';e.append(t,s);chat.append(e);return}for(const m of messages){const e=document.createElement('div');e.className=`msg ${m.role}`;const meta=document.createElement('div');meta.className='meta';meta.textContent=m.role==='user'?'Sen':'KaricimGPT';e.append(meta,document.createTextNode(m.content));chat.append(e)}window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})}
function setStatus(message='',error=false){status.textContent=message;status.className=error?'status error':'status'}
async function ask(){const text=input.value.trim();if(!text||sendButton.disabled)return;messages.push({role:'user',content:text});save();render();input.value='';sendButton.disabled=true;setStatus('Yanıt hazırlanıyor…');try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({messages})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`Sunucu hatası (${r.status})`);if(!data.output)throw new Error('Model boş yanıt döndürdü.');messages.push({role:'assistant',content:data.output});save();render();setStatus(data.model?`Model: ${data.model}`:'Hazır')}catch(e){setStatus(e.message||'Bir hata oluştu.',true)}finally{sendButton.disabled=false;input.focus()}}
form.addEventListener('submit',e=>{e.preventDefault();ask()});input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});clearButton.addEventListener('click',()=>{messages=[];save();render();setStatus('Sohbet temizlendi.');input.focus()});render();