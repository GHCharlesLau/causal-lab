import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9351;
const URL = process.argv[2] || 'http://127.0.0.1:4173/chapters/01-introduction.html';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ch01-test-'));
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
  await evaluate(`document.getElementById('lab-two-roads').scrollIntoView({block:'start'})`);
  await sleep(300);
  const observed = await evaluate(`({
    ate: document.getElementById('po-ate').textContent,
    att: document.getElementById('po-att').textContent,
    naive: document.getElementById('po-naive').textContent,
    bias: document.getElementById('po-bias').textContent,
    rows: document.querySelectorAll('#po-body tr').length,
    hidden: document.querySelectorAll('#po-body .missing').length,
    table: document.getElementById('po-table').innerText
  })`);
  await evaluate(`document.getElementById('po-lens').click()`);
  await sleep(250);
  const lens = await evaluate(`({
    ate: document.getElementById('po-ate').textContent,
    att: document.getElementById('po-att').textContent,
    naive: document.getElementById('po-naive').textContent,
    bias: document.getElementById('po-bias').textContent,
    hidden: document.querySelectorAll('#po-body .missing').length,
    counterfactual: document.querySelectorAll('#po-body .is-counterfactual').length,
    pressed: document.getElementById('po-lens').getAttribute('aria-pressed')
  })`);
  await evaluate(`document.querySelectorAll('#po-body tr')[2].click()`);
  await sleep(200);
  const detail = await evaluate(`document.getElementById('po-detail').textContent`);
  await evaluate(`document.querySelector('[data-dialog="course"]').click()`);
  await sleep(250);
  const map = await evaluate(`({
    open: document.getElementById('dlg-course').open,
    parts: document.querySelectorAll('#dlg-course .course-part').length,
    tickets: document.querySelectorAll('#dlg-course .course-ticket').length,
    links: document.querySelectorAll('#dlg-course a.course-ticket').length,
    active: document.querySelectorAll('#dlg-course .course-ticket.is-active').length
  })`);
  await evaluate(`document.querySelector('#dlg-course [data-close]').click()`);
  await evaluate(`document.getElementById('btn-practice').click()`);
  await sleep(120);
  const practice = await evaluate(`({
    body: document.body.classList.contains('practice-mode'),
    pressed: document.getElementById('btn-practice').getAttribute('aria-pressed'),
    rail: document.querySelectorAll('.rail-link').length
  })`);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.mkdirSync('assets/img/_shots', { recursive: true });
  fs.writeFileSync('assets/img/_shots/ch01-lens.png', Buffer.from(shot.data, 'base64'));
  console.log(JSON.stringify({ observed, lens, detail, map, practice, errors }, null, 2));
  ws.close();
  chrome.kill();
}
main().catch((e) => { console.error(e); chrome.kill(); process.exitCode = 1; });
