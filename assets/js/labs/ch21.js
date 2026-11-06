/* ============================================================
   Chapter 21 — S/T/X learner gain comparison.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch21Data;
  var models = global.Ch21Models;
  var mount = doc.getElementById('ch21-chart');
  if (!data || !models || !mount) return;

  var NS = 'http://www.w3.org/2000/svg';
  var current = 'x';
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('#lab-compare .ch21-preset'));
  var statusEl = doc.getElementById('ch21-status');
  var labelEl = doc.getElementById('ch21-label');
  var gainEl = doc.getElementById('ch21-gain');
  var ateEl = doc.getElementById('ch21-ate');
  var rangeEl = doc.getElementById('ch21-range');
  var noteEl = doc.getElementById('ch21-note');

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

  function pct(value, digits) {
    return (value >= 0 ? '+' : '\u2212') + Math.abs(value * 100).toFixed(digits == null ? 1 : digits) + '%';
  }

  function draw() {
    mount.innerHTML = '';
    var W = 640;
    var H = 310;
    var m = { l: 56, r: 30, t: 36, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minY = 0;
    var maxY = 0.08;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, mount);

    function x(value) {
      return m.l + value * plotW;
    }
    function y(value) {
      return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH;
    }

    [0, 0.02, 0.04, 0.06, 0.08].forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch21-tick' }, svg);
      label.textContent = Math.round(tick * 100) + '%';
    });
    [0, 0.25, 0.5, 0.75, 1].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch21-tick' }, svg);
      label.textContent = Math.round(tick * 100) + '%';
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch21-axis-title' }, svg);
    xTitle.textContent = 'share of test customers, ranked by CATE';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'ch21-axis-title'
    }, svg);
    yTitle.textContent = 'cumulative gain';

    el('line', { x1: x(0), y1: y(0), x2: x(1), y2: y(data.ate), class: 'ch21-baseline' }, svg);
    var baselineLabel = el('text', { x: x(1) - 4, y: y(data.ate) - 8, 'text-anchor': 'end', class: 'ch21-legend' }, svg);
    baselineLabel.textContent = 'baseline';

    ['s', 't', 'x'].forEach(function (key) {
      var curve = data.curves[key];
      var points = curve.x.map(function (xv, i) {
        return x(xv) + ',' + y(curve.gain[i]);
      }).join(' ');
      el('polyline', {
        points: points,
        class: 'ch21-curve ch21-curve--' + key + (key === current ? ' is-active' : '')
      }, svg);
    });

    el('line', { x1: m.l + 8, y1: 18, x2: m.l + 24, y2: 18, stroke: 'var(--red)', 'stroke-width': 2 }, svg);
    var legA = el('text', { x: m.l + 30, y: 21, class: 'ch21-legend' }, svg);
    legA.textContent = 'S';
    el('line', { x1: m.l + 82, y1: 18, x2: m.l + 98, y2: 18, stroke: 'var(--blue)', 'stroke-width': 2 }, svg);
    var legB = el('text', { x: m.l + 104, y: 21, class: 'ch21-legend' }, svg);
    legB.textContent = 'T';
    el('line', { x1: m.l + 156, y1: 18, x2: m.l + 172, y2: 18, stroke: '#5d7a52', 'stroke-width': 2 }, svg);
    var legC = el('text', { x: m.l + 178, y: 21, class: 'ch21-legend' }, svg);
    legC.textContent = 'X';

    var learner = models.learners[current];
    var cate = data.cate[current];
    statusEl.textContent = current.toUpperCase() + '-learner \u00b7 top 10%';
    labelEl.textContent = learner.label;
    gainEl.textContent = pct(data.top10[current], 1);
    ateEl.textContent = pct(data.ate, 1);
    rangeEl.textContent = pct(cate.min, 0) + ' / ' + pct(cate.max, 0);
    noteEl.textContent = learner.note;
    buttons.forEach(function (button) {
      var on = button.getAttribute('data-learner') === current;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      current = button.getAttribute('data-learner');
      draw();
    });
  });

  draw();
})(window);
