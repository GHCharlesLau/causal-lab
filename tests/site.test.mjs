import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const manifestSource = fs.readFileSync(path.join(root, 'assets/js/chapters.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(manifestSource, sandbox);
const parts = sandbox.window.CAUSAL_PARTS;
const chapters = sandbox.window.CAUSAL_CHAPTERS;

test('manifest: 25 chapters + 5 technical notes', () => {
  assert.equal(parts.length, 3);
  assert.equal(chapters.length, 30);
  assert.equal(chapters.filter((c) => c.status === 'live').length, 18);
  assert.equal(
    chapters.filter((c) => c.status === 'live').map((c) => c.slug).sort().join(','),
    '01-introduction,02-randomised-experiments,03-stats-review,04-graphical-causal-models,05-linear-regression,06-grouped-regression,07-beyond-confounders,08-instrumental-variables,09-non-compliance,10-matching,11-propensity-score,12-doubly-robust,13-difference-in-differences,14-panel-fixed-effects,15-synthetic-control,16-regression-discontinuity,17-predictive-models,18-heterogeneous-effects'
  );
});

test('manifest: numbers and slugs are unique', () => {
  const nums = chapters.map((c) => c.num);
  const slugs = chapters.map((c) => c.slug);
  assert.equal(new Set(nums).size, nums.length);
  assert.equal(new Set(slugs).size, slugs.length);
});

test('manifest: every live chapter has a page', () => {
  for (const c of chapters.filter((c) => c.status === 'live')) {
    const page = path.join(root, 'chapters', c.slug + '.html');
    assert.ok(fs.existsSync(page), c.slug + ' is live but ' + page + ' does not exist');
  }
});

test('manifest: every href is a chapters/ path', () => {
  for (const c of chapters) {
    assert.match(c.href, /^chapters\/[a-z0-9-]+\.html$/);
  }
});

test('landing and live pages load the shared reading scale', () => {
  const landing = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(landing, /assets\/css\/type\.css/);
  assert.match(landing, /assets\/js\/landing\.js/);
  assert.match(landing, /assets\/js\/chapters\.js/);

  const ch01 = fs.readFileSync(path.join(root, 'chapters/01-introduction.html'), 'utf8');
  assert.match(ch01, /\.\.\/assets\/css\/type\.css/);
  assert.match(ch01, /\.\.\/assets\/js\/site\.js/);
  assert.match(ch01, /window\.CHAPTER/);
});
















