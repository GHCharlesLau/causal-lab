/* ============================================================
   Chapter 24 â€” cohort paths and TWFE readout.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch24Data;
  var models = global.Ch24Models;
  var mount = doc.getElementById('ch24-chart');
  if (!data || !models || !mount) return;

  var NS = 'http://www.w3.org/2000/svg';
  var current = 'mature';
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('#lab-twfe .ch24-preset'));
  var statusEl = doc.getElementById('ch24-status');
  var twfeEl = doc.getElementById('ch24-twfe');
  var trueEl = doc.getElementById('ch24-true');
  var biasEl = doc.getElementById('ch24-bias');
  var cohortsEl = doc.getElementById('ch24-cohorts');
  var daysEl = doc.getElementById('ch24-days');
  var noteEl = doc.getElementById('ch24-note');

  var notes = {
    constant: 'constant effect, positive weights, exact recovery.',
    mature: 'the early cohort is still climbing when the late cohort is treated.',
    minimal: 'the early cohort falls; its trend is projected onto the late cohort.'
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

  function monthDay(iso) {
    var parts = iso.split('-');
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[Number(parts[1]) - 1] + ' ' + Number(parts[2]);
  }

  function draw() {
    mount.innerHTML = '';
    var scenario = data[current];
    var dates = scenario.dates;
    var keys = Object.keys(scenario.series).sort();
    var all = [];
    keys.forEach(function (key) { all = all.concat(scenario.series[key]); });
    var minY = Math.min.apply(null, all);
    var maxY = Math.max.apply(null, all);
    var pad = (maxY - minY) * 0.12;
    minY -= pad;
    maxY += pad;

    var W = 640;
    var H = 310;
    var m = { l: 54, r: 30, t: 42, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, mount);

    function x(index) { return m.l + (index / Math.max(1, dates.length - 1)) * plotW; }
    function y(value) { return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH; }

    [0, 0.25, 0.5, 0.75, 1].forEach(function (frac) {
      var tick = minY + frac * (maxY - minY);
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch24-tick' }, svg);
      label.textContent = tick.toFixed(1);
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var labelIndices = [0, Math.floor((dates.length - 1) / 3), Math.floor(2 * (dates.length - 1) / 3), dates.length - 1];
    dates.forEach(function (date, index) {
      if (labelIndices.indexOf(index) === -1) return;
      var label = el('text', { x: x(index), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch24-tick' }, svg);
      label.textContent = monthDay(date);
    });

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch24-axis-title' }, svg);
    xTitle.textContent = 'calendar time';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'ch24-axis-title'
    }, svg);
    yTitle.textContent = 'installs';

    keys.forEach(function (key, order) {
      var values = scenario.series[key];
      var className = 'c' + Math.min(order, 2);
      var points = values.map(function (value, index) {
        return x(index) + ',' + y(value);
      }).join(' ');
      el('polyline', { points: points, class: 'ch24-line ch24-line--' + className }, svg);
      values.forEach(function (value, index) {
        if (index % 6 === 0) {
          el('circle', { cx: x(index), cy: y(value), r: 1.8, class: 'ch24-dot--' + className }, svg);
        }
      });
      var cohortIndex = dates.indexOf(key);
      if (cohortIndex >= 0) {
        el('line', { x1: x(cohortIndex), y1: m.t, x2: x(cohortIndex), y2: H - m.b, class: 'ch24-vline' }, svg);
      }
      var legendY = 18 + order * 11;
      el('line', { x1: m.l + 8, y1: legendY, x2: m.l + 22, y2: legendY, stroke: 'var(--' + (order === 0 ? 'red' : order === 1 ? 'blue' : 'ink-3') + ')', 'stroke-width': 2 }, svg);
      var legend = el('text', { x: m.l + 28, y: legendY + 3, class: 'ch24-legend' }, svg);
      legend.textContent = monthDay(key);
    });

    var twfe = scenario.twfe;
    var truth = scenario.true;
    var bias = twfe - truth;
    statusEl.textContent = current + ' \u00b7 TWFE ' + twfe.toFixed(3);
    twfeEl.textContent = twfe.toFixed(3);
    trueEl.textContent = truth.toFixed(3);
    biasEl.textContent = signed(bias, 3);
    cohortsEl.textContent = String(keys.length);
    daysEl.textContent = String(dates.length);
    noteEl.textContent = notes[current];
    buttons.forEach(function (button) {
      var on = button.getAttribute('data-scenario') === current;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      current = button.getAttribute('data-scenario');
      draw();
    });
  });

  draw();
})(window);



