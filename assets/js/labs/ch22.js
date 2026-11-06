/* ============================================================
   Chapter 22 â€” raw vs residual scatter, and R-learner gain curves.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch22Data;
  var models = global.Ch22Models;
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
    return (value >= 0 ? '+' : '\u2212') + Math.abs(value).toFixed(digits == null ? 2 : digits);
  }

  function tickValues(min, max, count) {
    var step = (max - min) / count;
    var out = [];
    for (var i = 0; i <= count; i++) out.push(min + i * step);
    return out;
  }

  // ---------------------------------------------------------- residual scatter
  var resMount = doc.getElementById('ch22-res-chart');
  var resButtons = Array.prototype.slice.call(doc.querySelectorAll('#lab-residual .ch22-preset'));
  var resStatus = doc.getElementById('ch22-res-status');
  var resLabel = doc.getElementById('ch22-res-label');
  var resValue = doc.getElementById('ch22-res-value');
  var resNote = doc.getElementById('ch22-res-note');
  var resView = 'orth';

  function drawResidual() {
    if (!resMount) return;
    resMount.innerHTML = '';
    var raw = resView === 'raw';
    var xKey = raw ? 'price' : 'priceRes';
    var yKey = raw ? 'sales' : 'salesRes';
    var xs = data.scatter.map(function (row) { return row[xKey]; });
    var ys = data.scatter.map(function (row) { return row[yKey]; });
    var minX = Math.min.apply(null, xs);
    var maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys);
    var maxY = Math.max.apply(null, ys);
    var padX = (maxX - minX) * 0.08;
    var padY = (maxY - minY) * 0.1;
    minX -= padX; maxX += padX; minY -= padY; maxY += padY;

    var W = 640;
    var H = 310;
    var m = { l: 58, r: 30, t: 34, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, resMount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }
    function y(value) {
      return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH;
    }

    tickValues(minY, maxY, 4).forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch22-tick' }, svg);
      label.textContent = Math.round(tick);
    });
    tickValues(minX, maxX, 4).forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch22-tick' }, svg);
      label.textContent = tick.toFixed(1);
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch22-axis-title' }, svg);
    xTitle.textContent = raw ? 'price \u00b7 reais' : 'price residual';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'ch22-axis-title'
    }, svg);
    yTitle.textContent = raw ? 'sales \u00b7 units' : 'sales residual';

    data.scatter.forEach(function (row) {
      el('circle', {
        cx: x(row[xKey]), cy: y(row[yKey]), r: 2.1,
        class: 'ch22-dot' + (raw ? ' ch22-dot--raw' : '')
      }, svg);
    });

    var slope = raw ? data.rawSlope : data.residualSlope;
    var meanX = xs.reduce(function (sum, value) { return sum + value; }, 0) / xs.length;
    var meanY = ys.reduce(function (sum, value) { return sum + value; }, 0) / ys.length;
    var intercept = meanY - slope * meanX;
    el('line', {
      x1: x(minX), y1: y(intercept + slope * minX),
      x2: x(maxX), y2: y(intercept + slope * maxX),
      class: 'ch22-fit'
    }, svg);

    resStatus.textContent = (raw ? 'raw' : 'orthogonal') + ' \u00b7 ' + signed(slope, 2);
    resLabel.textContent = raw ? 'Raw slope' : 'Residual slope';
    resValue.textContent = signed(slope, 2);
    resNote.textContent = raw
      ? 'prices look pro-cyclical before controls.'
      : 'the sign flips once confounders are partialled out.';
    resButtons.forEach(function (button) {
      var on = button.getAttribute('data-view') === resView;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  resButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      resView = button.getAttribute('data-view');
      drawResidual();
    });
  });

  // ---------------------------------------------------------- gain curves
  var gainMount = doc.getElementById('ch22-gain-chart');
  var gainButtons = Array.prototype.slice.call(doc.querySelectorAll('#lab-gain .ch22-preset'));
  var gainStatus = doc.getElementById('ch22-gain-status');
  var gainLabel = doc.getElementById('ch22-gain-label');
  var gainValue = doc.getElementById('ch22-gain-value');
  var gainNote = doc.getElementById('ch22-gain-note');
  var rangeEl = doc.getElementById('ch22-cate-range');
  var gainModel = 'param';

  function drawGain() {
    if (!gainMount) return;
    gainMount.innerHTML = '';
    var W = 640;
    var H = 310;
    var m = { l: 56, r: 30, t: 36, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minY = -3;
    var maxY = 0.5;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, gainMount);

    function x(value) { return m.l + value * plotW; }
    function y(value) { return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH; }

    [-3, -2, -1, 0].forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch22-tick' }, svg);
      label.textContent = String(tick);
    });
    [0, 0.25, 0.5, 0.75, 1].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch22-tick' }, svg);
      label.textContent = Math.round(tick * 100) + '%';
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch22-axis-title' }, svg);
    xTitle.textContent = 'share of test days, ranked by CATE';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'ch22-axis-title'
    }, svg);
    yTitle.textContent = 'cumulative price slope';

    el('line', { x1: x(0), y1: y(0), x2: x(1), y2: y(data.testAte), class: 'ch22-baseline' }, svg);
    var baselineLabel = el('text', { x: x(1) - 4, y: y(data.testAte) - 8, 'text-anchor': 'end', class: 'ch22-legend' }, svg);
    baselineLabel.textContent = 'baseline';

    ['param', 'nonparam'].forEach(function (key) {
      var curve = data.curves[key];
      var points = curve.x.map(function (xv, i) {
        return x(xv) + ',' + y(curve.gain[i]);
      }).join(' ');
      el('polyline', {
        points: points,
        class: 'ch22-gain-curve ch22-gain-curve--' + key + (key === gainModel ? ' is-active' : '')
      }, svg);
    });

    el('line', { x1: m.l + 8, y1: 18, x2: m.l + 24, y2: 18, stroke: 'var(--red)', 'stroke-width': 2 }, svg);
    var legA = el('text', { x: m.l + 30, y: 21, class: 'ch22-legend' }, svg);
    legA.textContent = 'parametric';
    el('line', { x1: m.l + 124, y1: 18, x2: m.l + 140, y2: 18, stroke: 'var(--blue)', 'stroke-width': 2 }, svg);
    var legB = el('text', { x: m.l + 146, y: 21, class: 'ch22-legend' }, svg);
    legB.textContent = 'nonparametric';

    var cate = data.cate[gainModel];
    gainStatus.textContent = (gainModel === 'param' ? 'parametric' : 'nonparametric') + ' \u00b7 top 10%';
    gainLabel.textContent = gainModel === 'param' ? 'Parametric R-learner' : 'Nonparametric R-learner';
    gainValue.textContent = signed(data.top10[gainModel], 3);
    rangeEl.textContent = Math.round(cate.min) + ' / +' + cate.max.toFixed(0);
    gainNote.textContent = gainModel === 'param'
      ? 'the flexible model does not buy much here.'
      : 'a little worse at the top, but no linearity assumption.';
    gainButtons.forEach(function (button) {
      var on = button.getAttribute('data-model') === gainModel;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  gainButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      gainModel = button.getAttribute('data-model');
      drawGain();
    });
  });

  drawResidual();
  drawGain();
})(window);

