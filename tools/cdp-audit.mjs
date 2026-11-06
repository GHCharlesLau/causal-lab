import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9401;
const root = path.resolve(import.meta.dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/chapters.js'), 'utf8'), sandbox);
const chapters = sandbox.window.CAUSAL_CHAPTERS;

const baseArg = process.argv[2] || 'http://127.0.0.1:4173/chapters/';
const width = Number(process.argv[3] || 1440);
const height = Number(process.argv[4] || 900);
const base = baseArg.endsWith('/') ? baseArg : baseArg + '/';
const isFile = base.startsWith('file:');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'site-audit-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars',
  `--window-size=${width},${height}`, `--remote-debugging-port=${PORT}`,
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
let pageErrors = [];
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
    if (msg.method === 'Runtime.exceptionThrown') pageErrors.push(msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push(msg.params.args.map((a) => a.value || a.description || '').join(' '));
    }
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: isFile ? 'file:///' + root.replace(/\\/g, '/') + '/index.html' : 'http://127.0.0.1:4173/index.html' });
  await sleep(800);

  const results = [];
  for (const chapter of chapters) {
    pageErrors = [];
    const url = base + chapter.slug + '.html';
    await send('Page.navigate', { url });
    await sleep(650);
    let report;
    try {
      report = await evaluate(`(() => {
        const h1 = document.querySelector('h1');
        const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
        const blank = [...document.querySelectorAll('button')].filter((b) => !b.textContent.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title'));
        const missingAlt = [...document.querySelectorAll('img')].filter((img) => !img.hasAttribute('alt')).length;
        return {
          title: document.title,
          h1: h1 ? h1.textContent.replace(/\\s+/g, ' ').trim() : '',
          width: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          dupes: [...new Set(dupes)],
          blankButtons: blank.length,
          missingAlt
        };
      })()`);
    } catch (e) {
      report = { error: e.message };
    }
    results.push({ slug: chapter.slug, ...report, errors: pageErrors.slice() });
  }

  const failures = results.filter((r) =>
    r.error || !r.h1 || r.errors.length || r.scrollWidth > r.width + 1 ||
    r.dupes.length || r.blankButtons || r.missingAlt
  );
  console.log(JSON.stringify({
    base,
    width,
    pages: results.length,
    failures: failures.map((r) => ({
      slug: r.slug,
      h1: r.h1,
      scrollWidth: r.scrollWidth,
      width: r.width,
      dupes: r.dupes,
      blankButtons: r.blankButtons,
      missingAlt: r.missingAlt,
      errors: r.errors
    }))
  }, null, 2));
  if (failures.length) process.exitCode = 1;
  ws.close();
  chrome.kill();
}

main().catch((e) => { console.error(e); chrome.kill(); process.exitCode = 1; });
