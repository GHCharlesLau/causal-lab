/* ============================================================
   Chapter 16 — sharp RD, fuzzy RD, and the McCrary density.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch16Data;
  var models = global.Ch16Models;
  var sharpMount = doc.getElementById('ch16-sharp-chart');
  var fuzzyMount = doc.getElementById('ch16-fuzzy-chart');
  var mccraryMount = doc.getElementById('ch16-mccrary');
  if (!data || !models || !sharpMount || !fuzzyMount) return;

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
    var text = Math.abs(value).toFixed(digits == null ? 2 : digits);
    return (value >= 0 ? '+' : '\u2212') + text;
  }

  /* ---------------------------------------------------------- sharp RD */
  var sharpOutcome = 'all';
  var sharpBandwidth = 'full';
  var sharpButtons = Array.prototype.slice.call(doc.querySelectorAll('#lab-sharp .ch16-preset'));
  var sharpStatus = doc.getElementById('ch16-sharp-status');
  var sharpLabel = doc.getElementById('ch16-sharp-label');
  var sharpJump = doc.getElementById('ch16-sharp-jump');
  var sharpSub = doc.getElementById('ch16-sharp-sub');
  var sharpMode = doc.getElementById('ch16-sharp-mode');
  var sharpBandwidthEl = doc.getElementById('ch16-sharp-bandwidth');
  var sharpNote = doc.getElementById('ch16-sharp-note');

  var domains = {
    all: [60, 120],
    mva: [10, 50],
    suicide: [4, 25]
  };
  var outcomeNames = {
    all: 'All causes',
    mva: 'Car accidents',
    suicide: 'Suicide'
  };

  function drawSharp() {
    sharpMount.innerHTML = '';
    var W = 640;
    var H = 320;
    var m = { l: 52, r: 30, t: 38, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minX = -2;
    var maxX = 2;
    var domain = domains[sharpOutcome];
    var minY = domain[0];
    var maxY = domain[1];
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, sharpMount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }
    function y(value) {
      return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH;
    }

    var yTicks = sharpOutcome === 'all' ? [60, 80, 100, 120]
      : sharpOutcome === 'mva' ? [10, 20, 30, 40, 50]
      : [5, 10, 15, 20, 25];
    yTicks.forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch16-tick' }, svg);
      label.textContent = String(tick);
    });
    [-2, -1, 0, 1, 2].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch16-tick' }, svg);
      label.textContent = String(tick);
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch16-axis-title' }, svg);
    xTitle.textContent = 'age centered at 21';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2, 'text-anchor': 'middle',
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')', class: 'ch16-axis-title'
    }, svg);
    yTitle.textContent = 'deaths per 100,000';

    var rows = data.drinking.rows;
    rows.forEach(function (row) {
      el('circle', { cx: x(row.age), cy: y(row[sharpOutcome]), r: 3.2, class: 'rdd-dot' }, svg);
    });

    var coef = data.drinking.sharp[sharpOutcome][sharpBandwidth];
    var belowStart = x(-1.931507);
    var aboveEnd = x(1.931507);
    el('line', {
      x1: belowStart, y1: y(coef.intercept + coef.slope * -1.931507),
      x2: x(0), y2: y(coef.intercept),
      class: 'rdd-line-below'
    }, svg);
    el('line', {
      x1: x(0), y1: y(coef.intercept + coef.jump),
      x2: aboveEnd, y2: y(coef.intercept + coef.jump + (coef.slope + coef.interaction) * 1.931507),
      class: 'rdd-line-above'
    }, svg);
    el('line', { x1: x(0), y1: m.t, x2: x(0), y2: H - m.b, class: 'rdd-threshold-line' }, svg);

    var belowY = y(coef.intercept);
    var aboveY = y(coef.intercept + coef.jump);
    el('line', { x1: x(0) + 8, y1: belowY, x2: x(0) + 8, y2: aboveY, class: 'rdd-jump-bracket' }, svg);
    el('line', { x1: x(0) + 3, y1: belowY, x2: x(0) + 13, y2: belowY, class: 'rdd-jump-bracket' }, svg);
    el('line', { x1: x(0) + 3, y1: aboveY, x2: x(0) + 13, y2: aboveY, class: 'rdd-jump-bracket' }, svg);
    var jumpLabel = el('text', {
      x: x(0) + 18, y: (belowY + aboveY) / 2 + 4, class: 'rdd-jump-label'
    }, svg);
    jumpLabel.textContent = signed(coef.jump, 2);

    el('line', { x1: m.l + 8, y1: 20, x2: m.l + 24, y2: 20, stroke: 'var(--ink)', 'stroke-width': 2 }, svg);
    var legA = el('text', { x: m.l + 30, y: 23, class: 'rdd-legend' }, svg);
    legA.textContent = 'below';
    el('line', { x1: m.l + 92, y1: 20, x2: m.l + 108, y2: 20, stroke: 'var(--red)', 'stroke-width': 2 }, svg);
    var legB = el('text', { x: m.l + 114, y: 23, class: 'rdd-legend' }, svg);
    legB.textContent = 'above';

    sharpLabel.textContent = 'Jump at 21';
    sharpJump.textContent = signed(coef.jump, 2);
    sharpSub.textContent = coef.pct.toFixed(1) + '% of the below-cutoff mean';
    sharpStatus.textContent = outcomeNames[sharpOutcome] + ' \u00b7 ' + (sharpBandwidth === 'full' ? 'full sample' : 'kernel h=1');
    sharpMode.textContent = sharpBandwidth === 'full' ? 'full sample' : 'kernel h=1';
    sharpBandwidthEl.textContent = sharpBandwidth === 'full' ? 'all' : 'h=1';
    sharpNote.textContent = sharpBandwidth === 'full'
      ? 'the jump is the effect at the cutoff.'
      : 'triangular weights emphasize the points closest to 21.';
    sharpButtons.forEach(function (button) {
      var isOutcome = button.hasAttribute('data-outcome');
      var on = isOutcome
        ? button.getAttribute('data-outcome') === sharpOutcome
        : button.getAttribute('data-bandwidth') === sharpBandwidth;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  doc.querySelectorAll('#lab-sharp [data-outcome]').forEach(function (button) {
    button.addEventListener('click', function () {
      sharpOutcome = button.getAttribute('data-outcome');
      drawSharp();
    });
  });
  doc.querySelectorAll('#lab-sharp [data-bandwidth]').forEach(function (button) {
    button.addEventListener('click', function () {
      sharpBandwidth = button.getAttribute('data-bandwidth');
      drawSharp();
    });
  });

  /* ---------------------------------------------------------- fuzzy RD */
  var fuzzyView = 'first';
  var fuzzyButtons = Array.prototype.slice.call(doc.querySelectorAll('#lab-fuzzy .ch16-preset'));
  var fuzzyStatus = doc.getElementById('ch16-fuzzy-status');
  var fuzzyLabel = doc.getElementById('ch16-fuzzy-label');
  var fuzzyValue = doc.getElementById('ch16-fuzzy-value');
  var fuzzySub = doc.getElementById('ch16-fuzzy-sub');
  var fuzzyWald = doc.getElementById('ch16-fuzzy-wald');
  var fuzzyCi = doc.getElementById('ch16-fuzzy-ci');
  var fuzzyNote = doc.getElementById('ch16-fuzzy-note');

  function drawFuzzy() {
    fuzzyMount.innerHTML = '';
    var W = 640;
    var H = 320;
    var m = { l: 56, r: 30, t: 38, b: 50 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minX = -30;
    var maxX = 15;
    var isFirst = fuzzyView === 'first';
    var minY = isFirst ? 0 : 5000;
    var maxY = isFirst ? 1 : 20000;
    var coef = isFirst ? data.sheepskin.firstCoef : data.sheepskin.earningsCoef;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, fuzzyMount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }
    function y(value) {
      return m.t + plotH - ((value - minY) / (maxY - minY)) * plotH;
    }

    var yTicks = isFirst ? [0, 0.25, 0.5, 0.75, 1] : [5000, 10000, 15000, 20000];
    yTicks.forEach(function (tick) {
      el('line', { x1: m.l, y1: y(tick), x2: W - m.r, y2: y(tick), stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
      var label = el('text', { x: m.l - 8, y: y(tick) + 3, 'text-anchor': 'end', class: 'ch16-tick' }, svg);
      label.textContent = isFirst ? tick.toFixed(2) : '$' + (tick / 1000) + 'k';
    });
    [-30, -20, -10, 0, 10].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 16, 'text-anchor': 'middle', class: 'ch16-tick' }, svg);
      label.textContent = String(tick);
    });

    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);
    el('line', { x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var xTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch16-axis-title' }, svg);
    xTitle.textContent = 'test score relative to cutoff';

    data.sheepskin.rows.forEach(function (row) {
      var value = isFirst ? row.diploma : row.earnings;
      el('circle', {
        cx: x(row.score), cy: y(value),
        r: row.n >= 100 ? 4.5 : 3.2, class: 'rdd-dot'
      }, svg);
    });

    el('line', {
      x1: x(-30), y1: y(coef[0] + coef[1] * -30),
      x2: x(0), y2: y(coef[0]),
      class: 'rdd-line-below'
    }, svg);
    el('line', {
      x1: x(0), y1: y(coef[0] + coef[2]),
      x2: x(15), y2: y(coef[0] + coef[2] + (coef[1] + coef[3]) * 15),
      class: 'rdd-line-above'
    }, svg);
    el('line', { x1: x(0), y1: m.t, x2: x(0), y2: H - m.b, class: 'rdd-threshold-line' }, svg);

    var jumpLabel = el('text', {
      x: x(0) + 10, y: y(coef[0] + coef[2]) + 4, class: 'rdd-jump-label'
    }, svg);
    jumpLabel.textContent = isFirst ? '+0.277' : '\u221297.8';

    fuzzyLabel.textContent = isFirst ? 'Diploma jump' : 'Earnings jump';
    fuzzyValue.textContent = isFirst ? '+27.7 pp' : '\u221297.8';
    fuzzySub.textContent = isFirst ? 'first stage at the cutoff' : 'reduced form at the cutoff';
    fuzzyStatus.textContent = isFirst ? 'first stage \u00b7 +27.7 pp' : 'earnings \u00b7 \u221297.8';
    fuzzyWald.textContent = '\u2212352.8';
    fuzzyCi.textContent = '95% CI (\u22123235, 1383)';
    fuzzyNote.textContent = isFirst
      ? 'crossing the cutoff raises the diploma probability.'
      : 'the earnings jump is not significant.';
    fuzzyButtons.forEach(function (button) {
      var on = button.getAttribute('data-view') === fuzzyView;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  fuzzyButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      fuzzyView = button.getAttribute('data-view');
      drawFuzzy();
    });
  });

  /* ---------------------------------------------------------- McCrary */
  function drawMccrary() {
    if (!mccraryMount) return;
    mccraryMount.innerHTML = '';
    var W = 640;
    var H = 240;
    var m = { l: 44, r: 26, t: 28, b: 42 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var rows = data.sheepskin.rows;
    var minX = -30;
    var maxX = 15;
    var maxN = Math.max.apply(null, rows.map(function (row) { return row.n; }));
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, mccraryMount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }
    function y(value) {
      return m.t + plotH - (value / maxN) * plotH;
    }

    [-30, -20, -10, 0, 10].forEach(function (tick) {
      var label = el('text', { x: x(tick), y: H - m.b + 15, 'text-anchor': 'middle', class: 'ch16-tick' }, svg);
      label.textContent = String(tick);
    });
    el('line', { x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.2 }, svg);

    var barW = plotW / rows.length;
    rows.forEach(function (row) {
      el('rect', {
        x: x(row.score) - barW / 2 + 0.5,
        y: y(row.n),
        width: Math.max(1, barW - 1.5),
        height: Math.max(0, H - m.b - y(row.n)),
        class: 'mccrary-bar'
      }, svg);
    });
    el('line', { x1: x(0), y1: m.t, x2: x(0), y2: H - m.b, class: 'mccrary-threshold' }, svg);

    var label = el('text', { x: x(0) + 5, y: m.t + 10, class: 'ch16-tick' }, svg);
    label.textContent = 'cutoff';
    var axisTitle = el('text', { x: m.l + plotW / 2, y: H - 4, 'text-anchor': 'middle', class: 'ch16-axis-title' }, svg);
    axisTitle.textContent = 'students per score cell';
  }

  drawSharp();
  drawFuzzy();
  drawMccrary();
})(window);
