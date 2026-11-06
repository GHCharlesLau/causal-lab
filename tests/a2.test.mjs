import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-a2.js');
const models = require('../assets/js/iv-a2.js');

test('A2: sample and treated share', () => {
  assert.equal(data.n, 5000);
  assert.ok(Math.abs(data.treatedShare - 0.2158) < 1e-6);
  assert.ok(Math.abs(data.converted - 0.5368) < 1e-6);
});

test('A2: weighting balances income and invested', () => {
  assert.ok(data.corr.raw.income < -0.3);
  assert.ok(data.corr.raw.invested < -0.2);
  assert.ok(Math.abs(data.corr.weighted.income) < 0.05);
  assert.ok(Math.abs(data.corr.weighted.invested) < 0.05);
});

test('A2: the rare treated unit', () => {
  assert.ok(data.row1014.ps < 0.03);
  assert.ok(data.row1014.weight > 37);
  assert.equal(data.row1014.replications, 38);
  assert.ok(Math.abs(models.row1014.weight - data.row1014.weight) < 0.01);
});

test('A2: positivity histograms and email 3 zeros', () => {
  for (const key of ['em1', 'em3']) {
    assert.equal(data.ps[key].treated.length, 20);
    assert.equal(data.ps[key].control.length, 20);
    assert.equal(data.ps[key].edges.length, 21);
  }
  assert.equal(data.ps.em3.control[0] > 0, true);
  assert.ok(data.corr.em3Raw.age > 0.6);
});
