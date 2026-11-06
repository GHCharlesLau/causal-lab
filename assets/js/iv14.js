/* ============================================================
   Chapter 14 — wage panel and the book's toy fixed effects.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    n: 4360,
    entities: 545,
    years: 8,
    toy: {
      pooledSlope: -0.55834642,
      feSlope: 1.44137931
    },
    models: {
      pooled: {
        label: 'Pooled OLS',
        short: 'pooled',
        coef: 0.14102805,
        se: 0.0157906,
        lo: 0.110,
        hi: 0.172,
        status: 'pooled \u00b7 +14.1%',
        note: 'controls education, race, and ethnicity, but not the person.'
      },
      entity: {
        label: 'Entity fixed effects',
        short: 'entity FE',
        coef: 0.1146543,
        se: 0.0219791,
        lo: 0.0716,
        hi: 0.1577,
        status: 'entity FE \u00b7 +11.5%',
        note: 'within-person: stable beauty, intelligence, and background are absorbed.'
      },
      twoway: {
        label: 'Entity + time effects',
        short: 'two-way FE',
        coef: 0.04762345,
        se: 0.0177,
        lo: 0.0129,
        hi: 0.0823,
        status: 'two-way FE \u00b7 +4.8%',
        note: 'also removes common shocks such as inflation and the business cycle.'
      }
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch14Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
