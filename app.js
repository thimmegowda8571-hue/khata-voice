// KhataVoice UI: speak -> parse -> read back -> confirm -> save. Add / edit / delete supported. Data stays on the device.
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LANGS = { hi: 'hi-IN', en: 'en-IN', ta: 'ta-IN', kn: 'kn-IN', te: 'te-IN', ml: 'ml-IN', mr: 'mr-IN', bn: 'bn-IN' };
const L = {
  hi: { bolo: 'बोलो', go: 'समझो', khata: 'खाता', hisaab: 'हिसाब', save: 'हाँ, सेव करो', no: 'नहीं', edit: 'बदलो', del: 'हटाओ', add: '+ जोड़ो', ph: 'जैसे: रमेश ने 450 का सामान लिया, 200 दिया, बाकी उधार',
    bikri: 'आज की बिक्री', udhaar: 'उधार दिया', jama: 'आज जमा मिला', remind: 'याद दिलाओ', total: 'कुल', paid: 'दिया', due: 'बाकी', saved: 'सेव हो गया',
    whose: 'किसका खाता? नाम बोलिए', howmuch: 'कितने रुपये? रकम बोलिए', unknown: 'समझ नहीं आया, फिर बोलिए', askSave: 'सेव करूँ?', rm: 'नमस्ते {n} जी, आपका ₹{a} बाकी है। कृपया सुविधानुसार चुका दें। धन्यवाद 🙏' },
  en: { bolo: 'Speak', go: 'Understand', khata: 'Ledger', hisaab: 'Summary', save: 'Yes, save', no: 'No', edit: 'Edit', del: 'Delete', add: '+ Add', ph: 'e.g. Ramesh took goods for 450, paid 200, rest on credit',
    bikri: "Today's sales", udhaar: 'Credit given', jama: 'Collected today', remind: 'Remind', total: 'Total', paid: 'Paid', due: 'Due', saved: 'Saved',
    whose: 'Whose account? Say the name', howmuch: 'How much? Say the amount', unknown: 'Did not understand, say it again', askSave: 'Save?', rm: 'Hello {n}, your pending balance is ₹{a}. Please pay when convenient. Thank you 🙏' },
  ta: { bolo: 'பேசுங்கள்', go: 'புரிந்துகொள்', khata: 'கணக்கு', hisaab: 'சுருக்கம்', save: 'ஆம், சேமி', no: 'இல்லை', edit: 'மாற்று', del: 'நீக்கு', add: '+ சேர்', ph: 'எ.கா: ரமேஷ் 450 ரூபாய்க்கு சாமான் வாங்கினார், 200 கொடுத்தார், மீதி கடன்',
    bikri: 'இன்றைய விற்பனை', udhaar: 'கடன் கொடுத்தது', jama: 'இன்று வசூல்', remind: 'நினைவூட்டு', total: 'மொத்தம்', paid: 'கொடுத்தது', due: 'பாக்கி', saved: 'சேமிக்கப்பட்டது',
    whose: 'யாருடைய கணக்கு? பெயர் சொல்லுங்கள்', howmuch: 'எவ்வளவு? தொகை சொல்லுங்கள்', unknown: 'புரியவில்லை, மீண்டும் சொல்லுங்கள்', askSave: 'சேமிக்கவா?', rm: 'வணக்கம் {n}, உங்கள் பாக்கி ₹{a}. வசதிப்படி செலுத்தவும். நன்றி 🙏' },
  kn: { bolo: 'ಹೇಳಿ', go: 'ಅರ್ಥಮಾಡು', khata: 'ಖಾತೆ', hisaab: 'ಲೆಕ್ಕ', save: 'ಹೌದು, ಸೇವ್', no: 'ಇಲ್ಲ', edit: 'ಬದಲಿಸಿ', del: 'ಅಳಿಸಿ', add: '+ ಸೇರಿಸಿ', ph: 'ಉದಾ: ರಮೇಶ್ 450 ರೂಪಾಯಿ ಸಾಮಾನು ತೆಗೆದುಕೊಂಡ, 200 ಕೊಟ್ಟ, ಉಳಿದದ್ದು ಉದ್ರಿ',
    bikri: 'ಇಂದಿನ ಮಾರಾಟ', udhaar: 'ಉದ್ರಿ ನೀಡಿದ್ದು', jama: 'ಇಂದು ಸಿಕ್ಕಿದ್ದು', remind: 'ನೆನಪಿಸಿ', total: 'ಒಟ್ಟು', paid: 'ಕೊಟ್ಟದ್ದು', due: 'ಬಾಕಿ', saved: 'ಸೇವ್ ಆಯಿತು',
    whose: 'ಯಾರ ಖಾತೆ? ಹೆಸರು ಹೇಳಿ', howmuch: 'ಎಷ್ಟು ರೂಪಾಯಿ? ಮೊತ್ತ ಹೇಳಿ', unknown: 'ಅರ್ಥವಾಗಲಿಲ್ಲ, ಮತ್ತೆ ಹೇಳಿ', askSave: 'ಸೇವ್ ಮಾಡಲೇ?', rm: 'ನಮಸ್ಕಾರ {n}, ನಿಮ್ಮ ಬಾಕಿ ₹{a}. ಅನುಕೂಲವಾದಾಗ ಪಾವತಿಸಿ. ಧನ್ಯವಾದ 🙏' },
  te: { bolo: 'చెప్పండి', go: 'అర్థం చేసుకో', khata: 'ఖాతా', hisaab: 'లెక్క', save: 'అవును, సేవ్', no: 'కాదు', edit: 'మార్చు', del: 'తొలగించు', add: '+ చేర్చు', ph: 'ఉదా: రమేష్ 450 రూపాయల సరుకు తీసుకున్నాడు, 200 ఇచ్చాడు, మిగతాది అప్పు',
    bikri: 'ఈ రోజు అమ్మకాలు', udhaar: 'అప్పు ఇచ్చింది', jama: 'ఈ రోజు వసూలు', remind: 'గుర్తు చేయి', total: 'మొత్తం', paid: 'ఇచ్చింది', due: 'బాకీ', saved: 'సేవ్ అయింది',
    whose: 'ఎవరి ఖాతా? పేరు చెప్పండి', howmuch: 'ఎంత రూపాయలు? మొత్తం చెప్పండి', unknown: 'అర్థం కాలేదు, మళ్ళీ చెప్పండి', askSave: 'సేవ్ చేయనా?', rm: 'నమస్తే {n}, మీ బాకీ ₹{a}. వీలైనప్పుడు చెల్లించండి. ధన్యవాదాలు 🙏' },
  ml: { bolo: 'പറയൂ', go: 'മനസ്സിലാക്കൂ', khata: 'കണക്ക്', hisaab: 'സംഗ്രഹം', save: 'അതെ, സേവ്', no: 'ഇല്ല', edit: 'മാറ്റുക', del: 'നീക്കുക', add: '+ ചേർക്കുക', ph: 'ഉദാ: രമേഷ് 450 രൂപയുടെ സാധനം വാങ്ങി, 200 കൊടുത്തു, ബാക്കി കടം',
    bikri: 'ഇന്നത്തെ വിൽപ്പന', udhaar: 'കടം നൽകിയത്', jama: 'ഇന്ന് ലഭിച്ചത്', remind: 'ഓർമ്മിപ്പിക്കൂ', total: 'ആകെ', paid: 'കൊടുത്തത്', due: 'ബാക്കി', saved: 'സേവ് ചെയ്തു',
    whose: 'ആരുടെ കണക്ക്? പേര് പറയൂ', howmuch: 'എത്ര രൂപ? തുക പറയൂ', unknown: 'മനസ്സിലായില്ല, വീണ്ടും പറയൂ', askSave: 'സേവ് ചെയ്യട്ടേ?', rm: 'നമസ്കാരം {n}, നിങ്ങളുടെ ബാക്കി ₹{a}. സൗകര്യമുള്ളപ്പോൾ അടയ്ക്കുക. നന്ദി 🙏' },
  mr: { bolo: 'बोला', go: 'समजून घ्या', khata: 'खाते', hisaab: 'हिशोब', save: 'हो, सेव्ह करा', no: 'नाही', edit: 'बदला', del: 'काढा', add: '+ जोडा', ph: 'उदा: रमेशने 450 चा माल घेतला, 200 दिले, बाकी उधार',
    bikri: 'आजची विक्री', udhaar: 'उधार दिले', jama: 'आज जमा', remind: 'आठवण द्या', total: 'एकूण', paid: 'दिले', due: 'बाकी', saved: 'सेव्ह झाले',
    whose: 'कोणाचे खाते? नाव सांगा', howmuch: 'किती रुपये? रक्कम सांगा', unknown: 'समजले नाही, पुन्हा सांगा', askSave: 'सेव्ह करू?', rm: 'नमस्कार {n}, तुमचे ₹{a} बाकी आहेत. कृपया सोयीने द्या. धन्यवाद 🙏' },
  bn: { bolo: 'বলুন', go: 'বুঝুন', khata: 'খাতা', hisaab: 'হিসাব', save: 'হ্যাঁ, সেভ', no: 'না', edit: 'বদলান', del: 'মুছুন', add: '+ যোগ করুন', ph: 'যেমন: রমেশ ৪৫০ টাকার জিনিস নিয়েছে, ২০০ দিয়েছে, বাকি ধার',
    bikri: 'আজকের বিক্রি', udhaar: 'ধার দেওয়া', jama: 'আজ জমা', remind: 'মনে করান', total: 'মোট', paid: 'দিয়েছে', due: 'বাকি', saved: 'সেভ হয়েছে',
    whose: 'কার খাতা? নাম বলুন', howmuch: 'কত টাকা? পরিমাণ বলুন', unknown: 'বুঝতে পারিনি, আবার বলুন', askSave: 'সেভ করব?', rm: 'নমস্কার {n}, আপনার ₹{a} বাকি আছে। সুবিধামতো মিটিয়ে দিন। ধন্যবাদ 🙏' },
};
const EXTRA = {
  hi: { rate: 'का रेट?', days: 'दिन', first: 'पहले याद दिलाओ' }, en: { rate: 'rate?', days: 'days', first: 'Remind first' },
  ta: { rate: 'விலை?', days: 'நாள்', first: 'முதலில் நினைவூட்டு' }, kn: { rate: 'ರೇಟ್?', days: 'ದಿನ', first: 'ಮೊದಲು ನೆನಪಿಸಿ' },
  te: { rate: 'రేటు?', days: 'రోజులు', first: 'ముందు గుర్తు చేయండి' }, ml: { rate: 'റേറ്റ്?', days: 'ദിവസം', first: 'ആദ്യം ഓർമ്മിപ്പിക്കൂ' },
  mr: { rate: 'दर?', days: 'दिवस', first: 'आधी आठवण द्या' }, bn: { rate: 'দাম?', days: 'দিন', first: 'আগে মনে করান' },
};
for (const k in EXTRA) Object.assign(L[k], EXTRA[k]);
let lang = localStorage.kv_lang; if (!L[lang]) lang = 'hi';
const t = k => L[lang][k];
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const YES = ['haan', 'han', 'ha', 'yes', 'save', 'हाँ', 'हां', 'हो', 'होय', 'ஆம்', 'ಹೌದು', 'అవును', 'അതെ', 'হ্যাঁ', 'সেভ', 'सेव'];
const NO = ['nahi', 'nahin', 'no', 'नहीं', 'नाही', 'இல்லை', 'ಇಲ್ಲ', 'కాదు', 'ഇല്ല', 'না'];

// ---------- storage ----------
const day = n => Date.now() - n * 864e5, rid = () => Math.random().toString(36).slice(2);
function seed() {
  const c = ['Ramesh', 'Sunita Devi', 'Mohammed Irfan', 'Lakshmi'].map((name, i) => ({ id: i + 1, name, phone: '' }));
  const e = (cid, total, paid, items, d, raw) => ({ id: rid(), customerId: cid, total, paid, due: total - paid, items, timestamp: day(d), rawText: raw });
  return { v: 2, customers: c, prices: { atta: 45, chawal: 60, daal: 120, tel: 150 }, entries: [
    e(1, 900, 0, 'atta, tel', 22, 'Ramesh ko atta aur tel udhaar'), e(1, 0, 300, 'payment', 10, 'Ramesh ne 300 diye'), e(1, 450, 200, 'saman', 2, 'Ramesh ne 450 ka saman liya, 200 diya'),
    e(2, 1200, 0, 'atta, daal', 9, 'Sunita ne 1200 ka atta daal liya'), e(2, 0, 1200, 'payment', 3, 'Sunita ne 1200 diye'), e(2, 300, 0, 'cheeni', 1, 'Sunita ne 300 ka cheeni liya'),
    e(3, 300, 300, 'chai patti', 0, 'Irfan ne 300 ka chai patti liya nagad'), e(4, 800, 300, 'chawal', 12, 'Lakshmi ne 800 ka chawal liya, 300 diya')] };
}
let db; try { db = JSON.parse(localStorage.kv_db); } catch (e) { db = null; }
if (!db || !db.customers || db.v !== 2) { db = seed(); persist(); }
db.prices = db.prices || {};
function persist() { try { localStorage.kv_db = JSON.stringify(db); } catch (e) { /* storage blocked */ } }
const balance = cid => db.entries.filter(x => x.customerId === cid).reduce((s, x) => s + x.due, 0);
const rupee = n => '₹' + Math.abs(n).toLocaleString('en-IN');
const isToday = ts => new Date(ts).toDateString() === new Date().toDateString();
const byName = n => db.customers.find(c => c.name.toLowerCase() === n.toLowerCase());
function ensureCustomer(name) { let c = byName(name); if (!c) { c = { id: Date.now(), name, phone: '' }; db.customers.push(c); } return c; }

// ---------- speech ----------
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = LANGS[lang]; speechSynthesis.speak(u);
}
function listen(onText, onEnd) {
  if (!SR) { onEnd && onEnd('unsupported'); return null; }
  const r = new SR(); r.lang = LANGS[lang]; r.interimResults = false;
  r.onresult = ev => onText(ev.results[0][0].transcript);
  r.onerror = ev => onEnd && onEnd(ev.error);
  r.onend = () => onEnd && onEnd();
  try { r.start(); } catch (e) { onEnd && onEnd('error'); }
  return r;
}

// ---------- optional AI parsing (own key; otherwise offline rules) ----------
async function aiParse(text) {
  const key = localStorage.kv_key; if (!key) throw new Error('key not set');
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: 'claude-haiku-5-5', max_tokens: 300,
      system: 'Parse an Indian-language shop ledger sentence. Reply ONLY JSON: {"type":"sale|payment|query_due|query_today|query_top|unknown","customer":string,"total":number,"paid":number,"items":string}.',
      messages: [{ role: 'user', content: text }] }) });
  const j = await r.json(); const o = JSON.parse(j.content[0].text.replace(/```json|```/g, '').trim());
  o.due = (o.total || 0) - (o.paid || 0); o.flags = []; o.raw = text;
  if (o.type === 'payment') { o.total = 0; o.due = -o.paid; o.items = 'payment'; }
  return o;
}
async function understand(text) {
  try { const o = await aiParse(text); $('#mode').textContent = 'AI mode'; return o; }
  catch (e) { $('#mode').textContent = localStorage.kv_key ? 'AI error: offline parser used' : 'Key not set: offline parser used (tap to add)'; return parse(text, db.customers, db.prices); }
}

// ---------- Speak screen ----------
let pending = null, yesNo = null;
const stopListen = () => { if (yesNo) { try { yesNo.abort(); } catch (e) {} yesNo = null; } };
const answer = msg => { $('#out').innerHTML = `<p class="ans">${esc(msg)}</p>`; speak(msg); };
const problem = msg => { $('#out').innerHTML = `<p class="warn">${esc(msg)}</p>`; speak(msg); };
async function onGo() { const text = $('#say').value.trim(); if (text) render(await understand(text)); }

function render(r) {
  pending = null; stopListen();
  if (r.type === 'query_due') { const c = byName(r.customer || ''); return answer(`${c ? c.name : r.customer}: ${t('due')} ${c ? balance(c.id) : 0}`); }
  if (r.type === 'query_today') { const s = summary(); return answer(`${t('bikri')} ${s.sales}. ${t('udhaar')} ${s.credit}`); }
  if (r.type === 'query_top') {
    const top = db.customers.map(c => ({ c, b: balance(c.id) })).sort((a, b) => b.b - a.b)[0];
    return answer(top ? `${top.c.name}: ${t('due')} ${top.b}` : '');
  }
  if (r.type === 'unknown') return problem(t('unknown'));
  if (r.mode === 'items') return r.flags.includes('customer') ? problem(t('whose')) : renderItems(r);
  if (r.flags.includes('customer') || r.flags.includes('total') || !(r.total || r.paid)) return problem(r.flags.includes('customer') ? t('whose') : t('howmuch'));
  pending = r;
  const f = (k, v, bad) => `<div class="f"><span>${t(k)}</span><b class="${bad ? 'chk' : ''}">${rupee(v)}${bad ? ' ⚠' : ''}</b></div>`;
  $('#out').innerHTML = `<div class="card"><h2>${esc(r.customer)}</h2>` + (r.type === 'payment' ? f('paid', r.paid) : f('total', r.total) + f('paid', r.paid, r.flags.includes('paid')) + f('due', r.due)) +
    `<div class="row"><button class="btn" id="yes">${t('save')}</button><button class="btn alt" id="no">${t('no')}</button></div></div>`;
  $('#yes').onclick = saveEntry; $('#no').onclick = cancel;
  confirmSpeak(r);
}
function confirmSpeak(r) {
  stopListen();
  speak(r.type === 'payment' ? `${r.customer}. ${t('paid')} ${r.paid}. ${t('askSave')}` : `${r.customer}. ${t('total')} ${r.total}. ${t('paid')} ${r.paid}. ${t('due')} ${r.due}. ${t('askSave')}`);
  setTimeout(() => { if (pending !== r) return; yesNo = listen(txt => {
    const w = txt.toLowerCase().split(/\s+/); if (w.some(x => YES.includes(x))) saveEntry(); else if (w.some(x => NO.includes(x))) cancel(); }); }, 3000);
}

// ---------- Item mode: say items, the app uses remembered rates to make the bill ----------
function calcItems(r) {
  let total = 0, ok = true;
  r.lines.forEach(l => { const p = l.price || db.prices[l.item]; if (p > 0) total += p * l.qty; else ok = false; });
  r.total = total; r.paid = r.paidSpec === 'all' ? total : Math.min(r.paidSpec, total); r.due = total - r.paid;
  r.items = r.lines.map(l => `${l.item} ×${l.qty}`).join(', ');
  return ok;
}
function renderItems(r) {
  pending = r; r.lines.forEach(l => { l.price = db.prices[l.item]; });
  const rows = r.lines.map((l, i) => `<div class="f"><span>${esc(l.item)} × ${l.qty} ${esc(l.unit)}</span>` +
    (l.price ? `<b>${rupee(l.price * l.qty)}</b>` : `<input class="rate" data-i="${i}" type="number" min="1" inputmode="numeric" placeholder="₹ ${t('rate')}">`) + '</div>').join('');
  $('#out').innerHTML = `<div class="card"><h2>${esc(r.customer)}</h2>${rows}<div id="tot"></div><div class="row"><button class="btn" id="yes">${t('save')}</button><button class="btn alt" id="no">${t('no')}</button></div></div>`;
  $('#yes').onclick = saveEntry; $('#no').onclick = cancel;
  let tmr;
  document.querySelectorAll('.rate').forEach(inp => { inp.oninput = () => {
    r.lines[+inp.dataset.i].price = +inp.value || undefined; showTot(r); clearTimeout(tmr);
    tmr = setTimeout(() => { if (pending === r && calcItems(r)) confirmSpeak(r); }, 1500); }; });
  showTot(r);
  const first = r.lines.findIndex(l => !l.price);
  if (first < 0) return confirmSpeak(r);
  speak(`${r.lines[first].item} ${t('rate')}`);   // asks the rate once; it is remembered afterwards
  setTimeout(() => { if (pending !== r) return; yesNo = listen(txt => {
    const n = (normalize(txt).match(/\d+/) || [])[0], inp = document.querySelector(`.rate[data-i="${first}"]`); if (n && inp) { inp.value = n; inp.oninput(); } }); }, 2500);
}
function showTot(r) {
  const ok = calcItems(r), box = $('#tot'), bad = r.flags.includes('paid');
  if (box) box.innerHTML = ok ? `<div class="f"><span>${t('total')}</span><b>${rupee(r.total)}</b></div><div class="f"><span>${t('paid')}</span><b class="${bad ? 'chk' : ''}">${rupee(r.paid)}${bad ? ' ⚠' : ''}</b></div><div class="f"><span>${t('due')}</span><b>${rupee(r.due)}</b></div>` : '';
  const y = $('#yes'); if (y) y.disabled = !ok;
}
function saveEntry() {
  if (!pending) return;
  if (pending.mode === 'items') { if (!calcItems(pending)) return; pending.lines.forEach(l => { if (l.price > 0) db.prices[l.item] = l.price; }); }
  stopListen();
  const r = pending, c = ensureCustomer(r.customer);
  db.entries.push({ id: rid(), customerId: c.id, total: r.total, paid: r.paid, due: r.due, items: r.items || 'saman', timestamp: Date.now(), rawText: r.raw });
  persist(); pending = null; $('#say').value = ''; refresh();
  $('#out').innerHTML = `<p class="ans">✔ ${esc(c.name)}: ${t('due')} ${rupee(balance(c.id))}</p>`; speak(t('saved'));
}
function cancel() { stopListen(); pending = null; $('#out').innerHTML = ''; if ('speechSynthesis' in window) speechSynthesis.cancel(); $('#say').focus(); }

// ---------- Ledger: add / edit / delete ----------
const open = new Set(); let editing = null;
// Trust meter: pays-in-days (average) and oldest unpaid credit, using first-in-first-out matching of payments.
function trust(cid) {
  const es = db.entries.filter(x => x.customerId === cid).sort((a, b) => a.timestamp - b.timestamp), credits = [], delays = [];
  for (const x of es) {
    if (x.due > 0) credits.push({ ts: x.timestamp, left: x.due });
    else if (x.due < 0) {
      let pay = -x.due;
      while (pay > 0 && credits.length) {
        const c = credits[0], used = Math.min(c.left, pay); c.left -= used; pay -= used;
        if (c.left <= 0) { delays.push((x.timestamp - c.ts) / 864e5); credits.shift(); }
      }
    }
  }
  return { avg: delays.length ? delays.reduce((s, d) => s + d, 0) / delays.length : null, oldest: credits.length ? (Date.now() - credits[0].ts) / 864e5 : 0, owe: credits.reduce((s, c) => s + c.left, 0) };
}
const risk = m => Math.max(m.oldest, m.avg || 0);
function badge(cid) {
  const m = trust(cid); let k = 'n';
  if (m.owe > 0 || m.avg !== null) { const d = risk(m); k = d <= 7 ? 'g' : d <= 15 ? 'y' : 'r'; }
  return `<i class="dot ${k}" role="img" aria-label="${{ g: 'good', y: 'watch', r: 'risky', n: 'new' }[k]}"></i>`;
}
function trustLine(cid) { const m = trust(cid); return m.avg === null && m.owe <= 0 ? '' : `<div class="tr">✅ ${m.avg === null ? '–' : Math.round(m.avg)} ${t('days')} · ⏳ ${Math.round(m.oldest)} ${t('days')}</div>`; }
function remindFirst() {
  const rows = db.customers.map(c => ({ c, m: trust(c.id) })).filter(x => x.m.owe > 0).sort((a, b) => risk(b.m) - risk(a.m) || b.m.owe - a.m.owe).slice(0, 3);
  return rows.length ? `<h3>${t('first')}</h3>` + rows.map(({ c, m }) => `<div class="stat"><span>${badge(c.id)} ${esc(c.name)}<br><small>⏳ ${Math.round(m.oldest)} ${t('days')}</small></span><span><b>${rupee(m.owe)}</b> <button class="mini" data-remind="${c.id}">${t('remind')}</button></span></div>`).join('') : '';
}
function hist(c) {
  return db.entries.filter(x => x.customerId === c.id).sort((a, b) => b.timestamp - a.timestamp).map(x =>
    `<div class="e"><span>${new Date(x.timestamp).toLocaleDateString('en-IN')}</span><span class="it">${x.items === 'payment' ? '+' + rupee(x.paid) : esc(x.items) + ' ' + rupee(x.total) + ' / ' + rupee(x.paid)}</span>` +
    `<button class="ic" data-edit="${x.id}" aria-label="${t('edit')}">✎</button><button class="ic" data-del="${x.id}" aria-label="${t('del')}">🗑</button></div>`).join('');
}
function renderList() {
  const rows = db.customers.map(c => ({ c, b: balance(c.id) })).sort((a, b) => b.b - a.b);
  $('#list').innerHTML = rows.map(({ c, b }) => `<li><div class="top" data-toggle="${c.id}"><span class="av">${esc(c.name[0] || '?')}</span><span class="nm">${badge(c.id)} ${esc(c.name)}</span><span class="amt ${b > 0 ? 'd' : 'z'}">${rupee(b)}</span></div>` +
    (open.has(c.id) ? `<div class="hist">${trustLine(c.id)}${hist(c)}<div class="acts">${b > 0 ? `<button class="mini" data-remind="${c.id}">${t('remind')}</button>` : ''}<button class="mini" data-ren="${c.id}">${t('edit')}</button><button class="mini bad" data-delc="${c.id}">${t('del')}</button></div></div>` : '') + '</li>').join('');
}
$('#list').onclick = ev => {
  const b = ev.target.closest('[data-toggle],[data-remind],[data-ren],[data-delc],[data-edit],[data-del]'); if (!b) return;
  const d = b.dataset, cust = id => db.customers.find(c => c.id === +id);
  if (d.toggle) { const id = +d.toggle; open.has(id) ? open.delete(id) : open.add(id); }
  else if (d.remind) return remind(cust(d.remind));
  else if (d.edit) return openDlg(db.entries.find(e => e.id === d.edit));
  else if (d.ren) { const c = cust(d.ren), n = prompt(t('edit'), c.name); if (n && n.trim()) c.name = n.trim(); }
  else if (d.delc) { const c = cust(d.delc); if (confirm(`${t('del')}? ${c.name}`)) { db.customers = db.customers.filter(x => x !== c); db.entries = db.entries.filter(e => e.customerId !== c.id); } }
  else if (d.del && confirm(t('del') + '?')) db.entries = db.entries.filter(e => e.id !== d.del);
  persist(); refresh();
};
function openDlg(e) {
  editing = e || null; const c = e && db.customers.find(x => x.id === e.customerId);
  $('#f-name').value = c ? c.name : ''; $('#f-total').value = e ? e.total : ''; $('#f-paid').value = e ? e.paid : ''; $('#f-items').value = e ? e.items : '';
  $('#names').innerHTML = db.customers.map(x => `<option value="${esc(x.name)}">`).join(''); $('#d-err').textContent = ''; $('#dlg').showModal();
}
$('#sum').onclick = ev => { const b = ev.target.closest('[data-remind]'); if (b) remind(db.customers.find(c => c.id === +b.dataset.remind)); };
$('#add').onclick = () => openDlg(null);
$('#d-no').onclick = () => $('#dlg').close();
$('#d-ok').onclick = () => {
  const name = $('#f-name').value.trim(), total = +$('#f-total').value || 0, paid = +$('#f-paid').value || 0;
  if (!name) return ($('#d-err').textContent = t('whose'));
  if (total <= 0 && paid <= 0) return ($('#d-err').textContent = t('howmuch'));
  const c = ensureCustomer(name), items = total === 0 ? 'payment' : ($('#f-items').value.trim() || 'saman');
  const data = { customerId: c.id, total, paid, due: total - paid, items };
  if (editing) Object.assign(editing, data); else db.entries.push({ id: rid(), timestamp: Date.now(), rawText: 'manual', ...data });
  persist(); $('#dlg').close(); open.add(c.id); refresh();
};
function remind(c) {
  let ph = c.phone;
  if (!ph) { ph = (prompt('WhatsApp number (10 digits)') || '').replace(/\D/g, ''); if (ph.length !== 10) return; c.phone = ph; persist(); }
  const msg = t('rm').replace('{n}', c.name).replace('{a}', Math.max(balance(c.id), 0));
  window.open(`https://wa.me/91${ph}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ---------- Summary ----------
function summary() {
  const td = db.entries.filter(x => isToday(x.timestamp));
  return { sales: td.reduce((s, x) => s + x.total, 0), credit: td.filter(x => x.total).reduce((s, x) => s + Math.max(x.due, 0), 0), collected: td.reduce((s, x) => s + x.paid, 0) };
}
function renderSummary() {
  const s = summary();
  $('#sum').innerHTML = [['bikri', s.sales], ['udhaar', s.credit], ['jama', s.collected]].map(([k, v]) => `<div class="stat"><span>${t(k)}</span><b>${rupee(v)}</b></div>`).join('') + remindFirst() + '<button class="btn" id="read">🔊</button>';
  $('#read').onclick = () => speak(`${t('bikri')} ${s.sales}. ${t('udhaar')} ${s.credit}. ${t('jama')} ${s.collected}`);
}

// ---------- shell ----------
function refresh() {
  const owed = db.customers.reduce((s, c) => s + Math.max(balance(c.id), 0), 0);
  $('#strip').innerHTML = `${t('due')}: <b>${rupee(owed)}</b>`; renderList(); renderSummary();
}
function labels() {
  document.documentElement.lang = lang; $('#lang').value = lang;
  $('#l-bolo').textContent = t('bolo'); $('#go').textContent = t('go'); $('#say').placeholder = t('ph'); $('#add').textContent = t('add');
  const ic = { bolo: '🎤', khata: '📒', hisaab: '📊' };
  document.querySelectorAll('nav button').forEach(b => { b.textContent = `${ic[b.dataset.v]} ${t(b.dataset.v)}`; }); refresh();
}
function show(v) {
  ['bolo', 'khata', 'hisaab'].forEach(x => { $('#v-' + x).hidden = x !== v; });
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  if (v === 'bolo') $('#say').focus();
}
document.querySelectorAll('nav button').forEach(b => { b.onclick = () => show(b.dataset.v); });
$('#lang').onchange = e => { lang = e.target.value; localStorage.kv_lang = lang; labels(); };
$('#go').onclick = onGo;
$('#say').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onGo(); } });
$('#mic').onclick = () => {
  const b = $('#mic'); b.classList.add('rec'); $('#out').innerHTML = '<p class="ans">🎤 …</p>';
  let got = false, shown = false;
  const why = { 'not-allowed': 'Mic is blocked. Allow the microphone in the browser and in Windows Settings > Privacy > Microphone.', network: 'The browser speech service cannot be reached. Use Google Chrome, or dictate with Wispr Flow in the box.',
    'no-speech': 'Heard nothing. Speak right after pressing the mic.', unsupported: 'This browser has no speech recognition. Use Google Chrome, or dictate with Wispr Flow in the box.',
    'audio-capture': 'No microphone found.', 'language-not-supported': 'This language is not supported by the browser mic. Use Wispr Flow in the box.' };
  listen(txt => { got = true; $('#say').value = txt; onGo(); }, err => {
    b.classList.remove('rec');
    if (got || shown) return;
    shown = true;
    $('#out').innerHTML = `<p class="warn">${esc(why[err || 'no-speech'] || 'Mic problem')} (${esc(err || 'ended')})</p>`;
  });
};
$('#mode').onclick = () => { const k = prompt('Optional AI key (kept only on this device). Empty = offline parser.', localStorage.kv_key || ''); if (k !== null) { if (k.trim()) localStorage.kv_key = k.trim(); else localStorage.removeItem('kv_key'); } };
$('#mode').textContent = localStorage.kv_key ? 'AI mode' : 'Key not set: offline parser used (tap to add)';
labels(); show('bolo');
