const fs = require('fs');
const crypto = require('crypto');

// Lines use double-backslash so the HTML source contains literal \uXXXX / \b / \d etc.
const NEW = [
'window.UlarSpeech=(function(){',
'    var cache=[],S=window.speechSynthesis;',
'    function refresh(){if(S){cache=S.getVoices()||[];}}',
'    if(S){try{refresh();S.onvoiceschanged=refresh;}catch(e){}}',
'    function normLang(x){return String(x||"").toLowerCase().replace("_","-");}',
'    function pick(isBoy){',
'      var idSet=cache.filter(function(v){return v.lang&&normLang(v.lang).indexOf("id")===0;});',
'      var set=idSet.length?idSet:cache.slice();',
'      var pref=isBoy?',
'        [/google.*bahasa indonesia/i,/google.*indonesia/i,/andika/i,/ardi/i,/reza/i,/microsoft ardi/i,/indonesian.*male/i,/male.*indonesian/i,/id-id.*male/i,/pria/i,/male/i]:',
'        [/google.*bahasa indonesia/i,/google.*indonesia/i,/gadis/i,/microsoft gadis/i,/indonesian.*female/i,/female.*indonesian/i,/id-id.*female/i,/wanita/i,/female/i];',
'      for(var i=0;i<pref.length;i++)for(var j=0;j<set.length;j++)if(pref[i].test(set[j].name))return set[j];',
'      return set[0]||null;',
'    }',
'    function cleanForSpeech(text){',
'      if(text==null)return "";',
'      var s=String(text);',
'      s=s.replace(/[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]/g,"");',
'      s=s.replace(/[\\u2600-\\u27BF]/g,"");',
'      s=s.replace(/[\\uFE0F\\u200D\\u20E3]/g,"");',
'      s=s.replace(/\\u2192/g," ke ");',
'      s=s.replace(/\\bGreen Ladder\\b/gi,"Tangga hijau");',
'      s=s.replace(/\\bBlue Ladder\\b/gi,"Tangga biru");',
'      s=s.replace(/\\bStart with\\b/gi,"Mulai dengan");',
'      s=s.replace(/\\bFINISH\\b/gi,"Selesai");',
'      s=s.replace(/\\bYes\\b/gi,"Ya");',
"      s=s.replace(/Do'a/gi,\"Doa\");",
'      s=s.replace(/(\\d)\\s*[xX]\\b/g,"$1 kali");',
'      s=s.replace(/\\+/g," tambah ");',
'      s=s.replace(/:\\)/g," tersenyum");',
'      s=s.replace(/\\s+/g," ").trim();',
'      return s;',
'    }',
'    function speak(text,gender){',
'      try{',
'        if(!text||!S)return;',
'        if(window.UlarAudio&&window.UlarAudio.isMuted&&window.UlarAudio.isMuted())return;',
'        var msg=cleanForSpeech(text);',
'        if(!msg)return;',
'        refresh();',
'        try{S.cancel();}catch(e){}',
'        var u=new SpeechSynthesisUtterance(msg);',
'        var isBoy=gender!=="female";',
'        var v=pick(isBoy);',
'        if(v){u.voice=v;}',
'        u.lang="id-ID";',
'        u.rate=0.95;',
'        u.pitch=isBoy?1.0:1.12;',
'        u.volume=1;',
'        S.speak(u);',
'      }catch(e){}',
'    }',
'    function prime(){if(!S)return;try{S.cancel();}catch(e){}}',
'    document.addEventListener("pointerdown",prime,true);',
'    document.addEventListener("touchstart",prime,true);',
'    document.addEventListener("keydown",prime,true);',
'    return{speak:speak,refresh:refresh,prime:prime};',
'  })();'
].join('\n');

// Sanity: NEW must contain literal backslash sequences as source text
if (!NEW.includes('\\uD800') || !NEW.includes('\\bGreen') || !NEW.includes('\\+') || !NEW.includes('\\s+')) {
  console.error('NEW missing literal backslash patterns');
  process.exit(1);
}
if (NEW.includes('replace(/+/g')) {
  console.error('NEW has broken unescaped +');
  process.exit(1);
}

const files = [
  'Ular-Tangga-Publish-Ready-V4-6Pemain.html',
  'index.html'
];

for (const f of files) {
  const buf = fs.readFileSync(f);
  const hasBom = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
  let v = buf.toString('utf8');
  if (hasBom && v.charCodeAt(0) === 0xFEFF) v = v.slice(1);
  const i = v.indexOf('window.UlarSpeech=(function(){');
  const j = v.indexOf('return{speak:speak,refresh:refresh,prime:prime};', i);
  const k = v.indexOf('})();', j) + 5;
  if (i < 0 || k < 5) {
    console.error('NOT FOUND in', f, i, j, k);
    process.exit(1);
  }
  const out = v.slice(0, i) + NEW + v.slice(k);
  const payload = hasBom
    ? Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(out, 'utf8')])
    : Buffer.from(out, 'utf8');
  fs.writeFileSync(f, payload);
  console.log(f, 'rewritten', 'BOM', hasBom);
}

const hashes = files.map(f =>
  crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').toUpperCase()
);
console.log('identical', hashes[0] === hashes[1], hashes[0]);

for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  console.log(f,
    'literalU', t.includes('\\uD800'),
    'literalB', t.includes('\\bGreen'),
    'literalPlus', t.includes('replace(/\\+/g'),
    'literalS', t.includes('\\s+/g'),
    'pitchNew', t.includes('u.pitch=isBoy?1.0:1.12'),
    'oldPitchGone', !t.includes('u.pitch=isBoy?1.35:1.7')
  );
}

// Extract and eval cleanForSpeech from the HTML source (as real JS)
const html = fs.readFileSync(files[1], 'utf8');
const start = html.indexOf('function cleanForSpeech(text){');
const end = html.indexOf('function speak(text,gender)');
if (start < 0 || end < 0) {
  console.error('cannot extract cleanForSpeech');
  process.exit(1);
}
const src = html.slice(start, end).trim();
let cleanForSpeech;
try {
  cleanForSpeech = eval('(' + src + ')');
} catch (e) {
  console.error('eval cleanForSpeech failed:', e.message);
  console.error(src);
  process.exit(1);
}

const cases = [
  ['Aduh! Ular! Turun dari 75 ke 67 \uD83D\uDE22', /[\uD800-\uDBFF][\uDC00-\uDFFF]/, false],
  ['Alhamdulillah! Tangga! Naik dari 21 ke 41 \uD83C\uDF89', /[\uD800-\uDBFF][\uDC00-\uDFFF]/, false],
  ['Green Ladder! Naik ke 41?', /Green Ladder/, false],
  ['Blue Ladder menuju 82!', /Blue Ladder/, false],
  ['Start with Basmalah - Bismillahirrahmanirrahim!', /Start with/, false],
  ['FINISH! Alhamdulillah kamu menang!', /FINISH/, false],
  ['Takbir! 3x - Allahu Akbar!', /\d\s*x\b/i, false],
  ['Maju 3x Sambil Melompat', /\d\s*x\b/i, false],
  ['Bonus +9!', /\+/, false],
  ["Bacakan Do'a Sebelum Tidur", /Do'a/, false],
  ['Senyum dulu Yuk :) - Senyum itu sedekah', /:\)/, false],
  ['dapat Tangga! 21 \u2192 41', /\u2192/, false],
  ['120:2 = 60', /:/, true]
];

let fail = 0;
for (const [inp, re, shouldMatch] of cases) {
  const out = cleanForSpeech(inp);
  const ok = re.test(out) === shouldMatch;
  if (!ok) {
    fail++;
    console.log('CLEAN FAIL', JSON.stringify(inp), '=>', JSON.stringify(out));
  } else {
    console.log('CLEAN PASS', JSON.stringify(out.slice(0, 100)));
  }
}
if (!cleanForSpeech('Mulai dengan Basmalah')) { fail++; console.log('CLEAN FAIL empty'); }
console.log(fail ? fail + ' clean fail' : 'all clean tests pass');
if (fail) process.exit(1);

// syntax check all script blocks
for (const f of files) {
  const html2 = fs.readFileSync(f, 'utf8');
  const re2 = /<script[^>]*>([\s\S]*?)<\/script>/g;
  let m, n = 0, bad = 0;
  while ((m = re2.exec(html2))) {
    n++;
    const c = m[1];
    if (!c.trim()) continue;
    try { new Function(c); } catch (e) {
      bad++;
      console.log(f, 'BLOCK', n, 'FAIL:', e.message);
    }
  }
  console.log(f, n + ' blocks,' + bad + ' fail');
  if (bad) process.exit(1);
}

console.log('OK');
