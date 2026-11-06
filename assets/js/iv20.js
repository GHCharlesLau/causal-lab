/* ============================================================
   Chapter 20 — plug-and-play target-transformation constants.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    binary: {
      n: 15000,
      nTrain: 9000,
      nTest: 6000,
      ps: 0.50455556,
      top10: { train: 0.030994, test: 0.014385 },
      cate: { min: -0.141204, max: 0.385691, mean: 0.073521 }
    },
    continuous: {
      n: 5000,
      nTrain: 3500,
      nTest: 1500,
      top10: { train: 0.21887, test: 0.27308 },
      cate: { min: -61.7182, max: 13.9886, mean: -12.5167 }
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch20Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
