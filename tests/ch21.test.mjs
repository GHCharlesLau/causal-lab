import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch21.js');
const models = require('../assets/js/iv21.js');

test('chapter 21: biased train and random test', () => {
  assert.equal(data.nTrain, 15000);
  assert.equal(data.nTest, 15000);
  assert.ok(Math.abs(data.trainRate - 0.22466667) < 1e-4);
  assert.ok(Math.abs(data.testRate - 0.50446667) < 1e-4);
  assert.ok(data.testRate > data.trainRate);
});

test('chapter 21: three learners converge to the ATE', () => {
  for (const key of ['s', 't', 'x']) {
    const curve = data.curves[key];
    assert.ok(Math.abs(curve.gain[curve.gain.length - 1] - data.ate) < 1e-5);
  }
  assert.ok(Math.abs(models.ate - data.ate) < 1e-6);
});

test('chapter 21: S-learner shrinks the bottom of the CATE', () => {
  assert.ok(data.cate.s.min > 0);
  assert.ok(data.cate.t.min < 0);
  assert.ok(data.cate.x.min < 0);
  assert.ok(data.cate.s.min > data.cate.t.min);
});

test('chapter 21: X-learner has the top-decile edge', () => {
  assert.ok(data.top10.x > data.top10.s);
  assert.ok(data.top10.x > data.top10.t);
  assert.ok(data.top10.s > data.top10.t);
  assert.ok(Math.abs(models.top10.x - data.top10.x) < 1e-6);
});

