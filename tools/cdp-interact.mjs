import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9335;
const URL = process.argv[2] || 'http://127.0.0.1:4173/';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'matching-interact-'));
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
  return send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }).then((r) => {
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
    return r.result ? r.result.value : undefined;
  });
}
async function waitFor(expr, timeout = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { if (await evaluate(expr)) return true; } catch (e) {}
    await sleep(120);
  }
  throw new Error('timeout: ' + expr);
}
async function scroll(id) {
  await evaluate(`(() => { const el=document.getElementById(${JSON.stringify(id)}); if(!el) return false; window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 58); return true; })()`);
  await sleep(350);
}

const results = {};

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
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(msg.params.args.map((a) => a.value || a.description || '').join(' '));
    }
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: URL });
  await waitFor('!!(window.MatchLab && window.MatchLab.ready)', 20000);
  await sleep(500);

  // 00 band
  await scroll('problem');
  await evaluate(`(() => { const el=document.getElementById('band-slider'); el.value='0.1'; el.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await sleep(200);
  results.band01 = await evaluate(`document.getElementById('band-estimate').textContent`);

  // 01 regression
  await scroll('regression');
  await evaluate(`document.querySelector('[data-weight-mode="ols"]').click()`);
  await sleep(650);
  results.regressionOls = await evaluate(`document.getElementById('regression-estimate').textContent`);

  // 03 exact
  await scroll('exact');
  await evaluate(`document.getElementById('exact-play').click()`);
  await sleep(3600);
  results.exact = await evaluate(`document.getElementById('exact-estimate').textContent`);

  // 04 knn
  await scroll('knn');
  await waitFor(`(() => { const s=document.getElementById('knn-status'); return s && s.textContent.indexOf('matching') < 0; })()`, 20000);
  await sleep(400);
  results.knnInitial = await evaluate(`({
    raw: document.getElementById('knn-ate').textContent,
    corrected: document.getElementById('knn-corrected').textContent,
    median: document.getElementById('knn-median').textContent,
    p90: document.getElementById('knn-p90').textContent
  })`);

  await evaluate(`(() => { const el=document.getElementById('knn-k'); el.value='10'; el.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await sleep(300);
  results.knnK10 = await evaluate(`document.getElementById('knn-ate').textContent`);

  await evaluate(`document.getElementById('knn-correct').click()`);
  await sleep(200);
  results.knnCorrectClass = await evaluate(`document.getElementById('knn-corrected').className`);

  await evaluate(`(() => { const el=document.getElementById('knn-use-sex'); el.checked=false; el.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  await sleep(1200);
  results.knnOmitSex = await evaluate(`document.getElementById('knn-ate').textContent`);
  await evaluate(`(() => { const el=document.getElementById('knn-use-sex'); el.checked=true; el.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  await sleep(1200);

  // select a unit
  await evaluate(`(() => { const s=document.getElementById('knn-select'); if(s.options.length>1){ s.value=s.options[1].value; s.dispatchEvent(new Event('change',{bubbles:true})); } })()`);
  await sleep(250);
  results.knnCard = await evaluate(`document.getElementById('knn-card').textContent.replace(/\\s+/g,' ').trim().slice(0,160)`);

  // 05 bias
  await scroll('bias');
  await waitFor(`(() => { const s=document.getElementById('bias-status'); return s && s.textContent.indexOf('unit') >= 0; })()`, 20000);
  await sleep(300);
  results.biasInitial = await evaluate(`document.getElementById('bias-estimate').textContent`);
  await evaluate(`document.getElementById('bias-cycle').click()`);
  await sleep(250);
  results.biasNext = await evaluate(`document.getElementById('bias-estimate').textContent`);

  // 06 curse
  await scroll('curse');
  await sleep(300);
  await evaluate(`(() => { const el=document.getElementById('curse-d'); el.value='1'; el.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await sleep(200);
  results.curse1 = await evaluate(`({d: document.getElementById('curse-d-out').textContent, cells: document.getElementById('curse-cells').textContent})`);

  // 07 quiz
  await scroll('practice');
  await evaluate(`(() => {
    const answers = {q1:1,q2:1,q3:1,q4:1,q5:1,q7:1,q8:1};
    for (const [id, val] of Object.entries(answers)) {
      const f = document.querySelector('[data-qid="'+id+'"]');
      const r = f.querySelector('input[value="'+val+'"]');
      r.checked = true;
    }
    const num = document.querySelector('[data-qid="q6"] input');
    num.value = '59049';
    document.getElementById('quiz-form').requestSubmit();
  })()`);
  await sleep(400);
  results.quizScore = await evaluate(`document.getElementById('quiz-score').textContent`);

  // checklist
  await evaluate(`(() => { document.querySelectorAll('[data-check]').forEach(i => { i.checked=true; i.dispatchEvent(new Event('change',{bubbles:true})); }); })()`);
  await sleep(200);
  results.checklist = await evaluate(`({status: document.getElementById('checklist-status').textContent, stamp: !document.getElementById('checklist-stamp').hidden})`);

  // practice mode
  await evaluate(`document.getElementById('btn-practice').click()`);
  await sleep(300);
  results.practice = await evaluate(`({
    body: document.body.classList.contains('practice-mode'),
    truthDisplay: getComputedStyle(document.getElementById('knn-truth')).display,
    noteDisplay: getComputedStyle(document.querySelector('.note--blue')).display
  })`);
  await evaluate(`document.getElementById('btn-practice').click()`);

  // course map
  await evaluate(`document.querySelector('[data-dialog="course"]').click()`);
  await sleep(300);
  results.course = await evaluate(`({
    open: document.getElementById('dlg-course').open,
    tickets: document.querySelectorAll('#course-grid .course-ticket').length
  })`);
  await evaluate(`document.getElementById('dlg-course').close()`);

  results.errors = errors;
  console.log(JSON.stringify(results, null, 2));
  ws.close();
  chrome.kill();
}
main().catch((e) => { console.error('FAILED', e); console.log(JSON.stringify(results, null, 2)); console.log(errors); chrome.kill(); process.exitCode = 1; });
