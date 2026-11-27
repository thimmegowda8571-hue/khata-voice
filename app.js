// KhataVoice UI: voice entry -> parse -> read-back -> confirm -> save. Data stays on the device.
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const L = {
  hi: { bolo: 'बोलो', go: 'समझो', khata: 'खाता', hisaab: 'हिसाब', save: 'हाँ, सेव करो', no: 'नहीं', ph: 'जैसे: रमेश ने 450 का सामान लिया, 200 दिया, बाकी उधार',
    bikri: 'आज की बिक्री', udhaar: 'उधार दिया', jama: 'आज जमा मिला', remind: 'याद दिलाओ', speak: 'सुनाओ', check: 'जाँचें', total: 'कुल', paid: 'दिया', due: 'बाकी' },
  en: { bolo: 'Speak', go: 'Understand', khata: 'Ledger', hisaab: 'Summary', save: 'Yes, save', no: 'No', ph: 'e.g. Ramesh took goods worth 450, paid 200, rest udhaar',
    bikri: "Today's sales", udhaar: 'Credit given', jama: 'Collected today', remind: 'Remind', speak: 'Read out', check: 'check', total: 'Total', paid: 'Paid', due: 'Due' },
  kn: { bolo: 'ಹೇಳಿ', go: 'ಅರ್ಥಮಾಡು', khata: 'ಖಾತೆ', hisaab: 'ಲೆಕ್ಕ', save: 'ಹೌದು, ಸೇವ್', no: 'ಇಲ್ಲ', ph: 'ಉದಾ: ರಮೇಶ್ 450 ರ ಸಾಮಾನು ತೆಗೆದುಕೊಂಡ, 200 ಕೊಟ್ಟ, ಉಳಿದದ್ದು ಉದ್ರಿ',
    bikri: 'ಇಂದಿನ ಮಾರಾಟ', udhaar: 'ಉದ್ರಿ ನೀಡಿದ್ದು', jama: 'ಇಂದು ಸಿಕ್ಕಿದ್ದು', remind: 'ನೆನಪಿಸಿ', speak: 'ಓದಿ', check: 'ಪರಿಶೀಲಿಸಿ', total: 'ಒಟ್ಟು', paid: 'ಕೊಟ್ಟದ್ದು', due: 'ಬಾಕಿ' },
};
let lang = localStorage.kv_lang || 'hi';
const t = k => L[lang][k];
const pick = (hi, en) => (lang === 'en' ? en : hi);   // speech: English or Hindi
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const SPEECH_LANG = { hi: 'hi-IN', en: 'en-IN', kn: 'kn-IN' };

// ---------- storage ----------
const day = n => Date.now() - n * 864e5;
function seed() {
  const c = ['Ramesh', 'Sunita Devi', 'Mohammed Irfan', 'Lakshmi'].map((name, i) => ({ id: i + 1, name, phone: '' }));
  const e = (cid, total, paid, items, d, raw) => ({ id: Math.random().toString(36).slice(2), customerId: cid, total, paid, due: total - paid, items, timestamp: day(d), rawText: raw });
  return { customers: c, entries: [
    e(1, 450, 200, 'saman', 2, 'Ramesh ne 450 ka saman liya, 200 diya'), e(2, 1200, 0, 'atta, daal', 1, 'Sunita ne 1200 ka atta daal liya, baaki udhaar'),
    e(3, 300, 300, 'chai patti', 0, 'Irfan ne 300 ka chai patti liya nagad'), e(4, 800, 300, 'chawal', 3, 'Lakshmi ne 800 ka chawal liya, 300 diya'),
    e(1, 0, 100, 'payment', 1, 'Ramesh ne 100 diye') ] };
}
let db; try { db = JSON.parse(localStorage.kv_db); } catch (e) { db = null; }
if (!db || !db.customers) { db = seed(); persist(); }
function persist() { try { localStorage.kv_db = JSON.stringify(db); } catch (e) { /* storage full or blocked */ } }
const balance = cid => db.entries.filter(x => x.customerId === cid).reduce((s, x) => s + x.due, 0);
const isToday = ts => new Date(ts).toDateString() === new Date().toDateString();
const rupee = n => '₹' + Math.abs(n).toLocaleString('en-IN');

// ---------- speech ----------
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.lang = lang === 'en' ? 'en-IN' : 'hi-IN'; speechSynthesis.speak(u);
}
function listen(onText, onEnd) {
  if (!SR) { onEnd && onEnd('unsupported'); return null; }
  const r = new SR(); r.lang = SPEECH_LANG[lang]; r.interimResults = false;
  r.onresult = ev => onText(ev.results[0][0].transcript);
  r.onerror = ev => onEnd && onEnd(ev.error);
  r.onend = () => onEnd && onEnd();
  try { r.start(); } catch (e) { onEnd && onEnd('error'); }
  return r;
}

// ---------- optional AI parsing (needs the user's own key; falls back to offline rules) ----------
async function aiParse(text) {
  const key = localStorage.kv_key;
  if (!key) throw new Error('key not set');
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: 'claude-haiku-5-5', max_tokens: 300,
      system: 'Parse a Hindi/Hinglish shop ledger sentence. Reply ONLY with JSON: {"type":"sale|payment|query_due|query_today|query_top|unknown","customer":string,"total":number,"paid":number,"items":string}.',
      messages: [{ role: 'user', content: text }] }) });
  const j = await r.json();
  const o = JSON.parse(j.content[0].text.replace(/```json|```/g, '').trim());
  o.due = (o.total || 0) - (o.paid || 0); o.flags = []; o.raw = text;
  if (o.type === 'payment') { o.total = 0; o.due = -o.paid; }
  return o;
}
async function understand(text) {
  try { const o = await aiParse(text); $('#mode').textContent = 'AI mode'; return o; }
  catch (e) { $('#mode').textContent = localStorage.kv_key ? 'AI error, offline parser used' : 'Key not set: offline parser used'; return parse(text, db.customers); }
}

// ---------- Bolo screen ----------
let pending = null, yesNo = null;
async function onGo() {
  const text = $('#say').value.trim(); if (!text) return;
  render(await understand(text));
}
function render(r) {
  const out = $('#out'); pending = null;
  const cust = r.customer && db.customers.find(c => c.name.toLowerCase() === r.customer.toLowerCase());
  if (r.type === 'query_due') {
    const msg = cust ? pick(`${cust.name} का ${balance(cust.id)} रुपये बाकी है`, `${cust.name} owes ${balance(cust.id)} rupees`) : pick('यह ग्राहक नहीं मिला', 'Customer not found');
    out.innerHTML = `<p class="ans">${esc(msg)}</p>`; return speak(msg);
  }
  if (r.type === 'query_today') { const s = summary(); const msg = pick(`आज ${s.sales} रुपये की बिक्री, ${s.credit} रुपये उधार`, `Today ${s.sales} rupees sales, ${s.credit} rupees on credit`); out.innerHTML = `<p class="ans">${esc(msg)}</p>`; return speak(msg); }
  if (r.type === 'query_top') {
    const top = db.customers.map(c => ({ c, b: balance(c.id) })).sort((a, b) => b.b - a.b)[0];
    const msg = pick(`सबसे ज्यादा उधार ${top.c.name} का है, ${top.b} रुपये`, `${top.c.name} owes the most: ${top.b} rupees`); out.innerHTML = `<p class="ans">${esc(msg)}</p>`; return speak(msg);
  }
  if (r.type === 'unknown') { const msg = pick('समझ नहीं आया, फिर से बोलिए', 'Did not understand, please say it again'); out.innerHTML = `<p class="warn">${esc(msg)}</p>`; return speak(msg); }
  // sale or payment: never auto-save, ask follow-up if name or amount is missing
  if (r.flags.includes('customer') || r.flags.includes('total') || !(r.total || r.paid)) {
    const msg = r.flags.includes('customer') ? pick('किसका खाता? नाम बोलिए', 'Whose account? Say the name') : pick('कितने रुपये? रकम बोलिए', 'How much? Say the amount');
    out.innerHTML = `<p class="warn">${esc(msg)}</p>`; return speak(msg);
  }
  pending = r;
  const f = (k, v, bad) => `<div class="f"><span>${t(k)}</span><b class="${bad ? 'chk' : ''}">${rupee(v)}${bad ? ' (' + t('check') + ')' : ''}</b></div>`;
  out.innerHTML = `<div class="card"><h2>${esc(r.customer)}</h2>` +
    (r.type === 'payment' ? f('paid', r.paid) : f('total', r.total) + f('paid', r.paid, r.flags.includes('paid')) + f('due', r.due)) +
    `<div class="row"><button class="big" id="yes">${t('save')}</button><button class="big alt" id="no">${t('no')}</button></div></div>`;
  $('#yes').onclick = saveEntry; $('#no').onclick = cancel;
  const say = r.type === 'payment'
    ? pick(`${r.customer}, ${r.paid} रुपये जमा। सेव करूँ?`, `${r.customer}, ${r.paid} rupees received. Save?`)
    : pick(`${r.customer}, कुल ${r.total} रुपये, ${r.paid} दिए, ${r.due} बाकी। सेव करूँ?`, `${r.customer}, ${r.total} total, ${r.paid} paid, ${r.due} due. Save?`);
  speak(say);
  setTimeout(() => { yesNo = listen(txt => { const w = txt.toLowerCase(); if (/(haan|han|yes|ha |हाँ|हां|सेव|save)/.test(w + ' ')) saveEntry(); else if (/(nahi|nahin|no|नहीं)/.test(w)) cancel(); }); }, 2500);
}
function saveEntry() {
  if (!pending) return; if (yesNo) try { yesNo.abort(); } catch (e) {}
  const r = pending; let c = db.customers.find(x => x.name.toLowerCase() === r.customer.toLowerCase());
  if (!c) { c = { id: Date.now(), name: r.customer, phone: '' }; db.customers.push(c); }
  db.entries.push({ id: Math.random().toString(36).slice(2), customerId: c.id, total: r.total, paid: r.paid, due: r.due, items: r.items, timestamp: Date.now(), rawText: r.raw });
  persist(); pending = null; $('#say').value = '';
  $('#out').innerHTML = `<p class="ans">✔ ${esc(c.name)}: ${rupee(balance(c.id))} ${t('due')}</p>`; speak(pick('सेव हो गया', 'Saved'));
}
function cancel() { if (yesNo) try { yesNo.abort(); } catch (e) {} pending = null; $('#out').innerHTML = ''; speechSynthesis.cancel(); $('#say').focus(); }

// ---------- Khata + Hisaab screens ----------
function renderList() {
  const rows = db.customers.map(c => ({ c, b: balance(c.id) })).sort((a, b) => b.b - a.b);
  $('#list').innerHTML = rows.map(({ c, b }) => `<li data-id="${c.id}"><div class="top"><span>${esc(c.name)}</span>
    <span class="amt ${b > 0 ? 'd' : 'z'}">${rupee(b)}</span>${b > 0 ? `<button class="mini" data-remind="${c.id}">${t('remind')}</button>` : ''}</div></li>`).join('');
}
function history(cid) {
  return db.entries.filter(x => x.customerId === cid).sort((a, b) => b.timestamp - a.timestamp)
    .map(x => `<div>${new Date(x.timestamp).toLocaleDateString('en-IN')}: ${x.type === 'payment' || x.items === 'payment' ? '+' + rupee(x.paid) : esc(x.items) + ' ' + rupee(x.total) + ' / ' + rupee(x.paid)}</div>`).join('');
}
$('#list').onclick = ev => {
  const rid = ev.target.dataset.remind, li = ev.target.closest('li');
  if (rid) return remind(+rid);
  if (!li) return; const old = li.querySelector('.hist'); if (old) return old.remove();
  li.insertAdjacentHTML('beforeend', `<div class="hist">${history(+li.dataset.id)}</div>`);
};
function remind(cid) {
  const c = db.customers.find(x => x.id === cid); let ph = c.phone;
  if (!ph) { ph = (prompt('WhatsApp number (10 digits)') || '').replace(/\D/g, ''); if (ph.length !== 10) return; c.phone = ph; persist(); }
  const msg = `नमस्ते ${c.name} जी, आपका ${rupee(balance(cid))} बाकी है। कृपया सुविधानुसार चुका दें। धन्यवाद 🙏`;
  window.open(`https://wa.me/91${ph}?text=${encodeURIComponent(msg)}`, '_blank');
}
function summary() {
  const td = db.entries.filter(x => isToday(x.timestamp));
  return { sales: td.reduce((s, x) => s + x.total, 0), credit: td.filter(x => x.total).reduce((s, x) => s + Math.max(x.due, 0), 0), collected: td.reduce((s, x) => s + x.paid, 0) };
}
function renderSummary() {
  const s = summary();
  $('#sum').innerHTML = [['bikri', s.sales], ['udhaar', s.credit], ['jama', s.collected]].map(([k, v]) => `<div class="stat"><span>${t(k)}</span><b>${rupee(v)}</b></div>`).join('') +
    `<button class="big" id="read">${t('speak')}</button>`;
  $('#read').onclick = () => speak(pick(`आज ${s.sales} रुपये की बिक्री, ${s.credit} रुपये उधार, ${s.collected} रुपये जमा`, `Today ${s.sales} rupees sales, ${s.credit} on credit, ${s.collected} collected`));
}

// ---------- shell ----------
function labels() {
  document.documentElement.lang = lang; $('#lang').value = lang;
  $('#l-bolo').textContent = t('bolo'); $('#go').textContent = t('go'); $('#say').placeholder = t('ph');
  document.querySelectorAll('nav button').forEach(b => b.textContent = t(b.dataset.v));
  renderList(); renderSummary();
}
function show(v) {
  ['bolo', 'khata', 'hisaab'].forEach(x => { $('#v-' + x).hidden = x !== v; });
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  if (v === 'khata') renderList(); if (v === 'hisaab') renderSummary(); if (v === 'bolo') $('#say').focus();
}
document.querySelectorAll('nav button').forEach(b => b.onclick = () => show(b.dataset.v));
$('#lang').onchange = e => { lang = e.target.value; localStorage.kv_lang = lang; labels(); };
$('#go').onclick = onGo;
$('#say').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onGo(); } });
$('#mic').onclick = () => {
  const b = $('#mic'); b.classList.add('rec');
  listen(txt => { $('#say').value = txt; onGo(); }, err => {
    b.classList.remove('rec');
    if (err && err !== 'no-speech' && err !== 'aborted') $('#out').innerHTML = `<p class="warn">${err === 'not-allowed' ? 'Mic permission denied. Type or use Wispr Flow in the box.' : 'Mic not available. Type or use Wispr Flow in the box.'}</p>`;
  });
};
$('#mode').onclick = () => { const k = prompt('Optional AI key (stored only on this device). Leave empty to use the offline parser.', localStorage.kv_key || ''); if (k !== null) { k ? localStorage.kv_key = k.trim() : localStorage.removeItem('kv_key'); } };
$('#mode').textContent = localStorage.kv_key ? 'AI mode' : 'Key not set: offline parser used (tap to add)';
labels(); show('bolo');
