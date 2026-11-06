import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch11.js');
const models = require('../assets/js/iv11.js');

test('chapter 11: sample and treatment groups', () => {
  assert.equal(data.n, 10391);
  assert.equal(data.treated, 3384);
  assert.equal(data.control, 7007);
  assert.equal(data.ps.length, 10391);
});

test('chapter 11: propensity scores match the book head', () => {
  assert.ok(Math.abs(data.ps[0] - 0.31551696) < 1e-8);
  assert.ok(Math.abs(data.ps[1] - 0.26367664) < 1e-8);
  assert.ok(Math.abs(data.ps[4] - 0.36779079) < 1e-8);
  assert.ok(data.ps_min > 0.13 && data.ps_max < 0.54);
});

test('chapter 11: IPTW means and ATE', () => {
  assert.ok(Math.abs(data.y1 - 0.25958231) < 1e-5);
  assert.ok(Math.abs(data.y0 - (-0.12892417)) < 1e-5);
  assert.ok(Math.abs(data.ate - 0.38850648) < 1e-5);
  assert.ok(Math.abs(data.weight_treated - 10388.565115) < 0.05);
  assert.ok(Math.abs(data.weight_control - 10391.440761) < 0.05);
});

test('chapter 11: naive and adjusted estimates', () => {
  assert.ok(Math.abs(models.models.naive.coef - 0.4723) < 1e-4);
  assert.ok(Math.abs(models.models.iptw.coef - 0.38850648) < 1e-7);
  assert.ok(Math.abs(models.models.regression.coef - 0.3930) < 1e-4);
  assert.ok(Math.abs(models.models.matching.coef - 0.389) < 1e-4);
});

test('chapter 11: adjusted estimates are close, naive is higher', () => {
  for (const key of ['iptw', 'regression', 'matching']) {
    assert.ok(models.models[key].coef > 0.35 && models.models[key].coef < 0.43);
  }
  assert.ok(models.models.naive.coef > models.models.iptw.coef + 0.05);
});

