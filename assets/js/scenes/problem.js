/* Scene 00 - the severity band. */
(function (global) {
  'use strict';

  function init() {
    var root = global.document.getElementById('lab-problem');
    if (!root || root.dataset.ready) return;
    root.dataset.ready = '1';

    var C = global.MatchLabCharts;
    var S = global.MatchLabStats;
    var data = global.MatchLabData.medicine;
    var Timeline = global.MatchLabTimeline;
    var Sound = global.MatchLabSound;

    var slider = global.document.getElementById('band-slider');
    var out = global.document.getElementById('band-out');
    var estEl = global.document.getElementById('band-estimate');
    var nEl = global.document.getElementById('band-n');
    var treatedEl = global.document.getElementById('band-treated');
    var statusEl = global.document.getElementById('band-status');
    var noteEl = global.document.getElementById('band-note');
    var sweepBtn = global.document.getElementById('band-sweep');
    var chartEl = global.document.getElementById('band-chart');

    var target = S.quantile(data.severity, 0.5);
    var curve = S.bandCurve(data, target, 64);

    var W = 640;
    var H = 330;
    var m = { l: 54, r: 18, t: 22, b: 48 };
    var iw = W - m.l - m.r;
    var ih = H - m.t - m.b;
    var x = C.scale(0.01, 0.5, m.l, W - m.r);
    var y = C.scale(-8, 18, H - m.b, m.t);

    var svg = C.svg(chartEl, W, H);
    var gGrid = C.group(svg);
    var gPlot = C.group(svg);
    var gMarker = C.group(svg);

    // grid + axes
    var yTicks = [-5, 0, 5, 10, 15];
    yTicks.forEach(function (v) {
      C.line(gGrid, m.l, y(v), W - m.r, y(v), v === 0 ? 'grid-line grid-line--zero' : 'grid-line');
      C.text(gGrid, m.l - 8, y(v) + 3, C.fmtSigned(v, 0), 'tick-label', { 'text-anchor': 'end' });
    });
    [0.05, 0.1, 0.2, 0.3, 0.4, 0.5].forEach(function (v) {
      C.line(gGrid, x(v), m.t, x(v), H - m.b, 'grid-line');
      C.text(gGrid, x(v), H - m.b + 15, v.toFixed(2), 'tick-label', { 'text-anchor': 'middle' });
    });
    C.line(gGrid, m.l, H - m.b, W - m.r, H - m.b, 'axis-line');
    C.line(gGrid, m.l, m.t, m.l, H - m.b, 'axis-line');
    C.text(gGrid, m.l, m.t - 8, 'ESTIMATE (DAYS)', 'axis-title');
    C.text(gGrid, W - m.r, H - 10, 'BAND WIDTH (\u00b1 SEVERITY)', 'axis-title', { 'text-anchor': 'end' });

    // faint noisy region
    C.rect(gGrid, x(0.01), m.t, x(0.03) - x(0.01), ih, 'band-rect');
    C.text(gGrid, x(0.032), m.t + 12, 'few patients', 'annotation-text', { 'text-anchor': 'start' });

    // estimate curve
    var d = '';
    curve.forEach(function (p, i) {
      if (!isFinite(p.estimate)) return;
      d += (i ? 'L' : 'M') + x(p.band).toFixed(1) + ',' + y(p.estimate).toFixed(1);
    });
    C.path(gPlot, d, 'estimate-curve');
    curve.forEach(function (p, i) {
      if (i % 6 !== 0) return;
      C.circle(gPlot, x(p.band), y(p.estimate), 2.2, 'estimate-dot');
    });

    // annotations
    C.text(gPlot, x(0.055), y(12.6), 'wide band: almost everyone', 'annotation-text', { 'text-anchor': 'start' });
    C.text(gPlot, x(0.2), y(-5.6), 'narrower: the sign flips', 'annotation-text', { 'text-anchor': 'start' });
    C.text(gPlot, x(0.44), y(-3.2), 'still not the truth', 'annotation-hand', { 'text-anchor': 'middle' });

    // marker
    var markerLine = C.line(gMarker, 0, 0, 0, 0, 'estimate-marker-line');
    var marker = C.circle(gMarker, 0, 0, 5, 'estimate-marker');
    var markerLabel = C.text(gMarker, 0, 0, '', 'annotation-text annotation-text--red', { 'text-anchor': 'start' });

    var sweep = new Timeline({
      duration: 2.7,
      onUpdate: function (t, p) {
        var e = p * p * (3 - 2 * p);
        var band = 0.5 - 0.48 * e;
        setBand(band, false);
      },
      onEnd: function () {
        sweepBtn.textContent = 'Replay sweep';
      }
    });

    function setBand(band, fromUser) {
      band = Math.max(0.01, Math.min(0.5, band));
      var r = S.severityBand(data, band, target);
      slider.value = String(band);
      out.textContent = band.toFixed(3);
      estEl.textContent = C.fmtSigned(r.estimate, 2);
      nEl.textContent = C.fmt(r.n);
      treatedEl.textContent = C.fmt(r.treated);

      var bandWord = band >= 0.38 ? 'wide band' : band >= 0.16 ? 'medium band' : 'narrow band';
      statusEl.textContent = bandWord + ' \u00b7 ' + C.fmt(r.n) + ' patients';
      noteEl.textContent =
        band >= 0.38 ? 'wide enough to keep almost everyone.' :
        band >= 0.16 ? 'closer in severity, but not close enough.' :
        'narrow, noisy, and still confounded by age and sex.';

      var px = x(band);
      var py = y(r.estimate);
      markerLine.setAttribute('x1', px);
      markerLine.setAttribute('x2', px);
      markerLine.setAttribute('y1', y(0));
      markerLine.setAttribute('y2', py);
      marker.setAttribute('cx', px);
      marker.setAttribute('cy', py);
      markerLabel.setAttribute('x', px + (px > 470 ? -8 : 8));
      markerLabel.setAttribute('y', py - 9);
      markerLabel.setAttribute('text-anchor', px > 470 ? 'end' : 'start');
      markerLabel.textContent = C.fmtSigned(r.estimate, 2);

      slider.setAttribute(
        'aria-valuetext',
        'band width ' + band.toFixed(2) + ', estimate ' + C.fmtSigned(r.estimate, 2) +
        ' days, ' + r.n + ' patients'
      );

      if (fromUser && Sound) Sound.tick();
    }

    slider.addEventListener('input', function () {
      sweep.pause();
      sweepBtn.textContent = 'Play the sweep';
      setBand(Number(slider.value), false);
    });

    slider.addEventListener('change', function () {
      sweepBtn.textContent = 'Play the sweep';
      if (Sound) Sound.pluck(Math.round(Number(slider.value) * 12));
    });

    sweepBtn.addEventListener('click', function () {
      if (sweep.playing) {
        sweep.pause();
        sweepBtn.textContent = 'Resume sweep';
      } else {
        sweepBtn.textContent = 'Pause sweep';
        sweep.play();
      }
    });

    Timeline.bindVisibility(root, sweep);
    setBand(0.5, false);
  }

  global.MatchLabScenes = global.MatchLabScenes || {};
  global.MatchLabScenes.problem = init;
})(typeof window !== 'undefined' ? window : globalThis);

