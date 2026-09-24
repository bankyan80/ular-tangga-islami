const fs = require('fs');
const crypto = require('crypto');

// Visual map: box number -> emoji illustration shown beside modal text.
// Only challenges that benefit from a picture (imitate, sound, action, food, etc.).
const MG_ART = {
  14: '\u{1F9B8}',      // angkat 1 kaki - actually person balancing: use 🦵 or 🤸
  16: '\u{1F438}',      // katak
  17: '\u{1F442}',      // tiru bunyi hewan - telinga
  19: '\u{1F9A9}',      // unta-ish / padang pasir animal - use 🐫
  26: '\u{1F43E}',      // hewan
  27: '\u{1F60A}',      // senyum
  34: '\u{1F583}\u{FE0F}', // melompat - use 🦘
  37: '\u{1F697}',      // kendaraan
  46: '\u{1F998}',      // melompat di tempat
  47: '\u{1FA91}',      // duduk
  48: '\u{1F483}',      // gaya/tari
  49: '\u{1F442}',      // tiru bunyi hewan kotak 8
  65: '\u{1F42E}',      // sapi
  73: '\u{1F4AA}',      // gaya semangat
  74: '\u{1F964}',      // minum
  83: '\u{1F37D}\u{FE0F}', // makanan
  86: '\u{1F37D}\u{FE0F}', // doa sebelum makan
  89: '\u{1F426}',      // berkaki 2 - burung
  93: '\u{1F964}',      // minum
  96: '\u{1F998}',      // melompat
  98: '\u{1F4E2}',      // teriak keras
  99: '\u{1F3B5}',      // nyanyi
  3: '\u{1F4E3}',       // takbir
  5: '\u{1F3C3}',       // maju
  9: '\u{1F3C3}',
  15: '\u{1F54C}',      // tasbih - use 📿 = \u{1F54C} mosque? tasbih is 📿
  20: '\u{1F54C}',
  24: '\u{1F4DC}',      // surat - scroll
  33: '\u{1F54C}',
  44: '\u{1F54C}',
  51: '\u{1F634}',      // tidur
  53: '\u{1F4DC}',
  58: '\u{1F54C}',
  64: '\u{1F64F}',      // istighfar - hands
  71: '\u{1F54C}',
  87: '\u{1F54C}',
  81: '\u{1F4E3}'
};

// Fix specific emoji (some need correct code points)
MG_ART[14] = '\u{1F938}';   // hands down balance / person cartwheel
MG_ART[19] = '\u{1F42A}';   // camel
MG_ART[26] = '\u{1F43E}';   // paw prints
MG_ART[34] = '\u{1F998}';   // kangaroo jump
MG_ART[46] = '\u{1F998}';
MG_ART[15] = '\u{1F4FF}';   // prayer beads
MG_ART[20] = '\u{1F4FF}';
MG_ART[33] = '\u{1F4FF}';
MG_ART[44] = '\u{1F4FF}';
MG_ART[58] = '\u{1F54C}';   // mosque for rukun islam? use \u{1F54C} is mosque actually U+1F54C
MG_ART[71] = '\u{1F4FF}';
MG_ART[87] = '\u{1F4FF}';
MG_ART[64] = '\u{1F64F}';
MG_ART[24] = '\u{1F4D6}';   // open book
MG_ART[53] = '\u{1F4D6}';
MG_ART[51] = '\u{1F634}';
MG_ART[98] = '\u{1F4E2}';
MG_ART[99] = '\u{1F3B5}';
MG_ART[3] = '\u{1F4E3}';
MG_ART[81] = '\u{1F4E3}';
MG_ART[5] = '\u{1F3C3}';
MG_ART[9] = '\u{1F3C3}';
MG_ART[47] = '\u{1FA91}';
MG_ART[74] = '\u{1F964}';
MG_ART[93] = '\u{1F964}';
MG_ART[83] = '\u{1F37D}';
MG_ART[86] = '\u{1F37D}';
MG_ART[73] = '\u{1F4AA}';
MG_ART[48] = '\u{1F483}';
MG_ART[65] = '\u{1F42E}';
MG_ART[16] = '\u{1F438}';
MG_ART[17] = '\u{1F442}';
MG_ART[49] = '\u{1F442}';
MG_ART[37] = '\u{1F697}';
MG_ART[27] = '\u{1F60A}';
MG_ART[89] = '\u{1F426}';

// Build mgArt object literal (ASCII-safe keys, unicode escapes for emoji)
function artLiteral() {
  const parts = Object.keys(MG_ART)
    .map(Number)
    .sort((a, b) => a - b)
    .map((k) => k + ':"' + MG_ART[k] + '"');
  return 'mgArt={' + parts.join(',') + '};';
}

// Modal text container — old and new
const OLD_TEXT =
  'O("div",{style:{background:"rgba(255,255,255,0.08)",borderRadius:"14px",padding:"20px 18px",marginBottom:"18px"},children:O("div",{style:{fontSize:"15px",fontWeight:700,lineHeight:"1.6",color:"#f3f4f6"},children:D})})';

const NEW_TEXT =
  'O("div",{style:{background:"rgba(255,255,255,0.08)",borderRadius:"14px",padding:"20px 18px",marginBottom:"18px"},children:O("div",{style:Object.assign({display:mgArt[Qx&&Qx.pos]?"flex":"block",gap:"14px",alignItems:"center"},mgArt[Qx&&Qx.pos]?{}:{})},mgArt[Qx&&Qx.pos]?[O("div",{style:{fontSize:"52px",lineHeight:1,textAlign:"center",minWidth:"64px",filter:"drop-shadow(0 4px 10px rgba(0,0,0,0.35))",flex:"0 0 auto"},children:mgArt[Qx&&Qx.pos]}),O("div",{style:{fontSize:"15px",fontWeight:700,lineHeight:"1.6",color:"#f3f4f6",flex:1},children:D})]:O("div",{style:{fontSize:"15px",fontWeight:700,lineHeight:"1.6",color:"#f3f4f6"},children:D})})';

function patch(file) {
  const buf = fs.readFileSync(file);
  const hasBom = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
  let h = buf.toString('utf8');
  if (hasBom && h.charCodeAt(0) === 0xFEFF) h = h.slice(1);

  // 1) Insert mgArt after mg={...};
  if (h.indexOf('mgArt=') >= 0) {
    // replace existing mgArt block
    const ia = h.indexOf('mgArt={');
    const ib = h.indexOf('};', ia);
    if (ia < 0 || ib < 0) throw new Error(file + ': existing mgArt malformed');
    h = h.slice(0, ia) + artLiteral() + h.slice(ib + 2);
    console.log('  mgArt replaced');
  } else {
    const ma = h.indexOf('mg={');
    const mb = h.indexOf('};', ma);
    if (ma < 0 || mb < 0) throw new Error(file + ': mg not found');
    h = h.slice(0, mb + 2) + artLiteral() + h.slice(mb + 2);
    console.log('  mgArt inserted after mg');
  }

  // 2) Replace modal text container (must exist once)
  const count = h.split(OLD_TEXT).length - 1;
  if (count !== 1) throw new Error(file + ': OLD_TEXT count=' + count);
  h = h.replace(OLD_TEXT, NEW_TEXT);
  console.log('  modal text -> art layout');

  // sanity
  if (h.indexOf('mgArt=') < 0) throw new Error(file + ': mgArt missing');
  if (h.indexOf('mgArt[Qx&&Qx.pos]') < 0) throw new Error(file + ': art use missing');
  if (h.indexOf(OLD_TEXT) >= 0) throw new Error(file + ': old text remains');
  if (h.indexOf('answerQuiz=(benar)') < 0) throw new Error(file + ': quiz lost');
  if (h.indexOf('for(let hop=0;hop<5;hop++)') < 0) throw new Error(file + ': chain lost');
  if (h.indexOf('Ada berapa roda Mobil?') < 0) throw new Error(file + ': clean q4 lost');
  if (h.indexOf('stripAnswer=(t)') < 0) throw new Error(file + ': stripAnswer lost');

  const payload = hasBom
    ? Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(h, 'utf8')])
    : Buffer.from(h, 'utf8');
  fs.writeFileSync(file, payload);
  console.log('OK', file, 'size', payload.length);
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

// show art map sample from file
const html = fs.readFileSync('index.html', 'utf8');
const ia = html.indexOf('mgArt={');
const ib = html.indexOf('};', ia);
console.log('mgArt sample:', html.slice(ia, ia + 200));
console.log('mgArt entries:', (html.slice(ia, ib).match(/\d+:/g) || []).length);
console.log('ALL OK');
