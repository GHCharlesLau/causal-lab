import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9339;
const URL = process.argv[2] || 'http://127.0.0.1:4173/';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'matching-mobile-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars',
  '--window-size=390,844', `--remote-debugging-port=${PORT}`,
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
  return send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }).then((r) => {
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result ? r.result.value : undefined;
  });
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
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
    screenWidth: 390, screenHeight: 844, positionX: 0, positionY: 0
  });
  await send('Page.navigate', { url: URL });
  for (let i = 0; i < 120; i++) {
    await sleep(150);
    try { if (await evaluate('!!(window.MatchLab && window.MatchLab.ready)')) break; } catch (e) {}
  }
  await sleep(800);
  for (const id of ['lab-regression', 'lab-cells', 'lab-exact', 'lab-knn', 'lab-bias']) {
    const ok = await evaluate(`(() => { const el=document.getElementById(${JSON.stringify(id)}); if(!el) return false; el.scrollIntoView({block:'start'}); return true; })()`);
    if (!ok) continue;
    await sleep(id === 'lab-knn' || id === 'lab-bias' ? 1800 : 500);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`assets/img/_shots/mobile-${id}.png`, Buffer.from(shot.data, 'base64'));
    const m = await evaluate('({iw:innerWidth, sw:document.documentElement.scrollWidth, chart: (()=>{const e=document.querySelector("#'+id+' .lab-chart"); return e?{w:e.clientWidth,sw:e.scrollWidth}:null;})()})');
    console.log(id, m);
  }
  console.log('errors', errors);
  ws.close();
  chrome.kill();
}
main().catch((e) => { console.error(e); chrome.kill(); process.exitCode = 1; });
