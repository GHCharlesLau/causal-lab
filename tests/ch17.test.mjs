import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch17.js');
const models = require('../assets/js/iv17.js');

test('chapter 17: customer sample and split', () => {
  assert.equal(data.n, 10000);
  assert.equal(data.nTest, 3000);
  assert.equal(data.regions.length, 50);
  assert.ok(Math.abs(data.trainMean - (-29.16942857)) < 1e-8);
});

test('chapter 17: region policy at zero', () => {
  assert.equal(data.selectedAtZero, 18);
  assert.ok(Math.abs(data.policyAtZero - 15.570667) < 1e-6);
  assert.ok(Math.abs(models.regionPolicy - data.policyAtZero) < 1e-6);
});

test('chapter 17: model R2 and policy', () => {
  assert.ok(Math.abs(data.trainR2 - 0.7108790300152951) < 1e-12);
  assert.ok(Math.abs(data.testR2 - 0.6938513063048141) < 1e-12);
  assert.equal(data.modelPolicy, 16.6);
  assert.ok(data.modelPolicy > data.policyAtZero);
});

test('chapter 17: treat-all loses money', () => {
  assert.ok(data.testMean < 0);
  assert.ok(data.treatAllTest < 0);
  assert.ok(models.testMean < 0);
});
