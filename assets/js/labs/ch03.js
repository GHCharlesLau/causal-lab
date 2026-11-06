/* ============================================================
   Chapter 03 lab: the sampling distribution and the interval ruler.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch02Data;
  var mount = doc.getElementById('ch03-chart');
  if (!mount) return;

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

  function mean(values) {
    if (!values.length) return NaN;
    var total = 0;
    for (var i = 0; i < values.length; i++) total += values[i];
    return total / values.length;
  }

  function variance(values) {
    var m = mean(values);
    var total = 0;
    for (var i = 0; i < values.length; i++) total += (values[i] - m) * (values[i] - m);
    return values.length > 1 ? total / (values.length - 1) : NaN;
  }

  function quantile(values, q) {
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var pos = (sorted.length - 1) * q;
    var base = Math.floor(pos);
    var rest = pos - base;
    if (sorted[base + 1] === undefined) return sorted[base];
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }

  function fmt(value, digits) {
    if (!isFinite(value)) return '\u2014';
    return value.toFixed(digits == null ? 2 : digits).replace('-', '\u2212');
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normalMaker(seed) {
    var rnd = mulberry32(seed);
    var spare = null;
    return function () {
      if (spare !== null) {
        var value = spare;
        spare = null;
        return value;
      }
      var u = 0;
      var v = 0;
      while (u === 0) u = rnd();
      v = rnd();
      var mag = Math.sqrt(-2 * Math.log(u));
      spare = mag * Math.sin(2 * Math.PI * v);
      return mag * Math.cos(2 * Math.PI * v);
    };
  }

  /* ---------------------------------------------------------- sampling simulation */
  var TRUE_MEAN = 74;
  var TRUE_SD = 2;
  var EXPERIMENTS = 400;
  var seedOffset = 0;

  var nSlider = doc.getElementById('ch03-n-slider');
  var nOut = doc.getElementById('ch03-n-out');
  var nReadout = doc.getElementById('ch03-n');
  var seEl = doc.getElementById('ch03-se');
  var simSeEl = doc.getElementById('ch03-sim-se');
  var rangeEl = doc.getElementById('ch03-range');
  var statusEl = doc.getElementById('ch03-status');
  var runBtn = doc.getElementById('ch03-run');

  function drawHist(means, n, theoreticalSe) {
    mount.innerHTML = '';
    var W = 640;
    var H = 320;
    var m = { l: 48, r: 18, t: 28, b: 48 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var minX = 70.5;
    var maxX = 77.5;
    var bins = 28;
    var counts = new Array(bins).fill(0);
    var binWidth = (maxX - minX) / bins;

    means.forEach(function (value) {
      var index = Math.floor((value - minX) / binWidth);
      if (index < 0) index = 0;
      if (index >= bins) index = bins - 1;
      counts[index] += 1;
    });
    var maxCount = Math.max.apply(null, counts);

    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, mount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }
    function yCount(count) {
      return m.t + plotH - (count / maxCount) * plotH * 0.92;
    }

    for (var t = 70; t <= 77; t++) {
      el('line', {
        x1: x(t), y1: m.t, x2: x(t), y2: m.t + plotH,
        stroke: t === TRUE_MEAN ? 'var(--rule-strong)' : 'var(--rule)',
        'stroke-width': 1
      }, svg);
      var tick = el('text', {
        x: x(t), y: H - 26, 'text-anchor': 'middle', class: 'ch03-tick'
      }, svg);
      tick.textContent = String(t);
    }

    var yTick = el('text', {
      x: m.l - 9, y: m.t + 4, 'text-anchor': 'end', class: 'ch03-tick'
    }, svg);
    yTick.textContent = String(maxCount);
    var zeroTick = el('text', {
      x: m.l - 9, y: m.t + plotH + 3, 'text-anchor': 'end', class: 'ch03-tick'
    }, svg);
    zeroTick.textContent = '0';

    counts.forEach(function (count, i) {
      if (!count) return;
      var x0 = m.l + (i / bins) * plotW;
      var barWidth = Math.max(1, plotW / bins - 1.2);
      el('rect', {
        x: x0,
        y: yCount(count),
        width: barWidth,
        height: m.t + plotH - yCount(count),
        class: 'ch03-bar'
      }, svg);
    });

    // Normal overlay, scaled to the histogram's tallest bar.
    var peak = 1 / (theoreticalSe * Math.sqrt(2 * Math.PI));
    var path = [];
    for (var step = 0; step <= 100; step++) {
      var value = minX + (step / 100) * (maxX - minX);
      var density = Math.exp(-0.5 * Math.pow((value - TRUE_MEAN) / theoreticalSe, 2)) / (theoreticalSe * Math.sqrt(2 * Math.PI));
      var py = m.t + plotH - (density / peak) * maxCount * 0.92;
      path.push((step === 0 ? 'M' : 'L') + x(value).toFixed(2) + ' ' + py.toFixed(2));
    }
    el('path', { d: path.join(' '), class: 'ch03-curve' }, svg);

    var trueX = x(TRUE_MEAN);
    el('line', {
      x1: trueX, y1: m.t, x2: trueX, y2: m.t + plotH,
      class: 'ch03-true-line'
    }, svg);
    var trueLabel = el('text', {
      x: trueX + 5, y: m.t + 12, class: 'ch03-true-label'
    }, svg);
    trueLabel.textContent = 'true mean 74';

    var xTitle = el('text', {
      x: m.l + plotW / 2, y: H - 4,
      'text-anchor': 'middle', class: 'ch03-axis-title'
    }, svg);
    xTitle.textContent = 'Sample mean';
    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2,
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')',
      'text-anchor': 'middle', class: 'ch03-axis-title'
    }, svg);
    yTitle.textContent = 'Experiments';
  }

  function updateSampling(n) {
    var normal = normalMaker(42 + seedOffset);
    var means = [];
    for (var e = 0; e < EXPERIMENTS; e++) {
      var total = 0;
      for (var i = 0; i < n; i++) total += TRUE_MEAN + TRUE_SD * normal();
      means.push(total / n);
    }
    var theoreticalSe = TRUE_SD / Math.sqrt(n);
    var simulatedSe = Math.sqrt(variance(means));
    var lo = quantile(means, 0.025);
    var hi = quantile(means, 0.975);

    nOut.textContent = String(n);
    nReadout.textContent = String(n);
    seEl.textContent = theoreticalSe.toFixed(3);
    simSeEl.textContent = simulatedSe.toFixed(3);
    rangeEl.textContent = fmt(lo) + ' to ' + fmt(hi);
    statusEl.textContent = 'n = ' + n + ' \u00b7 ' + EXPERIMENTS + ' experiments';
    drawHist(means, n, theoreticalSe);
  }

  if (nSlider) {
    var timer = null;
    nSlider.addEventListener('input', function () {
      var n = Number(nSlider.value);
      if (timer) global.clearTimeout(timer);
      timer = global.setTimeout(function () { updateSampling(n); }, 30);
    });
    updateSampling(Number(nSlider.value));
  }

  if (runBtn) {
    runBtn.addEventListener('click', function () {
      seedOffset += 1;
      updateSampling(Number(nSlider.value));
    });
  }

  /* ---------------------------------------------------------- interval ruler */
  var ciMount = doc.getElementById('ch03-ci-chart');
  var ciStatus = doc.getElementById('ch03-ci-status');
  var ciReadout = doc.getElementById('ch03-ci-readout');
  var pReadout = doc.getElementById('ch03-p-readout');
  var confButtons = Array.prototype.slice.call(doc.querySelectorAll('.ch03-conf-btn'));

  function scores(format) {
    var values = [];
    for (var i = 0; i < data.n; i++) {
      if (data.format[i] === format) values.push(data.score[i]);
    }
    return values;
  }

  var online = scores(2);
  var face = scores(0);
  var diff = mean(online) - mean(face);
  var seDiff = Math.sqrt(variance(online) / online.length + variance(face) / face.length);
  var z = diff / seDiff;

  function normCdf(value) {
    var t = 1 / (1 + 0.2316419 * Math.abs(value));
    var d = 0.3989423 * Math.exp(-value * value / 2);
    var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return value > 0 ? 1 - p : p;
  }

  var pOne = normCdf(z);
  var pTwo = 2 * Math.min(pOne, 1 - pOne);
  var zLevels = { 90: 1.6448536, 95: 1.959964, 99: 2.5758293 };
  var level = 95;

  function drawCI(nextLevel) {
    level = nextLevel;
    var zc = zLevels[level];
    var lo = diff - zc * seDiff;
    var hi = diff + zc * seDiff;
    var excludes = lo > 0 || hi < 0;

    ciMount.innerHTML = '';
    var W = 640;
    var H = 210;
    var m = { l: 42, r: 34, t: 62, b: 38 };
    var plotW = W - m.l - m.r;
    var minX = -10;
    var maxX = 2;
    var axisY = 138;

    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, ciMount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }

    el('line', {
      x1: m.l, y1: axisY, x2: W - m.r, y2: axisY,
      stroke: 'var(--ink)', 'stroke-width': 1.2
    }, svg);

    for (var tick = -10; tick <= 2; tick += 2) {
      el('line', {
        x1: x(tick), y1: axisY - 4, x2: x(tick), y2: axisY + 4,
        stroke: 'var(--ink-3)', 'stroke-width': 1
      }, svg);
      var label = el('text', {
        x: x(tick), y: axisY + 18, 'text-anchor': 'middle', class: 'ch03-ci-axis'
      }, svg);
      label.textContent = String(tick);
    }

    var zeroX = x(0);
    el('line', {
      x1: zeroX, y1: 70, x2: zeroX, y2: axisY - 10,
      class: 'ch03-ci-zero'
    }, svg);
    var zeroLabel = el('text', {
      x: zeroX, y: 64, 'text-anchor': 'middle', class: 'ch03-ci-axis'
    }, svg);
    zeroLabel.textContent = 'no effect';

    el('rect', {
      x: x(lo),
      y: axisY - 26,
      width: x(hi) - x(lo),
      height: 26,
      class: 'ch03-ci-band'
    }, svg);
    el('line', {
      x1: x(lo), y1: axisY - 13, x2: x(hi), y2: axisY - 13,
      stroke: 'var(--blue)', 'stroke-width': 2
    }, svg);
    [lo, hi].forEach(function (value) {
      el('line', {
        x1: x(value), y1: axisY - 22, x2: x(value), y2: axisY - 4,
        stroke: 'var(--blue)', 'stroke-width': 1.4
      }, svg);
    });
    el('circle', {
      cx: x(diff), cy: axisY - 13, r: 5.5, class: 'ch03-ci-estimate'
    }, svg);

    var estimateLabel = el('text', {
      x: x(diff), y: axisY - 32, 'text-anchor': 'middle', class: 'ch03-ci-value'
    }, svg);
    estimateLabel.textContent = fmt(diff);
    var loLabel = el('text', {
      x: x(lo), y: axisY + 34, 'text-anchor': 'middle', class: 'ch03-ci-label'
    }, svg);
    loLabel.textContent = fmt(lo);
    var hiLabel = el('text', {
      x: x(hi), y: axisY + 34, 'text-anchor': 'middle', class: 'ch03-ci-label'
    }, svg);
    hiLabel.textContent = fmt(hi);

    var levelLabel = el('text', {
      x: m.l, y: 28, class: 'ch03-ci-label'
    }, svg);
    levelLabel.textContent = level + '% interval on the online \u2212 face-to-face gap';

    var xTitle = el('text', {
      x: m.l + plotW / 2, y: H - 2,
      'text-anchor': 'middle', class: 'ch03-axis-title'
    }, svg);
    xTitle.textContent = 'Exam points, online \u2212 face-to-face';

    ciStatus.textContent = level + '% interval';
    ciReadout.textContent = '(' + fmt(lo) + ', ' + fmt(hi) + ') \u00b7 ' +
      (excludes ? 'excludes zero' : 'includes zero');
    pReadout.textContent = 'one-sided p = ' + pOne.toFixed(4) + ' \u00b7 two-sided = ' + pTwo.toFixed(4);
    confButtons.forEach(function (button) {
      var on = Number(button.getAttribute('data-level')) === level;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  confButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      drawCI(Number(button.getAttribute('data-level')));
    });
  });

  if (ciMount) drawCI(95);
})(window);
