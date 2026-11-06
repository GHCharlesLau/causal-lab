/* ============================================================
   Chapter 15 â€” weights, synthetic path, and placebo distribution.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch15Data;
  var models = global.Ch15Models;
  var pathMount = doc.getElementById('ch15-path-chart');
  var placeboMount = doc.getElementById('ch15-placebo');
  if (!data || !models || !pathMount || !placeboMount) return;

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
    var text = Math.abs(value).toFixed(digits == null ? 1 : digits);
    return (value >= 0 ? '+' : '\u2212') + text;
  }

  /* ---------------------------------------------------------- weights */
  function drawWeights() {
    var mount = doc.getElementById('ch15-weights');
    if (!mount) return;
    mount.innerHTML = '';
    data.weights.slice().sort(function (a, b) { return b.weight - a.weight; }).forEach(function (item) {
      var row = doc.createElement('div');
      row.className = 'weight-row';
      var label = doc.createElement('span');
      label.className = 'weight-label';
      label.textContent = 'State ' + item.state;
      var track = doc.createElement('span');
      track.className = 'weight-track';
      var fill = doc.createElement('span');
      fill.className = 'weight-fill';
      fill.style.width = (item.weight * 100).toFixed(2) + '%';
      track.appendChild(fill);
      var value = doc.createElement('span');
      value.className = 'weight-value';
      value.textContent = (item.weight * 100).toFixed(2) + '%';
      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(value);
      mount.appendChild(row);
    });
  }

  /* ---------------------------------------------------------- path */
  var currentView = 'levels';
  var buttons = Array.prototype.slice.call(doc.querySelectorAll('#lab-path .ch15-preset'));
  var statusEl = doc.getElementById('ch15-path-status');
  var labelEl = doc.getElementById('ch15-path-label');
  var valueEl = doc.getElementById('ch15-path-value');
  var noteEl = doc.getElementById('ch15-path-note');
  var weightsEl = doc.getElementById('ch15-path-weights');

  function drawPath() {
    pathMount.innerHTML = '';
    var W = 640;
    var H = 320;
    var m = { l: 50, r: 30, t: 38, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minYear = data.years[0];
    var maxYear = data.years[data.years.length - 1];
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, pathMount);

    function x(year) {
      return m.l + ((year - minYear) / (maxYear - minYear)) * plotW;
    }
    function y(value, minY, maxY) {
      return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH;
    }

    if (currentView === 'levels') {
      var minY = 40;
      var maxY = 140;
      [40, 80, 120, 140].forEach(function (tick) {
        el('line', { x1: m.l, y1: y(tick, minY, maxY), x2: W - m.r, y2: y(tick, minY, maxY), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
        var label = el('text', { x: m.l - 8, y: y(tick, minY, maxY) + 3, 'text-anchor': 'end', class: 'ch15-tick' }, svg);
        label.textContent = String(tick);
      });

      var caPoints = data.years.map(function (year, i) {
        return x(year) + ',' + y(data.california[i], minY, maxY);
      }).join(' ');
      var synthPoints = data.years.map(function (year, i) {
        return x(year) + ',' + y(data.synthetic[i], minY, maxY);
      }).join(' ');
      el('polyline', { points: synthPoints, class: 'ch15-line-synth' }, svg);
      el('polyline', { points: caPoints, class: 'ch15-line-ca' }, svg);

      el('line', { x1: x(1988), y1: m.t, x2: x(1988), y2: H - m.b, class: 'ch15-prop-line' }, svg);
      var propLabel = el('text', { x: x(1988) + 5, y: m.t + 10, class: 'ch15-prop-label' }, svg);
      propLabel.textContent = 'Prop 99';

      el('line', { x1: m.l + 6, y1: 20, x2: m.l + 24, y2: 20, stroke: 'var(--red)', 'stroke-width': 2 }, svg);
      var legA = el('text', { x: m.l + 30, y: 23, class: 'ch15-legend' }, svg);
      legA.textContent = 'CA';
      el('line', { x1: m.l + 120, y1: 20, x2: m.l + 138, y2: 20, stroke: 'var(--blue)', 'stroke-width': 1.6, 'stroke-dasharray': '4 3' }, svg);
      var legB = el('text', { x: m.l + 144, y: 23, class: 'ch15-legend' }, svg);
      legB.textContent = 'synth';
    } else {
      var minG = -35;
      var maxG = 30;
      [-30, -15, 0, 15, 30].forEach(function (tick) {
        el('line', { x1: m.l, y1: y(tick, minG, maxG), x2: W - m.r, y2: y(tick, minG, maxG), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
        var label = el('text', { x: m.l - 8, y: y(tick, minG, maxG) + 3, 'text-anchor': 'end', class: 'ch15-tick' }, svg);
        label.textContent = String(tick);
      });
      var gapPoints = data.years.map(function (year, i) {
        return x(year) + ',' + y(data.effect[i], minG, maxG);
      }).join(' ');
      el('polyline', { points: gapPoints, class: 'ch15-line-gap' }, svg);
      el('line', { x1: m.l, y1: y(0, minG, maxG), x2: W - m.r, y2: y(0, minG, maxG), stroke: 'var(--ink-2)', 'stroke-width': 1 }, svg);
      el('line', { x1: x(1988), y1: m.t, x2: x(1988), y2: H - m.b, class: 'ch15-prop-line' }, svg);
      var propLabel2 = el('text', { x: x(1988) + 5, y: m.t + 10, class: 'ch15-prop-label' }, svg);
      propLabel2.textContent = 'Prop 99';
    }

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    [1970, 1980, 1988, 2000].forEach(function (year) {
      var label = el('text', { x: x(year), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch15-tick' }, svg);
      label.textContent = String(year);
    });
    var axisTitle = el('text', {
      x: m.l + plotW / 2, y: H - 4,
      'text-anchor': 'middle', class: 'ch15-axis-title'
    }, svg);
    axisTitle.textContent = currentView === 'levels'
      ? 'cigarette sales \u00b7 packs per capita'
      : 'California \u2212 synthetic';

    labelEl.textContent = currentView === 'levels' ? 'Effect in 2000' : 'Gap in 2000';
    valueEl.textContent = signed(data.californiaEffect2000, 1);
    statusEl.textContent = currentView === 'levels'
      ? 'levels \u00b7 California vs synthetic'
      : 'gap \u00b7 California \u2212 synthetic';
    noteEl.textContent = currentView === 'levels'
      ? 'the gap is the treatment effect.'
      : 'below zero means fewer packs than the counterfactual.';
    weightsEl.textContent = data.weights
      .slice()
      .sort(function (a, b) { return b.weight - a.weight; })
      .slice(0, 2)
      .map(function (item) { return item.state + ': ' + (item.weight * 100).toFixed(1) + '%'; })
      .join(' \u00b7 ');
    buttons.forEach(function (button) {
      var on = button.getAttribute('data-view') === currentView;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      currentView = button.getAttribute('data-view');
      drawPath();
    });
  });

  /* ---------------------------------------------------------- placebos */
  function drawPlacebos() {
    placeboMount.innerHTML = '';
    var W = 640;
    var H = 250;
    var m = { l: 44, r: 28, t: 30, b: 44 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minX = -30;
    var maxX = 40;
    var bins = 14;
    var binWidth = (maxX - minX) / bins;
    var counts = new Array(bins).fill(0);
    data.placeboEffects.forEach(function (effect) {
      var index = Math.floor((effect - minX) / binWidth);
      if (index < 0) index = 0;
      if (index >= bins) index = bins - 1;
      counts[index] += 1;
    });
    var maxCount = Math.max.apply(null, counts);

    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, placeboMount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }
    function y(value) {
      return m.t + plotH - (value / maxCount) * plotH;
    }

    [-30, -20, -10, 0, 10, 20, 30, 40].forEach(function (tick) {
      el('line', { x1: x(tick), y1: m.t, x2: x(tick), y2: H - m.b, stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: x(tick), y: H - m.b + 15, 'text-anchor': 'middle', class: 'ch15-tick' }, svg);
      label.textContent = String(tick);
    });

    counts.forEach(function (count, i) {
      var x0 = m.l + (i / bins) * plotW;
      el('rect', {
        x: x0 + 1, y: y(count),
        width: Math.max(1, plotW / bins - 2),
        height: Math.max(0, H - m.b - y(count)),
        class: 'placebo-bar'
      }, svg);
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    var caX = x(data.californiaEffect2000);
    el('line', { x1: caX, y1: m.t, x2: caX, y2: H - m.b, class: 'placebo-ca-line' }, svg);
    var caLabel = el('text', { x: caX + 5, y: m.t + 12, class: 'placebo-ca-label' }, svg);
    caLabel.textContent = 'CA \u221224.8';

    var axisTitle = el('text', {
      x: m.l + plotW / 2, y: H - 4,
      'text-anchor': 'middle', class: 'ch15-axis-title'
    }, svg);
    axisTitle.textContent = 'placebo effect in 2000';

    var pLabel = el('text', { x: W - m.r, y: 20, 'text-anchor': 'end', class: 'ch15-tick' }, svg);
    pLabel.textContent = 'p \u2248 ' + data.pValue.toFixed(3) + ' \u00b7 ' + data.placeboEffects.length + ' placebos';
  }

  drawWeights();
  drawPath();
  drawPlacebos();
})(window);

