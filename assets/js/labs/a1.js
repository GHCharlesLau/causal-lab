/* ============================================================
   Technical note A1 — residual scatter and gain curves.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.A1Data;
  var models = global.A1Models;
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

  function ticks(min, max, count) {
    var out = [];
    var step = (max - min) / count;
    for (var i = 0; i <= count; i++) out.push(min + i * step);
    return out;
  }

  // ---------------------------------------------------------- residual scatter
  var mount = doc.getElementById('a1-chart');
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('#lab-residual .a1-preset'));
  var statusEl = doc.getElementById('a1-status');
  var labelEl = doc.getElementById('a1-label');
  var slopeEl = doc.getElementById('a1-slope');
  var corrEl = doc.getElementById('a1-corr');
  var noteEl = doc.getElementById('a1-note');
  var view = 'both';

  function draw() {
    if (!mount) return;
    mount.innerHTML = '';
    var raw = view === 'raw';
    var both = view === 'both';
    var xKey = raw ? 'price' : 'priceRes';
    var yKey = both ? 'salesRes' : 'sales';
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
    var m = { l: 58, r: 30, t: 36, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, mount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }
    function y(value) {
      return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH;
    }

    ticks(minY, maxY, 4).forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'a1-tick' }, svg);
      label.textContent = Math.round(tick);
    });
    ticks(minX, maxX, 4).forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'a1-tick' }, svg);
      label.textContent = tick.toFixed(1);
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'a1-axis-title' }, svg);
    xTitle.textContent = raw ? 'price \u00b7 reais' : 'price residual';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'a1-axis-title'
    }, svg);
    yTitle.textContent = both ? 'sales residual' : 'sales';

    data.scatter.forEach(function (row) {
      el('circle', {
        cx: x(row[xKey]), cy: y(row[yKey]), r: 2.1,
        class: 'a1-dot' + (raw ? ' a1-dot--raw' : '')
      }, svg);
    });

    var slope = view === 'raw' ? data.slope.raw : view === 'price' ? data.slope.priceRes : data.slope.both;
    var meanX = xs.reduce(function (sum, value) { return sum + value; }, 0) / xs.length;
    var meanY = ys.reduce(function (sum, value) { return sum + value; }, 0) / ys.length;
    var intercept = meanY - slope * meanX;
    el('line', {
      x1: x(minX), y1: y(intercept + slope * minX),
      x2: x(maxX), y2: y(intercept + slope * maxX),
      class: 'a1-fit'
    }, svg);

    statusEl.textContent = (raw ? 'raw' : view === 'price' ? 'price residual' : 'both residuals') + ' \u00b7 ' + signed(slope, 2);
    labelEl.textContent = raw ? 'Raw slope' : view === 'price' ? 'Price residual slope' : 'Both residuals';
    slopeEl.textContent = signed(slope, 2);
    corrEl.textContent = signed(data.corr.priceSales, 3);
    noteEl.textContent = raw
      ? 'the weekend cloud drives the positive slope.'
      : view === 'price'
        ? 'the treatment residual removes the weekend effect.'
        : 'the residuals make the negative relationship easy to see.';
    buttons.forEach(function (button) {
      var on = button.getAttribute('data-view') === view;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      view = button.getAttribute('data-view');
      draw();
    });
  });

  // ---------------------------------------------------------- gain curves
  var gainMount = doc.getElementById('a1-gain-chart');
  var gainButtons = Array.prototype.slice.call(doc.querySelectorAll('#lab-gain .a1-preset'));
  var gainStatus = doc.getElementById('a1-gain-status');
  var gainLabel = doc.getElementById('a1-gain-label');
  var gainValue = doc.getElementById('a1-gain-value');
  var gainTop = doc.getElementById('a1-gain-top');
  var gainNote = doc.getElementById('a1-gain-note');
  var sample = 'debiased';

  function drawGain() {
    if (!gainMount) return;
    gainMount.innerHTML = '';
    var W = 640;
    var H = 310;
    var m = { l: 56, r: 30, t: 36, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minY = -4.5;
    var maxY = 2.5;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, gainMount);

    function x(value) { return m.l + value * plotW; }
    function y(value) { return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH; }

    [-4, -3, -2, -1, 0, 1, 2].forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'a1-tick' }, svg);
      label.textContent = String(tick);
    });
    [0, 0.25, 0.5, 0.75, 1].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'a1-tick' }, svg);
      label.textContent = Math.round(tick * 100) + '%';
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'a1-axis-title' }, svg);
    xTitle.textContent = 'share of days, ranked by predicted elasticity';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'a1-axis-title'
    }, svg);
    yTitle.textContent = 'cumulative price slope';

    var curve = data.curves[sample];
    var endpoint = data.end[sample];
    el('line', { x1: x(0), y1: y(0), x2: x(1), y2: y(endpoint), class: 'a1-baseline' }, svg);
    var points = curve.x.map(function (xv, i) {
      return x(xv) + ',' + y(curve.gain[i]);
    }).join(' ');
    el('polyline', { points: points, class: 'a1-gain' }, svg);

    el('line', { x1: m.l + 8, y1: 18, x2: m.l + 24, y2: 18, stroke: 'var(--red)', 'stroke-width': 2 }, svg);
    var legA = el('text', { x: m.l + 30, y: 21, class: 'a1-legend' }, svg);
    legA.textContent = 'cumulative gain';
    el('line', { x1: m.l + 148, y1: 18, x2: m.l + 164, y2: 18, stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, svg);
    var legB = el('text', { x: m.l + 170, y: 21, class: 'a1-legend' }, svg);
    legB.textContent = 'endpoint';

    gainStatus.textContent = sample + ' \u00b7 ' + signed(endpoint, 2);
    gainLabel.textContent = sample === 'debiased' ? 'Debiased sample' : 'Raw sample';
    gainValue.textContent = signed(endpoint, 2);
    gainTop.textContent = signed(curve.gain[25], 2);
    gainNote.textContent = sample === 'debiased'
      ? 'the sign is negative, as economics predicts.'
      : 'the raw curve says raising prices raises sales.';
    gainButtons.forEach(function (button) {
      var on = button.getAttribute('data-sample') === sample;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  gainButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      sample = button.getAttribute('data-sample');
      drawGain();
    });
  });

  draw();
  drawGain();
})(window);
