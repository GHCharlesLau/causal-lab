/* ============================================================
   Chapter 23 — cumulative effect and price-range charts.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch23Data;
  var models = global.Ch23Models;
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

  // ---------------------------------------------------------- binary curves
  var chart = doc.getElementById('ch23-chart');
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('#lab-binary .ch23-preset'));
  var statusEl = doc.getElementById('ch23-status');
  var labelEl = doc.getElementById('ch23-label');
  var ateEl = doc.getElementById('ch23-ate');
  var topEl = doc.getElementById('ch23-top');
  var baseEl = doc.getElementById('ch23-base');
  var noteEl = doc.getElementById('ch23-note');
  var current = 'conversion';

  var views = {
    latent: {
      label: 'Effect on latent outcome',
      status: 'latent \u00b7 continuous',
      base: 'mean 0.20',
      maxY: 3,
      note: 'age is the modifier; income is flat.'
    },
    conversion: {
      label: 'Effect on conversion',
      status: 'conversion \u00b7 50%',
      base: '51.8%',
      maxY: 0.8,
      note: 'income looks heterogeneous; the latent effect is not.'
    },
    low: {
      label: 'Effect on conversion',
      status: 'conversion \u00b7 low',
      base: '12.1%',
      maxY: 0.4,
      note: 'at a low base, high baseline converts better.'
    },
    high: {
      label: 'Effect on conversion',
      status: 'conversion \u00b7 high',
      base: '92.8%',
      maxY: 0.3,
      note: 'at a high base, high baseline has no room left.'
    }
  };

  function draw() {
    if (!chart) return;
    chart.innerHTML = '';
    var view = views[current];
    var ageCurve = data.curves[current].age;
    var incomeCurve = data.curves[current].income;
    var W = 640;
    var H = 300;
    var m = { l: 56, r: 30, t: 36, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minY = 0;
    var maxY = view.maxY;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, chart);

    function x(value) { return m.l + (value / 100) * plotW; }
    function y(value) { return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH; }

    tickValues(minY, maxY, 4).forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch23-tick' }, svg);
      label.textContent = tick.toFixed(2);
    });
    [0, 25, 50, 75, 100].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch23-tick' }, svg);
      label.textContent = tick + '%';
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch23-axis-title' }, svg);
    xTitle.textContent = 'top share of customers, ranked by the feature';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'ch23-axis-title'
    }, svg);
    yTitle.textContent = 'treatment effect';

    var ate = data.ate[current];
    el('line', { x1: m.l, y1: y(ate), x2: W - m.r, y2: y(ate), class: 'ch23-baseline' }, svg);
    var ateLabel = el('text', { x: W - m.r - 4, y: y(ate) - 7, 'text-anchor': 'end', class: 'ch23-legend' }, svg);
    ateLabel.textContent = 'ATE';

    [['age', ageCurve], ['income', incomeCurve]].forEach(function (entry) {
      var key = entry[0];
      var curve = entry[1];
      var points = curve.x.map(function (xv, i) {
        return x(xv) + ',' + y(curve.effect[i]);
      }).join(' ');
      el('polyline', { points: points, class: 'ch23-line ch23-line--' + key }, svg);
    });

    el('line', { x1: m.l + 8, y1: 18, x2: m.l + 24, y2: 18, stroke: 'var(--red)', 'stroke-width': 2 }, svg);
    var legA = el('text', { x: m.l + 30, y: 21, class: 'ch23-legend' }, svg);
    legA.textContent = 'age';
    el('line', { x1: m.l + 82, y1: 18, x2: m.l + 98, y2: 18, stroke: 'var(--blue)', 'stroke-width': 2 }, svg);
    var legB = el('text', { x: m.l + 104, y: 21, class: 'ch23-legend' }, svg);
    legB.textContent = 'income';

    var index = Math.min(10, ageCurve.effect.length - 1);
    statusEl.textContent = view.status;
    labelEl.textContent = view.label;
    ateEl.textContent = signed(ate, 3);
    topEl.textContent = 'age ' + signed(ageCurve.effect[index], 2) + ' \u00b7 income ' + signed(incomeCurve.effect[index], 2);
    baseEl.textContent = view.base;
    noteEl.textContent = view.note;
    buttons.forEach(function (button) {
      var on = button.getAttribute('data-view') === current;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      current = button.getAttribute('data-view');
      draw();
    });
  });

  // ---------------------------------------------------------- pricing
  var priceMount = doc.getElementById('ch23-price-chart');
  var priceButtons = Array.prototype.slice.call(doc.querySelectorAll('#lab-price .ch23-preset'));
  var priceStatus = doc.getElementById('ch23-price-status');
  var bInc = doc.getElementById('ch23-b-increment');
  var aInc = doc.getElementById('ch23-a-increment');
  var rangeEl = doc.getElementById('ch23-range');
  var priceNote = doc.getElementById('ch23-price-note');
  var rangeView = 'full';

  function drawPrice() {
    if (!priceMount) return;
    priceMount.innerHTML = '';
    var pricing = data.pricing;
    var W = 640;
    var H = 300;
    var m = { l: 62, r: 30, t: 36, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minX = 4;
    var maxX = 21;
    var minY = 2900;
    var maxY = 5500;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, priceMount);

    function x(value) { return m.l + ((value - minX) / (maxX - minX)) * plotW; }
    function y(value) { return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH; }

    [3000, 4000, 5000].forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch23-tick' }, svg);
      label.textContent = String(tick);
    });
    [5, 10, 15, 20].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch23-tick' }, svg);
      label.textContent = tick;
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch23-axis-title' }, svg);
    xTitle.textContent = 'monthly price \u00b7 BRL';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'ch23-axis-title'
    }, svg);
    yTitle.textContent = 'avg. sales';

    var prices = pricing.price;
    var aValues = pricing.a;
    var bValues = pricing.b;
    if (rangeView === 'truncated') {
      bValues = bValues.slice(0, 2);
    }

    function line(values, key) {
      var points = values.map(function (value, i) {
        return x(prices[i]) + ',' + y(value);
      }).join(' ');
      el('polyline', { points: points, class: 'ch23-line ch23-line--' + key }, svg);
      values.forEach(function (value, i) {
        el('circle', { cx: x(prices[i]), cy: y(value), r: 2.6, fill: key === 'a' ? 'var(--red)' : 'var(--blue)' }, svg);
      });
    }

    line(aValues, 'a');
    line(bValues, 'b');

    el('line', { x1: m.l + 8, y1: 18, x2: m.l + 24, y2: 18, stroke: 'var(--red)', 'stroke-width': 2 }, svg);
    var legA = el('text', { x: m.l + 30, y: 21, class: 'ch23-legend' }, svg);
    legA.textContent = 'segment A';
    el('line', { x1: m.l + 124, y1: 18, x2: m.l + 140, y2: 18, stroke: 'var(--blue)', 'stroke-width': 2 }, svg);
    var legB = el('text', { x: m.l + 146, y: 21, class: 'ch23-legend' }, svg);
    legB.textContent = 'segment B';

    priceStatus.textContent = rangeView === 'full' ? 'full range' : 'truncated \u00b7 B only at 5 / 10';
    bInc.textContent = signed(pricing.b[1] - pricing.b[0], 0);
    aInc.textContent = signed(pricing.a[1] - pricing.a[2], 0);
    rangeEl.textContent = rangeView === 'full' ? 'all prices' : 'B: 5 / 10 only';
    priceNote.textContent = rangeView === 'full'
      ? 'B falls faster at the low end; A has the larger 15→10 gain.'
      : 'B is never tested above 10, so the ranking is not comparable.';
    priceButtons.forEach(function (button) {
      var on = button.getAttribute('data-range') === rangeView;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  priceButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      rangeView = button.getAttribute('data-range');
      drawPrice();
    });
  });

  draw();
  drawPrice();
})(window);
