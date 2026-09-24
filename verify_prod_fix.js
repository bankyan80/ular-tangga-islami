const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ts = Date.now();
const url = 'https://tangga-islami.vercel.app/?cb=' + ts;

https.get(url, { headers: { 'Cache-Control': 'no-cache, no-store', 'User-Agent': 'verify' } }, (res) => {
  let d = '';
  res.on('data', (c) => (d += c));
  res.on('end', () => {
    const out = path.join(process.env.TEMP, 'opencode', 'prod.html');
    fs.writeFileSync(out, d);
    const local = fs.readFileSync('index.html', 'utf8');

    console.log('status', res.statusCode, 'age', res.headers.age, 'bytes local', Buffer.byteLength(local), 'prod', Buffer.byteLength(d));
    console.log('string equal', local === d);
    console.log('prod boardLinks', d.includes('function boardLinks'));
    console.log('prod const-list d', d.includes(',d='));

    const BARE_A = String.fromCharCode(59) + 'd=' + String.fromCharCode(39) + 'M';
    const BARE_B = ';d="M"';
    console.log('prod bare ;d=', d.includes(BARE_A) || d.includes(BARE_B));
    console.log('prod mgArt joined', d.includes('},mgArt={'));
    console.log('prod quiz', d.includes('answerQuiz=(benar)'));

    const i = d.indexOf('function boardLinks');
    const j = d.indexOf('function nz', i);
    const fn = d.slice(i, j);
    const hg = { 92: 88, 75: 67, 57: 43, 39: 22, 23: 17 };
    const bg = { 21: 41, 31: 50, 35: 47, 62: 82, 66: 75, 69: 72, 86: 95, 90: 91, 79: 82 };
    try {
      const svg = eval(
        '(function(){' +
          '"use strict";' +
          'var hg=' + JSON.stringify(hg) + ';' +
          'var bg=' + JSON.stringify(bg) + ';' +
          fn +
          ';return boardLinks()})()'
      );
      console.log('prod strict boardLinks OK', svg.includes('<path'), 'len', svg.length);
    } catch (e) {
      console.log('prod strict FAIL', e.message);
      process.exitCode = 1;
    }

    const shaLocal = crypto.createHash('sha256').update(local).digest('hex');
    const shaProd = crypto.createHash('sha256').update(d).digest('hex');
    console.log('sha equal', shaLocal === shaProd);

    const pass =
      local === d &&
      d.includes('function boardLinks') &&
      d.includes(',d=') &&
      !(d.includes(BARE_A) || d.includes(BARE_B)) &&
      d.includes('},mgArt={') &&
      d.includes('answerQuiz=(benar)');
    console.log(pass ? 'PROD VERIFIED OK' : 'PROD MISMATCH');
    if (!pass) process.exitCode = 1;
  });
}).on('error', (e) => {
  console.error(e);
  process.exit(1);
});
