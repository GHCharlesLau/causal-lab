import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-a5.js');
const models = require('../assets/js/iv-a5.js');

test('A5: effect path and endpoints', () => {
  assert.equal(data.years.length, 31);
  assert.equal(data.effect.length, 31);
  assert.ok(Math.abs(data.effect[18] - -1.8658) < 1e-4);
  assert.ok(Math.abs(data.effect[30] - -26.5966) < 1e-4);
});

test('A5: conformal p-value and statistic', () => {
  assert.ok(Math.abs(data.pValue - 0.16129032258064516) < 1e-12);
  assert.ok(Math.abs(data.statistic - 12.602929955114083) < 1e-9);
  assert.ok(data.pValue > 0.1);
});

test('A5: interval in 1988 contains zero, 2000 does not', () => {
  assert.equal(data.ci.length, 13);
  assert.ok(data.ci[0].lower < 0 && data.ci[0].upper > 0);
  assert.ok(data.ci[12].upper < 0);
  assert.ok(data.ci[12].lower < data.ci[0].lower);
});

test('A5: intervals match the book endpoints', () => {
  assert.ok(Math.abs(data.ci[0].lower - -12.323232) < 1e-6);
  assert.ok(Math.abs(data.ci[0].upper - 8.686869) < 1e-6);
  assert.ok(Math.abs(data.ci[12].lower - -51.111111) < 1e-6);
  assert.ok(Math.abs(data.ci[12].upper - -17.979798) < 1e-6);
  assert.ok(Math.abs(models.pValue - data.pValue) < 1e-12);
});
