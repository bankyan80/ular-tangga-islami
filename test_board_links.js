const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');
const i = h.indexOf('function boardLinks');
const j = h.indexOf('function nz', i);
const fn = h.slice(i, j);
const hg = { 92: 88, 75: 67, 57: 43, 39: 22, 23: 17 };
const bg = { 21: 41, 31: 50, 35: 47, 62: 82, 66: 75, 69: 72, 86: 95, 90: 91, 79: 82 };
const svg = eval('(function(){var hg=' + JSON.stringify(hg) + ';var bg=' + JSON.stringify(bg) + ';' + fn + ';return boardLinks()})()');
console.log('svg len', svg.length);
console.log('starts', svg.slice(0, 90));
const count = (re) => (svg.match(re) || []).length;
console.log('path', count(/<path[\s>]/g));
console.log('line', count(/<line[\s>]/g));
console.log('circle', count(/<circle[\s>]/g));
console.log('text', count(/<text[\s>]/g));
const labels = [...svg.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].map((m) => m[1]);
console.log('labels', labels.join(','));
const expect = [
  ...Object.keys(hg), ...Object.values(hg).map(String),
  ...Object.keys(bg), ...Object.values(bg).map(String)
];
const missing = expect.filter((n) => !labels.includes(String(n)));
console.log('missing labels', missing);
const xs = [...svg.matchAll(/cx="([0-9.]+)"/g)].map((m) => +m[1]);
const ys = [...svg.matchAll(/cy="([0-9.]+)"/g)].map((m) => +m[1]);
console.log('xy', Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys));
console.log('in range', xs.every((x) => x >= 0 && x <= 100) && ys.every((y) => y >= 0 && y <= 100));
// each pair endpoints distinct and on 5-grid centers
function P(n) {
  const f = Math.floor((n - 1) / 10);
  const v = f % 2 === 0 ? (n - 1) % 10 : 9 - ((n - 1) % 10);
  return { x: v * 10 + 5, y: (9 - f) * 10 + 5 };
}
let ok = true;
for (const [a, b] of Object.entries({ ...hg, ...bg })) {
  const p1 = P(+a), p2 = P(+b);
  if (p1.x === p2.x && p1.y === p2.y) { ok = false; console.log('same cell', a); }
  if (!svg.includes('>' + a + '<') || !svg.includes('>' + b + '<')) { ok = false; console.log('label miss', a, b); }
}
console.log(ok ? 'ALL ENDPOINTS OK' : 'FAIL');
process.exit(ok && !missing.length ? 0 : 1);
