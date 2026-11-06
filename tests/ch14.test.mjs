import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch14.js');
const models = require('../assets/js/iv14.js');

test('chapter 14: wage panel dimensions', () => {
  assert.equal(data.n, 4360);
  assert.equal(data.entities, 545);
  assert.equal(data.years, 8);
  assert.equal(Object.keys(data.yearMeans).length, 8);
});

test('chapter 14: toy panel slopes', () => {
  assert.equal(data.toy.rows.length, 16);
  assert.ok(Math.abs(data.toy.pooledSlope - (-0.55834642)) < 1e-8);
  assert.ok(Math.abs(data.toy.feSlope - 1.44137931) < 1e-8);
  assert.ok(data.toy.pooledSlope < 0 && data.toy.feSlope > 0);
});

test('chapter 14: marriage coefficients fall as controls increase', () => {
  assert.ok(Math.abs(models.models.pooled.coef - 0.14102805) < 1e-8);
  assert.ok(Math.abs(models.models.entity.coef - 0.1146543) < 1e-7);
  assert.ok(Math.abs(models.models.twoway.coef - 0.04762345) < 1e-8);
  assert.ok(models.models.pooled.coef > models.models.entity.coef);
  assert.ok(models.models.entity.coef > models.models.twoway.coef);
});

test('chapter 14: clustered interval and entity standard error', () => {
  assert.ok(Math.abs(models.models.entity.se - 0.0219791) < 1e-7);
  assert.ok(models.models.entity.lo < models.models.entity.coef);
  assert.ok(models.models.entity.hi > models.models.entity.coef);
  assert.ok(models.models.twoway.lo > 0);
});
