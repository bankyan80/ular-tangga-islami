const fs = require('fs');

const h = fs.readFileSync('index.html', 'utf8');
const a = h.indexOf('stripAnswer=(t)=>{');
const b = h.indexOf(',isQ=');
const c = h.indexOf(',finishTurn=');
if (a < 0 || b < 0 || c < 0) throw new Error('helpers not found');

const stripAnswer = eval('(' + h.slice(a + 'stripAnswer='.length, b) + ')');
const isQ = eval('(' + h.slice(b + ',isQ='.length, c) + ')');

let fail = 0;
function pass(msg) { console.log('PASS', msg); }
function bad(msg) { fail++; console.log('FAIL', msg); }

// clean questions from mg — no answer after ?
const cleanQuestions = [
  'Berapa hasil 1+1?',
  'Ada berapa roda Mobil?',
  'Siapa Tuhanmu?',
  'Berapa hasil 3+3?',
  'Berapa jumlah ayat Surat Al-Fatihah?',
  'Sebutkan 2 nama malaikat?',
  'Apa suara katak?',
  'Bagaimana bunyi sapi?',
  'Sebutkan nama hewan berkaki 2?',
  'Siapakah Nabi pertama?',
  'Sebutkan 5 Rukun Islam?',
  'Berapakah umurmu?'
];
for (const t of cleanQuestions) {
  if (!isQ(t)) bad('isQ false: ' + t);
  else if (stripAnswer(t) !== t) bad('strip changed clean q: ' + t + ' -> ' + stripAnswer(t));
  else pass(t);
}

// dirty legacy forms — strip must remove answer after ?
const dirty = [
  ['Siapa Tuhanmu? Allah SWT', 'Siapa Tuhanmu?'],
  ['Ada berapa rodanya? (Mobil) - 4 roda', 'Ada berapa rodanya?'],
  ['1+1 = ? Jawab: 2', '1+1 = ?'],
  ['Shalat wajib sehari berapa kali? 5', 'Shalat wajib sehari berapa kali?']
];
for (const pair of dirty) {
  const got = stripAnswer(pair[0]);
  if (got !== pair[1]) bad('strip ' + pair[0] + ' -> ' + got + ' exp ' + pair[1]);
  else {
    const qi = got.indexOf('?');
    const after = qi >= 0 ? got.slice(qi + 1).trim() : '';
    if (after) bad('leftover after ?: ' + got);
    else pass(JSON.stringify(pair[0]) + ' -> ' + JSON.stringify(got));
  }
  if (!isQ(pair[0])) bad('isQ false dirty: ' + pair[0]);
}

// non-questions stay info mode
const infos = [
  'Takbir! 3x - Allahu Akbar!',
  'Maju 5 kotak! Alhamdulillah dapat bonus!',
  'Green Ladder! Naik ke 41',
  'Bacakan Surat Al-Ikhlas!',
  'Tangga turun, aman!',
  'Bacakan Do\'a Sebelum Tidur',
  '',
  null
];
for (const t of infos) {
  if (isQ(t)) bad('isQ true info: ' + JSON.stringify(t));
  else pass('info ' + JSON.stringify(t));
}

// strip must not mangle non-? text
const s2 = stripAnswer('Bacakan Surat Al-Ikhlas!');
if (s2 !== 'Bacakan Surat Al-Ikhlas!') bad('strip non-q changed: ' + s2);
else pass('strip non-question unchanged');

// modal quiz buttons present
if (h.indexOf('kind:"quiz"') < 0 || h.indexOf('children:"Benar"') < 0 || h.indexOf('children:"Salah"') < 0) {
  bad('modal quiz buttons');
} else pass('modal quiz buttons present');

// mg has no answer after ?
const ma = h.indexOf('mg={');
const mb = h.indexOf('};', ma);
const body = h.slice(ma + 4, mb);
const re = /(\d+):"((?:[^"\\]|\\.)*)"/g;
let m;
let mgBad = 0;
while ((m = re.exec(body))) {
  const q = m[2].indexOf('?');
  if (q >= 0 && m[2].slice(q + 1).trim().length > 0) {
    mgBad++;
    bad('mg answer after ?: ' + m[1] + ' ' + m[2]);
  }
  if (/Jawab:/i.test(m[2])) {
    mgBad++;
    bad('mg Jawab: ' + m[1] + ' ' + m[2]);
  }
}
if (!mgBad) pass('mg: no answers after ?');

// user example fixed
if (h.indexOf('Ada berapa roda Mobil?') < 0) bad('user example q4 missing');
else pass('user example: Ada berapa roda Mobil?');
if (h.indexOf('Ada berapa rodanya? (Mobil) - 4 roda') >= 0) bad('old q4 remains');
else pass('old q4 removed');

console.log(fail ? fail + ' fail' : 'all pass');
process.exit(fail ? 1 : 0);
