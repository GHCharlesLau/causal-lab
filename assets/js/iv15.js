/* ============================================================
   Chapter 15 — the synthetic control for California.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    nStates: 39,
    donors: 5,
    years: 31,
    effect2000: -24.83326147,
    bookEffect2000: -24.83015975,
    pValue: 0.05714285714285714,
    placeboCount: 35,
    weights: [
      { state: 5, weight: 0.0852 },
      { state: 21, weight: 0.1130 },
      { state: 22, weight: 0.1051 },
      { state: 23, weight: 0.4566 },
      { state: 34, weight: 0.2401 }
    ]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch15Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
