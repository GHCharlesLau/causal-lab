/* ============================================================
   Chapter 18 — sensitivity band chart and readout.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch18Data;
  var models = global.Ch18Models;
  var mount = doc.getElementById('ch18-chart');
  if (!data || !models || !mount) return;

  var NS = 'http://www.w3.org/2000/svg';
  var current = 'all';
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('#lab-cate .ch18-preset'));
  var statusEl = doc.getElementById('ch18-status');
  var labelEl = doc.getElementById('ch18-label');
  var slopeEl = doc.getElementById('ch18-slope');
  var sensEl = doc.getElementById('ch18-sens');
  var daysEl = doc.getElementById('ch18-days');
  var noteEl = doc.getElementById('ch18-note');

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

  function selectedRows() {
    if (current === 'all') return data.rows;
    return data.rows.filter(function (row) { return row.band === current; });
  }

  function meanSensitivity(rows) {
    return rows.reduce(function (sum, row) { return sum + row.sens; }, 0) / rows.length;
  }

  function draw() {
    mount.innerHTML = '';
    var W = 640;
    var H = 310;
    var m = { l: 52, r: 34, t: 34, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minX = 1;
    var maxX = 10;
    var minY = 120;
    var maxY = 270;
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

    [120, 160, 200, 240, 270].forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch18-tick' }, svg);
      label.textContent = String(tick);
    });
    [1, 2, 4, 6, 8, 10].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch18-tick' }, svg);
      label.textContent = String(tick);
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch18-axis-title' }, svg);
    xTitle.textContent = 'price \u00b7 reais';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'ch18-axis-title'
    }, svg);
    yTitle.textContent = 'sales \u00b7 units';

    selectedRows().forEach(function (row) {
      el('circle', {
        cx: x(row.price), cy: y(row.sales), r: 2.2,
        class: 'cate-dot' + (current === 'low' ? ' cate-dot--low' : current === 'high' ? ' cate-dot--high' : '')
      }, svg);
    });

    var slope = models.slopes[current === 'all' ? 'ate' : current];
    var rows = selectedRows();
    var meanX = rows.reduce(function (sum, row) { return sum + row.price; }, 0) / rows.length;
    var meanY = rows.reduce(function (sum, row) { return sum + row.sales; }, 0) / rows.length;
    var intercept = meanY - slope * meanX;
    el('line', {
      x1: x(minX), y1: y(intercept + slope * minX),
      x2: x(maxX), y2: y(intercept + slope * maxX),
      class: 'cate-fit'
    }, svg);

    var bandLabel = current === 'all' ? 'All days' : current === 'low' ? 'Low sensitivity' : 'High sensitivity';
    statusEl.textContent = bandLabel + ' \u00b7 ' + signed(slope, 2);
    labelEl.textContent = current === 'all' ? 'Average price slope' : 'Band price slope';
    slopeEl.textContent = signed(slope, 2);
    sensEl.textContent = signed(meanSensitivity(rows), 2);
    daysEl.textContent = rows.length.toLocaleString('en-US');
    noteEl.textContent = current === 'all'
      ? 'the average slope hides the split.'
      : current === 'low'
        ? 'these days fall steeply when price rises.'
        : 'these days barely move when price rises.';
    buttons.forEach(function (button) {
      var on = button.getAttribute('data-band') === current;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      current = button.getAttribute('data-band');
      draw();
    });
  });

  draw();
})(window);
