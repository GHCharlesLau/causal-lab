import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data-ch06.js');
const ols = require('../assets/js/regression.js');

const byEduc = new Map();
for (let i = 0; i < data.n; i++) {
  const e = data.educ[i];
  if (!byEduc.has(e)) byEduc.set(e, { lhwage: [], hwage: [] });
  byEduc.get(e).lhwage.push(data.lhwage[i]);
  byEduc.get(e).hwage.push(data.hwage[i]);
}
const levels = [...byEduc.keys()].sort((a, b) => a - b);
const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
const groups = {
  n: levels.length,
  educ: levels,
  lhwage: levels.map((e) => mean(byEduc.get(e).lhwage)),
  hwage: levels.map((e) => mean(byEduc.get(e).hwage)),
  count: levels.map((e) => byEduc.get(e).lhwage.length)
};

test('chapter 6: 935 workers in ten education cells', () => {
  assert.equal(data.n, 935);
  assert.deepEqual(levels, [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  assert.equal(groups.count.reduce((a, b) => a + b, 0), 935);
  assert.equal(groups.count[3], 393);
});

test('chapter 6: weighted cell regression matches the individual slope', () => {
  const model = ols.wls(groups, 'lhwage', ['educ'], groups.count);
  assert.ok(Math.abs(model.coef - 0.0529472353) < 1e-8);
  assert.ok(Math.abs(model.intercept - 2.295423) < 1e-6);
  assert.ok(Math.abs(model.se - 0.00573556) < 1e-8);
});

test('chapter 6: equal cell weights change the slope', () => {
  const model = ols.ols(groups, 'lhwage', ['educ']);
  assert.ok(Math.abs(model.coef - 0.0480940622) < 1e-8);
  assert.ok(model.coef < ols.wls(groups, 'lhwage', ['educ'], groups.count).coef);
});

test('chapter 6: dummy baseline and educ=17 contrast', () => {
  assert.ok(Math.abs(groups.hwage[0] - 18.56) < 1e-9);
  const diff = groups.hwage[levels.indexOf(17)] - groups.hwage[0];
  assert.ok(Math.abs(diff - 9.5904723624) < 5e-8);
});

test('chapter 6: naive, IQ-adjusted, and interaction gaps', () => {
  const n = data.n;
  function design(interaction) {
    return {
      n,
      hwage: data.hwage,
      T: data.educ.map((e) => (e > 12 ? 1 : 0)),
      IQ: data.IQ,
      TIQ: interaction ? data.educ.map((e, i) => (e > 12 ? 1 : 0) * data.IQ[i]) : null
    };
  }
  const naive = ols.ols(design(false), 'hwage', ['T']);
  const adjusted = ols.ols(design(false), 'hwage', ['T', 'IQ']);
  const interaction = ols.ols(design(true), 'hwage', ['T', 'IQ', 'TIQ']);
  assert.ok(Math.abs(naive.coefficients[1] - 4.90438012) < 1e-6);
  assert.ok(Math.abs(adjusted.coefficients[1] - 3.15732835) < 1e-6);
  assert.ok(Math.abs(interaction.coefficients[1] - 0.68604365) < 1e-6);
  assert.ok(Math.abs(interaction.k - 4) < 1e-9);
});


