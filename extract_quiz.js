const fs = require('fs');
const path = require('path');
const os = require('os');

const html = fs.readFileSync('Ular-Tangga-Publish-Ready-V4-6Pemain.html', 'utf8');
const outDir = path.join(os.tmpdir(), 'opencode');
fs.mkdirSync(outDir, { recursive: true });

// 1. useState
const u = html.indexOf('[D,P]=BA.useState(null)');
if (u < 0) throw new Error('useState not found');
const useStateSnip = html.slice(u - 40, u + 80);
fs.writeFileSync(path.join(outDir, 'usestate.txt'), useStateSnip, 'utf8');

// 2. end of roll: from if(await i(400) to ,c=()=>{
const a = html.indexOf('if(await i(400),mg[d])');
const b = html.indexOf(',c=()=>{', a);
if (a < 0 || b < 0) throw new Error('end turn not found');
const endTurn = html.slice(a, b);
fs.writeFileSync(path.join(outDir, 'end_turn.txt'), endTurn, 'utf8');

// 3. modal from D&&!F&& to dice-box
const marker = 'D&&!F&&Z("div"';
const m = html.indexOf(marker);
const m2 = html.indexOf('Z("div",{className:"dice-box"', m);
if (m < 0 || m2 < 0) throw new Error('modal not found');
const modal = html.slice(m, m2);
fs.writeFileSync(path.join(outDir, 'modal.txt'), modal, 'utf8');

// 4. reset c=
const c = html.indexOf('c=()=>{f([{id:0');
const reset = html.slice(c, c + 400);
fs.writeFileSync(path.join(outDir, 'reset.txt'), reset, 'utf8');

// 5. delay + a start
const iIdx = html.indexOf('let i=(u)=>new Promise');
const aStart = html.slice(iIdx, iIdx + 200);
fs.writeFileSync(path.join(outDir, 'delay_a.txt'), aStart, 'utf8');

console.log('usestate:', JSON.stringify(useStateSnip));
console.log('endTurn len', endTurn.length);
console.log('modal len', modal.length);
console.log('--- endTurn ---');
console.log(endTurn);
console.log('--- modal ---');
console.log(modal);
console.log('--- reset ---');
console.log(reset);
console.log('--- delay_a ---');
console.log(aStart);
console.log('saved to', outDir);
