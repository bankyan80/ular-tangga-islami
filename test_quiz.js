const fs = require('fs');

const h = fs.readFileSync('index.html', 'utf8');
const a = h.indexOf('stripAnswer=(t)=>{');
const b = h.indexOf(',isQ=');
const c = h.indexOf(',finishTurn=');
if (a < 0 || b < 0 || c < 0) throw new Error('helpers not found');

const stripSrc = h.slice(a + 'stripAnswer='.length, b);
const isSrc = h.slice(b + ',isQ='.length, c);
const stripAnswer = eval('(' + stripSrc + ')');
const isQ = eval('(' + isSrc + ')');

const cases = [
  ['1+1 = ? Jawab: 2', true],
  ['Siapa Tuhanmu? Allah SWT', true],
  ['Bacakan Surat Al-Ikhlas!', false],
  ['Maju 5 kotak! Alhamdulillah dapat bonus!', false],
  ['Takbir! 3x - Allahu Akbar!', false],
  ['43:7x6 = 42', false],
  ['', false],
  [null, false]
];

let fail = 0;
for (const row of cases) {
  const t = row[0];
  const expectQ = row[1];
  const q = isQ(t);
  const s = stripAnswer(t);
  if (q !== expectQ) {
    fail++;
    console.log('FAIL isQ', JSON.stringify(t), q, 'expected', expectQ);
  } else {
    console.log('PASS isQ', JSON.stringify(t), '->', JSON.stringify(s));
  }
}

const s1 = stripAnswer('1+1 = ? Jawab: 2');
if (/Jawab/i.test(s1)) {
  fail++;
  console.log('FAIL strip keeps Jawab:', s1);
} else if (s1 !== '1+1 = ?') {
  fail++;
  console.log('FAIL strip wrong result:', JSON.stringify(s1));
} else {
  console.log('PASS strip removes Jawab ->', JSON.stringify(s1));
}

const s2 = stripAnswer('Bacakan Surat Al-Ikhlas!');
if (s2 !== 'Bacakan Surat Al-Ikhlas!') {
  fail++;
  console.log('FAIL strip non-Jawab changed:', s2);
} else {
  console.log('PASS strip non-Jawab unchanged');
}

// quiz gating in file
const modalQuiz = h.indexOf('kind==="quiz"') >= 0 && h.indexOf('children:"Benar"') >= 0 && h.indexOf('children:"Salah"') >= 0;
if (!modalQuiz) {
  fail++;
  console.log('FAIL modal quiz buttons');
} else {
  console.log('PASS modal quiz buttons present');
}

console.log(fail ? fail + ' fail' : 'all pass');
process.exit(fail ? 1 : 0);
