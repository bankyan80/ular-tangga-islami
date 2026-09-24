const fs = require('fs');
const crypto = require('crypto');

// Existing chain: var hg={...},bg={...},q3={...},mg={...};
// Then bare mgArt={...} — ReferenceError in strict/module context.
// Fix: join the same var chain: ...},mg={...},mgArt={...};

function patch(file) {
  const buf = fs.readFileSync(file);
  const bom = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
  let h = buf.toString('utf8');
  if (bom && h.charCodeAt(0) === 0xFEFF) h = h.slice(1);

  // Option A: bare after semicolon (current)
  const bare = '};mgArt={';
  // Option B: already joined
  const joined = '},mgArt={';
  // Option C: already var
  const asVar = ';var mgArt={';

  let mode = null;
  if (h.indexOf(joined) >= 0 && h.indexOf('var mgArt') < 0) {
    // might already be joined - check it's after mg
    mode = 'joined';
  } else if (h.indexOf(bare) >= 0) {
    mode = 'bare';
  } else if (h.indexOf(asVar) >= 0) {
    mode = 'asVar';
  } else if (h.indexOf('var mgArt={') >= 0) {
    mode = 'ok';
  } else {
    throw new Error(file + ': mgArt pattern not found');
  }

  if (mode === 'bare') {
    // Keep mg's closing }, only change ; to , so var chain continues
    // bare is };mgArt={  ->  },mgArt={
    h = h.replace(bare, joined);
    console.log('  joined mgArt into var chain');
    mode = 'joined';
  } else if (mode === 'asVar') {
    // ;var mgArt= is fine too, but ensure } not lost: pattern should be };var mgArt=
    console.log('  already var mgArt');
    mode = 'ok';
  } else if (mode === 'joined') {
    console.log('  already joined to chain');
  }

  // Prefer strongest: if we have },mgArt={ ensure the var chain still has var at hg
  if (h.indexOf('var hg={') < 0) throw new Error(file + ': var hg lost');
  if (h.indexOf('mgArt={') < 0) throw new Error(file + ': mgArt lost');
  if (h.indexOf('};mgArt={') >= 0) throw new Error(file + ': still bare after ;');

  // mgArt must be declared in same statement as mg (comma) OR with var
  const chainOk =
    h.indexOf('},mgArt={') >= 0 ||
    h.indexOf(';var mgArt={') >= 0 ||
    h.indexOf('var mgArt={') >= 0;
  if (!chainOk) throw new Error(file + ': mgArt not declared');

  if (h.indexOf('mgArt[Qx&&Qx.pos]') < 0) throw new Error(file + ': use missing');
  if (h.indexOf('answerQuiz=(benar)') < 0) throw new Error(file + ': quiz lost');
  if (h.indexOf('for(let hop=0;hop<5;hop++)') < 0) throw new Error(file + ': chain lost');

  // syntax
  const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
  let m, n = 0, bad = 0;
  while ((m = re.exec(h))) {
    n++;
    if (!m[1].trim()) continue;
    try { new Function(m[1]); } catch (e) { bad++; console.log('  FAIL', n, e.message); }
  }
  if (bad) throw new Error(file + ': syntax ' + bad);

  const payload = bom
    ? Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(h, 'utf8')])
    : Buffer.from(h, 'utf8');
  fs.writeFileSync(file, payload);
  console.log('OK', file, 'size', payload.length, 'blocks', n);
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

// Verify declaration context
const html = fs.readFileSync('index.html', 'utf8');
const i = html.indexOf('mgArt={');
console.log('context:', JSON.stringify(html.slice(i - 40, i + 30)));
const j = html.indexOf('var hg={');
const k = html.indexOf('mgArt={');
console.log('var hg before mgArt', j >= 0 && j < k, 'hg@' + j, 'mgArt@' + k);

// Eval test: simulate script fragment
const re2 = /<script[^>]*>([\s\S]*?)<\/script>/g;
let mm;
while ((mm = re2.exec(html))) {
  const code = mm[1];
  if (code.indexOf('mgArt={') < 0) continue;
  const start = code.indexOf('var hg={');
  const end = code.indexOf('};', code.indexOf('mgArt={')) + 2;
  const frag = code.slice(start, end);
  try {
    const keys = new Function(frag + '; return Object.keys(mgArt).length;')();
    console.log('eval mgArt keys', keys);
    if (keys < 30) throw new Error('too few keys');
  } catch (e) {
    console.log('eval FAIL', e.message);
    process.exit(1);
  }
}
console.log('ALL OK');
