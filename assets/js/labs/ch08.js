/* ============================================================
   Chapter 08 â€” the seasonal first stage, the IV ratio, and the
   weak-instrument simulation.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch08Data;
  var models = global.Ch08Models;
  var seasonMount = doc.getElementById('ch08-season-chart');
  var ratioMount = doc.getElementById('ch08-ratio-chart');
  var weakMount = doc.getElementById('ch08-weak-chart');
  if (!data || !models || !seasonMount || !ratioMount || !weakMount) return;

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

  function fmt(value, digits) {
    return value.toFixed(digits == null ? 4 : digits).replace('-', '\u2212');
  }

  function fmt3(value) {
    return value.toFixed(3).replace('-', '\u2212');
  }

  /* ---------------------------------------------------------- seasonal chart */
  var quarters = [1, 2, 3, 4];
  var colors = ['#a8283a', '#2f5d8a', '#4c6b50', '#a85a3c'];
  var seasonMode = 'education';
  var seasonButtons = Array.prototype.slice.call(doc.querySelectorAll('.season-tab'));

  function drawSeason() {
    seasonMount.innerHTML = '';
    var W = 640;
    var H = 300;
    var m = { l: 54, r: 58, t: 30, b: 42 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minX = 29.5;
    var maxX = 39.5;
    var isEducation = seasonMode === 'education';
    var minY = isEducation ? 12.2 : 5.87;
    var maxY = isEducation ? 13.2 : 5.93;
    var ys = isEducation ? [12.2, 12.4, 12.6, 12.8, 13.0, 13.2] : [5.87, 5.88, 5.89, 5.90, 5.91, 5.92, 5.93];

    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, seasonMount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }
    function y(value) {
      return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH;
    }

    for (var year = 30; year <= 39; year++) {
      el('line', {
        x1: x(year), y1: m.t, x2: x(year), y2: H - m.b,
        stroke: 'var(--rule)', 'stroke-width': 1
      }, svg);
      var tick = el('text', {
        x: x(year), y: H - m.b + 17, 'text-anchor': 'middle', class: 'season-tick'
      }, svg);
      tick.textContent = String(1930 + year - 30);
    }

    ys.forEach(function (value) {
      el('line', {
        x1: m.l, y1: y(value), x2: W - m.r, y2: y(value),
        stroke: 'var(--rule)', 'stroke-width': 1
      }, svg);
      var label = el('text', {
        x: m.l - 8, y: y(value) + 3, 'text-anchor': 'end', class: 'season-tick'
      }, svg);
      label.textContent = isEducation ? value.toFixed(1) : value.toFixed(2);
    });

    el('line', {
      x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b,
      stroke: 'var(--ink)', 'stroke-width': 1.2
    }, svg);
    el('line', {
      x1: m.l, y1: m.t, x2: m.l, y2: H - m.b,
      stroke: 'var(--ink)', 'stroke-width': 1.2
    }, svg);

    quarters.forEach(function (quarter, index) {
      var points = [];
      for (var i = 0; i < data.ak91.groups.year.length; i++) {
        if (data.ak91.groups.quarter[i] !== quarter) continue;
        points.push({
          year: data.ak91.groups.year[i],
          value: isEducation ? data.ak91.groups.years[i] : data.ak91.groups.log_wage[i]
        });
      }
      points.sort(function (a, b) { return a.year - b.year; });
      var d = points.map(function (point, j) {
        return (j === 0 ? 'M' : 'L') + x(point.year).toFixed(2) + ' ' + y(point.value).toFixed(2);
      }).join(' ');
      el('path', { d: d, class: 'season-line', stroke: colors[index] }, svg);
      points.forEach(function (point) {
        el('circle', {
          cx: x(point.year), cy: y(point.value), r: 2.6,
          fill: colors[index], class: 'season-dot'
        }, svg);
      });

    });

    quarters.forEach(function (quarter, index) {
      var lx = m.l + index * 62;
      el('line', {
        x1: lx, y1: 18, x2: lx + 16, y2: 18,
        stroke: colors[index], 'stroke-width': 1.8
      }, svg);
      var legend = el('text', {
        x: lx + 21, y: 21, class: 'season-label'
      }, svg);
      legend.textContent = 'Q' + quarter;
    });

    var xTitle = el('text', {
      x: m.l + plotW / 2, y: H - 4,
      'text-anchor': 'middle', class: 'season-axis-title'
    }, svg);
    xTitle.textContent = 'birth year \u00b7 1930s';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2,
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')',
      'text-anchor': 'middle', class: 'season-axis-title'
    }, svg);
    yTitle.textContent = isEducation ? 'years of schooling' : 'log weekly wage';
  }

  seasonButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      seasonMode = button.getAttribute('data-mode');
      seasonButtons.forEach(function (other) {
        var on = other === button;
        other.classList.toggle('is-active', on);
        other.setAttribute('aria-pressed', String(on));
      });
      drawSeason();
    });
  });

  /* ---------------------------------------------------------- ratio bench */
  var ratioCurrent = 'q4';
  var ratioButtons = Array.prototype.slice.call(doc.querySelectorAll('#lab-ratio .ch08-preset'));
  var ratioCoef = doc.getElementById('ch08-ratio-coef');
  var ratioSe = doc.getElementById('ch08-ratio-se');
  var ratioCi = doc.getElementById('ch08-ratio-ci');
  var ratioFirst = doc.getElementById('ch08-ratio-first');
  var ratioReduced = doc.getElementById('ch08-ratio-reduced');
  var ratioLabel = doc.getElementById('ch08-ratio-label');
  var ratioStatus = doc.getElementById('ch08-ratio-status');
  var ratioNote = doc.getElementById('ch08-ratio-note');

  function drawRatio() {
    var model = models.models[ratioCurrent];
    ratioMount.innerHTML = '';
    var W = 640;
    var H = 290;
    var m = { l: 86, r: 24, t: 30, b: 46 };
    var plotW = W - m.l - m.r;
    var axisY = H - 42;
    var minX = 0.02;
    var maxX = 0.16;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, ratioMount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }

    [0.04, 0.08, 0.12, 0.16].forEach(function (tick) {
      el('line', {
        x1: x(tick), y1: m.t, x2: x(tick), y2: axisY,
        stroke: 'var(--rule)', 'stroke-width': 1
      }, svg);
      var label = el('text', {
        x: x(tick), y: axisY + 16, 'text-anchor': 'middle', class: 'ch08-tick'
      }, svg);
      label.textContent = tick.toFixed(2);
    });

    el('line', {
      x1: m.l, y1: axisY, x2: W - m.r, y2: axisY,
      stroke: 'var(--ink)', 'stroke-width': 1.2
    }, svg);

    ['q4', 'many', 'ols'].forEach(function (key, i) {
      var row = models.models[key];
      var y = 64 + i * 62;
      var current = key === ratioCurrent;
      var group = el('g', { class: 'ch08-row' + (current ? ' is-current' : '') }, svg);
      var label = el('text', {
        x: m.l - 10, y: y + 4, 'text-anchor': 'end', class: 'ch08-row-label'
      }, group);
      label.textContent = row.short;

      el('line', {
        x1: x(row.lo), y1: y, x2: x(row.hi), y2: y, class: 'ch08-row-line'
      }, group);
      [row.lo, row.hi].forEach(function (edge) {
        el('line', {
          x1: x(edge), y1: y - 5, x2: x(edge), y2: y + 5, class: 'ch08-row-line'
        }, group);
      });
      el('circle', { cx: x(row.coef), cy: y, r: current ? 5 : 3.5, class: 'ch08-row-dot' }, group);
      var value = el('text', {
        x: x(row.coef), y: y - 11, 'text-anchor': 'middle', class: 'ch08-row-value'
      }, group);
      value.textContent = row.coef.toFixed(4);
    });

    var title = el('text', {
      x: m.l + plotW / 2, y: H - 4,
      'text-anchor': 'middle', class: 'ch08-axis-title'
    }, svg);
    title.textContent = 'return per year of schooling \u00b7 95% CI';
  }

  function setRatio(key) {
    ratioCurrent = key;
    var model = models.models[key];
    ratioCoef.textContent = model.coef.toFixed(4);
    ratioSe.textContent = model.se.toFixed(4);
    ratioCi.textContent = '(' + model.lo.toFixed(4) + ', ' + model.hi.toFixed(4) + ')';
    ratioFirst.textContent = model.first == null ? '\u2014' : model.first.toFixed(4);
    ratioReduced.textContent = model.reduced == null ? '\u2014' : model.reduced.toFixed(4);
    ratioLabel.textContent = model.label;
    ratioStatus.textContent = model.label.toLowerCase() + ' \u00b7 329,509 workers';
    ratioNote.textContent = model.note;
    ratioButtons.forEach(function (button) {
      var on = button.getAttribute('data-model') === key;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
    drawRatio();
  }

  ratioButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setRatio(button.getAttribute('data-model'));
    });
  });

  /* ---------------------------------------------------------- weak instruments */
  var points = data.weak.points;
  var weakSlider = doc.getElementById('ch08-weak-slider');
  var weakAte = doc.getElementById('ch08-weak-ate');
  var weakSe = doc.getElementById('ch08-weak-se');
  var weakCorr = doc.getElementById('ch08-weak-corr');
  var weakCi = doc.getElementById('ch08-weak-ci');
  var weakStatus = doc.getElementById('ch08-weak-status');
  var weakNote = doc.getElementById('ch08-weak-note');
  var weakSelected = 0;

  function drawWeak() {
    weakMount.innerHTML = '';
    var W = 640;
    var H = 300;
    var m = { l: 54, r: 26, t: 30, b: 46 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minX = 0;
    var maxX = 1;
    var minY = 1.2;
    var maxY = 2.9;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, weakMount);

    function x(value) { return m.l + ((value - minX) / (maxX - minX)) * plotW; }
    function y(value) { return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH; }

    [0, 0.25, 0.5, 0.75, 1].forEach(function (tick) {
      el('line', {
        x1: x(tick), y1: m.t, x2: x(tick), y2: H - m.b,
        stroke: 'var(--rule)', 'stroke-width': 1
      }, svg);
      var label = el('text', {
        x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch08-tick'
      }, svg);
      label.textContent = tick.toFixed(2);
    });
    [1.4, 1.8, 2.2, 2.6].forEach(function (tick) {
      el('line', {
        x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick),
        stroke: 'var(--rule)', 'stroke-width': 1
      }, svg);
      var label = el('text', {
        x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch08-tick'
      }, svg);
      label.textContent = tick.toFixed(1);
    });

    el('line', {
      x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b,
      stroke: 'var(--ink)', 'stroke-width': 1.2
    }, svg);
    el('line', {
      x1: m.l, y1: m.t, x2: m.l, y2: H - m.b,
      stroke: 'var(--ink)', 'stroke-width': 1.2
    }, svg);

    el('line', {
      x1: m.l, y1: y(2), x2: W - m.r, y2: y(2), class: 'weak-true'
    }, svg);
    var trueLabel = el('text', {
      x: W - m.r, y: y(2) - 7, 'text-anchor': 'end', class: 'ch08-axis-title'
    }, svg);
    trueLabel.textContent = 'true effect 2.0';

    points.forEach(function (point, index) {
      el('circle', {
        cx: x(point.corr), cy: y(point.ate), r: index === weakSelected ? 6 : 3,
        class: 'weak-dot' + (index === weakSelected ? ' is-selected' : '')
      }, svg);
    });

    var selected = points[weakSelected];
    el('line', {
      x1: x(selected.corr), y1: y(selected.ate - 1.96 * selected.se),
      x2: x(selected.corr), y2: y(selected.ate + 1.96 * selected.se),
      class: 'weak-ci'
    }, svg);
    [selected.ate - 1.96 * selected.se, selected.ate + 1.96 * selected.se].forEach(function (edge) {
      el('line', {
        x1: x(selected.corr) - 5, y1: y(edge), x2: x(selected.corr) + 5, y2: y(edge),
        class: 'weak-ci'
      }, svg);
    });

    el('text', {
      x: m.l + plotW / 2, y: H - 4,
      'text-anchor': 'middle', class: 'ch08-axis-title'
    }, svg).textContent = 'correlation between the instrument and treatment';
    el('text', {
      x: 12, y: m.t + plotH / 2,
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')',
      'text-anchor': 'middle', class: 'ch08-axis-title'
    }, svg).textContent = 'IV estimate';
  }

  function setWeak() {
    var value = Number(weakSlider.value);
    weakSelected = 49 - value;
    var point = points[weakSelected];
    weakAte.textContent = fmt3(point.ate);
    weakSe.textContent = fmt3(point.se);
    weakCorr.textContent = point.corr.toFixed(4);
    weakCi.textContent = '(' + fmt3(point.ate - 1.96 * point.se) + ', ' + fmt3(point.ate + 1.96 * point.se) + ')';
    var strength = point.corr >= 0.9 ? 'strongest' : point.corr >= 0.5 ? 'strong' : point.corr >= 0.2 ? 'weakening' : 'weak';
    weakStatus.textContent = 'corr ' + point.corr.toFixed(2) + ' \u00b7 ' + strength;
    weakNote.textContent = point.corr >= 0.9
      ? 'even the strongest instrument is biased.'
      : point.corr >= 0.2
        ? 'the first stage is weakening.'
        : 'the denominator is tiny; the estimate wanders.';
    drawWeak();
  }

  if (weakSlider) {
    weakSlider.addEventListener('input', setWeak);
  }

  drawSeason();
  setRatio('q4');
  setWeak();
})(window);


