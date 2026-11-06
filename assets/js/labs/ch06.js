/* ============================================================
   Chapter 06 Ã¢â‚¬â€ weighted cells and the dummy staircase.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch06Data;
  var ols = global.Ch05OLS;
  var weightMount = doc.getElementById('ch06-weight-chart');
  var dummyMount = doc.getElementById('ch06-dummy-chart');
  if (!data || !ols || !weightMount || !dummyMount) return;

  var NS = 'http://www.w3.org/2000/svg';

  function svgEl(name, attrs, parent) {
    var node = doc.createElementNS(NS, name);
    if (attrs) {
      for (var key in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, key)) node.setAttribute(key, attrs[key]);
      }
    }
    if (parent) parent.appendChild(node);
    return node;
  }

  var map = {};
  var levels = [];
  for (var i = 0; i < data.n; i++) {
    var e = data.educ[i];
    if (!map[e]) {
      map[e] = { educ: e, count: 0, lhwage: 0, hwage: 0 };
      levels.push(e);
    }
    map[e].count += 1;
    map[e].lhwage += data.lhwage[i];
    map[e].hwage += data.hwage[i];
  }
  levels.sort(function (a, b) { return a - b; });
  var groups = {
    n: levels.length,
    educ: levels,
    lhwage: levels.map(function (level) { return map[level].lhwage / map[level].count; }),
    hwage: levels.map(function (level) { return map[level].hwage / map[level].count; }),
    count: levels.map(function (level) { return map[level].count; })
  };

  var weightedFit = ols.wls(groups, 'lhwage', ['educ'], groups.count);
  var unweightedFit = ols.ols(groups, 'lhwage', ['educ']);
  var weighted = true;
  var T95 = 2.306004; // t(0.975, df=8) for the 10-cell regression

  var weightCoef = doc.getElementById('ch06-weight-coef');
  var weightCi = doc.getElementById('ch06-weight-ci');
  var weightMode = doc.getElementById('ch06-weight-mode');
  var weightStatus = doc.getElementById('ch06-weight-status');
  var weightNote = doc.getElementById('ch06-weight-note');
  var weightToggle = doc.getElementById('ch06-weight-toggle');

  function fmt(value, digits) {
    return value.toFixed(digits == null ? 4 : digits).replace('-', '\u2212');
  }

  function fmtSigned(value) {
    return (value >= 0 ? '+' : '\u2212') + Math.abs(value).toFixed(2);
  }

  function axis(svg, xScale, yScale, xTicks, yTicks, W, H, m) {
    xTicks.forEach(function (value) {
      svgEl('line', {
        x1: xScale(value), y1: m.t, x2: xScale(value), y2: H - m.b,
        stroke: 'var(--rule)', 'stroke-width': 1
      }, svg);
      var label = svgEl('text', {
        x: xScale(value), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch06-tick'
      }, svg);
      label.textContent = String(value);
    });
    yTicks.forEach(function (value) {
      svgEl('line', {
        x1: m.l, y1: yScale(value), x2: W - m.r, y2: yScale(value),
        stroke: 'var(--rule)', 'stroke-width': 1
      }, svg);
      var label = svgEl('text', {
        x: m.l - 9, y: yScale(value) + 3, 'text-anchor': 'end', class: 'ch06-tick'
      }, svg);
      label.textContent = String(value);
    });
    svgEl('line', {
      x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b,
      stroke: 'var(--ink)', 'stroke-width': 1.2
    }, svg);
    svgEl('line', {
      x1: m.l, y1: m.t, x2: m.l, y2: H - m.b,
      stroke: 'var(--ink)', 'stroke-width': 1.2
    }, svg);
  }

  function drawWeight() {
    var W = 640;
    var H = 320;
    var m = { l: 54, r: 22, t: 34, b: 46 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minX = 8.5;
    var maxX = 18.5;
    var minY = 2.75;
    var maxY = 3.30;
    var svg = svgEl('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, weightMount);
    weightMount.innerHTML = '';
    weightMount.appendChild(svg);

    function x(value) { return m.l + ((value - minX) / (maxX - minX)) * plotW; }
    function y(value) { return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH; }

    axis(svg, x, y, [9, 10, 11, 12, 13, 14, 15, 16, 17, 18], [2.8, 2.9, 3.0, 3.1, 3.2, 3.3], W, H, m);

    groups.educ.forEach(function (level, index) {
      var radius = 4 + 18 * Math.sqrt(groups.count[index] / 393);
      svgEl('circle', {
        cx: x(level), cy: y(groups.lhwage[index]), r: radius, class: 'weight-bubble'
      }, svg);
      if (groups.count[index] >= 100) {
        var value = svgEl('text', {
          x: x(level), y: y(groups.lhwage[index]) + 3,
          'text-anchor': 'middle', class: 'weight-value'
        }, svg);
        value.textContent = String(groups.count[index]);
      }
    });

    [unweightedFit, weightedFit].forEach(function (fit, index) {
      var isWeighted = index === 1;
      var active = isWeighted === weighted;
      svgEl('line', {
        x1: x(9), y1: y(fit.intercept + fit.coef * 9),
        x2: x(18), y2: y(fit.intercept + fit.coef * 18),
        class: 'weight-line ' +
          (isWeighted ? 'weight-line--weighted' : 'weight-line--unweighted') +
          (active ? '' : ' is-muted')
      }, svg);
    });

    svgEl('line', { x1: m.l, y1: 18, x2: m.l + 18, y2: 18, class: 'weight-line weight-line--weighted' }, svg);
    var legendA = svgEl('text', { x: m.l + 24, y: 21, class: 'weight-legend' }, svg);
    legendA.textContent = 'weighted';
    svgEl('line', { x1: m.l + 92, y1: 18, x2: m.l + 110, y2: 18, class: 'weight-line weight-line--unweighted' }, svg);
    var legendB = svgEl('text', { x: m.l + 116, y: 21, class: 'weight-legend' }, svg);
    legendB.textContent = 'equal cells';

    var axisTitle = svgEl('text', {
      x: m.l + plotW / 2, y: H - 5,
      'text-anchor': 'middle', class: 'ch06-axis-title'
    }, svg);
    axisTitle.textContent = 'years of education \u00b7 mean log wage';
  }

  function setWeight() {
    var fit = weighted ? weightedFit : unweightedFit;
    weightCoef.textContent = fit.coef.toFixed(4);
    weightCi.textContent = '(' + fmt(fit.coef - T95 * fit.se) + ', ' + fmt(fit.coef + T95 * fit.se) + ')';
    weightMode.textContent = weighted ? 'count' : 'equal';
    weightStatus.textContent = (weighted ? 'weighted' : 'unweighted') +
      ' \u00b7 10 cells \u00b7 935 workers';
    weightNote.textContent = weighted
      ? 'the 393 at 12 years dominate.'
      : 'every cell gets one vote.';
    drawWeight();
  }

  if (weightToggle) {
    weightToggle.addEventListener('change', function () {
      weighted = weightToggle.checked;
      setWeight();
    });
  }

  /* ---------------------------------------------------------- dummy staircase */
  var selected = 17;
  var dummyMean = doc.getElementById('ch06-dummy-mean');
  var dummyDiff = doc.getElementById('ch06-dummy-diff');
  var dummyCell = doc.getElementById('ch06-dummy-cell');
  var dummyWorkers = doc.getElementById('ch06-dummy-workers');
  var dummyStatus = doc.getElementById('ch06-dummy-status');
  var dummyNote = doc.getElementById('ch06-dummy-note');
  var baseline = groups.hwage[0];

  function drawDummy() {
    var W = 640;
    var H = 300;
    var m = { l: 54, r: 22, t: 34, b: 46 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minX = 8.5;
    var maxX = 18.5;
    var minY = 17;
    var maxY = 29.5;
    var svg = svgEl('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'group',
      'aria-label': 'Cell means of hourly wage by years of education. Click a dot to compare with the baseline.'
    }, dummyMount);
    dummyMount.innerHTML = '';
    dummyMount.appendChild(svg);

    function x(value) { return m.l + ((value - minX) / (maxX - minX)) * plotW; }
    function y(value) { return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH; }

    axis(svg, x, y, [9, 10, 11, 12, 13, 14, 15, 16, 17, 18], [18, 20, 22, 24, 26, 28], W, H, m);

    var selectedIndex = groups.educ.indexOf(selected);
    var selectedX = x(selected);
    svgEl('rect', {
      x: selectedX - (plotW / 10) / 2, y: m.t,
      width: plotW / 10, height: plotH,
      fill: 'var(--red)', opacity: '0.05'
    }, svg);

    var step = [];
    groups.educ.forEach(function (level, index) {
      var left = x(level - 0.5);
      var right = x(level + 0.5);
      var value = y(groups.hwage[index]);
      if (index === 0) step.push('M' + left + ' ' + value);
      step.push('L' + right + ' ' + value);
      if (index < groups.educ.length - 1) {
        step.push('L' + right + ' ' + y(groups.hwage[index + 1]));
      }
    });
    svgEl('path', { d: step.join(' '), class: 'dummy-step' }, svg);

    svgEl('line', {
      x1: m.l, y1: y(baseline), x2: W - m.r, y2: y(baseline),
      class: 'dummy-baseline'
    }, svg);
    var baselineLabel = svgEl('text', {
      x: W - m.r - 4, y: y(baseline) - 6, 'text-anchor': 'end', class: 'dummy-label'
    }, svg);
    baselineLabel.textContent = 'baseline educ=9: ' + baseline.toFixed(2);

    groups.educ.forEach(function (level, index) {
      var isSelected = level === selected;
      var group = svgEl('g', {
        tabindex: '0',
        role: 'button',
        'aria-pressed': String(isSelected),
        'aria-label': 'Education ' + level + ' years, mean hourly wage ' + groups.hwage[index].toFixed(2) +
          ', ' + groups.count[index] + ' workers'
      }, svg);
      svgEl('circle', {
        cx: x(level), cy: y(groups.hwage[index]),
        r: isSelected ? 6.5 : 4.5,
        class: 'dummy-dot' + (isSelected ? ' is-selected' : '')
      }, group);
      svgEl('circle', {
        cx: x(level), cy: y(groups.hwage[index]), r: 15, class: 'dummy-hit'
      }, group);
      var label = svgEl('text', {
        x: x(level), y: H - m.b + 16,
        'text-anchor': 'middle',
        class: 'dummy-cell-label' + (isSelected ? ' is-selected' : '')
      }, group);
      label.textContent = String(level);

      function choose(e) {
        if (e) e.preventDefault();
        selected = level;
        setDummy();
      }
      group.addEventListener('click', choose);
      group.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') choose(event);
      });
    });

    var yTitle = svgEl('text', {
      x: 12, y: m.t + plotH / 2,
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')',
      'text-anchor': 'middle', class: 'ch06-axis-title'
    }, svg);
    yTitle.textContent = 'hourly wage';
  }

  function setDummy() {
    var index = groups.educ.indexOf(selected);
    var value = groups.hwage[index];
    var diff = value - baseline;
    dummyMean.textContent = value.toFixed(2);
    dummyDiff.textContent = fmtSigned(diff);
    dummyCell.textContent = selected + ' years';
    dummyWorkers.textContent = String(groups.count[index]);
    dummyStatus.textContent = 'educ ' + selected + ' \u00b7 ' + value.toFixed(2) + ' \u00b7 ' + fmtSigned(diff);
    dummyNote.textContent = diff >= 0
      ? 'the coefficient is a cell contrast.'
      : 'below the baseline cell.';
    drawDummy();
  }

  setWeight();
  setDummy();
})(window);


