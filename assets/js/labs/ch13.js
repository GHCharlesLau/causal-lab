/* ============================================================
   Chapter 13 â€” the three comparisons and the trend chart.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var models = global.Ch13Models;
  var mount = doc.getElementById('ch13-chart');
  if (!models || !mount) return;

  var NS = 'http://www.w3.org/2000/svg';
  var current = 'did';
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('#lab-did .ch13-preset'));
  var labelEl = doc.getElementById('ch13-label');
  var valueEl = doc.getElementById('ch13-value');
  var formulaEl = doc.getElementById('ch13-formula');
  var statusEl = doc.getElementById('ch13-status');
  var noteEl = doc.getElementById('ch13-note');

  var means = models.means;
  var counterfactual = means.poaBefore + (means.flAfter - means.flBefore);

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

  function draw() {
    mount.innerHTML = '';
    var W = 640;
    var H = 320;
    var m = { l: 48, r: 74, t: 34, b: 52 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minY = 0;
    var maxY = 230;
    var xMay = m.l + 40;
    var xJul = m.l + plotW - 44;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, mount);

    function y(value) {
      return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH;
    }

    [0, 50, 100, 150, 200].forEach(function (tick) {
      el('line', {
        x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick),
        stroke: 'var(--rule)', 'stroke-width': 1
      }, svg);
      var label = el('text', {
        x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch13-tick'
      }, svg);
      label.textContent = String(tick);
    });

    el('line', {
      x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b,
      stroke: 'var(--ink)', 'stroke-width': 1.2
    }, svg);

    [['May', xMay], ['Jul', xJul]].forEach(function (point) {
      var label = el('text', {
        x: point[1], y: H - m.b + 18, 'text-anchor': 'middle', class: 'ch13-tick'
      }, svg);
      label.textContent = point[0];
    });

    var axisTitle = el('text', {
      x: m.l + plotW / 2, y: H - 4,
      'text-anchor': 'middle', class: 'ch13-axis-title'
    }, svg);
    axisTitle.textContent = 'monthly deposits \u00b7 reais';

    function line(x1, y1, x2, y2, cls) {
      el('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: cls }, svg);
    }

    function point(x, value, cls) {
      el('circle', { cx: x, cy: y(value), r: 4, class: cls }, svg);
    }

    function value(x, value, dx, dy) {
      var label = el('text', {
        x: x + dx, y: y(value) + dy, 'text-anchor': 'middle', class: 'ch13-value'
      }, svg);
      label.textContent = value.toFixed(1);
    }

    /* counterfactual */
    line(xMay, y(means.poaBefore), xJul, y(counterfactual), 'ch13-line-cf');
    el('circle', { cx: xJul, cy: y(counterfactual), r: 3.5, fill: 'var(--paper)', stroke: 'var(--blue)', 'stroke-width': 1.4 }, svg);

    /* FL */
    line(xMay, y(means.flBefore), xJul, y(means.flAfter), 'ch13-line-fl');
    point(xMay, means.flBefore, 'ch13-dot-fl');
    point(xJul, means.flAfter, 'ch13-dot-fl');
    value(xMay, means.flBefore, 0, -12);
    value(xJul, means.flAfter, 0, -12);

    /* POA */
    line(xMay, y(means.poaBefore), xJul, y(means.poaAfter), 'ch13-line-poa');
    point(xMay, means.poaBefore, 'ch13-dot-poa');
    point(xJul, means.poaAfter, 'ch13-dot-poa');
    value(xMay, means.poaBefore, 0, 16);
    value(xJul, means.poaAfter, 0, 16);

    /* legend */
    el('line', { x1: m.l + 44, y1: 18, x2: m.l + 60, y2: 18, stroke: 'var(--blue)', 'stroke-width': 2 }, svg);
    var legendA = el('text', { x: m.l + 64, y: 21, class: 'ch13-legend' }, svg);
    legendA.textContent = 'FL';
    el('line', { x1: m.l + 160, y1: 18, x2: m.l + 176, y2: 18, stroke: 'var(--red)', 'stroke-width': 2 }, svg);
    var legendB = el('text', { x: m.l + 180, y: 21, class: 'ch13-legend' }, svg);
    legendB.textContent = 'POA';
    el('line', { x1: m.l + 290, y1: 18, x2: m.l + 306, y2: 18, stroke: 'var(--blue)', 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }, svg);
    var legendC = el('text', { x: m.l + 310, y: 21, class: 'ch13-legend' }, svg);
    legendC.textContent = 'CF';

    var comparison = models.comparisons[current];
    labelEl.textContent = comparison.label;
    valueEl.textContent = signed(comparison.value);
    formulaEl.textContent = comparison.formula;
    statusEl.textContent = comparison.status;
    noteEl.textContent = comparison.note;
    buttons.forEach(function (button) {
      var on = button.getAttribute('data-compare') === current;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      current = button.getAttribute('data-compare');
      draw();
    });
  });

  draw();
})(window);


