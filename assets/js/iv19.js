/* ============================================================
   Chapter 19 — evaluation constants.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    n: 5000,
    ate: -2.551626,
    r2: { train: 0.92517048, test: 0.77110742 },
    topGain: { causal: -0.26322, predictive: -1.194, random: -0.69249 },
    models: {
      causal: { label: 'Causal model', note: 'the curve separates from the random line.' },
      predictive: { label: 'Predictive model', note: 'a strong sales forecast, not a sensitivity ranking.' },
      random: { label: 'Random model', note: 'a placebo: it should hug the diagonal.' }
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch19Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
