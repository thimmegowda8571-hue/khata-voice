// Offline rule-based parser. Understands Hinglish and Hindi, Tamil, Kannada, Telugu, Malayalam, Marathi, Bengali.
// Idea: map each local keyword to one canonical word, then run the same rules for every language.
const NUM = {ek:1,do:2,teen:3,char:4,chaar:4,paanch:5,panch:5,chhe:6,chhah:6,saat:7,aath:8,nau:9,das:10,
  gyarah:11,barah:12,pandrah:15,bees:20,pachis:25,tees:30,chalis:40,pachas:50,sattar:70,assi:80,nabbe:90,dedh:1.5,dhai:2.5};
const DEV = {'ने':'ne','को':'ko','का':'ka','की':'ki','दिया':'diya','दिए':'diye','उधार':'udhaar','बाकी':'baaki','सामान':'saman',
  'लिया':'liya','कितना':'kitna','है':'hai','आज':'aaj','बिक्री':'bikri','सबसे':'sabse','ज्यादा':'zyada'};
const LEX = {
  saman: ['सामान','माल','சாமான்','சரக்கு','ಸಾಮಾನು','ಸಾಮಾನ','సరుకు','సామాను','സാധനം','സാധനങ്ങൾ','মাল','জিনিস'],
  liya: ['लिया','लिए','घेतल','வாங்கி','ತೆಗೆದುಕೊಂಡ','ತಗೊಂಡ','తీసుకున్న','తీసుకొన్న','വാങ്ങി','নিয়েছ','নিলেন','কিনেছ'],
  diya: ['दिया','दिए','दिले','கொடுத்','ಕೊಟ್ಟ','ఇచ్చ','കൊടുത്ത','দিয়েছ','দিলেন'],
  udhaar: ['उधार','कर्ज','கடன்','ಉದ್ರಿ','ಸಾಲ','అప్పు','കടം','ধার','ঋণ'],
  baaki: ['बाकी','शिल्लक','उरल','மீதி','பாக்கி','ಬಾಕಿ','ಉಳಿದ','బాకీ','మిగతా','మిగిలిన','ബാക്കി','বাকি'],
  kitna: ['कितना','कितने','किती','எவ்வளவு','எவ்ளோ','ಎಷ್ಟು','ఎంత','എത്ര','কত'],
  aaj: ['आज','आजची','आजच्या','இன்று','இன்றைய','ಇಂದು','ಇಂದಿನ','ఈరోజు','ఇవాళ','ഇന്ന്','ഇന്നത്തെ','আজ','আজকের'],
  bikri: ['बिक्री','विक्री','விற்பனை','ಮಾರಾಟ','అమ్మకాల','అమ్మకం','വിൽപ്പന','বিক্রি'],
  'sabse zyada': ['जास्त','अधिक','அதிக','ಹೆಚ್ಚು','ఎక్కువ','കൂടുതൽ','বেশি'],
  nagad: ['नकद','कैश','रोख','ரொக்க','ಕ್ಯಾಶ್','ನಗದು','నగదు','క్యాష్','പണമായി','ক্যাশ','নগদ'],
};
const RUP_EXACT = ['रु','ரூ','ರೂ','రూ','രൂ','rs'];
const RUP_PREFIX = ['रुपय','ரூபாய்','ರೂಪಾಯಿ','రూపాయ','രൂപയ','টাকা','rupa','rupe'];
const FILL = ['um','umm','uh','uhh','hmm','achha','acha','matlab','basically'];
const STOP = new Set(['ne','ko','ka','ki','se','hai','saman','liya','diya','diye','udhaar','baaki','kitna','aaj','bikri','sabse','zyada','nagad','चा','ची','चे','च्या']);

// Native digits (Devanagari, Bengali, Tamil, Telugu, Kannada, Malayalam) -> 0-9
const ZEROS = [0x966, 0x9E6, 0xBE6, 0xC66, 0xCE6, 0xD66];
function digits(s) {
  return s.replace(/[\u0966-\u096F\u09E6-\u09EF\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F]/g, c => {
    const x = c.charCodeAt(0); return String(x - ZEROS.find(z => x >= z && x <= z + 9));
  });
}
function mapTok(w) {
  if (RUP_EXACT.includes(w) || RUP_PREFIX.some(p => w.startsWith(p))) return '';
  if (DEV[w]) return DEV[w];
  if (/^[\x00-\x7f]*$/.test(w)) return w;
  for (const k in LEX) if (LEX[k].some(s => w === s || (s.length >= 4 && w.startsWith(s)))) return k;
  return w;
}
function normNumbers(t) {   // Hindi number words ("paanch sau", "do hazaar") -> digits
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
  const s = digits(raw.toLowerCase()).replace(/[₹,?!।.]/g, ' ');
  const tk = s.split(/\s+/).filter(Boolean).map(mapTok).filter(w => w && !FILL.includes(w));
  return normNumbers(tk.join(' '));
}

const cap = s => s.replace(/(^|\s)([a-z])/g, (_, a, b) => a + b.toUpperCase());
const SKIP = ['bhai', 'ji', 'sahab', 'devi', 'bhabhi', 'anna', 'akka'];
function findCustomer(name, customers) {
  const n = name.toLowerCase(), ws = n.split(' ').filter(w => w.length >= 3 && !SKIP.includes(w));
  return customers.find(c => c.name.toLowerCase() === n) || customers.find(c => c.name.toLowerCase().startsWith(n))
    || customers.find(c => c.name.toLowerCase().split(' ').some(w => ws.includes(w))) || null;
}
function nameOf(t) {
  const out = [];
  for (const w of t.split(' ')) { if (/^\d/.test(w) || STOP.has(w) || out.length >= 3) break; out.push(w); }
  return out.join(' ').replace(/^(.{2,}?)ने$/, '$1').trim();   // Marathi "रमेशने"
}

function parse(raw, customers = []) {
  const t = normalize(raw);
  const res = { raw, text: t, type: 'unknown', flags: [] };
  const nums = (t.match(/\d+(\.\d+)?/g) || []).map(Number);
  const nm = nameOf(t);

  if (/sabse (zyada|jyada|jada)/.test(t)) return { ...res, type: 'query_top' };
  if (/\baaj\b/.test(t) && /\bbikri\b/.test(t)) return { ...res, type: 'query_today' };
  if (!nums.length && nm && /kitna.*(baaki|udhaar)|(baaki|udhaar).*kitna/.test(t)) {
    return { ...res, type: 'query_due', customer: findCustomer(nm, customers)?.name || cap(nm) };
  }
  const known = nm ? findCustomer(nm, customers) : null;
  res.customer = nm ? (known ? known.name : cap(nm)) : '';
  if (!nm) res.flags.push('customer');
  if (!nums.length) res.flags.push('total');

  const isPay = /(diye|diya|jama|wapas|paid|mile|mila)/.test(t) && !/(saman|liya|udhaar|baaki)/.test(t);
  if (isPay) return { ...res, type: 'payment', total: 0, paid: nums[0] || 0, due: -(nums[0] || 0), items: 'payment' };

  const total = nums[0] || 0;
  const pm = t.match(/(\d+(?:\.\d+)?)\s*(?:diya|diye|paid|jama)/);
  let paid = 0;
  if (pm && +pm[1] !== total) paid = +pm[1];
  else if (/\bnagad\b|cash|poora|pura|full/.test(t)) paid = total;
  else if (!/(udhaar|baaki|credit|khata)/.test(t)) res.flags.push('paid');
  if (paid > total) res.flags.push('paid');
  const tk = t.split(' '), a = tk.findIndex(w => /^\d/.test(w)), b = tk.indexOf('liya');
  const items = (a >= 0 && b > a ? tk.slice(a + 1, b) : []).filter(w => !STOP.has(w) && !/^\d/.test(w)).join(' ') || 'saman';
  return { ...res, type: 'sale', total, paid, due: total - paid, items };
}

if (typeof module !== 'undefined') module.exports = { parse, normalize };
