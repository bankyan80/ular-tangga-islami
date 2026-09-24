const fs = require('fs');
const crypto = require('crypto');

const FILES = [
  'Ular-Tangga-Publish-Ready-V4-6Pemain.html',
  'index.html'
];

// links after </title>
const LINKS =
  '\n  <link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32x32.png">' +
  '\n  <link rel="icon" type="image/png" sizes="16x16" href="assets/favicon-16x16.png">' +
  '\n  <link rel="shortcut icon" href="assets/favicon.ico">' +
  '\n  <link rel="apple-touch-icon" sizes="180x180" href="assets/apple-touch-icon.png">' +
  '\n  <link rel="apple-touch-icon" href="assets/icon-192.png">' +
  '\n  <link rel="manifest" href="assets/manifest.webmanifest">' +
  '\n  <meta name="theme-color" content="#16a34a">' +
  '\n  <meta name="application-name" content="Ular Tangga Islami">' +
  '\n  <meta property="og:title" content="Ular Tangga Islami V16">' +
  '\n  <meta property="og:type" content="website">' +
  '\n  <meta property="og:image" content="assets/logo-512.png">' +
  '\n  <meta name="twitter:card" content="summary_large_image">' +
  '\n  <meta name="twitter:image" content="assets/logo-512.png">';

const MARKER = '<link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32x32.png">';

function patch(file) {
  const buf = fs.readFileSync(file);
  const hasBom = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
  let h = buf.toString('utf8');
  if (hasBom && h.charCodeAt(0) === 0xFEFF) h = h.slice(1);

  if (h.includes(MARKER)) {
    console.log('skip (already)', file);
    return;
  }

  const titleEnd = h.indexOf('</title>');
  if (titleEnd < 0) throw new Error(file + ': </title> not found');
  const insertAt = titleEnd + '</title>'.length;
  h = h.slice(0, insertAt) + LINKS + h.slice(insertAt);

  // sanity
  if (!h.includes(MARKER)) throw new Error(file + ': insert failed');
  if (!h.includes('assets/apple-touch-icon.png')) throw new Error(file + ': apple-touch missing');
  if (!h.includes('assets/favicon.ico')) throw new Error(file + ': ico missing');
  if (h.indexOf('rel="icon"') !== h.lastIndexOf('rel="icon"') - h.indexOf('sizes="16x16"')) {
    // two icon links expected: 32 and 16
  }
  const iconCount = (h.match(/rel="icon"/g) || []).length;
  if (iconCount !== 2) throw new Error(file + ': expected 2 rel=icon, got ' + iconCount);

  const payload = hasBom
    ? Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(h, 'utf8')])
    : Buffer.from(h, 'utf8');
  fs.writeFileSync(file, payload);
  console.log('OK', file, 'size', payload.length, 'iconLinks', iconCount);
}

for (const f of FILES) patch(f);

const hashes = FILES.map(f =>
  crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').toUpperCase()
);
console.log('identical', hashes[0] === hashes[1], hashes[0]);

// syntax check all script blocks
let anyFail = false;
for (const f of FILES) {
  const html = fs.readFileSync(f, 'utf8');
  const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
  let m, n = 0, bad = 0;
  while ((m = re.exec(html))) {
    n++;
    if (!m[1].trim()) continue;
    try { new Function(m[1]); } catch (e) {
      bad++;
      console.log('FAIL', f, 'block', n, e.message);
    }
  }
  console.log(f, n + ' blocks', bad + ' fail');
  if (bad) anyFail = true;
}
if (anyFail) process.exit(1);
console.log('ALL OK');
