import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch08.js');
const iv = require('../assets/js/iv.js');

test('chapter 8: AK91 and weak-IV payloads', () => {
  assert.equal(data.ak91.n, 329509);
  assert.equal(data.ak91.groups.year.length, 40);
  assert.equal(data.weak.points.length, 50);
  assert.equal(data.weak.true_ate, 2);
});

test('chapter 8: IV constants and the ratio', () => {
  assert.ok(Math.abs(iv.firstStage - 0.1008580927) < 1e-9);
  assert.ok(Math.abs(iv.reducedForm - 0.0086034843) < 1e-9);
  assert.ok(Math.abs(iv.ratio - 0.0853028649) < 1e-8);
  assert.ok(Math.abs(iv.models.q4.coef - 0.0853028649) < 1e-8);
  assert.ok(Math.abs(iv.models.q4.se - 0.0255408128) < 1e-8);
});

test('chapter 8: multiple instruments and OLS comparison', () => {
  assert.ok(Math.abs(iv.models.many.coef - 0.1076937049) < 1e-8);
  assert.ok(Math.abs(iv.models.ols.coef - 0.0673257282) < 1e-8);
  assert.ok(iv.models.q4.coef > iv.models.ols.coef);
  assert.ok(iv.models.q4.se > iv.models.ols.se);
});

test('chapter 8: weak instruments widen the standard error', () => {
  const strong = data.weak.points[0];
  const weak = data.weak.points[data.weak.points.length - 1];
  assert.ok(Math.abs(strong.corr - 0.99980723) < 1e-8);
  assert.ok(Math.abs(strong.ate - 1.94607594) < 1e-8);
  assert.ok(Math.abs(strong.se - 0.01007062) < 1e-8);
  assert.ok(Math.abs(weak.corr - 0.03359071) < 1e-8);
  assert.ok(Math.abs(weak.ate - 2.0783756) < 1e-8);
  assert.ok(Math.abs(weak.se - 0.30270764) < 1e-8);
  assert.ok(weak.se > strong.se * 10);
});

test('chapter 8: the strongest 2SLS estimate is still biased', () => {
  const strong = data.weak.points[0];
  assert.ok(strong.ate < data.weak.true_ate);
  assert.ok(strong.ate + 1.96 * strong.se < data.weak.true_ate);
});
