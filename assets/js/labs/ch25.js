/* ============================================================
   Chapter 25 — estimator comparison and time weights.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch25Data;
  var models = global.Ch25Models;
  var mount = doc.getElementById('ch25-chart');
  if (!data || !models || !mount) return;

  var NS = 'http://www.w3.org/2000/svg';
  var current = 'sdid';
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('#lab-estimators .ch25-preset'));
  var statusEl = doc.getElementById('ch25-status');
  var labelEl = doc.getElementById('ch25-label');
  var attEl = doc.getElementById('ch25-att');
  var cfEl = doc.getElementById('ch25-cf');
  var noteEl = doc.getElementById('ch25-note');

  var config = {
    did: { label: 'Difference-in-differences', cf: 'parallel trend', note: 'the control trend projected onto California.' },
    sc: { label: 'Synthetic control', cf: 'matched pre-trend', note: 'the donor pool bends to California before 1989.' },
    sdid: { label: 'Synthetic DiD', cf: 'unit + time weights', note: 'the time weights focus on 1986–88.' }
  };

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

  function draw() {
    mount.innerHTML = '';
    var years = data.years;
    var cal = data.california;
    var cfKey = current === 'did' ? 'didCf' : current === 'sc' ? 'scCf' : 'sdidCf';
    var cf = data[cfKey];
    var W = 640;
    var H = 310;
    var m = { l: 54, r: 32, t: 40, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minX = years[0];
    var maxX = years[years.length - 1];
    var minY = 30;
    var maxY = 180;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, mount);

    function x(value) { return m.l + ((value - minX) / (maxX - minX)) * plotW; }
    function y(value) { return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH; }

    [40, 80, 120, 160].forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch25-tick' }, svg);
      label.textContent = String(tick);
    });
    [1970, 1980, 1990, 2000].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch25-tick' }, svg);
      label.textContent = String(tick);
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch25-axis-title' }, svg);
    xTitle.textContent = 'year';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'ch25-axis-title'
    }, svg);
    yTitle.textContent = 'cigarette sales';

    el('line', { x1: x(1989), y1: m.t, x2: x(1989), y2: H - m.b, class: 'ch25-vline' }, svg);
    var propLabel = el('text', { x: x(1989) + 4, y: m.t + 10, class: 'ch25-legend' }, svg);
    propLabel.textContent = 'Prop. 99';

    var calPoints = cal.map(function (value, index) {
      return x(years[index]) + ',' + y(value);
    }).join(' ');
    el('polyline', { points: calPoints, class: 'ch25-line ch25-line--cal' }, svg);

    var cfPoints = cf.map(function (value, index) {
      return x(years[index]) + ',' + y(value);
    }).join(' ');
    el('polyline', { points: cfPoints, class: 'ch25-line ch25-line--cf' }, svg);

    el('line', { x1: m.l + 8, y1: 18, x2: m.l + 24, y2: 18, stroke: 'var(--red)', 'stroke-width': 2 }, svg);
    var legA = el('text', { x: m.l + 30, y: 21, class: 'ch25-legend' }, svg);
    legA.textContent = 'California';
    el('line', { x1: m.l + 126, y1: 18, x2: m.l + 142, y2: 18, stroke: 'var(--blue)', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, svg);
    var legB = el('text', { x: m.l + 148, y: 21, class: 'ch25-legend' }, svg);
    legB.textContent = 'counterfactual';

    var att = data.att[current];
    statusEl.textContent = current + ' \u00b7 ' + signed(att, 2);
    labelEl.textContent = config[current].label;
    attEl.textContent = signed(att, 2);
    cfEl.textContent = config[current].cf;
    noteEl.textContent = config[current].note;
    buttons.forEach(function (button) {
      var on = button.getAttribute('data-estimator') === current;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      current = button.getAttribute('data-estimator');
      draw();
    });
  });

  draw();

  // ---------------------------------------------------------- time weights
  var timeMount = doc.getElementById('ch25-time-weights');
  if (timeMount) {
    var weights = data.timeWeights;
    var W = 640;
    var H = 120;
    var m = { l: 44, r: 24, t: 16, b: 30 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'presentation', 'aria-hidden': 'true' }, timeMount);
    var n = weights.values.length;
    var barW = plotW / n * 0.55;
    var maxW = Math.max.apply(null, weights.values) || 1;
    weights.years.forEach(function (year, index) {
      var value = weights.values[index];
      var barH = (value / maxW) * plotH;
      var x = m.l + (index + 0.5) * (plotW / n);
      el('rect', {
        x: x - barW / 2,
        y: m.t + plotH - barH,
        width: barW,
        height: barH,
        class: 'time-bar'
      }, svg);
      var label = el('text', { x: x, y: H - m.b + 16, 'text-anchor': 'middle', class: 'time-label' }, svg);
      label.textContent = String(year);
      if (value > 0.01) {
        var valueLabel = el('text', { x: x, y: m.t + plotH - barH - 4, 'text-anchor': 'middle', class: 'time-label' }, svg);
        valueLabel.textContent = value.toFixed(2);
      }
    });
  }
})(window);
