import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-a4.js');
const models = require('../assets/js/iv-a4.js');

test('A4: prediction R2 favors the nuisance model', () => {
  assert.ok(Math.abs(data.r2.m1 - 0.91605165) < 1e-6);
  assert.ok(Math.abs(data.r2.m2 - 0.08378351) < 1e-6);
  assert.ok(data.r2.m1 > data.r2.m2);
});

test('A4: residualized R2 favors the effect model', () => {
  assert.ok(data.r2Res.m1 < -200);
  assert.ok(data.r2Res.m2 < -20);
  assert.ok(data.r2Res.m2 > data.r2Res.m1);
});

test('A4: curves have 101 points and the same endpoint', () => {
  for (const key of ['m1', 'm2']) {
    const curve = data.curves[key];
    assert.equal(curve.x.length, 101);
    assert.equal(curve.gain.length, 101);
  }
  assert.ok(Math.abs(data.curves.m1.gain[100] - data.curves.m2.gain[100]) < 1e-5);
});

test('A4: M2 ranks the top quartile higher', () => {
  assert.ok(data.curves.m2.gain[25] > data.curves.m1.gain[25]);
  assert.ok(data.curves.m2.gain[25] > 5);
  assert.ok(data.curves.m1.gain[25] < 3.5);
  assert.ok(Math.abs(models.r2.m1 - data.r2.m1) < 1e-6);
});
