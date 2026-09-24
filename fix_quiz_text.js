const fs = require('fs');
const crypto = require('crypto');

// Clean question texts: no embedded answers, proper question form.
// Only entries that are true questions (or should be) — keep action/challenge text as-is.
const FIX = {
  2: 'Berapa hasil 1+1?',
  4: 'Ada berapa roda Mobil?',
  6: 'Berapa hasil 3+3?',
  7: 'Berapa jumlah ayat Surat Al-Fatihah?',
  8: 'Sebutkan nama hewan apa saja?',
  16: 'Apa suara katak?',
  18: 'Berapakah umurmu?',
  19: 'Sebutkan 1 hewan Padang Pasir!',
  23: 'Berapa hasil 4x6?',
  26: 'Sebutkan nama hewan apa saja?',
  32: 'Siapakah Nabi pertama?',
  36: 'Berapa hasil 6x6?',
  37: 'Tiru bunyi kendaraan!',
  41: 'Green Ladder! Naik ke 41',
  43: 'Berapa hasil 7x6?',
  48: 'Tirulah gaya ini!',
  60: 'Berapa hasil 120:2?',
  61: 'Siapa Tuhanmu?',
  63: 'Berapa hasil 9x7?',
  65: 'Bagaimana bunyi sapi?',
  70: 'Sebutkan 2 nama malaikat?',
  77: 'Berapa hasil 7x11?',
  88: 'Tangga turun, aman!',
  89: 'Sebutkan nama hewan berkaki 2?'
};

// Stronger stripAnswer: cut after first ? (drop trailing answer), or Jawab:...
const OLD_STRIP =
  'stripAnswer=(t)=>{var s=String(t||"");var m=s.match(/^(.*?)\\s*Jawab:\\s*.*$/i);if(m)s=m[1];return s.replace(/\\s+/g," ").trim()||String(t||"")}';
const NEW_STRIP =
  'stripAnswer=(t)=>{var s=String(t||"");var m=s.match(/^(.*?)\\s*Jawab:\\s*.*$/i);if(m)s=m[1];var q=s.indexOf("?");if(q>=0)s=s.slice(0,q+1);return s.replace(/\\s+/g," ").trim()||String(t||"")}';

function patch(file) {
  const buf = fs.readFileSync(file);
  const hasBom = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
  let h = buf.toString('utf8');
  if (hasBom && h.charCodeAt(0) === 0xFEFF) h = h.slice(1);

  const a = h.indexOf('mg={');
  const b = h.indexOf('};', a);
  if (a < 0 || b < 0) throw new Error(file + ': mg not found');
  const block = h.slice(a, b + 2);

  // parse mg by matching key:"value" pairs (values may contain escaped quotes rarely — here plain)
  let newBlock = block;
  let changed = 0;
  for (const key of Object.keys(FIX)) {
    const re = new RegExp('(^|[,{])(' + key + ':")((?:[^"\\\\]|\\\\.)*)(")', '');
    const m = newBlock.match(re);
    if (!m) {
      throw new Error(file + ': mg key ' + key + ' not found');
    }
    const oldVal = m[3];
    const newVal = FIX[key];
    if (oldVal !== newVal) {
      newBlock = newBlock.replace(re, '$1$2' + newVal + '$4');
      changed++;
      console.log('  ' + key + ': ' + JSON.stringify(oldVal) + ' -> ' + JSON.stringify(newVal));
    }
  }
  if (changed === 0) console.log('  mg: no value changes (idempotent)');
  h = h.slice(0, a) + newBlock + h.slice(b + 2);

  if (h.indexOf(OLD_STRIP) < 0) {
    if (h.indexOf(NEW_STRIP) < 0) throw new Error(file + ': stripAnswer not found');
    console.log('  stripAnswer already new');
  } else {
    h = h.replace(OLD_STRIP, NEW_STRIP);
    console.log('  stripAnswer upgraded');
  }

  // sanity
  if (h.indexOf('Ada berapa rodanya? (Mobil) - 4 roda') >= 0) throw new Error(file + ': old q4 remains');
  if (h.indexOf('Siapa Tuhanmu? Allah SWT') >= 0) throw new Error(file + ': old q61 remains');
  if (h.indexOf('q=s.indexOf("?")') < 0) throw new Error(file + ': new strip missing');
  if (h.indexOf('for(let hop=0;hop<5;hop++)') < 0) throw new Error(file + ': chain lost');
  if (h.indexOf('answerQuiz=(benar)') < 0) throw new Error(file + ': quiz lost');

  const payload = hasBom
    ? Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(h, 'utf8')])
    : Buffer.from(h, 'utf8');
  fs.writeFileSync(file, payload);
  console.log('OK', file, 'size', payload.length, 'mg_changes', changed);
}

for (const f of [
  'Ular-Tangga-Publish-Ready-V4-6Pemain.html',
  'index.html'
]) {
  console.log('==', f);
  patch(f);
}

const h1 = crypto.createHash('sha256').update(fs.readFileSync('Ular-Tangga-Publish-Ready-V4-6Pemain.html')).digest('hex');
const h2 = crypto.createHash('sha256').update(fs.readFileSync('index.html')).digest('hex');
console.log('identical', h1 === h2, h1.toUpperCase());

// syntax
for (const f of ['Ular-Tangga-Publish-Ready-V4-6Pemain.html', 'index.html']) {
  const html = fs.readFileSync(f, 'utf8');
  const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
  let m, n = 0, bad = 0;
  while ((m = re.exec(html))) {
    n++;
    if (!m[1].trim()) continue;
    try { new Function(m[1]); } catch (e) { bad++; console.log('FAIL', f, n, e.message); }
  }
  console.log(f, n + ' blocks', bad + ' fail');
  if (bad) process.exit(1);
}
console.log('ALL OK');
