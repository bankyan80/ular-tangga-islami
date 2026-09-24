const fs = require('fs');
const crypto = require('crypto');

// Container must end: children:...})  i.e. close else-O, close props, close container O
// = children:D})})

function fixRegion(h) {
  // Current broken starts with nested O + third-arg style OR already partially fixed
  const candidates = [
    'O("div",{style:{background:"rgba(255,255,255,0.08)",borderRadius:"14px",padding:"20px 18px",marginBottom:"18px"},children:O("div",{style:Object.assign',
    'O("div",{style:Object.assign({background:"rgba(255,255,255,0.08)"'
  ];
  let si = -1;
  for (const c of candidates) {
    si = h.indexOf(c);
    if (si >= 0) break;
  }
  if (si < 0) throw new Error('modal text region not found');

  const endMark = ',Qx&&Qx.kind==="quiz"?Z("div"';
  const ei = h.indexOf(endMark, si);
  if (ei < 0) throw new Error('end mark not found');

  // props.style + props.children in ONE object, one O() call.
  // Ends with: children:D})})
  //   }  close else-O props
  //   )  close else-O
  //   }  close container props
  //   )  close container O
  const fixed =
    'O("div",{style:Object.assign({background:"rgba(255,255,255,0.08)",borderRadius:"14px",padding:"20px 18px",marginBottom:"18px"},mgArt[Qx&&Qx.pos]?{display:"flex",gap:"14px",alignItems:"center"}:{}),children:mgArt[Qx&&Qx.pos]?[O("div",{style:{fontSize:"52px",lineHeight:1,textAlign:"center",minWidth:"64px",filter:"drop-shadow(0 4px 10px rgba(0,0,0,0.35))",flex:"0 0 auto"},children:mgArt[Qx&&Qx.pos]}),O("div",{style:{fontSize:"15px",fontWeight:700,lineHeight:"1.6",color:"#f3f4f6",flex:1},children:D})]:O("div",{style:{fontSize:"15px",fontWeight:700,lineHeight:"1.6",color:"#f3f4f6"},children:D})})';

  return h.slice(0, si) + fixed + h.slice(ei);
}

function checkSyntax(html) {
  const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
  let m, n = 0, bad = 0;
  while ((m = re.exec(html))) {
    n++;
    if (!m[1].trim()) continue;
    try { new Function(m[1]); } catch (e) {
      bad++;
      console.log('  FAIL block', n, e.message);
    }
  }
  return { n, bad };
}

function patch(file) {
  const buf = fs.readFileSync(file);
  const hasBom = buf[0] === 0xEF && buf[1] - 0xBB === 0 && buf[2] === 0xBF;
  const bom = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
  let h = buf.toString('utf8');
  if (bom && h.charCodeAt(0) === 0xFEFF) h = h.slice(1);

  const before = checkSyntax(h);
  console.log('  before:', before.n, 'blocks', before.bad, 'fail');

  h = fixRegion(h);

  const after = checkSyntax(h);
  console.log('  after:', after.n, 'blocks', after.bad, 'fail');
  if (after.bad) throw new Error(file + ': still ' + after.bad + ' fail');

  // required markers
  for (const s of [
    'mgArt=',
    'children:mgArt[Qx&&Qx.pos]?',
    'answerQuiz=(benar)',
    'for(let hop=0;hop<5;hop++)',
    'Ada berapa roda Mobil?',
    'stripAnswer=(t)',
    'closeInfo=()=>'
  ]) {
    if (h.indexOf(s) < 0) throw new Error(file + ': missing ' + s);
  }

  const payload = bom
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
console.log('ALL OK');
