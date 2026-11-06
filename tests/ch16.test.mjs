import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch16.js');
const models = require('../assets/js/iv16.js');

test('chapter 16: drinking and sheepskin cells', () => {
  assert.equal(data.drinking.n, 48);
  assert.equal(data.drinking.rows.length, 48);
  assert.equal(data.sheepskin.n, 46);
  assert.equal(data.sheepskin.rows.length, 46);
});

test('chapter 16: sharp RD jumps at 21', () => {
  const sharp = data.drinking.sharp;
  assert.ok(Math.abs(sharp.all.full.jump - 7.66271163) < 1e-8);
  assert.ok(Math.abs(sharp.all.local.jump - 9.70035922) < 1e-8);
  assert.ok(Math.abs(sharp.mva.full.pct - 15.1492) < 1e-4);
  assert.ok(Math.abs(sharp.suicide.full.pct - 15.3857) < 1e-4);
});

test('chapter 16: kernel changes the all-cause estimate', () => {
  assert.ok(data.drinking.sharp.all.local.jump > data.drinking.sharp.all.full.jump);
  assert.ok(data.drinking.sharp.all.local.pct > data.drinking.sharp.all.full.pct);
});

test('chapter 16: fuzzy RD Wald estimate', () => {
  const fuzzy = models.fuzzy;
  assert.ok(Math.abs(fuzzy.numerator - (-97.757056)) < 1e-6);
  assert.ok(Math.abs(fuzzy.denominator - 0.277096) < 1e-6);
  assert.ok(Math.abs(fuzzy.wald - (-352.7912)) < 1e-4);
  assert.ok(fuzzy.ciLo < fuzzy.wald && fuzzy.ciHi > fuzzy.wald);
});
