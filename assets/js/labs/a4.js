/* ============================================================
   Technical note A4 — cumulative elasticity metric bench.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.A4Data;
  var models = global.A4Models;
  var mount = doc.getElementById('a4-chart');
  if (!data || !models || !mount) return;

  var NS = 'http://www.w3.org/2000/svg';
  var current = 'm2';
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('#lab-curve .a4-preset'));
  var statusEl = doc.getElementById('a4-status');
  var labelEl = doc.getElementById('a4-label');
  var topEl = doc.getElementById('a4-top');
  var r2El = doc.getElementById('a4-r2');
  var noteEl = doc.getElementById('a4-note');

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

  function draw() {
    mount.innerHTML = '';
    var W = 640;
    var H = 310;
    var m = { l: 56, r: 30, t: 38, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minY = 0;
    var maxY = 6.5;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, mount);

    function x(value) { return m.l + value * plotW; }
    function y(value) { return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH; }

    [0, 1, 2, 3, 4, 5, 6].forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'a4-tick' }, svg);
      label.textContent = String(tick);
    });
    [0, 0.25, 0.5, 0.75, 1].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'a4-tick' }, svg);
      label.textContent = Math.round(tick * 100) + '%';
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'a4-axis-title' }, svg);
    xTitle.textContent = 'share of test rows, ranked by CATE';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'a4-axis-title'
    }, svg);
    yTitle.textContent = 'cumulative elasticity';

    var endpoint = data.end.m2;
    el('line', { x1: x(0), y1: y(0), x2: x(1), y2: y(endpoint), class: 'a4-baseline' }, svg);
    var endpointLabel = el('text', { x: x(1) - 4, y: y(endpoint) - 8, 'text-anchor': 'end', class: 'a4-legend' }, svg);
    endpointLabel.textContent = 'average';

    ['m1', 'm2'].forEach(function (key) {
      var curve = data.curves[key];
      var points = curve.x.map(function (xv, i) {
        return x(xv) + ',' + y(curve.gain[i]);
      }).join(' ');
      el('polyline', {
        points: points,
        class: 'a4-curve a4-curve--' + key + (key === current ? ' is-active' : '')
      }, svg);
    });

    el('line', { x1: m.l + 8, y1: 18, x2: m.l + 24, y2: 18, stroke: 'var(--red)', 'stroke-width': 2 }, svg);
    var legA = el('text', { x: m.l + 30, y: 21, class: 'a4-legend' }, svg);
    legA.textContent = 'M1';
    el('line', { x1: m.l + 82, y1: 18, x2: m.l + 98, y2: 18, stroke: 'var(--blue)', 'stroke-width': 2 }, svg);
    var legB = el('text', { x: m.l + 104, y: 21, class: 'a4-legend' }, svg);
    legB.textContent = 'M2';

    var curve = data.curves[current];
    var top = curve.gain[25];
    statusEl.textContent = current.toUpperCase() + ' \u00b7 top 25% ' + top.toFixed(2);
    labelEl.textContent = current === 'm1' ? 'M1 \u00b7 nuisance features' : 'M2 \u00b7 effect features';
    topEl.textContent = top.toFixed(2);
    r2El.textContent = data.r2[current].toFixed(3);
    noteEl.textContent = current === 'm1'
      ? 'a high R\u00b2 with a flat effect curve.'
      : 'the low-R\u00b2 model ranks the effect better.';
    buttons.forEach(function (button) {
      var on = button.getAttribute('data-model') === current;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      current = button.getAttribute('data-model');
      draw();
    });
  });

  draw();
})(window);
