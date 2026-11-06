import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9336;
const URL = process.argv[2] || 'http://127.0.0.1:4173/';
const OUT = path.resolve('assets/img/_shots');
fs.mkdirSync(OUT, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'matching-review-'));
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
  return send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }).then((r) => {
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
    return r.result ? r.result.value : undefined;
  });
}
async function waitReady() {
  for (let i = 0; i < 140; i++) {
    await sleep(150);
    try { if (await evaluate('!!(window.MatchLab && window.MatchLab.ready)')) return; } catch (e) {}
  }
  throw new Error('not ready');
}
async function shot(name) {
  await sleep(250);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64'));
  console.log('shot', name);
}
async function scrollTo(id, offset = 58) {
  await evaluate(`(() => { const el=document.getElementById(${JSON.stringify(id)}); if(!el) return false; window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - ${offset}); return true; })()`);
  await sleep(350);
}
async function scrollAdd(y) {
  await evaluate(`window.scrollBy(0, ${y})`);
  await sleep(400);
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
  await waitReady();
  await sleep(800);

  const plan = [
    ['problem', 300], ['regression', 300], ['cells', 300], ['exact', 300],
    ['knn', 2200], ['bias', 2200], ['curse', 2400], ['practice', 400]
  ];
  for (const [id, wait] of plan) {
    await scrollTo(id);
    if (wait > 400) await sleep(wait - 350);
    await shot('desktop-' + id);
  }
  await scrollTo('knn');
  await sleep(600);
  await scrollAdd(520);
  await shot('desktop-knn-lower');
  await scrollTo('practice');
  await sleep(400);
  await scrollAdd(620);
  await shot('desktop-practice-lower');

  // mobile: set metrics, then reload so the viewport meta is applied
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
    screenWidth: 390, screenHeight: 844, positionX: 0, positionY: 0
  });
  await send('Page.reload', { ignoreCache: false });
  await waitReady();
  await sleep(700);
  await evaluate('window.scrollTo(0,0)');
  await sleep(400);
  await shot('mobile-top');
  const metrics = await evaluate(`({
    iw: innerWidth, sw: document.documentElement.scrollWidth,
    vw: visualViewport ? visualViewport.width : null,
    dpr: devicePixelRatio, screen: screen.width
  })`);
  console.log('MOBILE METRICS', metrics);
  for (const id of ['problem', 'regression', 'knn', 'practice']) {
    await scrollTo(id, 50);
    await sleep(500);
    await shot('mobile-' + id);
    const overflow = await evaluate('({w: innerWidth, sw: document.documentElement.scrollWidth})');
    console.log('overflow', id, overflow);
  }
  await scrollTo('knn', 50);
  await sleep(400);
  await scrollAdd(520);
  await shot('mobile-knn-lower');

  console.log('ERRORS', JSON.stringify(errors, null, 2));
  ws.close();
  chrome.kill();
}
main().catch((e) => { console.error(e); chrome.kill(); process.exitCode = 1; });
