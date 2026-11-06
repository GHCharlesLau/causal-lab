/* ============================================================
   Technical note A1 — orthogonalization constants.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    n: 10000,
    nTest: 5000,
    corr: { priceSales: 0.083907, costPrice: 0.383544, tempSales: 0.356265 },
    slope: { raw: 1.37553, priceRes: -3.95149, both: -3.95149 },
    end: { debiased: -3.95149, biased: 1.37553 }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.A1Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
