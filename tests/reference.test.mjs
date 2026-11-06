import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../assets/js/data.js');
const ref = require('../assets/js/reference.js');
const stats = require('../assets/js/stats.js');

const close = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;

test('medicine: naive difference matches the book', () => {
  const m = data.medicine;
  let st = 0, nt = 0, sc = 0, nc = 0;
  for (let i = 0; i < m.n; i++) {
    if (m.medication[i]) { st += m.recovery[i]; nt++; }
    else { sc += m.recovery[i]; nc++; }
  }
  assert.ok(close(st / nt - sc / nc, ref.medicine.naive, 1e-9));
});

test('medicine: 1-NN matching reproduces -0.9954', () => {
  const r = stats.matching(data.medicine, {
    features: ['severity', 'age', 'sex'], standardize: true, k: 1
  });
  assert.ok(close(r.main.ateRaw, ref.medicine.raw_by_k['1'], 0.02),
    `got ${r.main.ateRaw}, expected ${ref.medicine.raw_by_k['1']}`);
  assert.equal(r.main.usedT, r.nTreated);
  assert.equal(r.main.usedC, r.nControl);
});

test('medicine: bias correction reproduces -7.3627', () => {
  const r = stats.matching(data.medicine, {
    features: ['severity', 'age', 'sex'], standardize: true, k: 1
  });
  assert.ok(close(r.main.ateCorrected, ref.medicine.corrected_by_k['1'], 0.02),
    `got ${r.main.ateCorrected}, expected ${ref.medicine.corrected_by_k['1']}`);
});

test('medicine: k curve matches the reference direction', () => {
  const r = stats.matching(data.medicine, {
    features: ['severity', 'age', 'sex'], standardize: true, k: 10
  });
  for (const k of [1, 3, 5, 10]) {
    assert.ok(close(r.curve[k - 1].ateRaw, ref.medicine.raw_by_k[String(k)], 0.02),
      `k=${k}: got ${r.curve[k - 1].ateRaw}, expected ${ref.medicine.raw_by_k[String(k)]}`);
  }
});

test('medicine: omitting sex reopens the bias', () => {
  const r = stats.matching(data.medicine, {
    features: ['severity', 'age'], standardize: true, k: 1
  });
  assert.ok(close(r.main.ateRaw, ref.medicine.omitSexRaw1, 0.05),
    `got ${r.main.ateRaw}, expected ${ref.medicine.omitSexRaw1}`);
});

test('medicine: oracle outcome model recovers the true effect', () => {
  const oracle = stats.oracleAte(data.medicine);
  assert.ok(close(oracle, ref.medicine.oracleAte, 0.05), `got ${oracle}`);
  assert.ok(Math.abs(oracle - ref.medicine.trueAte) < 0.15);
});

test('medicine: severity-band checkpoints', () => {
  const target = stats.quantile(data.medicine.severity, 0.5);
  for (const point of ref.medicine.severityBands) {
    const r = stats.severityBand(data.medicine, point.band, target);
    assert.ok(close(r.estimate, point.estimate, 0.05), `band ${point.band}: ${r.estimate}`);
    assert.equal(r.n, point.n);
  }
});

test('trainees: naive and exact-match numbers', () => {
  const t = data.trainees;
  const treated = t.filter((d) => d.treated === 1);
  const control = t.filter((d) => d.treated === 0);
  const naive = stats.mean(treated.map((d) => d.earnings)) -
    stats.mean(control.map((d) => d.earnings));
  assert.ok(close(naive, ref.trainees.naive, 1e-9));

  const firstByAge = new Map();
  for (const d of control) if (!firstByAge.has(d.age)) firstByAge.set(d.age, d);
  const diffs = treated.map((d) => d.earnings - firstByAge.get(d.age).earnings);
  assert.equal(diffs.length, ref.trainees.pairs);
  assert.ok(close(stats.mean(diffs), ref.trainees.matched, 1e-9));
});

test('drug example: naive, subclassification, OLS', () => {
  const r = stats.regressionWeights(data.drug);
  assert.ok(close(r.naive, ref.drug.naive, 1e-9));
  assert.ok(close(r.subclassification, ref.drug.subclassification, 1e-9));
  assert.ok(close(r.ols, ref.drug.ols, 1e-7));
  assert.ok(close(r.cells[0].effect, -3, 1e-9));
  assert.ok(close(r.cells[1].effect, -2, 1e-9));
});

test('k-d tree agrees with brute force and tie-breaks by index', () => {
  const rng = stats.mulberry32(42);
  const n = 600, d = 4;
  const X = new Float64Array(n * d);
  for (let i = 0; i < n * d; i++) X[i] = rng();
  const tree = new stats.KDTree(X, n, d, null);
  for (let q = 0; q < 40; q++) {
    const p = Array.from({ length: d }, rng);
    const got = tree.query(p, 5);
    const brute = [];
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let j = 0; j < d; j++) {
        const diff = p[j] - X[i * d + j];
        s += diff * diff;
      }
      brute.push({ i, d2: s });
    }
    brute.sort((a, b) => a.d2 - b.d2 || a.i - b.i);
    for (let k = 0; k < 5; k++) {
      assert.equal(got[k].i, brute[k].i, `query ${q} rank ${k}`);
      assert.ok(close(got[k].d2, brute[k].d2, 1e-12));
    }
  }
});

test('OLS recovers the toy drug regression', () => {
  const r = stats.regressionWeights(data.drug);
  assert.ok(close(r.intercept, 7.54545454545, 1e-8));
  assert.ok(close(r.femaleCoef, -3.31818181818, 1e-8));
  assert.ok(close(r.ols, -2.45454545454, 1e-8));
});

test('curse simulation: 3^10 cells and growing distances', () => {
  const r = stats.curseSim({ n: 300, q: 80, dMax: 10 });
  assert.equal(r.length, 10);
  assert.equal(r[9].cells, 59049);
  assert.ok(r[9].meanDistance > r[0].meanDistance);
});
