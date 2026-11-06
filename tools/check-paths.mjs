import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/chapters.js'), 'utf8'), sandbox);
const chapters = sandbox.window.CAUSAL_CHAPTERS;
const failures = [];

function localTarget(baseFile, ref) {
  if (!ref || /^(https?:|data:|mailto:|tel:|#)/.test(ref)) return null;
  if (ref.startsWith('//')) return null;
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean) return null;
  return path.resolve(path.dirname(baseFile), clean);
}

const pages = [path.join(root, 'index.html')].concat(
  chapters.map((c) => path.join(root, 'chapters', c.slug + '.html'))
);

for (const page of pages) {
  if (!fs.existsSync(page)) {
    failures.push('missing page ' + page);
    continue;
  }
  const html = fs.readFileSync(page, 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    const target = localTarget(page, ref);
    if (target && !fs.existsSync(target)) failures.push(path.relative(root, page) + ' -> missing ' + ref);
  }
  const standalone = page.endsWith('10-matching.html');
  if (page !== path.join(root, 'index.html') && !standalone) {
    if (!html.includes('../assets/css/type.css')) failures.push(path.relative(root, page) + ' missing type.css');
    if (!html.includes('../assets/js/site.js')) failures.push(path.relative(root, page) + ' missing site.js');
    if (!html.includes('window.CHAPTER')) failures.push(path.relative(root, page) + ' missing window.CHAPTER');
    if (!html.includes('<h1')) failures.push(path.relative(root, page) + ' missing h1');
  }
}

if (chapters.length !== 30) failures.push('manifest count ' + chapters.length);
if (chapters.some((c) => c.status !== 'live')) failures.push('not all chapters live');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!index.includes('30</span> of 30 pages live')) failures.push('landing live count not 30/30');

console.log(JSON.stringify({
  pages: pages.length,
  chapters: chapters.length,
  live: chapters.filter((c) => c.status === 'live').length,
  failures
}, null, 2));
if (failures.length) process.exitCode = 1;

