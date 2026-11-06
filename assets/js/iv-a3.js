/* ============================================================
   Technical note A3 — prediction failure constants.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    n: 10000,
    r2: { train: 0.5382953634651921, test: 0.504563847410434 },
    gain: { simple: 252.9268, model: 229.9341, loss: 22.9927 },
    bands: [10, 5, 5, 10, 5, 10, 10, 10, 15, 5]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.A3Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
