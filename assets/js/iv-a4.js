/* ============================================================
   Technical note A4 — prediction metric constants.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    n: 100000,
    nTest: 50000,
    r2: { m1: 0.91605165, m2: 0.08378351 },
    r2Res: { m1: -281.7974, m2: -24.0468 },
    end: { m1: 1.23552, m2: 1.23552 }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.A4Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
