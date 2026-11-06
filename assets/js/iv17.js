/* ============================================================
   Chapter 17 — prediction and policy constants.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    n: 10000,
    nTrain: 7000,
    nTest: 3000,
    trainMean: -29.16942857,
    testMean: -26.17533333,
    regionPolicy: 15.570667,
    modelPolicy: 16.6,
    trainR2: 0.7108790300152951,
    testR2: 0.6938513063048141,
    selectedRegions: 18
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch17Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
