import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch23.js');
const models = require('../assets/js/iv23.js');

test('chapter 23: sample and outcome means', () => {
  assert.equal(data.n, 100000);
  assert.ok(Math.abs(data.means.conversion - 0.51826) < 1e-5);
  assert.ok(Math.abs(data.means.low - 0.12119) < 1e-5);
  assert.ok(Math.abs(data.means.high - 0.9275) < 1e-5);
});

test('chapter 23: latent and conversion ATEs', () => {
  assert.ok(Math.abs(data.ate.latent - 1.402316) < 1e-6);
  assert.ok(Math.abs(data.ate.conversion - 0.394773) < 1e-6);
  assert.ok(data.ate.conversion < data.ate.latent);
  assert.ok(data.ate.low < data.ate.conversion);
  assert.ok(data.ate.high < data.ate.conversion);
});

test('chapter 23: four views with two curves', () => {
  for (const key of ['latent', 'conversion', 'low', 'high']) {
    const view = data.curves[key];
    assert.ok(view.age.x.length > 50);
    assert.equal(view.age.x.length, view.income.x.length);
    assert.ok(view.age.effect.length === view.age.x.length);
  }
});

test('chapter 23: pricing segments and arithmetic', () => {
  assert.deepEqual(data.pricing.price, [5, 10, 15, 20]);
  assert.equal(data.pricing.a.length, 4);
  assert.equal(data.pricing.b.length, 4);
  assert.equal(data.pricing.b[1] - data.pricing.b[0], -100);
  assert.equal(data.pricing.a[1] - data.pricing.a[2], 300);
  assert.ok(Math.abs(models.ate.latent - data.ate.latent) < 1e-6);
});
