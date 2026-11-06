/* ============================================================
   Chapter 04 â€” the three graph structures and their verdicts.
   Pure data + path logic; the renderer lives in labs/ch04.js.
   ============================================================ */
(function (global) {
  'use strict';

  var scenarios = {
    confounding: {
      id: 'confounding',
      label: 'Confounding',
      kicker: 'A common cause',
      title: 'Intelligence confounds education',
      nodes: [
        { id: 'I', label: 'Intelligence', x: 320, y: 72, role: 'confounder', conditionable: true },
        { id: 'E', label: 'Education', x: 150, y: 232, role: 'treatment', conditionable: false },
        { id: 'W', label: 'Wage', x: 490, y: 232, role: 'outcome', conditionable: false }
      ],
      edges: [['I', 'E'], ['I', 'W'], ['E', 'W']],
      paths: [
        { nodes: ['E', 'I', 'W'], label: 'E \u2190 I \u2192 W', kind: 'backdoor' }
      ],
      note: 'Education and wage share a cause. Comparing people with the same intelligence closes the backdoor.'
    },
    collider: {
      id: 'collider',
      label: 'Collider',
      kicker: 'A common effect',
      title: 'Investments is a collider',
      nodes: [
        { id: 'E', label: 'Education', x: 150, y: 72, role: 'treatment', conditionable: false },
        { id: 'W', label: 'Wage', x: 490, y: 72, role: 'outcome', conditionable: false },
        { id: 'I', label: 'Investments', x: 320, y: 240, role: 'collider', conditionable: true }
      ],
      edges: [['E', 'W'], ['E', 'I'], ['W', 'I']],
      paths: [
        { nodes: ['E', 'I', 'W'], label: 'E \u2192 I \u2190 W', kind: 'collider' }
      ],
      note: 'Education was randomised, so the comparison is clean. Conditioning on investments opens a path through a common effect.'
    },
    mediator: {
      id: 'mediator',
      label: 'Mediator',
      kicker: 'A channel',
      title: 'White-collar work carries the effect',
      nodes: [
        { id: 'E', label: 'Education', x: 110, y: 100, role: 'treatment', conditionable: false },
        { id: 'C', label: 'White-collar job', x: 320, y: 240, role: 'mediator', conditionable: true },
        { id: 'W', label: 'Wage', x: 530, y: 100, role: 'outcome', conditionable: false }
      ],
      edges: [['E', 'C'], ['C', 'W'], ['E', 'W']],
      paths: [
        { nodes: ['E', 'C', 'W'], label: 'E \u2192 C \u2192 W', kind: 'mediator' }
      ],
      note: 'The effect runs through white-collar work. Conditioning on the mediator closes the channel you are trying to measure.'
    }
  };

  function has(conditioned, id) {
    return !!(conditioned && conditioned[id]);
  }

  function evaluate(id, conditioned) {
    var s = scenarios[id];
    if (!s) return null;
    var results = s.paths.map(function (path) {
      if (path.kind === 'backdoor') {
        var open = !has(conditioned, 'I');
        return {
          label: path.label,
          kind: 'backdoor',
          open: open,
          text: open ? 'open \u00b7 confounding' : 'closed by intelligence'
        };
      }
      if (path.kind === 'collider') {
        var opened = has(conditioned, 'I');
        return {
          label: path.label,
          kind: 'collider',
          open: opened,
          text: opened ? 'opened by investments' : 'closed while investments is untouched'
        };
      }
      var blocked = has(conditioned, 'C');
      return {
        label: path.label,
        kind: 'mediator',
        open: !blocked,
        text: blocked ? 'blocked by white-collar job' : 'open \u00b7 the channel'
      };
    });

    if (id === 'confounding') {
      var closed = has(conditioned, 'I');
      return {
        id: id,
        status: closed ? 'ok' : 'bias',
        headline: closed ? 'Backdoor closed.' : 'Confounding bias.',
        body: closed
          ? 'Within levels of intelligence, education is as good as randomly assigned. The remaining difference is the effect.'
          : 'The path E \u2190 I \u2192 W is open. Education and wage differ for a reason other than education.',
        paths: results
      };
    }

    if (id === 'collider') {
      var opened = has(conditioned, 'I');
      return {
        id: id,
        status: opened ? 'bias' : 'ok',
        headline: opened ? 'Selection bias.' : 'No selection bias.',
        body: opened
          ? 'Conditioning on investments opens E \u2192 I \u2190 W. Among investors, education and wage become associated for a non-causal reason.'
          : 'The treatment was randomised and the collider is left alone. The comparison is clean; do not condition on investments.',
        paths: results
      };
    }

    var blocked = has(conditioned, 'C');
    return {
      id: id,
      status: blocked ? 'warn' : 'ok',
      headline: blocked ? 'Mediator blocked.' : 'Effect channel open.',
      body: blocked
        ? 'Conditioning on white-collar work closes part of the causal channel. The effect you estimate is not the total effect of education.'
        : 'The causal effect can flow through white-collar work. This is the channel you want to keep open when estimating the total effect.',
      paths: results
    };
  }

  global.CausalDag = {
    scenarios: scenarios,
    evaluate: evaluate
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.CausalDag;
})(typeof window !== 'undefined' ? window : globalThis);

