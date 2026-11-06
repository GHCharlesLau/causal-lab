/* ============================================================
   Technical note A2 — propensity score constants.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    n: 5000,
    treatedShare: 0.2158,
    converted: 0.5368,
    corr: {
      raw: { age: -0.058796, income: -0.30561, insurance: -0.023948, invested: -0.242374 },
      weighted: { age: -0.021004, income: -0.026685, insurance: -0.037656, invested: -0.012073 }
    },
    row1014: { ps: 0.026862, weight: 37.2278, replications: 38 },
    maxWeight: 37.2278
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.A2Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
