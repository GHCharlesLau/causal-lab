import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch25.js');
const models = require('../assets/js/iv25.js');

test('chapter 25: three estimates', () => {
  assert.ok(Math.abs(data.att.did - (-27.349)) < 1e-6);
  assert.ok(Math.abs(data.att.sc - (-19.5136)) < 1e-4);
  assert.ok(Math.abs(data.att.sdid - (-15.6054)) < 1e-4);
  assert.ok(data.att.did < data.att.sc);
  assert.ok(data.att.sc < data.att.sdid);
});

test('chapter 25: panel paths', () => {
  assert.equal(data.years.length, 31);
  assert.equal(data.california.length, 31);
  assert.equal(data.scCf.length, 31);
  assert.equal(data.sdidCf.length, 31);
  assert.equal(data.didCf.length, 31);
});

test('chapter 25: time weights', () => {
  assert.equal(data.timeWeights.values.length, 9);
  const sum = data.timeWeights.values.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-4);
  assert.ok(data.timeWeights.values[6] > 0.3);
  assert.ok(data.timeWeights.values[8] > 0.4);
});

test('chapter 25: placebo inference and staggered ATT', () => {
  assert.ok(data.se.sdid < data.se.sc);
  assert.ok(data.se.sdidCi[0] < data.att.sdid && data.se.sdidCi[1] > data.att.sdid);
  assert.ok(Math.abs(data.staggered.combined - (-16.7014)) < 1e-4);
  assert.ok(Math.abs(models.att.sdid - data.att.sdid) < 1e-4);
});
