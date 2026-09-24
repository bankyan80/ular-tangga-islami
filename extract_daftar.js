const fs = require('fs');

const h = fs.readFileSync('index.html', 'utf8');

// mg = tantangan per kotak
const ma = h.indexOf('mg={');
if (ma < 0) throw new Error('mg not found');
// find matching close: mg block ends with }; before next var or function
// pattern: mg={...};  then maybe more vars in chain
// safer: scan from ma for key:"value" pairs until we hit }; after last pair
let i = ma + 3; // after mg=
if (h[i] !== '{') throw new Error('mg not {');
let depth = 0;
let end = -1;
for (let k = i; k < h.length; k++) {
  const c = h[k];
  if (c === '{') depth++;
  else if (c === '}') {
    depth--;
    if (depth === 0) { end = k; break; }
  }
}
if (end < 0) throw new Error('mg end not found');
const body = h.slice(i + 1, end);

// parse pairs key:"value"
const re = /(\d+):"((?:[^"\\]|\\.)*)"/g;
const entries = [];
let m;
while ((m = re.exec(body))) {
  entries.push({ pos: +m[1], text: m[2].replace(/\\"/g, '"').replace(/\\n/g, '\n') });
}
entries.sort((a, b) => a.pos - b.pos);

// classify
function classify(t) {
  if (/\?/.test(t)) return 'QUIZ';
  if (/Jawab/i.test(t)) return 'QUIZ';
  // known non-quiz challenges / bonuses / events
  if (/Takbir|maju|Maju|bonus|Bonus|Naik ke|Turun|Ladder|ladder|Bacakan|Tiru|Tirulah|Do'a|Doa|Shalat|surat|Surat|zakat|puasa|Amin|Alhamdulillah|Allahu|Aman|aman|Hafal|Hafalan|Cerita|Sebut/i.test(t) && !/\?/.test(t)) {
    // some info events
  }
  if (/\?/.test(t)) return 'QUIZ';
  // info / tantangan non-kuis
  if (/Naik ke|Turun|Ladder|ladder|bonus|Bonus|Maju|maju|Takbir/i.test(t)) return 'EVENT';
  if (/Bacakan|Tiru|Tirulah|Do'a|Doa|Hafal|Cerita/i.test(t)) return 'TANTANGAN';
  return 'INFO';
}

// better classification based on game logic: isQ = /?|Jawab/i
function kindOf(t) {
  if (/\?|Jawab/i.test(t)) return 'QUIZ (Benar/Salah)';
  return 'INFO/TANTANGAN (Lanjutkan)';
}

const lines = [];
lines.push('DAFTAR TANTANGAN - Ular Tangga Islami V4');
lines.push('='.repeat(60));
lines.push('Sumber: index.html / Ular-Tangga-Publish-Ready-V4-6Pemain.html');
lines.push('Data: object mg={pos:teks} — muncul saat mendarat di kotak pos');
lines.push('');
lines.push('Jenis modal dalam game:');
lines.push('  - QUIZ        : ada "?" atau "Jawab" → tombol Benar/Salah');
lines.push('  - INFO/TANTANGAN : tanpa "?" → tombol "Lanjutkan Permainan"');
lines.push('');

const quizzes = entries.filter(e => kindOf(e.text).startsWith('QUIZ'));
const infos = entries.filter(e => !kindOf(e.text).startsWith('QUIZ'));

lines.push('TOTAL: ' + entries.length + ' kotak berisi tantangan/event');
lines.push('  - Quiz (Benar/Salah): ' + quizzes.length);
lines.push('  - Info/Tantangan (Lanjut): ' + infos.length);
lines.push('');
lines.push('='.repeat(60));
lines.push('BAGIAN 1 — QUIZ (pertanyaan, jawab Benar/Salah)');
lines.push('='.repeat(60));
quizzes.forEach((e, idx) => {
  lines.push(String(idx + 1).padStart(3, ' ') + '. [kotak ' + String(e.pos).padStart(2, ' ') + '] ' + e.text);
});

lines.push('');
lines.push('='.repeat(60));
lines.push('BAGIAN 2 — INFO / TANTANGAN (tekan Lanjutkan Permainan)');
lines.push('='.repeat(60));
infos.forEach((e, idx) => {
  lines.push(String(idx + 1).padStart(3, ' ') + '. [kotak ' + String(e.pos).padStart(2, ' ') + '] ' + e.text);
});

lines.push('');
lines.push('='.repeat(60));
lines.push('BAGIAN 3 — SEMUA KOTAK (urut nomor kotak)');
lines.push('='.repeat(60));
entries.forEach(e => {
  const k = kindOf(e.text).startsWith('QUIZ') ? 'Q' : 'I';
  lines.push('[' + k + '] kotak ' + String(e.pos).padStart(2, ' ') + ' | ' + e.text);
});

lines.push('');
lines.push('Kode: [Q]=quiz  [I]=info/tantangan');
lines.push('Dicetak: ' + new Date().toISOString());

const out = 'daftar_tantangan.txt';
fs.writeFileSync(out, lines.join('\r\n') + '\r\n', 'utf8');
console.log('written', out, 'entries', entries.length, 'quiz', quizzes.length, 'info', infos.length);
