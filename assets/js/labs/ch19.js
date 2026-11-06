/* ============================================================
   Chapter 19 â€” cumulative gain and sensitivity bands.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch19Data;
  var models = global.Ch19Models;
  var gainMount = doc.getElementById('ch19-gain-chart');
  var bandMount = doc.getElementById('ch19-bands');
  if (!data || !models || !gainMount) return;

  var NS = 'http://www.w3.org/2000/svg';
  var current = 'causal';
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('#lab-gain .ch19-preset'));
  var statusEl = doc.getElementById('ch19-status');
  var labelEl = doc.getElementById('ch19-label');
  var gainEl = doc.getElementById('ch19-gain-value');
  var ateEl = doc.getElementById('ch19-ate');
  var noteEl = doc.getElementById('ch19-note');

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
    var text = Math.abs(value).toFixed(digits == null ? 2 : digits);
    return (value >= 0 ? '+' : '\u2212') + text;
  }

  function drawGain() {
    gainMount.innerHTML = '';
    var W = 640;
    var H = 320;
    var m = { l: 56, r: 30, t: 38, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minY = -3;
    var maxY = 0.5;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, gainMount);

    function x(value) {
      return m.l + value * plotW;
    }
    function y(value) {
      return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH;
    }

    [-3, -2, -1, 0].forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch19-tick' }, svg);
      label.textContent = String(tick);
    });
    [0, 0.25, 0.5, 0.75, 1].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch19-tick' }, svg);
      label.textContent = Math.round(tick * 100) + '%';
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch19-axis-title' }, svg);
    xTitle.textContent = 'share of days, ranked by the model';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'ch19-axis-title'
    }, svg);
    yTitle.textContent = 'cumulative gain';

    el('line', {
      x1: x(0), y1: y(0), x2: x(1), y2: y(data.ate),
      class: 'gain-random-line'
    }, svg);
    var randomLabel = el('text', {
      x: x(1) - 4, y: y(data.ate) - 8, 'text-anchor': 'end', class: 'gain-legend'
    }, svg);
    randomLabel.textContent = 'random benchmark';

    ['causal', 'predictive', 'random'].forEach(function (key) {
      var curve = data.curves[key];
      var points = curve.x.map(function (xv, i) {
        return x(xv) + ',' + y(curve.gain[i]);
      }).join(' ');
      el('polyline', {
        points: points,
        class: 'gain-curve gain-curve--' + key + (key === current ? ' is-active' : '')
      }, svg);
    });

    el('line', { x1: x(0.25), y1: m.t, x2: x(0.25), y2: H - m.b, stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '2 3' }, svg);
    var quarter = el('text', { x: x(0.25) + 4, y: m.t + 10, class: 'ch19-tick' }, svg);
    quarter.textContent = 'top 25%';

    el('line', { x1: m.l + 8, y1: 20, x2: m.l + 24, y2: 20, stroke: 'var(--red)', 'stroke-width': 2 }, svg);
    var legA = el('text', { x: m.l + 30, y: 23, class: 'gain-legend' }, svg);
    legA.textContent = 'causal';
    el('line', { x1: m.l + 96, y1: 20, x2: m.l + 112, y2: 20, stroke: 'var(--blue)', 'stroke-width': 2 }, svg);
    var legB = el('text', { x: m.l + 118, y: 23, class: 'gain-legend' }, svg);
    legB.textContent = 'pred';
    el('line', { x1: m.l + 218, y1: 20, x2: m.l + 234, y2: 20, stroke: '#6f6a60', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, svg);
    var legC = el('text', { x: m.l + 240, y: 23, class: 'gain-legend' }, svg);
    legC.textContent = 'random';
    var model = models.models[current];
    statusEl.textContent = current + ' \u00b7 top 25%';
    labelEl.textContent = model.label;
    gainEl.textContent = signed(data.topGain[current], 3);
    ateEl.textContent = signed(data.ate, 3);
    noteEl.textContent = model.note;
    buttons.forEach(function (button) {
      var on = button.getAttribute('data-model') === current;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      current = button.getAttribute('data-model');
      drawGain();
    });
  });

  function drawBands() {
    if (!bandMount) return;
    bandMount.innerHTML = '';
    var W = 640;
    var H = 260;
    var m = { l: 52, r: 30, t: 34, b: 44 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minY = -13;
    var maxY = 6;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, bandMount);

    function x(value) {
      return m.l + ((value - 1) / 9) * plotW;
    }
    function y(value) {
      return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH;
    }

    [-12, -8, -4, 0, 4].forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch19-tick' }, svg);
      label.textContent = String(tick);
    });
    [1, 2, 4, 6, 8, 10].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch19-tick' }, svg);
      label.textContent = String(tick);
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var axisTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch19-axis-title' }, svg);
    axisTitle.textContent = 'prediction band \u00b7 1 = most sensitive';

    ['causal', 'predictive', 'random'].forEach(function (key) {
      var values = data.bands[key];
      var points = values.map(function (value, i) {
        return x(i + 1) + ',' + y(value);
      }).join(' ');
      el('polyline', { points: points, class: 'band-line band-line--' + key }, svg);
      values.forEach(function (value, i) {
        el('circle', { cx: x(i + 1), cy: y(value), r: 2.5, class: 'band-dot--' + key }, svg);
      });
    });

    el('line', { x1: m.l + 8, y1: 18, x2: m.l + 24, y2: 18, stroke: 'var(--red)', 'stroke-width': 2 }, svg);
    var legA = el('text', { x: m.l + 30, y: 21, class: 'gain-legend' }, svg);
    legA.textContent = 'causal';
    el('line', { x1: m.l + 96, y1: 18, x2: m.l + 112, y2: 18, stroke: 'var(--blue)', 'stroke-width': 2 }, svg);
    var legB = el('text', { x: m.l + 118, y: 21, class: 'gain-legend' }, svg);
    legB.textContent = 'pred';
    el('line', { x1: m.l + 198, y1: 18, x2: m.l + 214, y2: 18, stroke: '#6f6a60', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, svg);
    var legC = el('text', { x: m.l + 220, y: 21, class: 'gain-legend' }, svg);
    legC.textContent = 'random';
  }

  drawGain();
  drawBands();
})(window);


