import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9391;
const URL = process.argv[2] || 'http://127.0.0.1:4173/chapters/a1-debiasing-orthogonalization.html';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'a1-test-'));
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
  await send('Page.navigate', { url: URL });
  await sleep(1200);
  const both = await evaluate(`({status: document.getElementById('a1-status').textContent, slope: document.getElementById('a1-slope').textContent, dots: document.querySelectorAll('#a1-chart .a1-dot').length})`);
  await evaluate(`document.querySelector('#lab-residual [data-view="raw"]').click()`);
  await sleep(150);
  const raw = await evaluate(`({status: document.getElementById('a1-status').textContent, slope: document.getElementById('a1-slope').textContent, dots: document.querySelectorAll('#a1-chart .a1-dot').length})`);
  await evaluate(`document.querySelector('#lab-residual [data-view="price"]').click()`);
  await sleep(150);
  const price = await evaluate(`({status: document.getElementById('a1-status').textContent, slope: document.getElementById('a1-slope').textContent})`);
  const debiased = await evaluate(`({status: document.getElementById('a1-gain-status').textContent, value: document.getElementById('a1-gain-value').textContent, top: document.getElementById('a1-gain-top').textContent})`);
  await evaluate(`document.querySelector('#lab-gain [data-sample="biased"]').click()`);
  await sleep(150);
  const biased = await evaluate(`({status: document.getElementById('a1-gain-status').textContent, value: document.getElementById('a1-gain-value').textContent, top: document.getElementById('a1-gain-top').textContent})`);

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.mkdirSync('assets/img/_shots', { recursive: true });
  fs.writeFileSync('assets/img/_shots/a1-biased.png', Buffer.from(shot.data, 'base64'));
  console.log(JSON.stringify({ both, raw, price, debiased, biased, errors }, null, 2));
  ws.close();
  chrome.kill();
}
main().catch((e) => { console.error(e); chrome.kill(); process.exitCode = 1; });
