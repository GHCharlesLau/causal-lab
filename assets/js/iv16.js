/* ============================================================
   Chapter 16 — sharp and fuzzy regression discontinuity constants.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    drinkingN: 48,
    sheepskinN: 46,
    sharp: {
      all: { jump: 7.66271163, pct: 8.1851, localJump: 9.70035922, localPct: 10.4081 },
      mva: { jump: 4.53403414, pct: 15.1492, localJump: 5.18116492, localPct: 17.4257 },
      suicide: { jump: 1.79428959, pct: 15.3857, localJump: 1.56515106, localPct: 13.2914 }
    },
    fuzzy: {
      numerator: -97.757056,
      denominator: 0.277096,
      wald: -352.7912,
      ciLo: -3235.1543,
      ciHi: 1383.3578
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch16Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
