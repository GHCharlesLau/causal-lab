/* ============================================================
   Chapter 09 — the book's compliance estimates.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    n: 10000,
    assigned: 4943,
    firstStage: 0.71758042,
    compliers: 0.71758042,
    neverTakers: 1 - 0.71758042,
    alwaysTakers: 0,
    defiers: 0,
    models: {
      ols: {
        label: 'OLS: assigned + delivered',
        short: 'OLS',
        coef: 27.59967118,
        se: 0.6124,
        lo: 26.399,
        hi: 28.800,
        note: 'conditioning on delivery builds in the income confounder.'
      },
      itt: {
        label: 'ITT: assigned only',
        short: 'ITT',
        coef: 2.36359517,
        se: 0.5209,
        lo: 1.3427,
        hi: 3.3845,
        note: 'the effect of assignment, diluted by never takers.'
      },
      late: {
        label: 'LATE: 2SLS',
        short: 'LATE',
        coef: 3.2938,
        se: 0.7165,
        lo: 1.8896,
        hi: 4.6981,
        note: 'the effect on compliers, not on everyone.'
      }
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch09Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
