import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9340;
const URL = process.argv[2] || 'http://127.0.0.1:4173/chapters/10-matching.html';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'matching-reduced-'));
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
  return send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true }).then((r) => {
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
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(msg.params.args.map((a) => a.value || a.description || '').join(' '));
    }
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  await send('Page.navigate', { url: URL });
  for (let i = 0; i < 120; i++) {
    await sleep(150);
    try { if (await evaluate('!!(window.MatchLab && window.MatchLab.ready)')) break; } catch (e) {}
  }
  const reduced = await evaluate('window.MatchLabTimeline.prefersReduced()');
  await evaluate(`document.getElementById('exact').scrollIntoView({block:'start'})`);
  await sleep(300);
  await evaluate(`document.getElementById('exact-play').click()`);
  await sleep(150);
  const exact = await evaluate(`({pairs:document.getElementById('exact-pairs').textContent, est:document.getElementById('exact-estimate').textContent})`);
  await evaluate(`document.getElementById('problem').scrollIntoView({block:'start'})`);
  await sleep(300);
  await evaluate(`document.getElementById('band-sweep').click()`);
  await sleep(150);
  const band = await evaluate(`({out:document.getElementById('band-out').textContent, est:document.getElementById('band-estimate').textContent})`);
  await evaluate(`document.getElementById('curse').scrollIntoView({block:'start'})`);
  await sleep(300);
  const curseLine = await evaluate(`(() => { const p=document.querySelector('#curse-chart path.estimate-curve'); return p ? p.style.strokeDashoffset : null; })()`);
  console.log(JSON.stringify({ reduced, exact, band, curseLine, errors }, null, 2));
  ws.close();
  chrome.kill();
}
main().catch((e) => { console.error(e); chrome.kill(); process.exitCode = 1; });
