import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch13.js');
const models = require('../assets/js/iv13.js');

test('chapter 13: group means and counts', () => {
  assert.equal(data.n, 4600);
  assert.ok(Math.abs(data.means.flBefore - 171.64230769) < 1e-8);
  assert.ok(Math.abs(data.means.flAfter - 206.1655) < 1e-8);
  assert.ok(Math.abs(data.means.poaBefore - 46.016) < 1e-8);
  assert.ok(Math.abs(data.means.poaAfter - 87.06375) < 1e-8);
  assert.deepEqual(data.counts, { flBefore: 1300, flAfter: 2000, poaBefore: 500, poaAfter: 800 });
});

test('chapter 13: before-after and cross-section comparisons', () => {
  assert.ok(Math.abs(data.beforeAfter - 41.04775) < 1e-8);
  assert.ok(Math.abs(data.crossSection - (-119.10175)) < 1e-8);
});

test('chapter 13: difference in differences', () => {
  assert.ok(Math.abs(data.did - 6.52455769) < 1e-8);
  assert.ok(Math.abs(data.ols.interaction - data.did) < 1e-8);
});

test('chapter 13: the interaction interval includes zero', () => {
  assert.ok(data.ols.lo < 0 && data.ols.hi > 0);
  assert.ok(Math.abs(data.ols.seInteraction - 5.72852129) < 1e-8);
  assert.ok(Math.abs(models.ols.interaction - 6.52455769) < 1e-8);
});
