/* ============================================================
   The course manifest.
   One source of truth for the landing page, the chapter shell,
   and the course map. Add a chapter here, then build its page.
   ============================================================ */
(function (global) {
  'use strict';

  var parts = [
    {
      id: 'part-1',
      kicker: 'Part I &middot; The Yang',
      title: 'Identification',
      blurb: 'The core moves: potential outcomes, experiments, graphs, regression, instruments, matching, and the designs that make a comparison defensible.',
      chapters: [
        { num: '01', slug: '01-introduction', title: 'Introduction to causality', short: 'The two roads', deck: 'You can only take one road. Causal inference is the discipline of reasoning about the other.', status: 'live' },
        { num: '02', slug: '02-randomised-experiments', title: 'Randomised experiments', short: 'The coin decides', deck: 'When assignment is random, the difference in means becomes an estimate of the effect.', status: 'live' },
        { num: '03', slug: '03-stats-review', title: 'Stats review', short: 'The most dangerous equation', deck: 'Sampling, standard errors, and why small samples tell big lies.', status: 'live' },
        { num: '04', slug: '04-graphical-causal-models', title: 'Graphical causal models', short: 'Draw the assumptions', deck: 'Pictures that make confounding, mediation, and colliders visible.', status: 'live' },
        { num: '05', slug: '05-linear-regression', title: 'Linear regression', short: 'The unreasonable effectiveness', deck: 'Regression as a conditional expectation, a weighting device, and a bias machine.', status: 'live' },
        { num: '06', slug: '06-grouped-regression', title: 'Grouped and dummy regression', short: 'Compare within groups', deck: 'Dummy variables, fixed effects, and the difference between between and within.', status: 'live' },
        { num: '07', slug: '07-beyond-confounders', title: 'Beyond confounders', short: 'Bad controls', deck: 'Mediators and colliders: when adding a variable makes the estimate worse.', status: 'live' },
        { num: '08', slug: '08-instrumental-variables', title: 'Instrumental variables', short: 'A nudge from outside', deck: 'When treatment is chosen, an external nudge can isolate the compliers.', status: 'live' },
        { num: '09', slug: '09-non-compliance', title: 'Non-compliance and LATE', short: 'Who actually takes it', deck: 'Encouragement, take-up, and the local average treatment effect.', status: 'live' },
        { num: '10', slug: '10-matching', title: 'Matching', short: 'Find the twin', deck: 'Compare like with like, then measure the bias that survives the match.', status: 'live' },
        { num: '11', slug: '11-propensity-score', title: 'Propensity score', short: 'The probability of treatment', deck: 'Collapse many confounders into one balancing score.', status: 'live' },
        { num: '12', slug: '12-doubly-robust', title: 'Doubly robust estimation', short: 'Two chances to be right', deck: 'Combine an outcome model and a treatment model; get it right if either is.', status: 'live' },
        { num: '13', slug: '13-difference-in-differences', title: 'Difference-in-differences', short: 'Parallel worlds', deck: 'Use a comparison group to difference out the trend.', status: 'live' },
        { num: '14', slug: '14-panel-fixed-effects', title: 'Panel data and fixed effects', short: 'Each unit as its own control', deck: 'Within-unit variation, time dummies, and the assumptions that remain.', status: 'live' },
        { num: '15', slug: '15-synthetic-control', title: 'Synthetic control', short: 'Build a counterfactual', deck: 'Weight a donor pool into the comparison you wish you had.', status: 'live' },
        { num: '16', slug: '16-regression-discontinuity', title: 'Regression discontinuity', short: 'At the cutoff', deck: 'A rule creates a local experiment; estimate the jump at the line.', status: 'live' }
      ]
    },
    {
      id: 'part-2',
      kicker: 'Part II &middot; The Yin',
      title: 'Heterogeneity',
      blurb: 'Modern tools for a different question: not just whether it works, but for whom, and how to learn that without fooling yourself.',
      chapters: [
        { num: '17', slug: '17-predictive-models', title: 'Predictive models 101', short: 'Prediction is not causation', deck: 'What machine learning is good at, and where the causal question breaks it.', status: 'live' },
        { num: '18', slug: '18-heterogeneous-effects', title: 'Heterogeneous effects', short: 'Who benefits?', deck: 'From one average effect to a function of the people in front of you.', status: 'live' },
        { num: '19', slug: '19-evaluating-causal-models', title: 'Evaluating causal models', short: 'Test the claim', deck: 'Why predictive accuracy is the wrong report card for a causal model.', status: 'planned' },
        { num: '20', slug: '20-plug-and-play', title: 'Plug-and-play estimators', short: 'Models as components', deck: 'Outcome models, treatment models, and the estimators built from them.', status: 'planned' },
        { num: '21', slug: '21-meta-learners', title: 'Meta learners', short: 'Learn the effect', deck: 'S-, T-, X-, and R-learners: different ways to target the effect, not the outcome.', status: 'planned' },
        { num: '22', slug: '22-orthogonal-ml', title: 'Debiased machine learning', short: 'Orthogonalize the nuisance', deck: 'Neyman orthogonality and cross-fitting, without the hand-waving.', status: 'planned' },
        { num: '23', slug: '23-heterogeneity-nonlinearity', title: 'Heterogeneity and nonlinearity', short: 'When linearity lies', deck: 'The failure modes that survive a clever learner.', status: 'planned' },
        { num: '24', slug: '24-did-saga', title: 'The difference-in-differences saga', short: 'Many periods, many choices', deck: 'Staggered adoption, negative weights, and the estimators that fix them.', status: 'planned' },
        { num: '25', slug: '25-synthetic-did', title: 'Synthetic difference-in-differences', short: 'Weights that balance', deck: 'Combine synthetic control and DiD into one weighted design.', status: 'planned' }
      ]
    },
    {
      id: 'appendix',
      kicker: 'Appendix',
      title: 'Technical notes',
      blurb: 'The derivations and warnings that did not fit in the main line.',
      chapters: [
        { num: 'A1', slug: 'a1-debiasing-orthogonalization', title: 'Debiasing with orthogonalization', short: 'The algebra', deck: 'A compact derivation of the orthogonal moment.', status: 'planned' },
        { num: 'A2', slug: 'a2-debiasing-propensity-score', title: 'Debiasing with propensity score', short: 'The score as a device', deck: 'Why balancing on the score is enough.', status: 'planned' },
        { num: 'A3', slug: 'a3-when-prediction-fails', title: 'When prediction fails', short: 'The limits', deck: 'Distribution shift, overlap, and the predictions that cannot save you.', status: 'planned' },
        { num: 'A4', slug: 'a4-prediction-metrics', title: 'Prediction metrics are dangerous', short: 'The wrong scoreboard', deck: 'Why a better predictor can be a worse causal estimator.', status: 'planned' },
        { num: 'A5', slug: 'a5-conformal-synthetic-control', title: 'Conformal inference for synthetic control', short: 'Uncertainty, honestly', deck: 'A distribution-free interval for a synthetic control estimate.', status: 'planned' }
      ]
    }
  ];

  var flat = [];
  parts.forEach(function (part) {
    part.chapters.forEach(function (chapter) {
      chapter.part = part;
      chapter.href = 'chapters/' + chapter.slug + '.html';
      chapter.status = chapter.status === 'live' ? 'live' : 'planned';
      flat.push(chapter);
    });
  });

  global.CAUSAL_PARTS = parts;
  global.CAUSAL_CHAPTERS = flat;
  global.CAUSAL_BY_SLUG = {};
  flat.forEach(function (chapter) { global.CAUSAL_BY_SLUG[chapter.slug] = chapter; });
})(window);
