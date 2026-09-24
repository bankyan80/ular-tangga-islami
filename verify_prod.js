const fs = require('fs');
const path = require('path');

const local = fs.readFileSync('index.html', 'utf8');
const prodPath = path.join(process.env.TEMP, 'opencode', 'prod.html');
if (!fs.existsSync(prodPath)) {
  console.log('prod missing', prodPath);
  process.exit(1);
}
const prod = fs.readFileSync(prodPath, 'utf8');
console.log('equal', local === prod, 'local', local.length, 'prod', prod.length);

const checks = [
  'answerQuiz=(benar)',
  'children:"Benar"',
  'children:"Salah"',
  'stripAnswer=(t)',
  'finishTurn=(dice)',
  'kind:"quiz"',
  'for(let hop=0;hop<5;hop++)',
  '79:82',
  'cleanForSpeech',
  'u.pitch=isBoy?1.0:1.12',
  'closeInfo=()=>',
  '[Qx,Qs]=BA.useState(null)'
];

let ok = true;
for (const c of checks) {
  const hit = prod.indexOf(c) >= 0;
  if (!hit) ok = false;
  console.log(hit ? 'OK' : 'MISS', c);
}
const oldPitch = prod.indexOf('u.pitch=isBoy?1.35:1.7') >= 0;
if (oldPitch) {
  ok = false;
  console.log('BAD old pitch present');
} else {
  console.log('OK old pitch absent');
}

console.log(ok ? 'ALL PROD MARKERS OK' : 'PROD FAIL');
process.exit(ok && local === prod ? 0 : 1);
