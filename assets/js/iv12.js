/* ============================================================
   Chapter 12 — the book's doubly robust estimates.
   ============================================================ */
(function (global) {
  'use strict';

  var api = {
    models: {
      both: {
        label: 'Both models correct',
        short: 'DR',
        coef: 0.3882212177,
        lo: 0.3536475272,
        hi: 0.4197844134,
        status: 'both models correct',
        note: 'the propensity model and the outcome model are both approximately right.'
      },
      wrongPs: {
        label: 'Wrong propensity model',
        short: 'wrong PS',
        coef: 0.3797369831,
        lo: 0.3380644331,
        hi: 0.4335673823,
        status: 'wrong propensity model',
        note: 'random propensity scores; the outcome model still carries the estimate.'
      },
      wrongOutcome: {
        label: 'Wrong outcome model',
        short: 'wrong Y',
        coef: 0.3981186404,
        lo: 0.3386382261,
        hi: 0.4331731646,
        status: 'wrong outcome model',
        note: 'random outcome predictions; the propensity model still carries the estimate.'
      },
      bothWrong: {
        label: 'Both models wrong',
        short: 'both wrong',
        coef: null,
        lo: null,
        hi: null,
        status: 'both models wrong',
        note: 'No guarantee. Doubly robust needs at least one of the two models to be right.'
      }
    },
    iptw: 0.38850648,
    n: 10391
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch12Models = api;
})(typeof window !== 'undefined' ? window : globalThis);
