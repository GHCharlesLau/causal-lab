import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch07.js');
const ols = require('../assets/js/regression.js');

function residualVariance(dataset, yName, cols) {
  const model = ols.ols(dataset, yName, cols);
  let total = 0;
  for (let i = 0; i < dataset.n; i++) {
    let fit = model.coefficients[0];
    for (let j = 0; j < cols.length; j++) fit += model.coefficients[j + 1] * dataset[cols[j]][i];
    const e = dataset[yName][i] - fit;
    total += e * e;
  }
  return total / dataset.n;
}

test('chapter 7: datasets', () => {
  assert.equal(data.email.n, 5000);
  assert.equal(data.hospital.n, 80);
});

test('chapter 7: email naive and outcome-predictor models', () => {
  const naive = ols.ols(data.email, 'payments', ['email']);
  const good = ols.ols(data.email, 'payments', ['email', 'credit_limit', 'risk_score']);
  assert.ok(Math.abs(naive.coefficients[1] - (-0.6202804021)) < 1e-6);
  assert.ok(Math.abs(naive.seAll[1] - 2.941497) < 1e-5);
  assert.ok(Math.abs(good.coefficients[1] - 4.430357) < 1e-5);
  assert.ok(Math.abs(good.seAll[1] - 2.129899) < 1e-5);
});

test('chapter 7: bad controls collapse the email effect', () => {
  const bad = ols.ols(data.email, 'payments', ['email', 'credit_limit', 'risk_score', 'opened', 'agreement']);
  assert.ok(Math.abs(bad.coefficients[1] - (-1.609483)) < 1e-5);
  assert.ok(Math.abs(bad.seAll[1] - 2.723665) < 1e-5);
  assert.ok(bad.coefficients[1] < 0);
});

test('chapter 7: outcome variance collapses with credit and risk', () => {
  assert.ok(Math.abs(residualVariance(data.email, 'payments', []) - 10807.612416) < 1e-5);
  assert.ok(Math.abs(residualVariance(data.email, 'payments', ['credit_limit', 'risk_score']) - 5652.453558) < 1e-5);
});

test('chapter 7: hospital naive, severity, and hospital controls', () => {
  const naive = ols.ols(data.hospital, 'days', ['treatment']);
  const severity = ols.ols(data.hospital, 'days', ['treatment', 'severity']);
  const both = ols.ols(data.hospital, 'days', ['treatment', 'severity', 'hospital']);
  assert.ok(Math.abs(naive.coefficients[1] - 14.153333) < 1e-6);
  assert.ok(Math.abs(naive.seAll[1] - 3.366811) < 1e-5);
  assert.ok(Math.abs(severity.coefficients[1] - (-7.591172)) < 1e-6);
  assert.ok(Math.abs(severity.seAll[1] - 2.269234) < 1e-5);
  assert.ok(Math.abs(both.coefficients[1] - (-5.094469)) < 1e-6);
  assert.ok(Math.abs(both.seAll[1] - 3.492034) < 1e-5);
  assert.ok(both.seAll[1] > severity.seAll[1]);
});

