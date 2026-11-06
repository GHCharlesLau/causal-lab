import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch18.js');
const models = require('../assets/js/iv18.js');

test('chapter 18: sample and split', () => {
  assert.equal(data.n, 5000);
  assert.equal(data.nTest, 1250);
  assert.equal(data.rows.length, 1250);
  assert.equal(models.nTest, 1250);
});

test('chapter 18: average sensitivity', () => {
  assert.ok(Math.abs(data.m1Price - (-2.75146286)) < 1e-6);
  assert.ok(Math.abs(models.slopes.ate - (-2.3402)) < 1e-6);
  assert.ok(Math.abs(data.slopes.ate - (-2.3402)) < 1e-6);
});

test('chapter 18: bands split at the median', () => {
  assert.equal(data.rows.filter((row) => row.band === 'low').length, 625);
  assert.equal(data.rows.filter((row) => row.band === 'high').length, 625);
  assert.ok(data.median < 0 && data.median > -0.01);
  assert.ok(data.m3SensMin < -10 && data.m3SensMax > 1);
});

test('chapter 18: band slopes diverge', () => {
  assert.ok(data.slopes.low < -5 && data.slopes.low > -6);
  assert.ok(data.slopes.high > 0.5 && data.slopes.high < 1.5);
  assert.ok(data.slopes.low < data.slopes.ate);
  assert.ok(data.slopes.ate < data.slopes.high);
  assert.ok(Math.abs(data.mlR2 - 0.9124088322890126) < 1e-12);
});

