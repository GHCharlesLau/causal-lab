import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9356;
const URL = process.argv[2] || 'http://127.0.0.1:4173/chapters/06-grouped-regression.html';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ch06-test-'));
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
async function weightState() {
  return evaluate(`({
    coef: document.getElementById('ch06-weight-coef').textContent,
    ci: document.getElementById('ch06-weight-ci').textContent,
    mode: document.getElementById('ch06-weight-mode').textContent,
    status: document.getElementById('ch06-weight-status').textContent,
    checked: document.getElementById('ch06-weight-toggle').checked
  })`);
}
async function dummyState() {
  return evaluate(`({
    mean: document.getElementById('ch06-dummy-mean').textContent,
    diff: document.getElementById('ch06-dummy-diff').textContent,
    cell: document.getElementById('ch06-dummy-cell').textContent,
    status: document.getElementById('ch06-dummy-status').textContent
  })`);
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
  await sleep(1400);
  await evaluate(`document.getElementById('lab-weights').scrollIntoView({block:'start'})`);
  await sleep(250);
  const weighted = await weightState();
  await evaluate(`document.getElementById('ch06-weight-toggle').click()`);
  await sleep(220);
  const unweighted = await weightState();
  await evaluate(`document.getElementById('ch06-weight-toggle').click()`);
  await sleep(180);

  await evaluate(`document.getElementById('lab-dummy').scrollIntoView({block:'start'})`);
  await sleep(200);
  const dummy17 = await dummyState();
  await evaluate(`(() => {
    const node = [...document.querySelectorAll('[aria-label^="Education 10 years"]')][0];
    if (node) node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  })()`);
  await sleep(200);
  const dummy10 = await dummyState();
  await evaluate(`(() => {
    const node = [...document.querySelectorAll('[aria-label^="Education 17 years"]')][0];
    if (node) node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  })()`);
  await sleep(200);
  const reset = await dummyState();

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.mkdirSync('assets/img/_shots', { recursive: true });
  fs.writeFileSync('assets/img/_shots/ch06-dummy.png', Buffer.from(shot.data, 'base64'));
  console.log(JSON.stringify({ weighted, unweighted, dummy17, dummy10, reset, errors }, null, 2));
  ws.close();
  chrome.kill();
}
main().catch((e) => { console.error(e); chrome.kill(); process.exitCode = 1; });
