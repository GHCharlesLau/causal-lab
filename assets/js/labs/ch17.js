/* ============================================================
   Chapter 17 â€” region policy slider, policy comparison bars.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch17Data;
  var models = global.Ch17Models;
  var chartMount = doc.getElementById('ch17-policy-chart');
  if (!data || !models || !chartMount) return;

  var NS = 'http://www.w3.org/2000/svg';
  var cutoff = 0;

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

  function policyAt(value) {
    var selected = data.regions.filter(function (row) { return row.lower > value; });
    var total = selected.reduce(function (sum, row) { return sum + row.testSum; }, 0);
    return { value: total / data.nTest, count: selected.length, regions: selected };
  }

  var slider = doc.getElementById('ch17-cutoff');
  var sliderValue = doc.getElementById('ch17-cutoff-value');
  var statusEl = doc.getElementById('ch17-policy-status');
  var valueEl = doc.getElementById('ch17-policy-value');
  var cutoffEl = doc.getElementById('ch17-cutoff-readout');
  var keptEl = doc.getElementById('ch17-regions-kept');
  var noteEl = doc.getElementById('ch17-policy-note');

  function draw() {
    chartMount.innerHTML = '';
    var W = 640;
    var H = 300;
    var m = { l: 52, r: 34, t: 36, b: 48 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minX = 0;
    var maxX = 55;
    var minY = -5;
    var maxY = 20;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, chartMount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }
    function y(value) {
      return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH;
    }

    [-5, 0, 5, 10, 15, 20].forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch17-tick' }, svg);
      label.textContent = String(tick);
    });
    [0, 10, 20, 30, 40, 50].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch17-tick' }, svg);
      label.textContent = String(tick);
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var points = [];
    for (var c = minX; c <= maxX; c += 1) {
      var p = policyAt(c);
      points.push(x(c) + ',' + y(p.value));
    }
    el('polyline', { points: points.join(' '), class: 'ch17-policy-line' }, svg);

    el('line', {
      x1: m.l, y1: y(data.modelPolicy), x2: W - m.r, y2: y(data.modelPolicy),
      class: 'ch17-model-line'
    }, svg);
    var modelLabel = el('text', {
      x: W - m.r, y: y(data.modelPolicy) - 6, 'text-anchor': 'end', class: 'ch17-model-label'
    }, svg);
    modelLabel.textContent = 'model 16.60';

    el('line', { x1: x(cutoff), y1: m.t, x2: x(cutoff), y2: H - m.b, class: 'ch17-cutoff-line' }, svg);
    var active = policyAt(cutoff);
    el('circle', { cx: x(cutoff), cy: y(active.value), r: 5, class: 'ch17-policy-dot' }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch17-axis-title' }, svg);
    xTitle.textContent = 'lower-bound cutoff';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'ch17-axis-title'
    }, svg);
    yTitle.textContent = 'test net value';

    valueEl.textContent = signed(active.value, 2);
    statusEl.textContent = 'cutoff ' + cutoff + ' \u00b7 ' + active.count + ' regions';
    cutoffEl.textContent = cutoff.toFixed(1);
    keptEl.textContent = String(active.count);
    sliderValue.textContent = String(cutoff);
    noteEl.textContent = active.count === 0
      ? 'no region clears this cutoff; the policy earns nothing.'
      : 'keep the regions whose lower bound clears the cutoff.';
  }

  slider.addEventListener('input', function () {
    cutoff = Number(slider.value);
    draw();
  });

  /* ---------------------------------------------------------- policy bars */
  function drawBars() {
    var mount = doc.getElementById('ch17-policy-bars');
    if (!mount) return;
    mount.innerHTML = '';
    var W = 640;
    var H = 190;
    var m = { l: 112, r: 34, t: 20, b: 30 };
    var plotW = W - m.l - m.r;
    var minX = -30;
    var maxX = 20;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, mount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }

    el('line', { x1: x(0), y1: m.t, x2: x(0), y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1 }, svg);
    var rows = [
      { label: 'treat all', value: data.treatAllTest },
      { label: 'region rule', value: data.policyAtZero },
      { label: 'model rule', value: data.modelPolicy }
    ];
    rows.forEach(function (row, i) {
      var barY = m.t + i * 48;
      var zero = x(0);
      var end = x(row.value);
      el('rect', {
        x: Math.min(zero, end), y: barY,
        width: Math.max(1, Math.abs(end - zero)), height: 20,
        class: row.value >= 0 ? 'ch17-bar-positive' : 'ch17-bar-negative'
      }, svg);
      var label = el('text', { x: m.l - 10, y: barY + 14, 'text-anchor': 'end', class: 'ch17-bar-label' }, svg);
      label.textContent = row.label;
      var value = el('text', {
        x: row.value >= 0 ? end + 6 : end - 6, y: barY + 14,
        'text-anchor': row.value >= 0 ? 'start' : 'end', class: 'ch17-bar-value'
      }, svg);
      value.textContent = signed(row.value, 2);
    });

    var title = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch17-axis-title' }, svg);
    title.textContent = 'net value per customer \u00b7 test set';
  }

  draw();
  drawBars();
})(window);


