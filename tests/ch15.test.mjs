import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch15.js');
const models = require('../assets/js/iv15.js');

test('chapter 15: California series and years', () => {
  assert.equal(data.years.length, 31);
  assert.equal(data.california.length, 31);
  assert.equal(data.synthetic.length, 31);
  assert.equal(data.years[0], 1970);
  assert.equal(data.years[data.years.length - 1], 2000);
});

test('chapter 15: donor weights are convex', () => {
  assert.equal(data.weights.length, 5);
  assert.ok(Math.abs(data.weightSum - 1) < 1e-9);
  for (const item of data.weights) {
    assert.ok(item.weight >= 0 && item.weight <= 1);
  }
});

test('chapter 15: synthetic effect in 2000', () => {
  assert.ok(Math.abs(data.californiaEffect2000 - (-24.83326147)) < 1e-8);
  assert.ok(Math.abs(models.effect2000 - data.californiaEffect2000) < 1e-8);
  assert.ok(Math.abs(models.bookEffect2000 - (-24.83015975)) < 1e-8);
  assert.ok(Math.abs(data.californiaEffect2000 - models.bookEffect2000) < 0.01);
});

test('chapter 15: placebo distribution and p-value', () => {
  assert.equal(data.placeboEffects.length, 35);
  assert.ok(Math.abs(data.pValue - 0.05714285714285714) < 1e-12);
  const tail = data.placeboEffects.filter((value) => value < data.californiaEffect2000).length;
  assert.ok(tail >= 1 && tail <= 2);
});

