/* ============================================================
   Technical note A2 â€” balance bars and positivity histograms.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.A2Data;
  var models = global.A2Models;
  if (!data || !models) return;

  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, parent) {
    var node = doc.createElementNS(NS, name);
    if (attrs) {
      for (var key in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, key)) node.setAttribute(key, attrs[key]);
      }
    }
    if (parent) parent.appendChild(node);
    return node;
  }

  function signed(value, digits) {
    return (value >= 0 ? '+' : '\u2212') + Math.abs(value).toFixed(digits == null ? 3 : digits);
  }

  // ---------------------------------------------------------- balance
  var chart = doc.getElementById('a2-chart');
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('#lab-balance .a2-preset'));
  var statusEl = doc.getElementById('a2-status');
  var labelEl = doc.getElementById('a2-label');
  var maxEl = doc.getElementById('a2-max');
  var incomeEl = doc.getElementById('a2-income');
  var noteEl = doc.getElementById('a2-note');
  var view = 'weighted';
  var names = { age: 'age', income: 'income', insurance: 'insurance', invested: 'invested' };

  function drawBalance() {
    if (!chart) return;
    chart.innerHTML = '';
    var W = 640;
    var H = 300;
    var m = { l: 92, r: 30, t: 36, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minX = -0.35;
    var maxX = 0.15;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, chart);

    function x(value) { return m.l + ((value - minX) / (maxX - minX)) * plotW; }

    [-0.3, -0.2, -0.1, 0, 0.1].forEach(function (tick) {
      el('line', { x1: x(tick), y1: m.t, x2: x(tick), y2: H - m.b, stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'a2-tick' }, svg);
      label.textContent = tick.toFixed(1);
    });
    el('line', { x1: x(0), y1: m.t, x2: x(0), y2: H - m.b, stroke: 'var(--ink-2)', 'stroke-width': 1.2 }, svg);

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'a2-axis-title' }, svg);
    xTitle.textContent = 'correlation with email 1';

    var keys = Object.keys(names);
    var rowH = plotH / keys.length;
    keys.forEach(function (key, index) {
      var y = m.t + index * rowH + rowH / 2;
      var label = el('text', { x: m.l - 8, y: y + 4, 'text-anchor': 'end', class: 'a2-label' }, svg);
      label.textContent = names[key];
      var raw = data.corr.raw[key];
      var weighted = data.corr.weighted[key];
      var barH = rowH * 0.28;
      el('rect', {
        x: x(Math.min(0, raw)),
        y: y - barH - 2,
        width: Math.abs(x(raw) - x(0)),
        height: barH,
        class: 'a2-bar--raw a2-bar'
      }, svg);
      el('rect', {
        x: x(Math.min(0, weighted)),
        y: y + 2,
        width: Math.abs(x(weighted) - x(0)),
        height: barH,
        class: 'a2-bar'
      }, svg);
    });

    el('rect', { x: m.l + 8, y: 14, width: 10, height: 10, class: 'a2-bar--raw a2-bar' }, svg);
    var legA = el('text', { x: m.l + 24, y: 23, class: 'a2-legend' }, svg);
    legA.textContent = 'raw';
    el('rect', { x: m.l + 82, y: 14, width: 10, height: 10, class: 'a2-bar' }, svg);
    var legB = el('text', { x: m.l + 98, y: 23, class: 'a2-legend' }, svg);
    legB.textContent = 'weighted';

    var selected = data.corr[view];
    var maxAbs = Math.max.apply(null, Object.keys(selected).map(function (key) { return Math.abs(selected[key]); }));
    statusEl.textContent = view + ' \u00b7 max ' + maxAbs.toFixed(3);
    labelEl.textContent = view === 'raw' ? 'Raw correlations' : 'Weighted correlations';
    maxEl.textContent = maxAbs.toFixed(3);
    incomeEl.textContent = signed(selected.income, 3);
    noteEl.textContent = view === 'raw'
      ? 'income and invested are strongly related to treatment.'
      : 'income is balanced; the raw bias is gone.';
    buttons.forEach(function (button) {
      var on = button.getAttribute('data-view') === view;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      view = button.getAttribute('data-view');
      drawBalance();
    });
  });

  // ---------------------------------------------------------- positivity
  var posChart = doc.getElementById('a2-pos-chart');
  var posButtons = Array.prototype.slice.call(doc.querySelectorAll('#lab-positivity .a2-preset'));
  var posStatus = doc.getElementById('a2-pos-status');
  var posLabel = doc.getElementById('a2-pos-label');
  var posMax = doc.getElementById('a2-pos-max');
  var posZero = doc.getElementById('a2-pos-zero');
  var posTreated = doc.getElementById('a2-pos-treated');
  var posControl = doc.getElementById('a2-pos-control');
  var posNote = doc.getElementById('a2-pos-note');
  var emailKey = 'em1';

  function drawPositivity() {
    if (!posChart) return;
    posChart.innerHTML = '';
    var hist = data.ps[emailKey];
    var W = 640;
    var H = 300;
    var m = { l: 50, r: 30, t: 36, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var maxCount = Math.max.apply(null, hist.treated.concat(hist.control));
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, posChart);

    function x(value) { return m.l + value * plotW; }
    function y(value) { return m.t + plotH - (value / maxCount) * plotH; }

    [0, 0.25, 0.5, 0.75, 1].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'a2-tick' }, svg);
      label.textContent = tick.toFixed(2);
    });
    [0, Math.round(maxCount / 2), maxCount].forEach(function (tick) {
      var label = el('text', { x: m.l - 7, y: y(tick) + 3, 'text-anchor': 'end', class: 'a2-tick' }, svg);
      label.textContent = String(tick);
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'a2-axis-title' }, svg);
    xTitle.textContent = 'propensity score';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'a2-axis-title'
    }, svg);
    yTitle.textContent = 'customers';

    var binW = plotW / hist.treated.length;
    hist.treated.forEach(function (count, index) {
      el('rect', {
        x: m.l + index * binW,
        y: y(count),
        width: binW * 0.9,
        height: (count / maxCount) * plotH,
        class: 'a2-hist'
      }, svg);
    });
    hist.control.forEach(function (count, index) {
      el('rect', {
        x: m.l + index * binW,
        y: y(count),
        width: binW * 0.9,
        height: (count / maxCount) * plotH,
        class: 'a2-hist a2-hist--control'
      }, svg);
    });

    el('rect', { x: m.l + 8, y: 14, width: 10, height: 10, class: 'a2-hist' }, svg);
    var legA = el('text', { x: m.l + 24, y: 23, class: 'a2-legend' }, svg);
    legA.textContent = 'treated';
    el('rect', { x: m.l + 94, y: 14, width: 10, height: 10, class: 'a2-hist a2-hist--control' }, svg);
    var legB = el('text', { x: m.l + 110, y: 23, class: 'a2-legend' }, svg);
    legB.textContent = 'control';

    var totals = hist.treated.reduce(function (a, b) { return a + b; }, 0);
    var controls = hist.control.reduce(function (a, b) { return a + b; }, 0);
    var maxScore = emailKey === 'em1' ? 0.9136 : 0.9992;
    var zeroUnits = emailKey === 'em1' ? 0 : 1537;
    posStatus.textContent = emailKey === 'em1' ? 'email 1 \u00b7 good overlap' : 'email 3 \u00b7 no overlap under 0.4';
    posLabel.textContent = emailKey === 'em1' ? 'Email 1' : 'Email 3';
    posMax.textContent = maxScore.toFixed(3);
    posZero.textContent = String(zeroUnits);
    posTreated.textContent = totals.toLocaleString('en-US');
    posControl.textContent = controls.toLocaleString('en-US');
    posNote.textContent = emailKey === 'em1'
      ? 'both groups span the score range.'
      : 'the treated are old; the young have no counterfactual.';
    posButtons.forEach(function (button) {
      var on = button.getAttribute('data-email') === emailKey;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  posButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      emailKey = button.getAttribute('data-email');
      drawPositivity();
    });
  });

  drawBalance();
  drawPositivity();
})(window);

