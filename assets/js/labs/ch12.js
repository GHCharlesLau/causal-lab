/* ============================================================
   Chapter 12 — robustness grid and interval chart.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var models = global.Ch12Models;
  var intervalMount = doc.getElementById('ch12-intervals');
  if (!models || !intervalMount) return;

  var NS = 'http://www.w3.org/2000/svg';
  var current = 'both';
  var cells = Array.prototype.slice.call(doc.querySelectorAll('.dr-cell'));
  var labelEl = doc.getElementById('ch12-label');
  var coefEl = doc.getElementById('ch12-coef');
  var ciEl = doc.getElementById('ch12-ci');
  var statusEl = doc.getElementById('ch12-status');
  var statusShort = doc.getElementById('ch12-status-short');
  var noteEl = doc.getElementById('ch12-note');

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

  function fmt(value) {
    return value.toFixed(4).replace('-', '\u2212');
  }

  function drawIntervals() {
    intervalMount.innerHTML = '';
    var W = 640;
    var H = 220;
    var m = { l: 92, r: 30, t: 26, b: 40 };
    var plotW = W - m.l - m.r;
    var axisY = H - 36;
    var minX = 0.32;
    var maxX = 0.45;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, intervalMount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }

    [0.32, 0.36, 0.40, 0.44].forEach(function (tick) {
      el('line', {
        x1: x(tick), y1: 20, x2: x(tick), y2: axisY,
        stroke: 'var(--rule)', 'stroke-width': 1
      }, svg);
      var label = el('text', {
        x: x(tick), y: axisY + 15, 'text-anchor': 'middle', class: 'dr-tick'
      }, svg);
      label.textContent = tick.toFixed(2);
    });

    el('line', {
      x1: m.l, y1: axisY, x2: W - m.r, y2: axisY,
      stroke: 'var(--ink)', 'stroke-width': 1.2
    }, svg);

    var keys = ['both', 'wrongPs', 'wrongOutcome'];
    keys.forEach(function (key, i) {
      var model = models.models[key];
      var y = 56 + i * 54;
      var isCurrent = key === current;
      var group = el('g', { class: 'dr-row' + (isCurrent ? ' is-current' : '') }, svg);
      var label = el('text', {
        x: m.l - 9, y: y + 4, 'text-anchor': 'end', class: 'dr-row-label'
      }, group);
      label.textContent = model.short === 'DR' ? 'DR' : model.short;

      el('line', {
        x1: x(model.lo), y1: y, x2: x(model.hi), y2: y, class: 'dr-row-line'
      }, group);
      [model.lo, model.hi].forEach(function (edge) {
        el('line', {
          x1: x(edge), y1: y - 4, x2: x(edge), y2: y + 4, class: 'dr-row-line'
        }, group);
      });
      el('circle', { cx: x(model.coef), cy: y, r: isCurrent ? 5 : 3.5, class: 'dr-row-dot' }, group);
      var value = el('text', {
        x: x(model.coef), y: y - 10, 'text-anchor': 'middle', class: 'dr-row-value'
      }, group);
      value.textContent = model.coef.toFixed(3);
    });

    var axisTitle = el('text', {
      x: m.l + plotW / 2, y: H - 4,
      'text-anchor': 'middle', class: 'dr-axis-title'
    }, svg);
    axisTitle.textContent = 'achievement score \u00b7 95% CI';
  }

  function setCell(key) {
    current = key;
    var model = models.models[key];
    labelEl.textContent = model.label;
    coefEl.textContent = model.coef == null ? '\u2014' : fmt(model.coef);
    ciEl.textContent = model.lo == null
      ? 'no guarantee'
      : '(' + fmt(model.lo) + ', ' + fmt(model.hi) + ')';
    statusEl.textContent = model.status;
    statusShort.textContent = key === 'bothWrong' ? 'no guarantee' : 'insured';
    noteEl.textContent = model.note;

    cells.forEach(function (button) {
      var on = button.getAttribute('data-cell') === key;
      button.classList.toggle('is-selected', on);
      button.setAttribute('aria-pressed', String(on));
    });
    drawIntervals();
  }

  cells.forEach(function (button) {
    button.addEventListener('click', function () {
      setCell(button.getAttribute('data-cell'));
    });
  });

  setCell('both');
})(window);
