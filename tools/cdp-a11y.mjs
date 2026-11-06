import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9341;
const URL = process.argv[2] || 'http://127.0.0.1:4173/chapters/10-matching.html';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'matching-a11y-'));
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
    }
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: URL });
  for (let i = 0; i < 120; i++) {
    await sleep(150);
    try { if (await evaluate('!!(window.MatchLab && window.MatchLab.ready)')) break; } catch (e) {}
  }
  const report = await evaluate(`(() => {
    const name = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim();
    const blankButtons = [...document.querySelectorAll('button')]
      .filter(b => !name(b) && !b.title && !b.getAttribute('aria-labelledby'))
      .map(b => b.outerHTML.slice(0, 120));
    const unlabeled = [...document.querySelectorAll('input, select, textarea')]
      .filter(el => el.type !== 'hidden' && !el.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby'))
      .map(el => el.outerHTML.slice(0, 120));
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => h.tagName + ':' + h.textContent.trim().slice(0, 60));
    const images = [...document.querySelectorAll('img')].filter(i => !i.alt).map(i => i.src);
    const svgImg = [...document.querySelectorAll('svg[role="img"]')].filter(s => !s.getAttribute('aria-label') && !s.querySelector('title')).length;
    const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
    const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
    const emptyLinks = [...document.querySelectorAll('a')].filter(a => !(a.textContent.trim() || a.getAttribute('aria-label'))).length;
    return {
      blankButtons, unlabeled, images, svgImg, dupIds, emptyLinks,
      headingCounts: headings.reduce((o,h) => (o[h.split(':')[0]] = (o[h.split(':')[0]]||0)+1, o), {}),
      headingOrder: headings.slice(0, 12),
      main: !!document.querySelector('main'),
      h1: document.querySelectorAll('h1').length,
      lang: document.documentElement.lang,
      title: document.title
    };
  })()`);
  console.log(JSON.stringify(report, null, 2));
  ws.close();
  chrome.kill();
}
main().catch((e) => { console.error(e); chrome.kill(); process.exitCode = 1; });
