import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const models = require('../assets/js/iv12.js');

test('chapter 12: doubly robust estimate and interval', () => {
  const dr = models.models.both;
  assert.ok(Math.abs(dr.coef - 0.3882212177) < 1e-9);
  assert.ok(Math.abs(dr.lo - 0.3536475272) < 1e-9);
  assert.ok(Math.abs(dr.hi - 0.4197844134) < 1e-9);
});

test('chapter 12: one wrong model stays close', () => {
  const dr = models.models.both.coef;
  assert.ok(Math.abs(models.models.wrongPs.coef - dr) < 0.02);
  assert.ok(Math.abs(models.models.wrongOutcome.coef - dr) < 0.02);
});

test('chapter 12: both wrong has no estimate', () => {
  assert.equal(models.models.bothWrong.coef, null);
  assert.equal(models.models.bothWrong.lo, null);
  assert.match(models.models.bothWrong.note, /No guarantee/);
});

test('chapter 12: intervals overlap and resemble IPTW', () => {
  const dr = models.models.both;
  const wrongPs = models.models.wrongPs;
  const wrongOutcome = models.models.wrongOutcome;
  assert.ok(wrongPs.lo < dr.hi && dr.lo < wrongPs.hi);
  assert.ok(wrongOutcome.lo < dr.hi && dr.lo < wrongOutcome.hi);
  assert.ok(Math.abs(models.iptw - dr.coef) < 0.001);
});
