/* Scene 05 — the bias in the match, up close. */
(function (global) {
  'use strict';

  function init() {
    var root = global.document.getElementById('lab-bias');
    if (!root || root.dataset.ready) return;
    root.dataset.ready = '1';

    if (!global.IntersectionObserver) {
      setup();
      return;
    }
    var io = new global.IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            io.disconnect();
            setup();
            return;
          }
        }
      },
      { rootMargin: '420px 0px' }
    );
    io.observe(root);

    function setup() {
      var C = global.MatchLabCharts;
      var S = global.MatchLabStats;
      var data = global.MatchLabData.medicine;
      var Sound = global.MatchLabSound;

      var chartEl = global.document.getElementById('bias-chart');
      var estEl = global.document.getElementById('bias-estimate');
      var corrEl = global.document.getElementById('bias-correction');
      var correctedEl = global.document.getElementById('bias-corrected');
      var statusEl = global.document.getElementById('bias-status');
      var tableBody = global.document.querySelector('#bias-table tbody');
      var waterfallEl = global.document.getElementById('bias-waterfall');
      var cycleBtn = global.document.getElementById('bias-cycle');

      statusEl.textContent = 'matching\u2026';

      var result = S.matching(data, {
        features: ['severity', 'age', 'sex'],
        k: 1,
        standardize: true,
        caliper: 0,
        replace: true
      });

      var pairs = [];
      for (var s = 0; s < Math.min(5, result.T.m); s++) {
        var unit = result.T.list[s];
        var info = S.unitMatches(result, unit);
        if (!info || !info.matches.length) continue;
        var match = info.matches[0].index;
        pairs.push({
          unit: unit,
          match: match,
          distance: info.matches[0].distance,
          raw: info.raw,
          corr: info.correction,
          corrected: info.raw - info.correction
        });
      }

      var selected = 0;

      function card(x, y, w, h, title, color, d) {
        C.rect(chartElSvg, x, y, w, h, 'cell-rect', { fill: '#fbf8f1', stroke: color });
        C.text(chartElSvg, x + 12, y + 20, title, 'annotation-text', { fill: color });
        C.text(chartElSvg, x + 12, y + 44, 'age', 'ruler-label');
        C.text(chartElSvg, x + w - 12, y + 44, C.fmt(d.age, 1), 'cell-count', { 'text-anchor': 'end' });
        C.text(chartElSvg, x + 12, y + 64, 'severity', 'ruler-label');
        C.text(chartElSvg, x + w - 12, y + 64, C.fmt(d.severity, 2), 'cell-count', { 'text-anchor': 'end' });
        C.text(chartElSvg, x + 12, y + 84, 'sex', 'ruler-label');
        C.text(chartElSvg, x + w - 12, y + 84, String(d.sex), 'cell-count', { 'text-anchor': 'end' });
        C.text(chartElSvg, x + 12, y + 104, 'recovery', 'ruler-label');
        C.text(chartElSvg, x + w - 12, y + 104, d.recovery + ' d', 'cell-count', { 'text-anchor': 'end' });
      }

      var chartElSvg = C.svg(chartEl, 640, 330);
      var g = C.group(chartElSvg);

      function draw() {
        C.clear(g);
        if (!pairs.length) return;
        var p = pairs[selected];
        var t = {
          age: data.age[p.unit],
          severity: data.severity[p.unit],
          sex: data.sex[p.unit],
          recovery: data.recovery[p.unit]
        };
        var c = {
          age: data.age[p.match],
          severity: data.severity[p.match],
          sex: data.sex[p.match],
          recovery: data.recovery[p.match]
        };

        C.text(g, 30, 26, 'THE MATCH, IN THREE DIMENSIONS', 'axis-title');
        C.text(g, 30, 46, 'Close, not identical', 'plot-title');

        card(30, 70, 210, 130, 'TREATED #' + p.unit, '#a8283a', t);
        card(400, 70, 210, 130, 'MATCH #' + p.match, '#2f5d8a', c);

        // distance
        var midX = 320;
        C.text(g, midX, 92, 'distance', 'ruler-label', { 'text-anchor': 'middle' });
        C.text(g, midX, 108, C.fmt(p.distance, 2) + ' SD', 'annotation-text', { 'text-anchor': 'middle' });
        C.line(g, 250, 122, 390, 122, 'annotation-leader');
        C.line(g, 250, 117, 250, 127, 'annotation-line');
        C.line(g, 390, 117, 390, 127, 'annotation-line');

        // raw gap
        C.text(g, midX, 158, 'raw difference', 'ruler-label', { 'text-anchor': 'middle' });
        C.text(g, midX, 178, C.fmtSigned(p.raw, 2) + ' d', 'annotation-text annotation-text--red', {
          'text-anchor': 'middle'
        });

        // correction
        C.text(g, midX, 214, '\u03bc\u2080 gap (estimated)', 'ruler-label', { 'text-anchor': 'middle' });
        C.text(g, midX, 234, C.fmtSigned(p.corr, 2) + ' d', 'annotation-text annotation-text--blue', {
          'text-anchor': 'middle'
        });
        C.line(g, 268, 250, 372, 250, 'annotation-leader');

        C.text(g, midX, 276, 'corrected', 'ruler-label', { 'text-anchor': 'middle' });
        C.text(g, midX, 298, C.fmtSigned(p.corrected, 2) + ' d', 'annotation-text', {
          'text-anchor': 'middle'
        });

        C.text(g, 30, 316, 'The gap between the two outcome surfaces is the bias term.', 'annotation-hand');

        estEl.textContent = C.fmtSigned(p.raw, 2);
        corrEl.textContent = C.fmtSigned(p.corr, 2);
        correctedEl.textContent = C.fmtSigned(p.corrected, 2);
        statusEl.textContent = 'unit ' + p.unit + ' \u00b7 1-NN \u00b7 ' + C.fmt(p.distance, 2) + ' SD';

        drawTable();
        drawWaterfall();
      }

      function drawTable() {
        tableBody.innerHTML = '';
        pairs.forEach(function (p, idx) {
          var tr = global.document.createElement('tr');
          if (idx === selected) tr.className = 'is-highlight';
          var vals = [
            '#' + p.unit + ' \u2192 #' + p.match,
            String(data.recovery[p.unit]),
            String(data.recovery[p.match]),
            C.fmtSigned(p.raw, 2),
            C.fmtSigned(p.corr, 2),
            C.fmtSigned(p.corrected, 2)
          ];
          vals.forEach(function (v) {
            var td = global.document.createElement('td');
            td.textContent = v;
            tr.appendChild(td);
          });
          tr.style.cursor = 'pointer';
          tr.addEventListener('click', function () {
            selected = idx;
            draw();
            if (Sound) Sound.tick();
          });
          tableBody.appendChild(tr);
        });
      }

      function drawWaterfall() {
        var raw = result.main.ateRaw;
        var corrected = result.main.ateCorrected;
        var svg = C.svg(waterfallEl, 610, 84);
        var x = C.scale(-9, 2, 18, 540);
        var y0 = 52;
        C.line(svg, 18, y0, 540, y0, 'ruler-track');
        [-8, -6, -4, -2, 0].forEach(function (v) {
          C.line(svg, x(v), y0 - 3, x(v), y0 + 3, 'ruler-tick');
          C.text(svg, x(v), y0 + 15, String(v), 'ruler-label', { 'text-anchor': 'middle' });
        });
        C.rect(svg, Math.min(x(0), x(raw)), 22, Math.abs(x(raw) - x(0)), 16, 'wf-bar wf-bar--raw');
        C.rect(svg, Math.min(x(raw), x(corrected)), 22, Math.abs(x(corrected) - x(raw)), 16, 'wf-bar wf-bar--corrected');
        C.text(svg, x(raw), 16, 'raw ' + C.fmtSigned(raw, 2), 'wf-label', { 'text-anchor': 'middle' });
        C.text(svg, (x(raw) + x(corrected)) / 2, 16, 'correction ' + C.fmtSigned(corrected - raw, 2), 'wf-label', {
          'text-anchor': 'middle'
        });
        C.text(svg, x(corrected), 70, 'corrected ' + C.fmtSigned(corrected, 2), 'annotation-text annotation-text--blue', {
          'text-anchor': 'middle'
        });
        C.text(svg, 560, 48, 'days', 'ruler-label');
      }

      cycleBtn.addEventListener('click', function () {
        selected = (selected + 1) % pairs.length;
        draw();
        if (Sound) Sound.pluck(selected);
      });

      draw();
      statusEl.dataset.ready = '1';
    }
  }

  global.MatchLabScenes = global.MatchLabScenes || {};
  global.MatchLabScenes.bias = init;
})(typeof window !== 'undefined' ? window : globalThis);
