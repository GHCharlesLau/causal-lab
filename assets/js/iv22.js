/* ============================================================
   Chapter 22 â€” orthogonal ML constants.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    nTrain: 10000,
    nTest: 5000,
    rawSlope: 1.229375,
    olsSlope: -4.00042915,
    residualSlope: -3.922826,
    testAte: -2.551626,
    top10: { param: 0.21982, nonparam: 0.20869 },
    cate: {
      param: { min: -12.22522, max: 0.52244, mean: -3.94734 },
      nonparam: { min: -15.9144, max: 3.52417, mean: -4.01116 }
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch22Models = api;
})(typeof window !== 'undefined' ? window : globalThis);

