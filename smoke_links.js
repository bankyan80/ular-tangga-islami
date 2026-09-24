const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const out = path.join(process.env.TEMP, 'opencode', 'smoke_links.html');
const err = path.join(process.env.TEMP, 'opencode', 'smoke_links.err');
const prof = path.join(process.env.TEMP, 'opencode', 'chrome-smoke2');
try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}

const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--allow-file-access-from-files',
  `--user-data-dir=${prof}`,
  '--virtual-time-budget=8000',
  '--dump-dom',
  url
];

const fdOut = fs.openSync(out, 'w');
const fdErr = fs.openSync(err, 'w');
const p = spawn(chrome, args, { stdio: ['ignore', fdOut, fdErr] });
p.on('exit', (code) => {
  fs.closeSync(fdOut);
  fs.closeSync(fdErr);
  const dom = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  const errLog = fs.existsSync(err) ? fs.readFileSync(err, 'utf8') : '';
  console.log('exit', code, 'dom', dom.length);
  console.log('has board-links', dom.includes('board-links'));
  console.log('has viewBox 100', dom.includes('viewBox="0 0 100 100"') || dom.includes("viewBox='0 0 100 100'"));
  console.log('has badge circles', /circle[^>]+r="3.4"/.test(dom));
  console.log('has root content', dom.includes('id="root"') && dom.length > 50000);
  console.log('has ReferenceError', errLog.includes('ReferenceError') || dom.includes('ReferenceError'));
  console.log('has mgArt not defined', errLog.includes('mgArt is not defined') || dom.includes('mgArt is not defined'));
  // extract a few badge numbers
  const nums = [...dom.matchAll(/font-size="3.4"[^>]*>(\d+)</g)].map(m => m[1]);
  console.log('badge numbers sample', nums.slice(0, 20).join(','), 'count', nums.length);
  // stderr snippet
  if (errLog.trim()) console.log('stderr head:', errLog.slice(0, 500));
  process.exit(code === 0 && dom.includes('board-links') ? 0 : 1);
});
