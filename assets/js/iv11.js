/* ============================================================
   Chapter 11 — the book's propensity-score estimates.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    n: 10391,
    ateIptw: 0.38850648,
    y1: 0.25958231,
    y0: -0.12892417,
    bootstrapLo: 0.35451324,
    bootstrapHi: 0.41992561,
    models: {
      naive: {
        label: 'Naive difference',
        short: 'naive',
        coef: 0.4723,
        se: 0.0204,
        lo: 0.432,
        hi: 0.512,
        note: 'the raw comparison is confounded by school and student characteristics.'
      },
      iptw: {
        label: 'IPTW',
        short: 'IPTW',
        coef: 0.38850648,
        se: 0.0167,
        lo: 0.35451324,
        hi: 0.41992561,
        note: 'inverse-probability weights balance the covariate mix.'
      },
      regression: {
        label: 'PS regression',
        short: 'PS reg',
        coef: 0.3930,
        se: 0.019,
        lo: 0.356,
        hi: 0.430,
        note: 'the outcome model includes the propensity score linearly.'
      },
      matching: {
        label: 'PS matching',
        short: 'PS match',
        coef: 0.389,
        se: 0.025,
        lo: 0.340,
        hi: 0.438,
        note: 'nearest neighbor on the propensity score, with bias adjustment.'
      }
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch11Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
