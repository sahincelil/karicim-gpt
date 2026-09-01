const chat = document.querySelector('#chat');
const input = document.querySelector('#input');
const form = document.querySelector('#form');
const sendButton = document.querySelector('#send');
const clearButton = document.querySelector('#clear');
const status = document.querySelector('#status');
const state = JSON.parse(localStorage.getItem('karicimgpt') || '{"messages":[]}');
function save(){localStorage.setItem('karicimgpt',JSON.stringify({messages:state.messages.slice(-40)}));}
function render(){chat.replaceChildren();if(!state.messages.length){const e=document.createElement('div');e.className='empty';e.innerHTML='<strong>KaricimGPT</strong><span>Ücretsiz açık model yönlendiricisiyle sohbet et.</span>';chat.append(e);return;}for(const m of state.messages){const e=document.createElement('div');e.className=`msg ${m.role==='user'?'user':'assistant'}`;const meta=document.createElement('div');meta.className='meta';meta.textContent=m.role==='user'?'Sen':'KaricimGPT';e.append(meta,document.createTextNode(m.content));chat.append(e);}chat.scrollTop=chat.scrollHeight;}
function setStatus(message='',isError=false){status.textContent=message;status.className=isError?'status error':'status';}
async function send(text){state.messages.push({role:'user',content:text});const pending={role:'assistant',content:'…'};state.messages.push(pending);save();render();sendButton.disabled=true;setStatus('Ücretsiz model düşünüyor…');try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:state.messages.slice(0,-1).slice(-20)})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`Sunucu hatası (${r.status})`);pending.content=data.output||'Yanıt alınamadı.';setStatus(data.model?`Model: ${data.model}`:'');}catch(e){pending.content=`Hata: ${e.message}`;setStatus(e.message,true);}finally{save();render();sendButton.disabled=false;input.focus();}}
form.addEventListener('submit',e=>{e.preventDefault();const text=input.value.trim();if(!text||sendButton.disabled)return;input.value='';send(text);});input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit();}});clearButton.addEventListener('click',()=>{state.messages.length=0;save();render();setStatus('Sohbet temizlendi.');input.focus();});render();
