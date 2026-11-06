/* ============================================================
   Technical note A5 — conformal synthetic control constants.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    pValue: 0.16129032258064516,
    statistic: 12.602929955114083,
    alpha: 0.1,
    ci: {
      '1988': [-12.323232, 8.686869],
      '1995': [-43.030303, -14.747475],
      '2000': [-51.111111, -17.979798]
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.A5Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
