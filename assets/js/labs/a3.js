/* ============================================================
   Technical note A3 — coupon policy comparison and band choices.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.A3Data;
  var models = global.A3Models;
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

  // ---------------------------------------------------------- policy bars
  var chart = doc.getElementById('a3-chart');
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('#lab-policy .a3-preset'));
  var statusEl = doc.getElementById('a3-status');
  var labelEl = doc.getElementById('a3-label');
  var gainEl = doc.getElementById('a3-gain');
  var lossEl = doc.getElementById('a3-loss');
  var noteEl = document.getElementById('a3-note');
  var policy = 'model';

  function drawPolicy() {
    if (!chart) return;
    chart.innerHTML = '';
    var W = 640;
    var H = 300;
    var m = { l: 58, r: 40, t: 36, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var maxY = 280;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, chart);

    function y(value) { return m.t + plotH - (value / maxY) * plotH; }

    [0, 70, 140, 210, 280].forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'a3-tick' }, svg);
      label.textContent = String(tick);
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'a3-axis-title'
    }, svg);
    yTitle.textContent = 'net value per customer';

    var bars = [
      { key: 'simple', label: 'Simple', value: data.gain.simple, x: m.l + plotW * 0.22, w: plotW * 0.2 },
      { key: 'model', label: 'Model', value: data.gain.model, x: m.l + plotW * 0.56, w: plotW * 0.2 }
    ];
    bars.forEach(function (bar) {
      el('rect', {
        x: bar.x,
        y: y(bar.value),
        width: bar.w,
        height: (bar.value / maxY) * plotH,
        class: 'a3-bar' + (bar.key === 'simple' ? ' a3-bar--simple' : '') + (bar.key === policy ? ' is-active' : '')
      }, svg);
      var value = el('text', { x: bar.x + bar.w / 2, y: y(bar.value) - 6, 'text-anchor': 'middle', class: 'a3-value' }, svg);
      value.textContent = bar.value.toFixed(2);
      var label = el('text', { x: bar.x + bar.w / 2, y: H - m.b + 18, 'text-anchor': 'middle', class: 'a3-tick' }, svg);
      label.textContent = bar.label;
    });

    var selected = data.gain[policy];
    statusEl.textContent = policy + ' \u00b7 ' + selected.toFixed(2);
    labelEl.textContent = policy === 'simple' ? 'Simple policy' : 'Model policy';
    gainEl.textContent = selected.toFixed(2);
    lossEl.textContent = signed(selected - data.gain.simple, 2);
    noteEl.textContent = policy === 'simple'
      ? 'the flat rule uses the treatment variation.'
      : 'a better forecast made a worse policy.';
    buttons.forEach(function (button) {
      var on = button.getAttribute('data-policy') === policy;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      policy = button.getAttribute('data-policy');
      drawPolicy();
    });
  });

  drawPolicy();

  // ---------------------------------------------------------- band choices
  var bandMount = doc.getElementById('a3-bands');
  if (bandMount) {
    var W = 640;
    var H = 150;
    var m = { l: 40, r: 24, t: 20, b: 28 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'presentation', 'aria-hidden': 'true' }, bandMount);
    var values = data.bands.coupon;
    var maxVal = 15;
    var barW = plotW / values.length * 0.58;
    values.forEach(function (value, index) {
      var x = m.l + (index + 0.5) * (plotW / values.length);
      var barH = (value / maxVal) * plotH;
      el('rect', {
        x: x - barW / 2,
        y: m.t + plotH - barH,
        width: barW,
        height: barH,
        class: 'band-bar'
      }, svg);
      var valueLabel = el('text', { x: x, y: m.t + plotH - barH - 4, 'text-anchor': 'middle', class: 'band-label' }, svg);
      valueLabel.textContent = String(value);
      var bandLabel = el('text', { x: x, y: H - m.b + 15, 'text-anchor': 'middle', class: 'band-label' }, svg);
      bandLabel.textContent = String(index + 1);
    });
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'band-label'
    }, svg);
    yTitle.textContent = 'coupon';
  }
})(window);
