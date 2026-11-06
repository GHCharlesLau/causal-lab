import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch05.js');
const ols = require('../assets/js/regression.js');

const controls = ['IQ', 'exper', 'tenure', 'age', 'married', 'black', 'south', 'urban', 'sibs', 'brthord', 'meduc', 'feduc'];
const fit = (xs) => ols.ols(data, 'lhwage', ['educ', ...xs]);

test('chapter 5: complete-case wage sample', () => {
  assert.equal(data.n, 663);
  assert.equal(data.educ.length, 663);
  assert.equal(data.lhwage.length, 663);
});

test('chapter 5: raw education coefficient matches the book', () => {
  const model = fit([]);
  assert.ok(Math.abs(model.coef - 0.0536047475) < 1e-9);
  assert.ok(Math.abs(model.se - 0.00753532) < 1e-9);
  assert.equal(model.n, 663);
});

test('chapter 5: IQ control lowers the coefficient', () => {
  const model = fit(['IQ']);
  assert.ok(Math.abs(model.coef - 0.0348640766) < 1e-9);
  assert.ok(model.coef < fit([]).coef);
});

test('chapter 5: human capital raises it again', () => {
  const model = fit(['IQ', 'exper', 'tenure', 'age']);
  assert.ok(Math.abs(model.coef - 0.0489957415) < 1e-9);
  assert.ok(model.coef > fit(['IQ']).coef);
});

test('chapter 5: full controls match the book and FWL value', () => {
  const model = fit(controls);
  assert.ok(Math.abs(model.coef - 0.0411471910) < 5e-8);
  assert.ok(Math.abs(model.se - 0.0100982) < 1e-8);
  assert.ok(Math.abs(model.lo - 0.0213547) < 1e-6);
  assert.ok(Math.abs(model.hi - 0.0609397) < 1e-6);
});

