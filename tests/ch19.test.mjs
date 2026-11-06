import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch19.js');
const models = require('../assets/js/iv19.js');

test('chapter 19: sample and ATE', () => {
  assert.equal(data.n, 5000);
  assert.ok(Math.abs(data.ate - (-2.551626)) < 1e-6);
  assert.ok(Math.abs(models.ate - data.ate) < 1e-6);
});

test('chapter 19: predictive model R2', () => {
  assert.ok(Math.abs(data.r2.train - 0.92517048) < 1e-8);
  assert.ok(Math.abs(data.r2.test - 0.77110742) < 1e-8);
  assert.ok(data.r2.test < data.r2.train);
});

test('chapter 19: cumulative gain curves converge to ATE', () => {
  for (const key of ['causal', 'predictive', 'random']) {
    const curve = data.curves[key];
    assert.equal(curve.x.length, 100);
    assert.equal(curve.gain.length, 100);
    assert.ok(Math.abs(curve.gain[curve.gain.length - 1] - data.ate) < 1e-4);
  }
});

test('chapter 19: three models have ten bands', () => {
  for (const key of ['causal', 'predictive', 'random']) {
    assert.equal(data.bands[key].length, 10);
  }
  assert.ok(data.topGain.causal > data.topGain.random);
  assert.ok(data.topGain.predictive < data.topGain.random);
});

