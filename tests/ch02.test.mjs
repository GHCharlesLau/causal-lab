import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch02.js');

const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
const group = (f) => {
  const scores = [];
  for (let i = 0; i < data.n; i++) if (data.format[i] === f) scores.push(data.score[i]);
  return scores;
};
const meanOf = (key, f) => {
  const values = [];
  for (let i = 0; i < data.n; i++) {
    if (data.format[i] === f && data[key][i] !== null) values.push(data[key][i]);
  }
  return mean(values);
};

test('chapter 2: sample and group counts', () => {
  assert.equal(data.n, 323);
  assert.equal(group(0).length, 120);
  assert.equal(group(1).length, 109);
  assert.equal(group(2).length, 94);
});

test('chapter 2: group means reproduce the book', () => {
  assert.ok(Math.abs(mean(group(0)) - 78.547485) < 1e-5);
  assert.ok(Math.abs(mean(group(1)) - 77.093731) < 1e-5);
  assert.ok(Math.abs(mean(group(2)) - 73.635263) < 1e-5);
});

test('chapter 2: online and blended gaps versus face-to-face', () => {
  const f2f = mean(group(0));
  assert.ok(Math.abs(mean(group(2)) - f2f - (-4.912221)) < 1e-5);
  assert.ok(Math.abs(mean(group(1)) - f2f - (-1.453753)) < 1e-5);
});

test('chapter 2: balance table keeps missing responses out', () => {
  assert.equal(data.black.filter((x) => x === null).length, 76);
  assert.ok(Math.abs(meanOf('black', 0) - 0.070707) < 1e-5);
  assert.ok(Math.abs(meanOf('black', 1) - 0.102564) < 1e-5);
  assert.ok(Math.abs(meanOf('black', 2) - 0.028571) < 1e-5);
  assert.ok(Math.abs(meanOf('gender', 0) - 0.633333) < 1e-5);
});
