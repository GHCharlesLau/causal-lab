import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const URL = process.argv[2] || 'http://127.0.0.1:4173/chapters/10-matching.html';

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'matching-cdp-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--hide-scrollbars',
  '--window-size=1440,1100',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await r.json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch (e) { /* not up yet */ }
    await sleep(150);
  }
  throw new Error('chrome debugger did not start');
}

let ws;
let nextId = 0;
const pending = new Map();
const consoleEvents = [];
const exceptions = [];
const failedRequests = [];

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function evaluate(expression, awaitPromise = false) {
  return send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise,
    userGesture: true
  }).then((r) => {
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result ? r.result.value : undefined;
  });
}

async function main() {
  const page = await target();
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const type = msg.params.type;
      const text = msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
      if (type === 'error' || type === 'warning') consoleEvents.push({ type, text });
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      exceptions.push(msg.params.exceptionDetails.text + ' ' +
        (msg.params.exceptionDetails.exception?.description || ''));
    }
    if (msg.method === 'Network.loadingFailed') {
      failedRequests.push(msg.params);
    }
  };

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Network.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: URL });

  let ready = false;
  for (let i = 0; i < 100; i++) {
    await sleep(150);
    try {
      ready = await evaluate('!!(window.MatchLab && window.MatchLab.ready)');
      if (ready) break;
    } catch (e) { /* context not ready */ }
  }

  await sleep(700);

  const report = await evaluate(`(() => {
    const q = (s) => document.querySelector(s);
    const txt = (s) => (q(s) ? q(s).textContent.trim() : null);
    return {
      ready: !!(window.MatchLab && window.MatchLab.ready),
      title: document.title,
      sections: document.querySelectorAll('[data-section]').length,
      band: txt('#band-estimate'),
      bandN: txt('#band-n'),
      regression: txt('#regression-estimate'),
      exact: txt('#exact-estimate'),
      cells: txt('#cells-estimable'),
      curseCells: txt('#curse-cells'),
      quizQuestions: document.querySelectorAll('#quiz-form .question').length,
      codeChars: (q('#code-mirror') ? q('#code-mirror').textContent.length : 0),
      svgs: document.querySelectorAll('.chart-svg').length,
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight
    };
  })()`);

  console.log('REPORT', JSON.stringify(report, null, 2));
  console.log('CONSOLE', JSON.stringify(consoleEvents, null, 2));
  console.log('EXCEPTIONS', JSON.stringify(exceptions, null, 2));
  console.log('FAILED', JSON.stringify(failedRequests.map((f) => ({ url: f.blockedReason || f.errorText, type: f.type })), null, 2));

  ws.close();
  chrome.kill();
}

main().catch((e) => {
  console.error('SMOKE FAILED', e);
  try { chrome.kill(); } catch (e2) {}
  process.exitCode = 1;
});
