/* ============================================================
   Chapter 13 — the billboard difference-in-differences.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    n: 4600,
    means: {
      flBefore: 171.64230769,
      flAfter: 206.1655,
      poaBefore: 46.016,
      poaAfter: 87.06375
    },
    counts: { flBefore: 1300, flAfter: 2000, poaBefore: 500, poaAfter: 800 },
    comparisons: {
      beforeAfter: {
        label: 'Before and after',
        short: 'before / after',
        value: 41.04775,
        formula: '87.06 \u2212 46.02',
        status: 'before / after \u00b7 +41.05',
        note: 'This assumes Porto Alegre would not have changed without the billboards.'
      },
      crossSection: {
        label: 'After, cross-section',
        short: 'after only',
        value: -119.10175,
        formula: '87.06 \u2212 206.17',
        status: 'after only \u00b7 \u2212119.10',
        note: 'This assumes Porto Alegre and Florianopolis have the same level.'
      },
      did: {
        label: 'Difference in differences',
        short: 'DiD',
        value: 6.52455769,
        formula: '(87.06 \u2212 46.02) \u2212 (206.17 \u2212 171.64)',
        status: 'DiD \u00b7 +6.52',
        note: 'This assumes the two cities would have followed parallel trends.'
      }
    },
    ols: {
      interaction: 6.52455769,
      se: 5.72852129,
      lo: -4.706,
      hi: 17.755,
      p: 0.255
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch13Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
