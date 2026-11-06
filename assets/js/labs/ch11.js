/* ============================================================
   Chapter 11 â€” score distribution, intervention-rate strip,
   and the four propensity estimates.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch11Data;
  var models = global.Ch11Models;
  var chart = doc.getElementById('ch11-score-chart');
  var estMount = doc.getElementById('ch11-est-chart');
  if (!data || !models || !chart || !estMount) return;

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

  function fmt(value, digits) {
    return value.toFixed(digits == null ? 3 : digits).replace('-', '\u2212');
  }

  function drawRates() {
    var mount = doc.getElementById('ch11-rates');
    if (!mount) return;
    mount.innerHTML = '';
    Object.keys(data.rates).sort(function (a, b) { return Number(a) - Number(b); }).forEach(function (key) {
      var rate = data.rates[key];
      var row = doc.createElement('div');
      row.className = 'rate-row';
      var label = doc.createElement('span');
      label.className = 'rate-label';
      label.textContent = 'expect ' + key;
      var track = doc.createElement('span');
      track.className = 'rate-track';
      var fill = doc.createElement('span');
      fill.className = 'rate-fill';
      fill.style.width = Math.max(4, (rate / 0.4) * 100).toFixed(1) + '%';
      track.appendChild(fill);
      var value = doc.createElement('span');
      value.className = 'rate-value';
      value.textContent = (rate * 100).toFixed(1) + '%';
      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(value);
      mount.appendChild(row);
    });
  }

  function drawScore() {
    chart.innerHTML = '';
    var W = 640;
    var H = 300;
    var m = { l: 44, r: 22, t: 34, b: 44 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var bins = 20;
    var minX = 0;
    var maxX = 1;
    var treated = new Array(bins).fill(0);
    var control = new Array(bins).fill(0);
    var binWidth = (maxX - minX) / bins;

    for (var i = 0; i < data.n; i++) {
      var index = Math.floor((data.ps[i] - minX) / binWidth);
      if (index < 0) index = 0;
      if (index >= bins) index = bins - 1;
      if (data.intervention[i] === 1) treated[index] += 1;
      else control[index] += 1;
    }
    var maxCount = 0;
    for (var j = 0; j < bins; j++) maxCount = Math.max(maxCount, treated[j] + control[j]);

    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, chart);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }
    function y(value) {
      return m.t + plotH - (value / maxCount) * plotH;
    }

    [0, 0.25, 0.5, 0.75, 1].forEach(function (tick) {
      el('line', {
        x1: x(tick), y1: m.t, x2: x(tick), y2: H - m.b,
        stroke: 'var(--rule)', 'stroke-width': 1
      }, svg);
      var label = el('text', {
        x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch11-tick'
      }, svg);
      label.textContent = tick.toFixed(2);
    });

    el('line', {
      x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b,
      stroke: 'var(--ink)', 'stroke-width': 1.2
    }, svg);
    el('line', {
      x1: m.l, y1: m.t, x2: m.l, y2: H - m.b,
      stroke: 'var(--ink)', 'stroke-width': 1.2
    }, svg);

    for (var b = 0; b < bins; b++) {
      var x0 = m.l + (b / bins) * plotW;
      var half = (plotW / bins) / 2;
      el('rect', {
        x: x0 + 0.5,
        y: y(treated[b]),
        width: Math.max(1, half - 1),
        height: Math.max(0, H - m.b - y(treated[b])),
        class: 'ps-bar-treated'
      }, svg);
      el('rect', {
        x: x0 + half + 0.5,
        y: y(control[b]),
        width: Math.max(1, half - 1),
        height: Math.max(0, H - m.b - y(control[b])),
        class: 'ps-bar-control'
      }, svg);
    }

    var maxTick = el('text', {
      x: m.l - 7, y: m.t + 3, 'text-anchor': 'end', class: 'ch11-tick'
    }, svg);
    maxTick.textContent = String(maxCount);

    el('line', { x1: m.l + 10, y1: 18, x2: m.l + 26, y2: 18, stroke: 'var(--red)', 'stroke-width': 7, opacity: '.55' }, svg);
    var legendA = el('text', { x: m.l + 32, y: 21, class: 'ps-legend' }, svg);
    legendA.textContent = 'treated';
    el('line', { x1: m.l + 120, y1: 18, x2: m.l + 136, y2: 18, stroke: 'var(--blue)', 'stroke-width': 7, opacity: '.5' }, svg);
    var legendB = el('text', { x: m.l + 142, y: 21, class: 'ps-legend' }, svg);
    legendB.textContent = 'control';

    var axisTitle = el('text', {
      x: m.l + plotW / 2, y: H - 4,
      'text-anchor': 'middle', class: 'ch11-axis-title'
    }, svg);
    axisTitle.textContent = 'estimated propensity score';

    doc.getElementById('ch11-score-mean').textContent = data.ps_treated_mean.toFixed(3);
    doc.getElementById('ch11-score-range').textContent =
      data.ps_min.toFixed(2) + ' \u2013 ' + data.ps_max.toFixed(2);
    doc.getElementById('ch11-score-treated').textContent = data.treated.toLocaleString('en-US');
    doc.getElementById('ch11-score-control').textContent = data.control.toLocaleString('en-US');
    doc.getElementById('ch11-score-note').textContent = 'both groups sit in the same score range.';
  }

  /* ---------------------------------------------------------- estimator chart */
  var current = 'iptw';
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('#lab-estimators .ch11-preset'));
  var estLabel = doc.getElementById('ch11-est-label');
  var estCoef = doc.getElementById('ch11-est-coef');
  var estCi = doc.getElementById('ch11-est-ci');
  var estStatus = doc.getElementById('ch11-est-status');
  var estNote = doc.getElementById('ch11-est-note');

  function drawEstimators() {
    estMount.innerHTML = '';
    var W = 640;
    var H = 310;
    var m = { l: 80, r: 24, t: 30, b: 46 };
    var plotW = W - m.l - m.r;
    var axisY = H - 42;
    var minX = 0.30;
    var maxX = 0.55;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, estMount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }

    [0.30, 0.35, 0.40, 0.45, 0.50, 0.55].forEach(function (tick) {
      el('line', {
        x1: x(tick), y1: m.t, x2: x(tick), y2: axisY,
        stroke: 'var(--rule)', 'stroke-width': 1
      }, svg);
      var label = el('text', {
        x: x(tick), y: axisY + 16, 'text-anchor': 'middle', class: 'ch11-tick'
      }, svg);
      label.textContent = tick.toFixed(2);
    });

    el('line', {
      x1: m.l, y1: axisY, x2: W - m.r, y2: axisY,
      stroke: 'var(--ink)', 'stroke-width': 1.2
    }, svg);

    ['naive', 'iptw', 'regression', 'matching'].forEach(function (key, i) {
      var model = models.models[key];
      var y = 54 + i * 55;
      var isCurrent = key === current;
      var group = el('g', { class: 'ch11-row' + (isCurrent ? ' is-current' : '') }, svg);
      var label = el('text', {
        x: m.l - 9, y: y + 4, 'text-anchor': 'end', class: 'ch11-row-label'
      }, group);
      label.textContent = model.short;

      el('line', {
        x1: x(model.lo), y1: y, x2: x(model.hi), y2: y, class: 'ch11-row-line'
      }, group);
      [model.lo, model.hi].forEach(function (edge) {
        el('line', {
          x1: x(edge), y1: y - 5, x2: x(edge), y2: y + 5, class: 'ch11-row-line'
        }, group);
      });
      el('circle', { cx: x(model.coef), cy: y, r: isCurrent ? 5 : 3.5, class: 'ch11-row-dot' }, group);
      var value = el('text', {
        x: x(model.coef), y: y - 11, 'text-anchor': 'middle', class: 'ch11-row-value'
      }, group);
      value.textContent = model.coef.toFixed(3);
    });

    var axisTitle = el('text', {
      x: m.l + plotW / 2, y: H - 4,
      'text-anchor': 'middle', class: 'ch11-axis-title'
    }, svg);
    axisTitle.textContent = 'achievement score \u00b7 95% CI';

    var model = models.models[current];
    estLabel.textContent = model.label;
    estCoef.textContent = model.coef.toFixed(4);
    estCi.textContent = '(' + model.lo.toFixed(4) + ', ' + model.hi.toFixed(4) + ')';
    estStatus.textContent = model.label + ' \u00b7 ' + model.coef.toFixed(4);
    estNote.textContent = model.note;
    buttons.forEach(function (button) {
      var on = button.getAttribute('data-model') === current;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      current = button.getAttribute('data-model');
      drawEstimators();
    });
  });

  drawRates();
  drawScore();
  drawEstimators();
})(window);

