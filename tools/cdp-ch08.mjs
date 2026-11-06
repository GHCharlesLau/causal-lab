import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9358;
const URL = process.argv[2] || 'http://127.0.0.1:4173/chapters/08-instrumental-variables.html';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ch08-test-'));
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
async function ratioState() {
  return evaluate(`({
    coef: document.getElementById('ch08-ratio-coef').textContent,
    se: document.getElementById('ch08-ratio-se').textContent,
    ci: document.getElementById('ch08-ratio-ci').textContent,
    first: document.getElementById('ch08-ratio-first').textContent,
    reduced: document.getElementById('ch08-ratio-reduced').textContent,
    label: document.getElementById('ch08-ratio-label').textContent
  })`);
}
async function weakState() {
  return evaluate(`({
    ate: document.getElementById('ch08-weak-ate').textContent,
    se: document.getElementById('ch08-weak-se').textContent,
    corr: document.getElementById('ch08-weak-corr').textContent,
    ci: document.getElementById('ch08-weak-ci').textContent,
    status: document.getElementById('ch08-weak-status').textContent
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

  await evaluate(`document.getElementById('season-figure').scrollIntoView({block:'start'})`);
  await sleep(200);
  await evaluate(`document.querySelector('.season-tab[data-mode="wage"]').click()`);
  await sleep(200);
  const seasonWage = await evaluate(`document.querySelector('.season-tab.is-active').textContent.trim()`);

  await evaluate(`document.getElementById('lab-ratio').scrollIntoView({block:'start'})`);
  await sleep(200);
  const q4 = await ratioState();
  await evaluate(`document.querySelector('#lab-ratio .ch08-preset[data-model="many"]').click()`);
  await sleep(150);
  const many = await ratioState();
  await evaluate(`document.querySelector('#lab-ratio .ch08-preset[data-model="ols"]').click()`);
  await sleep(150);
  const ols = await ratioState();

  await evaluate(`document.getElementById('lab-weak').scrollIntoView({block:'start'})`);
  await sleep(200);
  const strong = await weakState();
  await evaluate(`(() => { const s=document.getElementById('ch08-weak-slider'); s.value='0'; s.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await sleep(200);
  const weak = await weakState();

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.mkdirSync('assets/img/_shots', { recursive: true });
  fs.writeFileSync('assets/img/_shots/ch08-weak.png', Buffer.from(shot.data, 'base64'));
  console.log(JSON.stringify({ seasonWage, q4, many, ols, strong, weak, errors }, null, 2));
  ws.close();
  chrome.kill();
}
main().catch((e) => { console.error(e); chrome.kill(); process.exitCode = 1; });
