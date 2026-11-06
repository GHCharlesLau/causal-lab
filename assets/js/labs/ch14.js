/* ============================================================
   Chapter 14 — toy fixed effects and the wage coefficient chart.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch14Data;
  var models = global.Ch14Models;
  var toyMount = doc.getElementById('ch14-toy-chart');
  var wageMount = doc.getElementById('ch14-wage-chart');
  if (!data || !models || !toyMount || !wageMount) return;

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

  function fmtSigned(value, digits) {
    var text = Math.abs(value).toFixed(digits);
    return (value >= 0 ? '+' : '\u2212') + text;
  }

  /* ---------------------------------------------------------- toy panel */
  var toyCurrent = 'fe';
  var toyButtons = Array.prototype.slice.call(doc.querySelectorAll('#lab-toy .ch14-preset'));
  var toyLabel = doc.getElementById('ch14-toy-label');
  var toySlope = doc.getElementById('ch14-toy-slope');
  var toyStatus = doc.getElementById('ch14-toy-status');
  var toyNote = doc.getElementById('ch14-toy-note');
  var rows = data.toy.rows;

  function cityClass(city) {
    return 'c' + city.slice(1);
  }

  function drawToy() {
    toyMount.innerHTML = '';
    var W = 640;
    var H = 320;
    var m = { l: 52, r: 30, t: 38, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minX = 0;
    var maxX = 10.5;
    var minY = 4;
    var maxY = 16;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, toyMount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }
    function y(value) {
      return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH;
    }

    [4, 8, 12, 16].forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch14-tick' }, svg);
      label.textContent = String(tick);
    });
    [0, 2, 4, 6, 8, 10].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch14-tick' }, svg);
      label.textContent = String(tick);
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch14-axis-title' }, svg);
    xTitle.textContent = 'marketing costs';
    var yTitle = el('text', { x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle', transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'ch14-axis-title' }, svg);
    yTitle.textContent = 'purchases';

    rows.forEach(function (row) {
      el('circle', {
        cx: x(row.cost), cy: y(row.purchase), r: 5,
        class: 'toy-dot toy-dot--' + cityClass(row.city)
      }, svg);
    });

    var meanX = rows.reduce(function (sum, row) { return sum + row.cost; }, 0) / rows.length;
    var meanY = rows.reduce(function (sum, row) { return sum + row.purchase; }, 0) / rows.length;

    if (toyCurrent === 'pooled') {
      var slope = data.toy.pooledSlope;
      var intercept = meanY - slope * meanX;
      el('line', {
        x1: x(0), y1: y(intercept), x2: x(10), y2: y(intercept + slope * 10),
        class: 'toy-line-pooled'
      }, svg);
    } else {
      var feSlope = data.toy.feSlope;
      var cities = ['C0', 'C1', 'C2', 'C3'];
      cities.forEach(function (city) {
        var subset = rows.filter(function (row) { return row.city === city; });
        var meanC = subset.reduce(function (sum, row) { return sum + row.cost; }, 0) / subset.length;
        var meanP = subset.reduce(function (sum, row) { return sum + row.purchase; }, 0) / subset.length;
        var interceptC = meanP - feSlope * meanC;
        var minC = Math.min.apply(null, subset.map(function (row) { return row.cost; }));
        var maxC = Math.max.apply(null, subset.map(function (row) { return row.cost; }));
        var start = Math.min(maxY, Math.max(minY, interceptC + feSlope * minC));
        var end = Math.min(maxY, Math.max(minY, interceptC + feSlope * maxC));
        el('line', {
          x1: x(minC), y1: y(start), x2: x(maxC), y2: y(end),
          class: 'toy-line-fe toy-line-fe--' + cityClass(city)
        }, svg);
      });
    }

    /* legend */
    var legendX = m.l + 6;
    citiesLegend().forEach(function (item, i) {
      var dot = el('circle', {
        cx: legendX + i * 72, cy: 18, r: 4,
        class: 'toy-dot toy-dot--' + cityClass(item)
      }, svg);
      dot.setAttribute('opacity', '0.9');
      var label = el('text', {
        x: legendX + i * 72 + 10, y: 21, class: 'toy-legend'
      }, svg);
      label.textContent = item;
    });

    function citiesLegend() {
      return ['C0', 'C1', 'C2', 'C3'];
    }

    var comparison = toyCurrent === 'fe'
      ? { label: 'City fixed effects', slope: data.toy.feSlope, status: 'city fixed effects \u00b7 +1.44', note: 'the between-city level differences are absorbed.' }
      : { label: 'Pooled OLS', slope: data.toy.pooledSlope, status: 'pooled OLS \u00b7 \u22120.56', note: 'cities with lower purchases get more marketing, so the pooled slope is negative.' };
    toyLabel.textContent = comparison.label;
    toySlope.textContent = fmtSigned(comparison.slope, 2);
    toyStatus.textContent = comparison.status;
    toyNote.textContent = comparison.note;
    toyButtons.forEach(function (button) {
      var on = button.getAttribute('data-model') === toyCurrent;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  toyButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      toyCurrent = button.getAttribute('data-model');
      drawToy();
    });
  });

  /* ---------------------------------------------------------- wage panel */
  var wageCurrent = 'entity';
  var wageButtons = Array.prototype.slice.call(doc.querySelectorAll('#lab-wage .ch14-preset'));
  var wageLabel = doc.getElementById('ch14-wage-label');
  var wageCoef = doc.getElementById('ch14-wage-coef');
  var wageCi = doc.getElementById('ch14-wage-ci');
  var wageStatus = doc.getElementById('ch14-wage-status');
  var wageNote = doc.getElementById('ch14-wage-note');

  function drawWage() {
    wageMount.innerHTML = '';
    var W = 640;
    var H = 300;
    var m = { l: 86, r: 34, t: 30, b: 52 };
    var plotW = W - m.l - m.r;
    var axisY = H - 44;
    var minX = 0;
    var maxX = 0.20;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, wageMount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }

    [0, 0.05, 0.10, 0.15, 0.20].forEach(function (tick) {
      el('line', { x1: x(tick), y1: m.t, x2: x(tick), y2: axisY, stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: x(tick), y: axisY + 16, 'text-anchor': 'middle', class: 'ch14-tick' }, svg);
      label.textContent = (tick * 100).toFixed(0) + '%';
    });
    el('line', { x1: m.l, y1: axisY, x2: W - m.r, y2: axisY, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    ['pooled', 'entity', 'twoway'].forEach(function (key, i) {
      var model = models.models[key];
      var y = 58 + i * 66;
      var isCurrent = key === wageCurrent;
      var group = el('g', { class: 'wage-row' + (isCurrent ? ' is-current' : '') }, svg);
      var label = el('text', { x: m.l - 10, y: y + 4, 'text-anchor': 'end', class: 'wage-row-label' }, group);
      label.textContent = model.short;

      el('line', { x1: x(model.lo), y1: y, x2: x(model.hi), y2: y, class: 'wage-row-line' }, group);
      [model.lo, model.hi].forEach(function (edge) {
        el('line', { x1: x(edge), y1: y - 5, x2: x(edge), y2: y + 5, class: 'wage-row-line' }, group);
      });
      el('circle', { cx: x(model.coef), cy: y, r: isCurrent ? 5 : 3.5, class: 'wage-row-dot' }, group);
      var value = el('text', { x: x(model.coef), y: y - 11, 'text-anchor': 'middle', class: 'wage-row-value' }, group);
      value.textContent = (model.coef * 100).toFixed(1) + '%';
    });

    var axisTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch14-axis-title' }, svg);
    axisTitle.textContent = 'marriage coefficient \u00b7 95% CI';

    var model = models.models[wageCurrent];
    wageLabel.textContent = model.label;
    wageCoef.textContent = fmtSigned(model.coef * 100, 1) + '%';
    wageCi.textContent = '(' + (model.lo * 100).toFixed(1) + '%, ' + (model.hi * 100).toFixed(1) + '%)';
    wageStatus.textContent = model.status;
    wageNote.textContent = model.note;
    wageButtons.forEach(function (button) {
      var on = button.getAttribute('data-model') === wageCurrent;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  wageButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      wageCurrent = button.getAttribute('data-model');
      drawWage();
    });
  });

  drawToy();
  drawWage();
})(window);
