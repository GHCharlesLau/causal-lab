import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch20.js');
const models = require('../assets/js/iv20.js');

test('chapter 20: binary sample and treatment probability', () => {
  assert.equal(data.binary.n, 15000);
  assert.equal(data.binary.nTrain, 9000);
  assert.equal(data.binary.nTest, 6000);
  assert.ok(Math.abs(data.binary.ps - 0.50455556) < 1e-8);
  assert.ok(Math.abs(models.binary.ps - data.binary.ps) < 1e-8);
});

test('chapter 20: binary gain curves', () => {
  for (const split of ['train', 'test']) {
    const curve = data.binary.curves[split];
    assert.ok(curve.x.length > 50);
    assert.ok(Math.abs(curve.gain[curve.gain.length - 1] - curve.ate) < 1e-5);
  }
  assert.ok(data.binary.top10.train > data.binary.top10.test);
  assert.ok(data.binary.cate.min < 0 && data.binary.cate.max > 0);
});

test('chapter 20: continuous sample and curves', () => {
  assert.equal(data.continuous.n, 5000);
  assert.equal(data.continuous.nTrain, 3500);
  assert.equal(data.continuous.nTest, 1500);
  for (const split of ['train', 'test']) {
    const curve = data.continuous.curves[split];
    assert.ok(curve.x.length > 50);
    assert.ok(Math.abs(curve.gain[curve.gain.length - 1] - curve.ate) < 1e-4);
  }
});

test('chapter 20: top-decile lift is positive and modest', () => {
  assert.ok(data.binary.top10.test > 0 && data.binary.top10.test < 0.03);
  assert.ok(data.continuous.top10.test > 0 && data.continuous.top10.test < 0.5);
  assert.ok(data.continuous.curves.test.ate < 0);
  assert.ok(Math.abs(models.continuous.top10.test - data.continuous.top10.test) < 1e-5);
});


