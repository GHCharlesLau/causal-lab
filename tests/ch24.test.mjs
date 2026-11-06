import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch24.js');
const models = require('../assets/js/iv24.js');

test('chapter 24: constant effect is recovered', () => {
  assert.ok(Math.abs(data.constant.twfe - 1) < 1e-6);
  assert.ok(Math.abs(data.constant.true - 1) < 1e-6);
  assert.ok(Math.abs(models.constant.twfe - data.constant.twfe) < 1e-6);
});

test('chapter 24: maturing effect is underestimated', () => {
  assert.ok(Math.abs(data.mature.twfe - 0.786771) < 1e-6);
  assert.ok(Math.abs(data.mature.true - 0.854412) < 1e-6);
  assert.ok(data.mature.twfe < data.mature.true);
});

test('chapter 24: fading effect reverses sign', () => {
  assert.ok(Math.abs(data.minimal.twfe - 0.05) < 1e-6);
  assert.ok(data.minimal.true < 0);
  assert.ok(data.minimal.twfe > 0);
  assert.ok(data.minimal.twfe > data.minimal.true);
});

test('chapter 24: cohort series and flexible fix', () => {
  assert.equal(data.constant.dates.length, 92);
  assert.equal(data.constant.series['2021-06-01'].length, 92);
  assert.equal(data.minimal.dates.length, 48);
  assert.equal(Object.keys(data.minimal.series).length, 2);
  assert.ok(Math.abs(data.fix.flexible - data.fix.true) < 1e-10);
  assert.equal(data.fix.params, 467);
});
