// Offline rule-based parser for Hindi / Hinglish ledger speech. Works with no API key.
const NUM = {ek:1,do:2,teen:3,char:4,chaar:4,paanch:5,panch:5,chhe:6,chhah:6,saat:7,aath:8,nau:9,das:10,
  gyarah:11,barah:12,pandrah:15,bees:20,pachis:25,tees:30,chalis:40,pachas:50,sattar:70,assi:80,nabbe:90,
  dedh:1.5,dhai:2.5};
const DEV = {'ने':'ne','को':'ko','का':'ka','की':'ki','दिया':'diya','दिए':'diye','उधार':'udhaar','बाकी':'baaki',
  'सामान':'saman','लिया':'liya','कितना':'kitna','है':'hai','आज':'aaj','बिक्री':'bikri','सबसे':'sabse','ज्यादा':'zyada'};

function normNumbers(t) {
  const out = []; let cur = 0, tot = 0, run = false, lastD = false;
  const flush = () => { if (run) out.push(String(tot + cur)); cur = 0; tot = 0; run = false; lastD = false; };
  for (const w of t.split(/\s+/).filter(Boolean)) {
    if (/^\d+(\.\d+)?$/.test(w)) { if (run && cur !== 0) flush(); cur = +w; run = true; lastD = true; }
    else if (NUM[w] !== undefined) { if (run && lastD) flush(); cur += NUM[w]; run = true; lastD = false; }
    else if (w === 'sau') { cur = (cur || 1) * 100; run = true; lastD = false; }
    else if (w === 'hazaar' || w === 'hazar') { tot += (cur || 1) * 1000; cur = 0; run = true; lastD = false; }
    else { flush(); out.push(w); }
  }
  flush();
  return out.join(' ');
}

function normalize(raw) {
  let t = raw.toLowerCase().replace(/[₹,?!।.]/g, ' ').replace(/\b(rs|rupaye|rupay|rupees|rupee)\b/g, ' ');
  t = t.replace(/\b(um+|uh+|hmm+|achha|acha|matlab|basically)\b/g, ' ');
  t = t.split(/\s+/).filter(Boolean).map(w => DEV[w] || w).join(' ');
  return normNumbers(t);
}

const cap = s => s.replace(/(^|\s)(\S)/g, (_, a, b) => a + b.toUpperCase());
function findCustomer(name, customers) {
  const n = name.toLowerCase();
  return customers.find(c => c.name.toLowerCase() === n) || customers.find(c => c.name.toLowerCase().startsWith(n)) || null;
}

function parse(raw, customers = []) {
  const t = normalize(raw);
  const res = { raw, text: t, type: 'unknown', flags: [] };
  const nums = (t.match(/\d+(\.\d+)?/g) || []).map(Number);
  const m = t.match(/^([^\d]+?)\s+(ne|ko|ka|ki|se)\b/);
  const nm = m ? m[1].trim() : '';

  if (/sabse (zyada|jyada|jada)/.test(t)) return { ...res, type: 'query_top' };
  if (/\b(aaj|today)\b.*\b(bikri|bikra|sale|hisaab)\b|\b(bikri|sale)\b.*\b(aaj|today)\b/.test(t)) return { ...res, type: 'query_today' };
  if (!nums.length && nm && /(kitna|kitne|how much|balance).*(baaki|udhaar|due|bacha)|(baaki|udhaar|due).*(kitna|kitne)/.test(t)) {
    return { ...res, type: 'query_due', customer: findCustomer(nm, customers)?.name || cap(nm) };
  }

  const known = nm ? findCustomer(nm, customers) : null;
  res.customer = nm ? (known ? known.name : cap(nm)) : '';
  if (!nm) res.flags.push('customer');
  if (!nums.length) res.flags.push('total');

  const isPay = /(diye|diya|jama|wapas|de gaya|de gayi|paid|mile|mila)/.test(t) && !/(saman|liya|khareed|le gaya|le gayi|udhaar|baaki)/.test(t);
  if (isPay) {
    return { ...res, type: 'payment', total: 0, paid: nums[0] || 0, due: -(nums[0] || 0), items: 'payment' };
  }
  const total = nums[0] || 0;
  const pm = t.match(/(\d+(?:\.\d+)?)\s*(?:diya|diye|de diya|paid|jama|nagad)/);
  let paid = 0;
  if (pm && +pm[1] !== total) paid = +pm[1];
  else if (/(nagad|cash|poora|pura|full)/.test(t)) paid = total;
  else if (!/(udhaar|baaki|credit|khata)/.test(t)) { res.flags.push('paid'); }
  if (paid > total) res.flags.push('paid');
  const im = t.match(/\bka\s+(.+?)\s+(liya|le gaya|le gayi|khareeda)/);
  const items = im ? im[1].replace(/\d+/g, '').trim() || 'saman' : 'saman';
  return { ...res, type: 'sale', total, paid, due: total - paid, items };
}

if (typeof module !== 'undefined') module.exports = { parse, normalize, normNumbers };
