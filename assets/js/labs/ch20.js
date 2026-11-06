/* ============================================================
   Chapter 20 â€” binary and continuous target-transformation charts.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch20Data;
  var models = global.Ch20Models;
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

  function pct(value, digits) {
    return (value >= 0 ? '+' : '\u2212') + Math.abs(value * 100).toFixed(digits == null ? 1 : digits) + '%';
  }

  function signed(value, digits) {
    return (value >= 0 ? '+' : '\u2212') + Math.abs(value).toFixed(digits == null ? 3 : digits);
  }

  function initLab(config) {
    var mount = doc.getElementById(config.mount);
    if (!mount) return;
    var root = doc.getElementById(config.root);
    var buttons = Array.prototype.slice.call(root.querySelectorAll('.ch20-preset'));
    var statusEl = doc.getElementById(config.status);
    var labelEl = doc.getElementById(config.label);
    var gainEl = doc.getElementById(config.gain);
    var ateEl = doc.getElementById(config.ate);
    var noteEl = doc.getElementById(config.noteId);
    var split = 'test';

    function draw() {
      mount.innerHTML = '';
      var W = 620;
      var H = 300;
      var m = { l: 56, r: 30, t: 36, b: 48 };
      var plotW = W - m.l - m.r;
      var plotH = H - m.t - m.b;
      var minY = config.minY;
      var maxY = config.maxY;
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

      config.ticks.forEach(function (tick) {
        el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
        var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch20-tick' }, svg);
        label.textContent = config.tickLabel(tick);
      });
      [0, 0.25, 0.5, 0.75, 1].forEach(function (tick) {
        var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch20-tick' }, svg);
        label.textContent = Math.round(tick * 100) + '%';
      });

      el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
      el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

      var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch20-axis-title' }, svg);
      xTitle.textContent = 'share of units, ranked by CATE';
      var yTitle = el('text', {
        x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
        transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'ch20-axis-title'
      }, svg);
      yTitle.textContent = config.yTitle;

      var splitData = config.data.curves[split];
      var ate = splitData.ate;
      el('line', { x1: x(0), y1: y(0), x2: x(1), y2: y(ate), class: 'ch20-baseline' }, svg);
      var baselineLabel = el('text', { x: x(1) - 4, y: y(ate) - 8, 'text-anchor': 'end', class: 'ch20-legend' }, svg);
      baselineLabel.textContent = 'baseline';

      var points = splitData.x.map(function (xv, i) {
        return x(xv) + ',' + y(splitData.gain[i]);
      }).join(' ');
      el('polyline', { points: points, class: 'ch20-curve' }, svg);

      var gain = config.data.top10[split];
      statusEl.textContent = split + ' \u00b7 top 10%';
      labelEl.textContent = split === 'test' ? 'Test split' : 'Train split';
      gainEl.textContent = config.formatGain(gain);
      ateEl.textContent = config.formatAte(ate);
      noteEl.textContent = config.note(split);
      buttons.forEach(function (button) {
        var on = button.getAttribute('data-split') === split;
        button.classList.toggle('is-active', on);
        button.setAttribute('aria-pressed', String(on));
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        split = button.getAttribute('data-split');
        draw();
      });
    });

    draw();
  }

  initLab({
    root: 'lab-binary',
    mount: 'ch20-binary-chart',
    status: 'ch20-binary-status',
    label: 'ch20-binary-label',
    gain: 'ch20-binary-gain',
    ate: 'ch20-binary-ate',
    noteId: 'ch20-binary-note',
    data: data.binary,
    minY: 0,
    maxY: 0.08,
    ticks: [0, 0.02, 0.04, 0.06, 0.08],
    tickLabel: function (value) { return Math.round(value * 100) + '%'; },
    yTitle: 'cumulative gain',
    formatGain: function (value) { return pct(value, 1); },
    formatAte: function (value) { return pct(value, 1); },
    note: function (split) {
      return split === 'test'
        ? 'the top decile is not a huge lift.'
        : 'train gain is double the test gain: some overfit.';
    }
  });

  initLab({
    root: 'lab-continuous',
    mount: 'ch20-continuous-chart',
    status: 'ch20-continuous-status',
    label: 'ch20-continuous-label',
    gain: 'ch20-continuous-gain',
    ate: 'ch20-continuous-ate',
    noteId: 'ch20-continuous-note',
    data: data.continuous,
    minY: -3,
    maxY: 0.5,
    ticks: [-3, -2, -1, 0],
    tickLabel: function (value) { return String(value); },
    yTitle: 'cumulative price slope',
    formatGain: function (value) { return signed(value, 3); },
    formatAte: function (value) { return signed(value, 2); },
    note: function (split) {
      return split === 'test'
        ? 'the top decile is less price-sensitive.'
        : 'the train curve is noisier but the ranking holds.';
    }
  });
})(window);


