import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-a3.js');
const models = require('../assets/js/iv-a3.js');

test('A3: simple policy beats the model policy', () => {
  assert.ok(Math.abs(data.gain.simple - 252.9268) < 1e-4);
  assert.ok(Math.abs(data.gain.model - 229.9341) < 1e-4);
  assert.ok(data.gain.simple > data.gain.model);
  assert.ok(Math.abs(data.gain.loss - 22.9927) < 1e-4);
});

test('A3: predictive performance is decent', () => {
  assert.ok(data.r2.train > 0.5 && data.r2.train < 0.6);
  assert.ok(data.r2.test > 0.5 && data.r2.test < 0.6);
  assert.ok(data.r2.test < data.r2.train);
});

test('A3: coupon assignment is concentrated', () => {
  assert.equal(data.couponCounts['5'], 4749);
  assert.equal(data.couponCounts['10'], 4154);
  assert.ok(data.corr.age > 0.8);
  assert.ok(data.corr.netValue < 0);
});

test('A3: model band choices', () => {
  assert.equal(data.bands.band.length, 10);
  assert.equal(data.bands.coupon.length, 10);
  assert.deepEqual(Array.from(data.bands.coupon), [10, 5, 5, 10, 5, 10, 10, 10, 15, 5]);
  assert.deepEqual(Array.from(models.bands), Array.from(data.bands.coupon));
});
