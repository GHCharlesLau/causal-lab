/* ============================================================
   Chapter 25 — synthetic DiD constants.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    att: { did: -27.349, sc: -19.5136, sdid: -15.6054 },
    timeWeights: [0, 0, 0, 0, 0, 0, 0.36647, 0.20645, 0.42708],
    se: {
      sdid: 9.912089736240311,
      sc: 11.2419349486209,
      sdidCi: [-31.960345299383516, 0.7495508302095111],
      scCi: [-38.06282242922302, -0.9644370987740523]
    },
    staggered: {
      california: -15.605397234587002,
      newStates: -17.249435402003648,
      combined: -16.701422679531433,
      weights: [12, 24]
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch25Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
