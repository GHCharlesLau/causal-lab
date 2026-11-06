/* Scene 02 - the cell atlas. */
(function (global) {
  'use strict';

  function init() {
    var root = global.document.getElementById('lab-cells');
    if (!root || root.dataset.ready) return;
    root.dataset.ready = '1';

    var C = global.MatchLabCharts;
    var S = global.MatchLabStats;
    var data = global.MatchLabData.medicine;
    var Sound = global.MatchLabSound;

    var chartEl = global.document.getElementById('cells-chart');
    var estEl = global.document.getElementById('cells-estimable');
    var countEl = global.document.getElementById('cells-count');
    var emptyEl = global.document.getElementById('cells-empty');
    var statusEl = global.document.getElementById('cells-status');
    var sampleSelect = global.document.getElementById('cells-sample');
    var binButtons = Array.prototype.slice.call(root.querySelectorAll('[data-bins]'));

    var W = 640;
    var H = 380;
    var svg = C.svg(chartEl, W, H);
    var g = C.group(svg);

    var bins = 4;
    var sampleSize = 400;
    var edges = [];
    var sampled = [];
    var cells = [];

    function computeEdges() {
      edges = [];
      for (var i = 1; i < bins; i++) {
        edges.push(S.quantile(data.severity, i / bins));
      }
    }

    function binOf(sev) {
      var b = 0;
      while (b < edges.length && sev > edges[b]) b++;
      return Math.min(bins - 1, b);
    }

    function sampleData() {
      var stride = Math.max(1, Math.floor(data.n / sampleSize));
      sampled = [];
      for (var i = 0; i < data.n && sampled.length < sampleSize; i += stride) {
        sampled.push(i);
      }
      // if stride rounded us short, fill from the front
      for (i = 0; i < data.n && sampled.length < sampleSize; i++) {
        if (sampled[sampled.length - 1] !== i) sampled.push(i);
      }
    }

    function computeCells() {
      cells = [];
      for (var s = 0; s < 2; s++) {
        for (var b = 0; b < bins; b++) {
          cells.push({ sex: s, bin: b, n: 0, t: 0, c: 0 });
        }
      }
      sampled.forEach(function (i) {
        var b = binOf(data.severity[i]);
        var s = data.sex[i] ? 1 : 0;
        var cell = cells[s * bins + b];
        cell.n++;
        if (data.medication[i]) cell.t++;
        else cell.c++;
      });
    }

    function draw() {
      C.clear(g);

      var m = { l: 76, r: 24, t: 70, b: 52 };
      var iw = W - m.l - m.r;
      var ih = H - m.t - m.b;
      var cellW = iw / bins;
      var rowH = ih / 2;
      var gap = 6;

      // legend
      var lx = 24;
      C.rect(g, lx, 12, 9, 9, 'cell-rect has-both');
      C.text(g, lx + 14, 20, 'both groups', 'cell-count', { 'text-anchor': 'start' });
      C.rect(g, lx + 130, 12, 9, 9, 'cell-rect has-one');
      C.text(g, lx + 144, 20, 'one group', 'cell-count', { 'text-anchor': 'start' });
      C.rect(g, lx + 260, 12, 9, 9, 'cell-rect is-empty');
      C.text(g, lx + 274, 20, 'empty', 'cell-count', { 'text-anchor': 'start' });

      for (var s = 0; s < 2; s++) {
        var y0 = m.t + s * rowH;
        C.text(g, m.l - 12, y0 + rowH / 2, s === 0 ? 'sex 0' : 'sex 1', 'cell-axis', {
          'text-anchor': 'end'
        });
        C.text(g, m.l - 12, y0 + rowH / 2 + 12, s === 0 ? 'n=' + sampleCount(s, null) : 'n=' + sampleCount(s, null),
          'cell-count', { 'text-anchor': 'end' });

        for (var b = 0; b < bins; b++) {
          var cell = cells[s * bins + b];
          var x0 = m.l + b * cellW + gap / 2;
          var y = y0 + gap / 2;
          var w = cellW - gap;
          var h = rowH - gap;
          var cls = 'cell-rect';
          if (cell.t > 0 && cell.c > 0) cls += ' has-both';
          else if (cell.t > 0 || cell.c > 0) cls += ' has-one';
          else cls += ' is-empty';
          C.rect(g, x0, y, w, h, cls, { rx: 1 });
          C.text(g, x0 + w / 2, y + h / 2 - 6, cell.t + ' / ' + cell.c, 'cell-count', {
            'text-anchor': 'middle'
          });
          C.text(g, x0 + w / 2, y + h / 2 + 12, cell.n + ' pts', 'cell-count', {
            'text-anchor': 'middle',
            style: 'opacity:.55'
          });
        }
      }

      // column labels / ranges
      for (var b2 = 0; b2 < bins; b2++) {
        var xc = m.l + b2 * cellW + cellW / 2;
        C.text(g, xc, m.t - 22, 'B' + (b2 + 1), 'cell-axis', { 'text-anchor': 'middle' });
        var lo = b2 === 0 ? 0 : edges[b2 - 1];
        var hi = b2 === bins - 1 ? 1 : edges[b2];
        C.text(g, xc, H - 28, lo.toFixed(2) + '\u2013' + hi.toFixed(2), 'cell-count', {
          'text-anchor': 'middle'
        });
      }
      C.text(g, W - m.r, H - 8, 'SEVERITY BINS (QUANTILES)', 'axis-title', { 'text-anchor': 'end' });
      C.text(g, m.l - 12, m.t - 6, 'T / C', 'cell-count', { 'text-anchor': 'end' });
    }

    function sampleCount(sex, bin) {
      var out = 0;
      sampled.forEach(function (i) {
        if ((data.sex[i] ? 1 : 0) === sex && (bin == null || binOf(data.severity[i]) === bin)) out++;
      });
      return out;
    }

    function update() {
      computeEdges();
      sampleData();
      computeCells();
      var estimable = 0;
      var one = 0;
      cells.forEach(function (c) {
        if (c.t > 0 && c.c > 0) estimable++;
        else one++;
      });
      estEl.textContent = estimable + ' / ' + cells.length;
      countEl.textContent = String(cells.length);
      emptyEl.textContent = String(one);
      statusEl.textContent = bins + ' bins \u00d7 sex \u00b7 ' + C.fmt(sampled.length) + ' patients';
      draw();
    }

    binButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        bins = Number(btn.dataset.bins);
        binButtons.forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        update();
        if (Sound) Sound.pluck(bins);
      });
    });

    if (sampleSelect) {
      sampleSelect.addEventListener('change', function () {
        sampleSize = Number(sampleSelect.value);
        update();
        if (Sound) Sound.tick();
      });
    }

    update();
  }

  global.MatchLabScenes = global.MatchLabScenes || {};
  global.MatchLabScenes.cells = init;
})(typeof window !== 'undefined' ? window : globalThis);



