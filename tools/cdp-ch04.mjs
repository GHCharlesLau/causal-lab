import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9354;
const URL = process.argv[2] || 'http://127.0.0.1:4173/chapters/04-graphical-causal-models.html';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ch04-test-'));
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
async function state() {
  return evaluate(`({
    headline: document.getElementById('dag-headline').textContent,
    body: document.getElementById('dag-body').textContent,
    conditioned: document.getElementById('dag-conditioned').textContent,
    path: document.querySelector('.dag-path span:last-child') ? document.querySelector('.dag-path span:last-child').textContent : '',
    status: document.getElementById('dag-status').textContent,
    nodes: document.querySelectorAll('.dag-node').length
  })`);
}
async function clickNode(label) {
  await evaluate(`(() => {
    const nodes = [...document.querySelectorAll('.dag-node[role="button"]')];
    const node = nodes.find(n => (n.getAttribute('aria-label') || '').includes(${JSON.stringify(label)}));
    if (!node) return false;
    node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return true;
  })()`);
  await sleep(150);
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
  await sleep(1300);
  await evaluate(`document.getElementById('lab-dag').scrollIntoView({block:'start'})`);
  await sleep(250);
  const confoundingBefore = await state();
  await clickNode('Intelligence');
  const confoundingAfter = await state();

  await evaluate(`document.querySelector('.dag-tab[data-scenario="collider"]').click()`);
  await sleep(150);
  const colliderBefore = await state();
  await clickNode('Investments');
  const colliderAfter = await state();

  await evaluate(`document.querySelector('.dag-tab[data-scenario="mediator"]').click()`);
  await sleep(150);
  const mediatorBefore = await state();
  await clickNode('White-collar');
  const mediatorAfter = await state();

  await evaluate(`document.getElementById('dag-reset').click()`);
  await sleep(150);
  const reset = await state();

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.mkdirSync('assets/img/_shots', { recursive: true });
  fs.writeFileSync('assets/img/_shots/ch04-workbench.png', Buffer.from(shot.data, 'base64'));
  console.log(JSON.stringify({
    confoundingBefore, confoundingAfter,
    colliderBefore, colliderAfter,
    mediatorBefore, mediatorAfter,
    reset, errors
  }, null, 2));
  ws.close();
  chrome.kill();
}
main().catch((e) => { console.error(e); chrome.kill(); process.exitCode = 1; });
