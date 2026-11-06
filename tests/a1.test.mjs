import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-a1.js');
const models = require('../assets/js/iv-a1.js');

test('A1: sample and raw correlation', () => {
  assert.equal(data.n, 10000);
  assert.equal(data.nTest, 5000);
  assert.ok(Math.abs(data.corr.priceSales - 0.083907) < 1e-6);
  assert.ok(data.corr.costPrice > 0.3);
});

test('A1: raw and residual slopes flip sign', () => {
  assert.ok(data.slope.raw > 1);
  assert.ok(data.slope.priceRes < -3);
  assert.ok(data.slope.both < -3);
  assert.ok(Math.abs(data.slope.priceRes - data.slope.both) < 1e-6);
});

test('A1: scatter sample and gain curves', () => {
  assert.equal(data.scatter.length, 600);
  for (const key of ['debiased', 'biased']) {
    const curve = data.curves[key];
    assert.ok(curve.x.length > 50);
    assert.equal(curve.x.length, curve.gain.length);
  }
});

test('A1: endpoints have opposite signs', () => {
  assert.ok(data.end.debiased < -3);
  assert.ok(data.end.biased > 1);
  assert.ok(Math.abs(models.end.debiased - data.end.debiased) < 1e-6);
});
