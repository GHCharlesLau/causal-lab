/* ============================================================
   Chapter 23 — binary outcome and nonlinearity constants.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    n: 100000,
    ate: { latent: 1.402316, conversion: 0.394773, low: 0.170085, high: 0.118473 },
    means: { conversion: 0.51826, low: 0.12119, high: 0.9275, age: 40.0135, income: 3995.49 },
    pricing: {
      price: [5, 10, 15, 20],
      a: [5350, 5300, 5000, 4500],
      b: [5100, 5000, 4500, 3000]
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch23Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
