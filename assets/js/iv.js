/* ============================================================
   Chapter 08 — the book's quarter-of-birth estimates.
   ============================================================ */
(function (global) {
  'use strict';

  var models = {
    q4: {
      label: '2SLS with q4',
      short: 'q4',
      coef: 0.0853028649,
      se: 0.0255408128,
      lo: 0.03524287,
      hi: 0.13536286,
      first: 0.1008580927,
      reduced: 0.0086034843,
      note: 'the exclusion restriction is an argument, not a test.'
    },
    many: {
      label: '2SLS with q1–q3',
      short: 'q1–q3',
      coef: 0.1076937049,
      se: 0.0195571490,
      lo: 0.06936169,
      hi: 0.14602572,
      first: null,
      reduced: null,
      note: 'more instruments sharpen the estimate and widen the assumptions.'
    },
    ols: {
      label: 'OLS comparison',
      short: 'OLS',
      coef: 0.0673257282,
      se: 0.0003883998,
      lo: 0.06656446,
      hi: 0.06808699,
      first: null,
      reduced: null,
      note: 'much more precise, and still confounded by ability.'
    }
  };

  var api = {
    models: models,
    firstStage: 0.1008580927,
    reducedForm: 0.0086034843,
    ratio: 0.0086034843 / 0.1008580927
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch08Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
