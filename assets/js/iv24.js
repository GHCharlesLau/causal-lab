/* ============================================================
   Chapter 24 — DiD saga constants.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    constant: { twfe: 1.0, true: 1.0 },
    mature: { twfe: 0.786771, true: 0.854412 },
    minimal: { twfe: 0.05, true: -1.219099 },
    fix: {
      true: 0.8544117647058823,
      flexible: 0.8544117647058977,
      params: 467,
      reducedParams: 271,
      reduced: 0.8544117647059067
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch24Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
