/* ============================================================
   Chapter 21 — meta-learner comparison constants.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    nTrain: 15000,
    nTest: 15000,
    trainRate: 0.22466667,
    testRate: 0.50446667,
    ate: 0.068539,
    top10: { s: 0.015209, t: 0.011862, x: 0.018572 },
    cate: {
      s: { min: 0.00604, max: 0.3123, mean: 0.08661 },
      t: { min: -0.13267, max: 0.37396, mean: 0.09517 },
      x: { min: -0.09389, max: 0.41764, mean: 0.09915 }
    },
    learners: {
      s: { label: 'S-learner', note: 'one model, treatment as a feature.' },
      t: { label: 'T-learner', note: 'separate models for treated and control.' },
      x: { label: 'X-learner', note: 'imputed effects weighted by propensity.' }
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch21Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
