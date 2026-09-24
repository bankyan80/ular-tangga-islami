const fs = require('fs');
const crypto = require('crypto');

const HELPER = `function boardLinks(){function P(n){let f=Math.floor((n-1)/10),v=f%2===0?(n-1)%10:9-((n-1)%10);return{x:v*10+5,y:(9-f)*10+5}}function bd(x,y,t,c){return '<g><circle cx="'+x+'" cy="'+y+'" r="3.4" fill="'+c+'" stroke="#fff" stroke-width=".7"/><text x="'+x+'" y="'+(y+1.15)+'" text-anchor="middle" font-size="3.4" font-weight="800" fill="#111">'+t+'</text></g>'}let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2">';for(const a of Object.keys(hg)){const b=hg[a],p1=P(+a),p2=P(+b),mx=(p1.x+p2.x)/2+(p1.y-p2.y)*.18,my=(p1.y+p2.y)/2+(p2.x-p1.x)*.18;d='M'+p1.x+' '+p1.y+' Q'+mx+' '+my+' '+p2.x+' '+p2.y;s+='<path d="'+d+'" fill="none" stroke="#4c1d95" stroke-width="2.8" stroke-linecap="round"/><path d="'+d+'" fill="none" stroke="#c4b5fd" stroke-width="1.1" stroke-linecap="round"/>';s+=bd(p1.x,p1.y,a,'#ddd6fe');s+=bd(p2.x,p2.y,b,'#bbf7d0')}for(const a of Object.keys(bg)){const b=bg[a],p1=P(+a),p2=P(+b),dx=p2.x-p1.x,dy=p2.y-p1.y,len=Math.hypot(dx,dy)||1,nx=-dy/len*1.5,ny=dx/len*1.5;s+='<line x1="'+(p1.x+nx)+'" y1="'+(p1.y+ny)+'" x2="'+(p2.x+nx)+'" y2="'+(p2.y+ny)+'" stroke="#14532d" stroke-width="1.15" stroke-linecap="round"/><line x1="'+(p1.x-nx)+'" y1="'+(p1.y-ny)+'" x2="'+(p2.x-nx)+'" y2="'+(p2.y-ny)+'" stroke="#14532d" stroke-width="1.15" stroke-linecap="round"/>';const n=Math.max(3,Math.round(len/5));for(let i=0;i<=n;i++){const t=i/n,cx=p1.x+dx*t,cy=p1.y+dy*t;s+='<line x1="'+(cx+nx)+'" y1="'+(cy+ny)+'" x2="'+(cx-nx)+'" y2="'+(cy-ny)+'" stroke="#166534" stroke-width=".9" stroke-linecap="round"/>'}s+=bd(p1.x,p1.y,a,'#fed7aa');s+=bd(p2.x,p2.y,b,'#bbf7d0')}return s+'</svg>'}`;

const OLD_IMG = 'O("img",{src:p3,alt:"Papan Ular Tangga Islami Asli",className:"board-img",draggable:!1}),A.map(';
const NEW_IMG = 'O("img",{src:p3,alt:"Papan Ular Tangga Islami Asli",className:"board-img",draggable:!1}),O("div",{className:"board-links",style:{position:"absolute",inset:0,pointerEvents:"none",zIndex:2},dangerouslySetInnerHTML:{__html:boardLinks()}}),A.map(';

const OLD_FN = 'return{row:f,col:v,left:g,top:M}}function nz(){';
const NEW_FN = 'return{row:f,col:v,left:g,top:M}}' + HELPER + 'function nz(){';

function patch(file) {
  const buf = fs.readFileSync(file);
  const bom = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
  let h = buf.toString('utf8');
  if (bom && h.charCodeAt(0) === 0xFEFF) h = h.slice(1);

  if (h.indexOf('boardLinks()') >= 0 && h.indexOf('className:"board-links"') >= 0) {
    console.log('  already has board-links overlay');
  } else {
    if (h.split(OLD_IMG).length - 1 !== 1) throw new Error(file + ': img anchor count=' + (h.split(OLD_IMG).length - 1));
    if (h.split(OLD_FN).length - 1 !== 1) throw new Error(file + ': Hr anchor count=' + (h.split(OLD_FN).length - 1));
    if (h.indexOf('function boardLinks') >= 0) throw new Error(file + ': boardLinks already defined without insert?');
    h = h.replace(OLD_FN, NEW_FN);
    h = h.replace(OLD_IMG, NEW_IMG);
    console.log('  inserted boardLinks + overlay div');
  }

  // sanity
  if (h.indexOf('function boardLinks') < 0) throw new Error(file + ': boardLinks missing');
  if (h.indexOf('className:"board-links"') < 0) throw new Error(file + ': overlay div missing');
  if (h.indexOf('dangerouslySetInnerHTML:{__html:boardLinks()}') < 0) throw new Error(file + ': innerHTML missing');
  if (h.indexOf('for(let hop=0;hop<5;hop++)') < 0) throw new Error(file + ': chain lost');
  if (h.indexOf('answerQuiz=(benar)') < 0) throw new Error(file + ': quiz lost');
  if (h.indexOf('},mgArt={') < 0) throw new Error(file + ': mgArt chain lost');
  if (h.indexOf('Hr(u.pos)') < 0) throw new Error(file + ': token pos lost');

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

// unit-test boardLinks geometry vs Hr
function P(n) {
  let f = Math.floor((n - 1) / 10), v = f % 2 === 0 ? (n - 1) % 10 : 9 - ((n - 1) % 10);
  return { x: v * 10 + 5, y: (9 - f) * 10 + 5 };
}
const hg = { 92: 88, 75: 67, 57: 43, 39: 22, 23: 17 };
const bg = { 21: 41, 31: 50, 35: 47, 62: 82, 66: 75, 69: 72, 86: 95, 90: 91, 79: 82 };
for (const [a, b] of Object.entries({ ...hg, ...bg })) {
  const p1 = P(+a), p2 = P(+b);
  if (p1.x < 5 || p1.x > 95 || p2.x < 5 || p2.x > 95) throw new Error('x oob ' + a);
  if (p1.y < 5 || p1.y > 95 || p2.y < 5 || p2.y > 95) throw new Error('y oob ' + a);
}
console.log('geometry OK', Object.keys(hg).length + Object.keys(bg).length, 'links');
console.log('ALL OK');
