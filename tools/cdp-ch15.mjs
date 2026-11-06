import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9369;
const URL = process.argv[2] || 'http://127.0.0.1:4173/chapters/15-synthetic-control.html';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ch15-test-'));
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
  await evaluate(`document.getElementById('lab-path').scrollIntoView({block:'start'})`);
  await sleep(200);
  const levels = await evaluate(`({
    label: document.getElementById('ch15-path-label').textContent,
    value: document.getElementById('ch15-path-value').textContent,
    status: document.getElementById('ch15-path-status').textContent,
    weights: document.querySelectorAll('#ch15-weights .weight-row').length
  })`);
  await evaluate(`document.querySelector('#lab-path .ch15-preset[data-view="gap"]').click()`);
  await sleep(150);
  const gap = await evaluate(`({
    label: document.getElementById('ch15-path-label').textContent,
    value: document.getElementById('ch15-path-value').textContent,
    status: document.getElementById('ch15-path-status').textContent
  })`);
  await evaluate(`document.querySelector('#lab-path .ch15-preset[data-view="levels"]').click()`);
  await sleep(150);
  const placebo = await evaluate(`({
    bars: document.querySelectorAll('#ch15-placebo .placebo-bar').length,
    lines: document.querySelectorAll('#ch15-placebo .placebo-ca-line').length
  })`);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.mkdirSync('assets/img/_shots', { recursive: true });
  fs.writeFileSync('assets/img/_shots/ch15-path2.png', Buffer.from(shot.data, 'base64'));
  console.log(JSON.stringify({ levels, gap, placebo, errors }, null, 2));
  ws.close();
  chrome.kill();
}
main().catch((e) => { console.error(e); chrome.kill(); process.exitCode = 1; });
