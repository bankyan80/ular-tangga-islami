const fs = require('fs');
const crypto = require('crypto');

function apply(file) {
  const buf = fs.readFileSync(file);
  const hasBom = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
  let h = buf.toString('utf8');
  if (hasBom && h.charCodeAt(0) === 0xFEFF) h = h.slice(1);

  const must = (label, s) => {
    if (h.indexOf(s) < 0) throw new Error(file + ': missing ' + label);
  };

  // 1) Add quiz state after D,P useState
  must('useStateD', '[D,P]=BA.useState(null)');
  const oldState = '[D,P]=BA.useState(null),[F,t]=BA.useState(null)';
  const newState = '[D,P]=BA.useState(null),[Qx,Qs]=BA.useState(null),[F,t]=BA.useState(null)';
  if (h.indexOf(oldState) < 0) throw new Error(file + ': useState pattern mismatch');
  h = h.replace(oldState, newState);

  // 2) Clear quiz state when starting a roll
  must('rollStart', 'e(!0),P(null),I(`Mengocok dadu');
  h = h.replace('e(!0),P(null),I(`Mengocok dadu', 'e(!0),P(null),Qs(null),I(`Mengocok dadu');

  // 3) Insert helper methods before a=async (after delay definition)
  must('delay', 'let i=(u)=>new Promise((Q)=>setTimeout(Q,u)),a=async()=>{');
  const helpers =
    'let i=(u)=>new Promise((Q)=>setTimeout(Q,u)),' +
    'stripAnswer=(t)=>{var s=String(t||"");var m=s.match(/^(.*?)\\s*Jawab:\\s*.*$/i);if(m)s=m[1];return s.replace(/\\s+/g," ").trim()||String(t||"")},' +
    'isQ=(t)=>/\\?|Jawab/i.test(String(t||"")),' +
    'finishTurn=(dice)=>{r(!1);if(dice===6)I(`${A[v].name} dapat 6! Kocok lagi!`);else{let R=(v+1)%A.length;(window.UlarAudio&&window.UlarAudio.playTurn());g(R);I(`Giliran ${A[R].name} - Posisi: ${A.map((JA)=>`${JA.name} ${JA.pos}`).join(" \u2022 ")}`)}},' +
    'answerQuiz=(benar)=>{if(!Qx)return;let dice=Qx.dice,name=A[v].name,gen=A[v].gender;P(null),Qs(null);' +
    'if(benar){I(`Benar! ${name} pindah giliran.`);window.UlarSpeech&&window.UlarSpeech.speak(`Benar! Jawaban tepat. Giliran berpindah.`,gen);finishTurn(dice);}' +
    'else{I(`Belum tepat. ${name} terus lanjutkan permainan!`);window.UlarSpeech&&window.UlarSpeech.speak(`Belum tepat. Terus lanjutkan permainan!`,gen);r(!1);}},' +
    'closeInfo=()=>{if(!Qx){P(null);Qs(null);return}let dice=Qx.dice;P(null),Qs(null);finishTurn(dice)},' +
    'a=async()=>{';
  h = h.replace('let i=(u)=>new Promise((Q)=>setTimeout(Q,u)),a=async()=>{', helpers);

  // 4) Replace end-of-roll turn logic
  const startMark = 'if(await i(400),mg[d])';
  const endMark = ',c=()=>{';
  const a = h.indexOf(startMark);
  const b = h.indexOf(endMark, a);
  if (a < 0 || b < 0) throw new Error(file + ': end-turn markers not found');
  const newEnd =
    'if(await i(400),d===100){(window.UlarAudio&&window.UlarAudio.playWin());t(v),I(`\uD83C\uDF89 FINISH! ${A[v].name} menang! Alhamdulillah!`),r(!1);return}' +
    'r(!1);' +
    'if(mg[d]){var _full=mg[d]+_A;' +
    'if(isQ(mg[d])){var _q=stripAnswer(mg[d])+(_A?" "+_A:"");P(_q);Qs({kind:"quiz",dice:u,pos:d});' +
    'window.UlarSpeech&&window.UlarSpeech.speak(_q,A[v].gender);' +
    'I(`${A[v].name} di kotak ${d} - jawab Benar atau Salah!`);return}' +
    'P(_full);Qs({kind:"info",dice:u,pos:d});' +
    'window.UlarSpeech&&window.UlarSpeech.speak(_full,A[v].gender);return}' +
    'if(_A){var _u2=_A.trim();P(_u2);Qs({kind:"info",dice:u,pos:d});' +
    'window.UlarSpeech&&window.UlarSpeech.speak(_u2,A[v].gender);return}' +
    'finishTurn(u);}';
  h = h.slice(0, a) + newEnd + h.slice(b);

  // 5) Reset clears quiz state
  must('reset', 'I("Mulai dengan Basmalah! Giliran Ahmad"),P(null),e(!1),r(!1)}');
  h = h.replace(
    'I("Mulai dengan Basmalah! Giliran Ahmad"),P(null),e(!1),r(!1)}',
    'I("Mulai dengan Basmalah! Giliran Ahmad"),P(null),Qs(null),e(!1),r(!1)}'
  );

  // 6) Replace modal UI
  const modalStart = 'D&&!F&&Z("div"';
  const modalEnd = 'Z("div",{className:"dice-box"';
  const mi = h.indexOf(modalStart);
  const mj = h.indexOf(modalEnd, mi);
  if (mi < 0 || mj < 0) throw new Error(file + ': modal markers not found');

  const newModal =
    'D&&!F&&Z("div",{onClick:()=>{if(!(Qx&&Qx.kind==="quiz"))closeInfo()},style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)"},children:[Z("div",{onClick:(e)=>e.stopPropagation(),style:{background:"#1f2937",color:"white",borderRadius:"20px",padding:"28px 24px",maxWidth:"420px",width:"100%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.5)",position:"relative",zIndex:1000,border:"2px solid rgba(255,255,255,0.1)"},children:[' +
    (Qx => Qx) // placeholder replaced below
    ;

  // build modal properly without placeholder issues
  const modalJsx =
    'D&&!F&&Z("div",{onClick:()=>{if(!(Qx&&Qx.kind==="quiz"))closeInfo()},style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)"},children:[Z("div",{onClick:(e)=>e.stopPropagation(),style:{background:"#1f2937",color:"white",borderRadius:"20px",padding:"28px 24px",maxWidth:"420px",width:"100%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.5)",position:"relative",zIndex:1000,border:"2px solid rgba(255,255,255,0.1)"},children:[' +
    'O("div",{style:{textAlign:"center",marginBottom:"16px"},children:O("div",{style:{fontSize:"13px",fontWeight:800,letterSpacing:"1px",color:"#fbbf24",textTransform:"uppercase"},children:Qx&&Qx.kind==="quiz"?"PERTANYAAN ISLAMI":"TANTANGAN ISLAMI"})}),' +
    'O("div",{style:{background:"rgba(255,255,255,0.08)",borderRadius:"14px",padding:"20px 18px",marginBottom:"18px"},children:O("div",{style:{fontSize:"15px",fontWeight:700,lineHeight:"1.6",color:"#f3f4f6"},children:D})}),' +
    'Qx&&Qx.kind==="quiz"?Z("div",{style:{display:"flex",gap:"10px"},children:[' +
    'O("button",{onClick:()=>answerQuiz(true),style:{flex:1,background:"#16a34a",color:"white",border:"none",borderRadius:"12px",padding:"14px",fontSize:"16px",fontWeight:900,cursor:"pointer",boxShadow:"0 4px 14px rgba(22,163,74,0.35)",transition:"transform 0.12s"},onMouseDown:function(ev){ev.currentTarget.style.transform="scale(0.97)"},onMouseUp:function(ev){ev.currentTarget.style.transform="scale(1)"},onTouchStart:function(ev){ev.currentTarget.style.transform="scale(0.97)"},onTouchEnd:function(ev){ev.currentTarget.style.transform="scale(1)"},children:"Benar"}),' +
    'O("button",{onClick:()=>answerQuiz(false),style:{flex:1,background:"#dc2626",color:"white",border:"none",borderRadius:"12px",padding:"14px",fontSize:"16px",fontWeight:900,cursor:"pointer",boxShadow:"0 4px 14px rgba(220,38,38,0.35)",transition:"transform 0.12s"},onMouseDown:function(ev){ev.currentTarget.style.transform="scale(0.97)"},onMouseUp:function(ev){ev.currentTarget.style.transform="scale(1)"},onTouchStart:function(ev){ev.currentTarget.style.transform="scale(0.97)"},onTouchEnd:function(ev){ev.currentTarget.style.transform="scale(1)"},children:"Salah"})]})' +
    ':O("div",{onClick:()=>closeInfo(),style:{display:"block",width:"100%",background:"#fbbf24",color:"#1f2937",border:"none",borderRadius:"12px",padding:"14px",fontSize:"15px",fontWeight:800,cursor:"pointer",textAlign:"center",boxShadow:"0 4px 14px rgba(251,191,36,0.3)",transition:"transform 0.12s,opacity 0.2s"},onMouseDown:function(ev){ev.currentTarget.style.transform="scale(0.97)"},onMouseUp:function(ev){ev.currentTarget.style.transform="scale(1)"},onTouchStart:function(ev){ev.currentTarget.style.transform="scale(0.97)"},onTouchEnd:function(ev){ev.currentTarget.style.transform="scale(1)"},children:"Lanjutkan Permainan"})' +
    ']})]})]}),';

  h = h.slice(0, mi) + modalJsx + h.slice(mj);

  // sanity
  const needs = [
    '[Qx,Qs]=BA.useState(null)',
    'answerQuiz=(benar)',
    'finishTurn=(dice)',
    'kind:"quiz"',
    'children:"Benar"',
    'children:"Salah"',
    'closeInfo=()=>',
    'stripAnswer=(t)'
  ];
  for (const s of needs) {
    if (h.indexOf(s) < 0) throw new Error(file + ': post-check missing ' + s);
  }
  if (h.indexOf('u.pitch=isBoy?1.35:1.7') >= 0) throw new Error(file + ': old pitch still there');
  if (h.indexOf('for(let hop=0;hop<5;hop++)') < 0) throw new Error(file + ': chain lost');

  const payload = hasBom
    ? Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(h, 'utf8')])
    : Buffer.from(h, 'utf8');
  fs.writeFileSync(file, payload);
  console.log('OK', file, 'size', payload.length);
}

const files = [
  'Ular-Tangga-Publish-Ready-V4-6Pemain.html',
  'index.html'
];
for (const f of files) apply(f);

const hashes = files.map(f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').toUpperCase());
console.log('identical', hashes[0] === hashes[1], hashes[0]);

// syntax check
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
  let m, n = 0, bad = 0;
  while ((m = re.exec(html))) {
    n++;
    const c = m[1];
    if (!c.trim()) continue;
    try { new Function(c); } catch (e) {
      bad++;
      console.log('FAIL', f, 'block', n, e.message);
    }
  }
  console.log(f, n + ' blocks', bad + ' fail');
  if (bad) process.exit(1);
}
console.log('ALL OK');
