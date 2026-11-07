/* Scene 06 — the curse of dimensionality. */
(function (global) {
  'use strict';

  function init() {
    var root = global.document.getElementById('lab-curse');
    if (!root || root.dataset.ready) return;
    root.dataset.ready = '1';

    var C = global.MatchLabCharts;
    var S = global.MatchLabStats;
    var P = global.MatchLabPencil;
    var Sound = global.MatchLabSound;
    var Timeline = global.MatchLabTimeline;

    var chartEl = global.document.getElementById('curse-chart');
    var slider = global.document.getElementById('curse-d');
    var dOut = global.document.getElementById('curse-d-out');
    var distEl = global.document.getElementById('curse-distance');
    var cellsEl = global.document.getElementById('curse-cells');
    var budgetEl = global.document.getElementById('curse-budget');
    var gridEl = global.document.getElementById('curse-grid');

    var sim = S.curseSim({ n: 500, q: 150, dMax: 10, seed: 777 });

    var W = 640;
    var H = 330;
    var m = { l: 58, r: 22, t: 28, b: 48 };
    var maxD = Math.max.apply(null, sim.map(function (d) { return d.meanDistance; }));
    var x = C.scale(1, 10, m.l, W - m.r);
    var y = C.scale(0, maxD * 1.12, H - m.b, m.t);

    var svg = C.svg(chartEl, W, H);
    var g = C.group(svg);

    var yTicks = C.niceTicks(0, maxD * 1.12, 5);
    yTicks.forEach(function (v) {
      if (v > maxD * 1.12) return;
      C.line(g, m.l, y(v), W - m.r, y(v), v === 0 ? 'grid-line grid-line--zero' : 'grid-line');
      C.text(g, m.l - 8, y(v) + 3, C.fmt(v, 2), 'tick-label', { 'text-anchor': 'end' });
    });
    sim.forEach(function (d) {
      C.line(g, x(d.d), m.t, x(d.d), H - m.b, 'grid-line');
      C.text(g, x(d.d), H - m.b + 14, String(d.d), 'tick-label', { 'text-anchor': 'middle' });
    });
    C.line(g, m.l, H - m.b, W - m.r, H - m.b, 'axis-line');
    C.line(g, m.l, m.t, m.l, H - m.b, 'axis-line');
    C.text(g, m.l - 38, m.t + 64, 'MEAN NN DISTANCE', 'axis-title', {
      transform: 'rotate(-90 ' + (m.l - 38) + ' ' + (m.t + 64) + ')'
    });
    C.text(g, W - m.r, H - 9, 'COVARIATES (d)', 'axis-title', { 'text-anchor': 'end' });

    var dPath = '';
    sim.forEach(function (d, i) {
      dPath += (i ? 'L' : 'M') + x(d.d).toFixed(1) + ',' + y(d.meanDistance).toFixed(1);
    });
    var linePath = C.path(g, dPath, 'estimate-curve');
    var dots = sim.map(function (d) {
      return C.circle(g, x(d.d), y(d.meanDistance), 3.2, 'estimate-dot');
    });

    C.text(g, x(1.15), y(maxD * 0.3), 'same 500 points', 'annotation-text', { 'text-anchor': 'start' });
    C.text(g, x(10), y(sim[9].meanDistance) - 12, 'farther matches', 'annotation-hand', {
      'text-anchor': 'end'
    });

    var activeLine = C.line(g, 0, 0, 0, 0, 'estimate-marker-line');
    var activeDot = C.circle(g, 0, 0, 5.4, 'estimate-marker');

    // grid rows
    var rows = [];
    sim.forEach(function (d) {
      var row = global.document.createElement('div');
      row.className = 'curse-row';
      row.dataset.d = String(d.d);
      var label = global.document.createElement('span');
      label.className = 'curse-row-label';
      label.textContent = 'd=' + d.d;
      var track = global.document.createElement('div');
      track.className = 'curse-bar-track';
      var bar = global.document.createElement('div');
      bar.className = 'curse-bar';
      bar.style.width = (Math.log10(d.cells) / Math.log10(59049)) * 100 + '%';
      track.appendChild(bar);
      var count = global.document.createElement('span');
      count.className = 'curse-count';
      count.textContent = C.fmt(d.cells);
      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(count);
      gridEl.appendChild(row);
      rows.push(row);
    });

    function update(d) {
      d = Math.max(1, Math.min(10, Math.round(d)));
      var point = sim[d - 1];
      dOut.textContent = String(d);
      distEl.textContent = C.fmt(point.meanDistance, 2);
      cellsEl.textContent = C.fmt(point.cells);
      budgetEl.textContent = '\u00d7' + C.fmt(point.cells);
      var px = x(d);
      var py = y(point.meanDistance);
      activeLine.setAttribute('x1', px);
      activeLine.setAttribute('x2', px);
      activeLine.setAttribute('y1', m.t);
      activeLine.setAttribute('y2', H - m.b);
      activeDot.setAttribute('cx', px);
      activeDot.setAttribute('cy', py);
      dots.forEach(function (dot, i) {
        dot.setAttribute('r', i === d - 1 ? 5 : 3.2);
        dot.classList.toggle('is-selected', i === d - 1);
      });
      rows.forEach(function (row) {
        row.classList.toggle('is-active', Number(row.dataset.d) === d);
      });
      slider.value = String(d);
      slider.setAttribute(
        'aria-valuetext',
        d + ' covariates, mean nearest-neighbour distance ' + C.fmt(point.meanDistance, 2) +
        ', ' + point.cells + ' cells'
      );
    }

    slider.addEventListener('input', function () {
      update(Number(slider.value));
      if (Sound) Sound.tick();
    });

    var reveal = new Timeline({
      duration: 1.2,
      onUpdate: function (t, p) {
        P.setDrawProgress(linePath, p);
      },
      onEnd: function () {
        P.setDrawProgress(linePath, 1);
      }
    });

    if (global.IntersectionObserver) {
      var io = new global.IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              io.disconnect();
              reveal.play();
              return;
            }
          }
        },
        { threshold: 0.35 }
      );
      io.observe(root);
    } else {
      P.setDrawProgress(linePath, 1);
    }

    update(10);
  }

  global.MatchLabScenes = global.MatchLabScenes || {};
  global.MatchLabScenes.curse = init;
})(typeof window !== 'undefined' ? window : globalThis);
