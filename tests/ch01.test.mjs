import test from 'node:test';
import assert from 'node:assert/strict';

// Chapter 01, four schools. The table is the book's; the arithmetic is the
// guard that the page and the source notebook agree.
const units = [
  { i: 1, Y0: 500, Y1: 450, T: 0 },
  { i: 2, Y0: 600, Y1: 600, T: 0 },
  { i: 3, Y0: 800, Y1: 600, T: 1 },
  { i: 4, Y0: 700, Y1: 750, T: 1 }
];

const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
const ate = mean(units.map((u) => u.Y1 - u.Y0));
const att = mean(units.filter((u) => u.T === 1).map((u) => u.Y1 - u.Y0));
const treatedMean = mean(units.filter((u) => u.T === 1).map((u) => u.Y1));
const controlMean = mean(units.filter((u) => u.T === 0).map((u) => u.Y0));
const naive = treatedMean - controlMean;
const bias = naive - att;

test('chapter 1: potential outcomes and the two averages', () => {
  assert.equal(ate, -50);
  assert.equal(att, -75);
});

test('chapter 1: naive association and bias', () => {
  assert.equal(treatedMean, 675);
  assert.equal(controlMean, 550);
  assert.equal(naive, 125);
  assert.equal(bias, 200);
  assert.equal(naive, att + bias);
});

test('chapter 1: every unit has one observed road', () => {
  for (const u of units) {
    const observed = u.T === 1 ? u.Y1 : u.Y0;
    assert.ok(Number.isFinite(observed));
    const missing = u.T === 1 ? u.Y0 : u.Y1;
    assert.ok(Number.isFinite(missing));
  }
});
