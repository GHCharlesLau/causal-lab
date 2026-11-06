import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9334;
const URL = process.argv[2] || 'http://127.0.0.1:4173/chapters/10-matching.html';
const OUT = path.resolve('assets/img/_shots');
fs.mkdirSync(OUT, { recursive: true });

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'matching-shots-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars',
  '--window-size=1440,1100', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await r.json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch (e) {}
    await sleep(150);
  }
  throw new Error('no target');
}

let ws, nextId = 0;
const pending = new Map();
const errors = [];

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
function evaluate(expression) {
  return send('Runtime.evaluate', { expression, returnByValue: true }).then((r) => {
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result ? r.result.value : undefined;
  });
}
async function shot(name) {
  await sleep(500);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64'));
  console.log('shot', name);
}

async function main() {
  const page = await target();
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message)); else p.resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(msg.params.args.map((a) => a.value || a.description || '').join(' '));
    }
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: URL });
  for (let i = 0; i < 100; i++) {
    await sleep(150);
    try { if (await evaluate('!!(window.MatchLab && window.MatchLab.ready)')) break; } catch (e) {}
  }
  await sleep(900);

  const sections = ['top', 'problem', 'regression', 'cells', 'exact', 'knn', 'bias', 'curse', 'practice'];
  for (const id of sections) {
    const ok = await evaluate(`(() => { const el=document.getElementById(${JSON.stringify(id)}); if(!el) return false; window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 58); return true; })()`);
    if (!ok) continue;
    if (id === 'knn' || id === 'bias') await sleep(1800);
    await shot('desktop-' + id);
  }

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 1, mobile: true
  });
  await sleep(500);
  await evaluate('window.scrollTo(0,0)');
  await shot('mobile-top');
  for (const id of ['problem', 'knn', 'practice']) {
    await evaluate(`(() => { const el=document.getElementById(${JSON.stringify(id)}); if(!el) return false; window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 50); return true; })()`);
    await sleep(900);
    await shot('mobile-' + id);
    const overflow = await evaluate('({w: innerWidth, sw: document.documentElement.scrollWidth})');
    console.log('overflow', id, overflow);
  }

  console.log('ERRORS', JSON.stringify(errors, null, 2));
  ws.close();
  chrome.kill();
}
main().catch((e) => { console.error(e); chrome.kill(); process.exitCode = 1; });
