import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch22.js');
const models = require('../assets/js/iv22.js');

test('chapter 22: raw and orthogonal slopes', () => {
  assert.equal(data.nTrain, 10000);
  assert.equal(data.nTest, 5000);
  assert.ok(Math.abs(data.rawSlope - 1.229375) < 1e-5);
  assert.ok(Math.abs(data.residualSlope - (-3.922826)) < 1e-5);
  assert.ok(data.rawSlope > 0);
  assert.ok(data.residualSlope < 0);
});

test('chapter 22: OLS benchmark and test ATE', () => {
  assert.ok(Math.abs(data.olsSlope - (-4.00042915)) < 1e-8);
  assert.ok(Math.abs(data.testAte - models.testAte) < 1e-6);
  assert.ok(data.testAte < 0);
});

test('chapter 22: both CATE curves converge to the test ATE', () => {
  for (const key of ['param', 'nonparam']) {
    const curve = data.curves[key];
    assert.ok(curve.gain.length > 50);
    assert.ok(Math.abs(curve.gain[curve.gain.length - 1] - data.testAte) < 1e-4);
  }
});

test('chapter 22: residual scatter and CATE ranges', () => {
  assert.equal(data.scatter.length, 600);
  assert.ok(data.top10.param > 0.2);
  assert.ok(data.top10.nonparam > 0.2);
  assert.ok(data.cate.param.min < -10);
  assert.ok(data.cate.nonparam.min < -10);
});

