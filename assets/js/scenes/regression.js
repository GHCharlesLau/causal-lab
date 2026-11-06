/* Scene 01 — regression as a weighted average. */
(function (global) {
  'use strict';

  function init() {
    var root = global.document.getElementById('lab-regression');
    if (!root || root.dataset.ready) return;
    root.dataset.ready = '1';

    var C = global.MatchLabCharts;
    var S = global.MatchLabStats;
    var data = global.MatchLabData.drug;
    var ref = global.MatchLabReference.drug;
    var Sound = global.MatchLabSound;

    var estEl = global.document.getElementById('regression-estimate');
    var detailEl = global.document.getElementById('regression-detail');
    var statusEl = global.document.getElementById('regression-status');
    var chartEl = global.document.getElementById('regression-chart');
    var tableBody = global.document.querySelector('#regression-cells tbody');
    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-weight-mode]'));

    var W = 640;
    var H = 330;
    var svg = C.svg(chartEl, W, H);
    var gCells = C.group(svg);
    var gScale = C.group(svg);

    var mode = 'sub';
    var womenShare = 0.4;
    var beamGroup = null;
    var barMen = null;
    var barWomen = null;
    var shareMenText = null;
    var shareWomenText = null;
    var scaleEstimate = null;
    var scaleSub = null;

    // ------------------------------------------------------------ cells panel
    C.text(gCells, 24, 28, 'THE TWO CELLS', 'axis-title');
    C.text(gCells, 24, 48, 'Same drug, different cell', 'plot-title');

    var cols = [
      { key: 'M', label: 'MEN', cx: 110, n: 6 },
      { key: 'W', label: 'WOMEN', cx: 252, n: 4 }
    ];

    cols.forEach(function (col) {
      C.rect(gCells, col.cx - 52, 62, 104, 178, 'cell-rect has-both', { rx: 1 });
      C.text(gCells, col.cx, 80, col.label, 'scale-label', { 'text-anchor': 'middle' });
      C.text(gCells, col.cx, 94, 'n = ' + col.n, 'cell-count', { 'text-anchor': 'middle' });

      var treated = data.filter(function (d) { return d.sex === col.key && d.drug === 1; });
      var control = data.filter(function (d) { return d.sex === col.key && d.drug === 0; });

      treated.forEach(function (d, i) {
        var px = col.cx - 30 + (i % 3) * 30;
        var py = 108 + Math.floor(i / 3) * 12 + (i % 2) * 3;
        C.circle(gCells, px, py, 5, 'data-dot data-dot--treated');
      });
      control.forEach(function (d, i) {
        var px = col.cx - 30 + (i % 3) * 30;
        var py = 208 + Math.floor(i / 3) * 12;
        C.circle(gCells, px, py, 5, 'data-dot data-dot--control');
      });

      // mean lines + within-cell effect bracket
      var treatY = 120;
      var controlY = 222;
      C.line(gCells, col.cx - 44, treatY, col.cx + 44, treatY, 'mean-line mean-line--treated');
      C.line(gCells, col.cx - 44, controlY, col.cx + 44, controlY, 'mean-line mean-line--control');
      C.line(gCells, col.cx - 34, treatY, col.cx - 34, controlY, 'annotation-leader');
      C.line(gCells, col.cx - 38, treatY, col.cx - 30, treatY, 'annotation-leader');
      C.line(gCells, col.cx - 38, controlY, col.cx - 30, controlY, 'annotation-leader');
      C.text(gCells, col.cx - 40, (treatY + controlY) / 2 + 4, C.fmtSigned(col.key === 'M' ? -3 : -2, 1),
        'annotation-text annotation-text--blue', { 'text-anchor': 'end' });
    });

    C.text(gCells, 24, 264, 'within-cell effect:', 'annotation-text');
    C.text(gCells, 135, 264, 'men \u22123.0', 'annotation-text annotation-text--red');
    C.text(gCells, 215, 264, 'women \u22122.0', 'annotation-text annotation-text--red');
    C.text(gCells, 24, 284, 'cell size:', 'annotation-text');
    C.text(gCells, 88, 284, '6 men, 4 women', 'annotation-text');

    // ------------------------------------------------------------ scale panel
    C.text(gScale, 350, 28, 'HOW THE CELLS ARE COMBINED', 'axis-title');
    C.text(gScale, 350, 48, 'The balance', 'plot-title');

    C.line(gScale, 486, 214, 486, 82, 'scale-post');
    C.line(gScale, 462, 214, 510, 214, 'scale-post');

    beamGroup = C.group(gScale, { class: 'scale-beam-group' });
    C.line(beamGroup, 406, 96, 566, 96, 'scale-beam');
    C.circle(beamGroup, 486, 96, 3, 'scale-weight', { 'aria-hidden': 'true' });

    // hanging bars (weights)
    barMen = C.rect(beamGroup, 394, 0, 24, 0, 'scale-weight', { y: 180 });
    barWomen = C.rect(beamGroup, 554, 0, 24, 0, 'scale-weight scale-weight--control', { y: 180 });

    C.line(beamGroup, 406, 96, 406, 160, 'scale-beam');
    C.line(beamGroup, 566, 96, 566, 160, 'scale-beam');
    C.path(beamGroup, 'M386 160 Q406 178 426 160', 'scale-pan');
    C.path(beamGroup, 'M546 160 Q566 178 586 160', 'scale-pan');

    shareMenText = C.text(gScale, 406, 238, 'MEN 60%', 'scale-label', { 'text-anchor': 'middle' });
    shareWomenText = C.text(gScale, 566, 238, 'WOMEN 40%', 'scale-label', { 'text-anchor': 'middle' });
    scaleEstimate = C.text(gScale, 486, 276, '\u22122.60', 'plot-title', { 'text-anchor': 'middle' });
    scaleSub = C.text(gScale, 486, 292, 'subclassification', 'cell-count', { 'text-anchor': 'middle' });

    // ------------------------------------------------------------ table
    function buildTable() {
      tableBody.innerHTML = '';
      var cells = ref.cells;
      var weights;
      if (mode === 'naive') weights = [0, 0];
      else if (mode === 'sub') weights = cells.map(function (c) { return c.n / data.length; });
      else {
        var raw = cells.map(function (c) { return c.n * c.varT; });
        var sum = raw[0] + raw[1];
        weights = raw.map(function (w) { return w / sum; });
      }
      var maxW = Math.max(weights[0], weights[1]);
      cells.forEach(function (c, i) {
        var tr = global.document.createElement('tr');
        if (mode !== 'naive' && weights[i] === maxW) tr.className = 'is-highlight';
        var vals = [
          c.name === 'M' ? 'Men' : 'Women',
          String(c.n),
          String(c.treated),
          C.fmtSigned(c.effect, 2),
          C.fmtFixed(c.varT, 3),
          mode === 'naive' ? '\u2014' : C.fmtFixed(weights[i] * 100, 1) + '%'
        ];
        vals.forEach(function (v) {
          var td = global.document.createElement('td');
          td.textContent = v;
          tr.appendChild(td);
        });
        tableBody.appendChild(tr);
      });
    }

    function setBeam(angle) {
      beamGroup.style.transformBox = 'view-box';
      beamGroup.style.transformOrigin = '486px 96px';
      beamGroup.style.transform = 'rotate(' + angle + 'deg)';
    }

    function update() {
      var estimate;
      var menShare;
      if (mode === 'naive') {
        estimate = ref.naive;
        menShare = 0.5;
        detailEl.textContent = 'one comparison \u00b7 no sex adjustment';
        statusEl.textContent = 'naive comparison';
        scaleSub.textContent = 'naive comparison';
      } else if (mode === 'sub') {
        estimate = ref.subclassification;
        menShare = 0.6;
        detailEl.textContent = 'weights: 60% men / 40% women';
        statusEl.textContent = 'subclassification';
        scaleSub.textContent = 'subclassification';
      } else {
        estimate = ref.ols;
        menShare = 0.4545;
        detailEl.textContent = 'weights: 45% men / 55% women';
        statusEl.textContent = 'regression (OLS)';
        scaleSub.textContent = 'regression (OLS)';
      }
      womenShare = 1 - menShare;

      estEl.textContent = C.fmtSigned(estimate, 2);
      scaleEstimate.textContent = C.fmtSigned(estimate, 2);
      shareMenText.textContent = 'MEN ' + Math.round(menShare * 100) + '%';
      shareWomenText.textContent = 'WOMEN ' + Math.round(womenShare * 100) + '%';

      // beam: heavier side goes down
      var angle = (womenShare - 0.5) * 22;
      setBeam(angle);

      // weight bars
      var maxBar = 58;
      barMen.setAttribute('y', 180 - menShare * maxBar);
      barMen.setAttribute('height', menShare * maxBar);
      barWomen.setAttribute('y', 180 - womenShare * maxBar);
      barWomen.setAttribute('height', womenShare * maxBar);

      if (mode === 'naive') {
        barMen.setAttribute('height', 2);
        barWomen.setAttribute('height', 2);
        barMen.setAttribute('y', 178);
        barWomen.setAttribute('y', 178);
      }

      buildTable();
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        mode = btn.dataset.weightMode;
        buttons.forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        update();
        if (Sound) Sound.pluck(mode === 'naive' ? 0 : mode === 'sub' ? 3 : 1);
      });
    });

    update();
  }

  global.MatchLabScenes = global.MatchLabScenes || {};
  global.MatchLabScenes.regression = init;
})(typeof window !== 'undefined' ? window : globalThis);
