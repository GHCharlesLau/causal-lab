/* ============================================================
   Chapter 18 — ATE and CATE sensitivity constants.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    n: 5000,
    nTrain: 3750,
    nTest: 1250,
    m1Price: -2.75146286,
    m2Price: -3.6299,
    m2Interaction: 0.0366,
    sensMin: -10.59687657,
    sensMax: 1.38923015,
    median: -0.00554727,
    slopes: { ate: -2.3402, low: -5.7347, high: 0.8845 },
    mlR2: 0.9124088322890126
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch18Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
