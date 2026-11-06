import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch02.js');

const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
const variance = (xs) => {
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
};
const scores = (f) => data.score.filter((_, i) => data.format[i] === f);
const online = scores(2);
const face = scores(0);
const se = (xs) => Math.sqrt(variance(xs) / xs.length);
const diff = mean(online) - mean(face);
const seDiff = Math.sqrt(variance(online) / online.length + variance(face) / face.length);

function normCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

test('chapter 3: standard errors match the book', () => {
  assert.ok(Math.abs(se(online) - 1.5371593973) < 1e-9);
  assert.ok(Math.abs(se(face) - 0.8723511456) < 1e-9);
});

test('chapter 3: difference and its standard error', () => {
  assert.ok(Math.abs(diff - (-4.9122214982)) < 1e-9);
  assert.ok(Math.abs(seDiff - 1.7674432195) < 1e-9);
});

test('chapter 3: 95% interval and z statistic', () => {
  const lo = diff - 1.96 * seDiff;
  const hi = diff + 1.96 * seDiff;
  assert.ok(Math.abs(lo - (-8.3764102084)) < 1e-9);
  assert.ok(Math.abs(hi - (-1.4480327881)) < 1e-9);
  assert.ok(Math.abs(diff / seDiff - (-2.7792810791)) < 1e-9);
});

test('chapter 3: one-sided and two-sided p-values', () => {
  const z = diff / seDiff;
  const one = normCdf(z);
  const two = 2 * Math.min(one, 1 - one);
  assert.ok(Math.abs(one - 0.0027239681) < 1e-7);
  assert.ok(Math.abs(two - 0.0054479362) < 2e-7);
});

