import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch09.js');
const models = require('../assets/js/iv09.js');

test('chapter 9: compliance counts', () => {
  assert.equal(data.n, 10000);
  assert.equal(data.assigned, 4943);
  assert.equal(data.counts.assigned0_delivered0, 5057);
  assert.equal(data.counts.assigned0_delivered1, 0);
  assert.equal(data.counts.assigned1_delivered0, 1396);
  assert.equal(data.counts.assigned1_delivered1, 3547);
});

test('chapter 9: first stage is the compliance share', () => {
  assert.ok(Math.abs(data.delivery_rate_assigned - 0.71758042) < 1e-8);
  assert.equal(data.delivery_rate_unassigned, 0);
  assert.ok(Math.abs(models.firstStage - 0.71758042) < 1e-8);
  assert.ok(Math.abs(models.neverTakers - 0.28241958) < 1e-8);
  assert.equal(models.alwaysTakers, 0);
  assert.equal(models.defiers, 0);
});

test('chapter 9: OLS, ITT, and LATE coefficients', () => {
  assert.ok(Math.abs(models.models.ols.coef - 27.59967118) < 1e-6);
  assert.ok(Math.abs(models.models.itt.coef - 2.36359517) < 1e-6);
  assert.ok(Math.abs(models.models.late.coef - 3.2938) < 1e-4);
});

test('chapter 9: ITT divided by first stage is LATE', () => {
  const ratio = models.models.itt.coef / models.firstStage;
  assert.ok(Math.abs(ratio - models.models.late.coef) < 1e-3);
});

test('chapter 9: LATE lies between ITT and OLS', () => {
  assert.ok(models.models.late.coef > models.models.itt.coef);
  assert.ok(models.models.late.coef < models.models.ols.coef);
});
