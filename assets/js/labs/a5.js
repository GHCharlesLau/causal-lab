/* ============================================================
   Technical note A5 — conformal interval bench.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.A5Data;
  var models = global.A5Models;
  var mount = doc.getElementById('a5-chart');
  if (!data || !models || !mount) return;

  var NS = 'http://www.w3.org/2000/svg';
  var selected = 2000;
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('#lab-interval .a5-preset'));
  var statusEl = doc.getElementById('a5-status');
  var labelEl = doc.getElementById('a5-label');
  var ciEl = doc.getElementById('a5-ci');
  var effectEl = doc.getElementById('a5-effect');
  var noteEl = doc.getElementById('a5-note');
  var table = doc.getElementById('a5-table');

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
    return (value >= 0 ? '+' : '\u2212') + Math.abs(value).toFixed(digits == null ? 2 : digits);
  }

  function draw() {
    mount.innerHTML = '';
    var W = 640;
    var H = 320;
    var m = { l: 58, r: 34, t: 38, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minY = -55;
    var maxY = 15;
    var minX = data.years[0];
    var maxX = data.years[data.years.length - 1];
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, mount);

    function x(year) { return m.l + ((year - minX) / (maxX - minX)) * plotW; }
    function y(value) { return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH; }

    [-50, -40, -30, -20, -10, 0, 10].forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'a5-tick' }, svg);
      label.textContent = String(tick);
    });
    [1970, 1980, 1988, 1995, 2000].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'a5-tick' }, svg);
      label.textContent = String(tick);
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'a5-axis-title' }, svg);
    xTitle.textContent = 'year';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'a5-axis-title'
    }, svg);
    yTitle.textContent = 'gap in packs per capita';

    el('line', { x1: m.l, y1: y(0), x2: W - m.r, y2: y(0), class: 'a5-zero' }, svg);
    el('line', { x1: x(1988), y1: m.t, x2: x(1988), y2: H - m.b, stroke: 'var(--ink-2)', 'stroke-width': 1, 'stroke-dasharray': '2 3' }, svg);
    var prop = el('text', { x: x(1988) + 4, y: m.t + 10, class: 'a5-year-label' }, svg);
    prop.textContent = 'Prop 99';

    var bandPoints = data.ci.map(function (row) {
      return x(row.year) + ',' + y(row.upper);
    }).concat(data.ci.slice().reverse().map(function (row) {
      return x(row.year) + ',' + y(row.lower);
    })).join(' ');
    el('polygon', { points: bandPoints, class: 'a5-band' }, svg);

    var linePoints = data.years.map(function (year, index) {
      return x(year) + ',' + y(data.effect[index]);
    }).join(' ');
    el('polyline', { points: linePoints, class: 'a5-line' }, svg);

    var row = data.ci.find(function (item) { return item.year === selected; });
    if (row) {
      el('line', { x1: x(row.year), y1: y(row.lower), x2: x(row.year), y2: y(row.upper), class: 'a5-selected-band' }, svg);
      el('line', { x1: x(row.year) - 8, y1: y(row.lower), x2: x(row.year) + 8, y2: y(row.lower), class: 'a5-selected' }, svg);
      el('line', { x1: x(row.year) - 8, y1: y(row.upper), x2: x(row.year) + 8, y2: y(row.upper), class: 'a5-selected' }, svg);
    }

    var point = data.ci.find(function (item) { return item.year === selected; });
    var effect = data.effect[selected - data.years[0]];
    statusEl.textContent = selected + ' \u00b7 [' + point.lower.toFixed(2) + ', ' + point.upper.toFixed(2) + ']';
    labelEl.textContent = selected + ' \u00b7 90% interval';
    ciEl.textContent = fmt(point.lower, 1) + ' / ' + fmt(point.upper, 1);
    effectEl.textContent = fmt(effect, 2);
    noteEl.textContent = selected === 1988
      ? 'the interval includes zero.'
      : selected === 1995
        ? 'the interval is fully negative.'
        : 'by 2000, every plausible null is negative.';
    buttons.forEach(function (button) {
      var on = Number(button.getAttribute('data-year')) === selected;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      selected = Number(button.getAttribute('data-year'));
      draw();
    });
  });

  // table
  if (table) {
    data.ci.forEach(function (row) {
      var div = doc.createElement('div');
      div.className = 'ci-row' + (row.year >= 1991 ? ' ci-row--post' : '');
      var effect = data.effect[row.year - data.years[0]];
      div.innerHTML = '<span>' + row.year + '</span><span>' + fmt(effect, 2) + '</span><span>[' + fmt(row.lower, 2) + ', ' + fmt(row.upper, 2) + ']</span>';
      table.appendChild(div);
    });
  }

  draw();
})(window);
