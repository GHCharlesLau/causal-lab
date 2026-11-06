/* Scene 04 — the nearest-neighbour matching bench. */
(function (global) {
  'use strict';

  function init() {
    var root = global.document.getElementById('lab-knn');
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
      { rootMargin: '500px 0px' }
    );
    io.observe(root);

    function setup() {
      var C = global.MatchLabCharts;
      var S = global.MatchLabStats;
      var data = global.MatchLabData.medicine;
      var Sound = global.MatchLabSound;
      var Timeline = global.MatchLabTimeline;

      var wrap = global.document.getElementById('knn-chart');
      var canvas = global.document.getElementById('knn-canvas');
      var overlay = global.document.getElementById('knn-overlay');
      var ctx = canvas.getContext('2d');
      var tooltip = global.document.getElementById('knn-tooltip');
      var statusEl = global.document.getElementById('knn-status');
      var ateEl = global.document.getElementById('knn-ate');
      var correctedEl = global.document.getElementById('knn-corrected');
      var truthEl = global.document.getElementById('knn-truth');
      var medianEl = global.document.getElementById('knn-median');
      var p90El = global.document.getElementById('knn-p90');
      var usedEl = global.document.getElementById('knn-used');
      var droppedEl = global.document.getElementById('knn-dropped');
      var rulerEl = global.document.getElementById('knn-ruler');
      var curveEl = global.document.getElementById('knn-curve');
      var distEl = global.document.getElementById('knn-dist');
      var cardEl = global.document.getElementById('knn-card');
      var oracleEl = global.document.getElementById('knn-oracle');
      var selectEl = global.document.getElementById('knn-select');

      var kInput = global.document.getElementById('knn-k');
      var kOut = global.document.getElementById('knn-k-out');
      var caliperInput = global.document.getElementById('knn-caliper');
      var caliperOut = global.document.getElementById('knn-caliper-out');
      var useSeverity = global.document.getElementById('knn-use-severity');
      var useAge = global.document.getElementById('knn-use-age');
      var useSex = global.document.getElementById('knn-use-sex');
      var standardizeInput = global.document.getElementById('knn-standardize');
      var replaceInput = global.document.getElementById('knn-replace');
      var correctInput = global.document.getElementById('knn-correct');
      var replayBtn = global.document.getElementById('knn-replay');
      var bookBtn = global.document.getElementById('knn-book');
      var resetBtn = global.document.getElementById('knn-reset');

      var state = {
        k: 1,
        features: ['severity', 'age', 'sex'],
        standardize: true,
        caliper: 0,
        replace: true,
        correct: false,
        selected: -1
      };

      var result = null;
      var busy = false;
      var pending = false;
      var W = 0;
      var H = 0;
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      var m = { l: 48, r: 16, t: 16, b: 34 };
      var ageMin = 0;
      var ageMax = 1;
      var x = null;
      var y = null;
      var baseCanvas = null;
      var hash = null;
      var cellSize = 16;
      var lastHit = -1;
      var replayProgress = 1;

      if (oracleEl && global.MatchLabReference) {
        oracleEl.textContent = C.fmtSigned(global.MatchLabReference.medicine.oracleAte, 2);
      }

      // age domain
      ageMin = Infinity;
      ageMax = -Infinity;
      for (var i = 0; i < data.n; i++) {
        if (data.age[i] < ageMin) ageMin = data.age[i];
        if (data.age[i] > ageMax) ageMax = data.age[i];
      }
      var pad = (ageMax - ageMin) * 0.04;
      ageMin -= pad;
      ageMax += pad;

      function measure() {
        var r = wrap.getBoundingClientRect();
        W = Math.max(280, Math.round(r.width));
        H = Math.max(240, Math.round(r.height));
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        overlay.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        overlay.setAttribute('preserveAspectRatio', 'none');
        x = C.scale(0, 1, m.l, W - m.r);
        y = C.scale(ageMin, ageMax, H - m.b, m.t);
      }

      function drawAxes() {
        C.clear(overlay);
        var g = C.group(overlay);
        var yTicks = C.niceTicks(ageMin, ageMax, 5);
        yTicks.forEach(function (v) {
          if (v < ageMin || v > ageMax) return;
          C.line(g, m.l, y(v), W - m.r, y(v), 'grid-line');
          C.text(g, m.l - 7, y(v) + 3, C.fmt(v, 0), 'tick-label', { 'text-anchor': 'end' });
        });
        [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
          C.line(g, x(v), m.t, x(v), H - m.b, 'grid-line');
          C.text(g, x(v), H - m.b + 13, v.toFixed(2), 'tick-label', { 'text-anchor': 'middle' });
        });
        C.line(g, m.l, H - m.b, W - m.r, H - m.b, 'axis-line');
        C.line(g, m.l, m.t, m.l, H - m.b, 'axis-line');
        C.text(g, m.l - 34, m.t + 4, 'AGE', 'axis-title', { transform: 'rotate(-90 ' + (m.l - 34) + ' ' + (m.t + 4) + ')' });
        C.text(g, W - m.r, H - 8, 'SEVERITY', 'axis-title', { 'text-anchor': 'end' });
        C.text(g, W - m.r, m.t + 8, data.n.toLocaleString('en-US') + ' PATIENTS', 'tick-label', {
          'text-anchor': 'end'
        });
      }

      function buildBase() {
        baseCanvas = global.document.createElement('canvas');
        baseCanvas.width = Math.round(W * dpr);
        baseCanvas.height = Math.round(H * dpr);
        var b = baseCanvas.getContext('2d');
        b.setTransform(dpr, 0, 0, dpr, 0, 0);
        b.clearRect(0, 0, W, H);

        function batch(pred, fill, stroke, radius, square, lw) {
          b.beginPath();
          for (var i = 0; i < data.n; i++) {
            if (!pred(i)) continue;
            var px = x(data.severity[i]);
            var py = y(data.age[i]);
            if (square) {
              b.rect(px - radius, py - radius, radius * 2, radius * 2);
            } else {
              b.moveTo(px + radius, py);
              b.arc(px, py, radius, 0, Math.PI * 2);
            }
          }
          if (fill) {
            b.fillStyle = fill;
            b.fill();
          }
          if (stroke) {
            b.strokeStyle = stroke;
            b.lineWidth = lw || 0.5;
            b.stroke();
          }
        }

        // control rings first
        batch(function (i) { return !data.medication[i] && !data.sex[i]; },
          null, 'rgba(47,93,138,0.34)', 1.7, false);
        batch(function (i) { return !data.medication[i] && data.sex[i]; },
          null, 'rgba(47,93,138,0.34)', 1.6, true);
        // treated dots
        batch(function (i) { return data.medication[i] && !data.sex[i]; },
          'rgba(168,40,58,0.52)', 'rgba(43,39,35,0.18)', 1.9, false);
        batch(function (i) { return data.medication[i] && data.sex[i]; },
          'rgba(168,40,58,0.52)', 'rgba(43,39,35,0.18)', 1.8, true);
      }

      function buildHash() {
        hash = new Map();
        for (var i = 0; i < data.n; i++) {
          var px = x(data.severity[i]);
          var py = y(data.age[i]);
          var key = Math.floor(px / cellSize) + ',' + Math.floor(py / cellSize);
          var arr = hash.get(key);
          if (!arr) {
            arr = [];
            hash.set(key, arr);
          }
          arr.push(i);
        }
      }

      function hitTest(mx, my) {
        var cx = Math.floor(mx / cellSize);
        var cy = Math.floor(my / cellSize);
        var best = -1;
        var bestD = 12 * 12;
        for (var ox = -1; ox <= 1; ox++) {
          for (var oy = -1; oy <= 1; oy++) {
            var arr = hash && hash.get((cx + ox) + ',' + (cy + oy));
            if (!arr) continue;
            for (var j = 0; j < arr.length; j++) {
              var i = arr[j];
              var dx = x(data.severity[i]) - mx;
              var dy = y(data.age[i]) - my;
              var d2 = dx * dx + dy * dy;
              if (d2 < bestD) {
                bestD = d2;
                best = i;
              }
            }
          }
        }
        return best;
      }

      function drawLines(unit, group) {
        if (!result) return;
        var G = group === 'treated' ? result.T : result.C;
        var s = G.pos[unit];
        if (s < 0) return;
        var kk = result.currentK || state.k;
        var any = false;
        for (var c = 0; c < kk; c++) {
          var idx = G.match[s * result.kMax + c];
          if (idx < 0) break;
          var dist = G.dist[s * result.kMax + c];
          if (dist > result.caliper) break;
          any = true;
          ctx.beginPath();
          ctx.moveTo(x(data.severity[unit]), y(data.age[unit]));
          ctx.lineTo(x(data.severity[idx]), y(data.age[idx]));
          ctx.strokeStyle = group === 'treated' ? 'rgba(168,40,58,0.85)' : 'rgba(47,93,138,0.85)';
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
        if (!any) {
          ctx.beginPath();
          ctx.arc(x(data.severity[unit]), y(data.age[unit]), 7, 0, Math.PI * 2);
          ctx.strokeStyle = '#d97757';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }

      function render() {
        if (!result) return;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (baseCanvas) ctx.drawImage(baseCanvas, 0, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var kk = result.currentK || state.k;
        var sampleT = Math.max(1, Math.floor(result.T.m / 150));
        var sampleC = Math.max(1, Math.floor(result.C.m / 150));
        var limitT = Math.floor(result.T.m * replayProgress);
        var limitC = Math.floor(result.C.m * replayProgress);

        ctx.lineWidth = 0.7;
        for (var s = 0; s < limitT; s += sampleT) {
          var u = result.T.list[s];
          for (var c = 0; c < kk; c++) {
            var idx = result.T.match[s * result.kMax + c];
            if (idx < 0) break;
            if (result.T.dist[s * result.kMax + c] > result.caliper) break;
            ctx.beginPath();
            ctx.moveTo(x(data.severity[u]), y(data.age[u]));
            ctx.lineTo(x(data.severity[idx]), y(data.age[idx]));
            ctx.strokeStyle = 'rgba(168,40,58,0.11)';
            ctx.stroke();
          }
        }
        for (s = 0; s < limitC; s += sampleC) {
          u = result.C.list[s];
          for (c = 0; c < kk; c++) {
            idx = result.C.match[s * result.kMax + c];
            if (idx < 0) break;
            if (result.C.dist[s * result.kMax + c] > result.caliper) break;
            ctx.beginPath();
            ctx.moveTo(x(data.severity[u]), y(data.age[u]));
            ctx.lineTo(x(data.severity[idx]), y(data.age[idx]));
            ctx.strokeStyle = 'rgba(47,93,138,0.1)';
            ctx.stroke();
          }
        }

        if (state.selected >= 0) {
          var group = data.medication[state.selected] ? 'treated' : 'control';
          drawLines(state.selected, group);
          ctx.beginPath();
          ctx.arc(x(data.severity[state.selected]), y(data.age[state.selected]), 7, 0, Math.PI * 2);
          ctx.strokeStyle = '#d97757';
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }
      }

      function fmtUnit(i) {
        var treated = data.medication[i] === 1;
        return (treated ? 'Treated' : 'Control') + ' #' + i;
      }

      function showTooltip(i, mx, my) {
        if (!tooltip) return;
        var rect = wrap.getBoundingClientRect();
        tooltip.hidden = false;
        tooltip.innerHTML =
          '<strong>' + fmtUnit(i) + '</strong><br>' +
          'age ' + C.fmt(data.age[i], 1) + ' \u00b7 severity ' + C.fmt(data.severity[i], 2) + '<br>' +
          'sex ' + data.sex[i] + ' \u00b7 recovery ' + data.recovery[i] + ' days';
        var tw = tooltip.offsetWidth;
        var th = tooltip.offsetHeight;
        var left = mx + 14;
        var top = my - th - 10;
        if (left + tw > rect.width - 6) left = mx - tw - 14;
        if (top < 6) top = my + 14;
        tooltip.style.left = Math.max(6, left) + 'px';
        tooltip.style.top = Math.max(6, top) + 'px';
      }

      function hideTooltip() {
        if (tooltip) tooltip.hidden = true;
      }

      function updateCard() {
        if (!result || state.selected < 0) {
          cardEl.innerHTML = '<p class="pair-card-label mono">Inspect</p><p class="pair-card-body">Click a dot to see its match, the distance, and the correction.</p>';
          return;
        }
        var i = state.selected;
        var info = S.unitMatches(result, i);
        var head =
          '<p class="pair-card-label mono">' + fmtUnit(i) + '</p>' +
          '<div class="pair-row"><span>age / severity</span><span>' + C.fmt(data.age[i], 1) + ' / ' + C.fmt(data.severity[i], 2) + '</span></div>' +
          '<div class="pair-row"><span>sex / recovery</span><span>' + data.sex[i] + ' / ' + data.recovery[i] + ' d</span></div>';
        if (!info || !info.matches.length) {
          cardEl.innerHTML = head + '<div class="pair-row"><span>match</span><strong>none within caliper</strong></div>';
          return;
        }
        var first = info.matches[0];
        var body =
          '<div class="pair-row"><span>match</span><span>' + fmtUnit(first.index) + ' at ' + C.fmt(first.distance, 2) + ' SD</span></div>' +
          '<div class="pair-row"><span>raw difference</span><strong>' + C.fmtSigned(info.raw, 2) + ' d</strong></div>' +
          '<div class="pair-row"><span>correction</span><span>' + C.fmtSigned(info.correction, 2) + ' d</span></div>' +
          '<div class="pair-row"><span>corrected</span><strong>' + C.fmtSigned(info.raw - info.correction, 2) + ' d</strong></div>';
        if (info.matches.length > 1) {
          body += '<div class="pair-row"><span>matches</span><span>' + info.matches.length + ' neighbours averaged</span></div>';
        }
        cardEl.innerHTML = head + body;
      }

      function selectUnit(i) {
        state.selected = i;
        updateCard();
        render();
        if (selectEl) selectEl.value = String(i);
        if (Sound) Sound.click ? Sound.tick() : null;
      }

      function populateSelect() {
        if (!selectEl || !result) return;
        selectEl.innerHTML = '<option value="">Choose a patient\u2026</option>';
        function addGroup(list, label) {
          var step = Math.max(1, Math.floor(list.length / 12));
          for (var s = 0; s < list.length; s += step) {
            var i = list[s];
            var opt = global.document.createElement('option');
            opt.value = String(i);
            opt.textContent = label + ' #' + i + ' \u00b7 age ' + C.fmt(data.age[i], 0) +
              ' \u00b7 sev ' + C.fmt(data.severity[i], 2);
            selectEl.appendChild(opt);
          }
        }
        addGroup(result.T.list, 'Treated');
        addGroup(result.C.list, 'Control');
      }

      function drawRuler() {
        if (!result || !rulerEl) return;
        var main = result.main;
        var practice = global.document.body.classList.contains('practice-mode');
        var svg = C.svg(rulerEl, 240, 64, { className: 'chart-svg' });
        var rx = C.scale(-13, 19, 10, 230);
        var yy = 34;
        C.line(svg, 10, yy, 230, yy, 'ruler-track');
        for (var v = -10; v <= 18; v += 5) {
          C.line(svg, rx(v), yy - 4, rx(v), yy + 4, v % 10 === 0 ? 'ruler-tick ruler-tick--major' : 'ruler-tick');
          C.text(svg, rx(v), yy + 15, String(v), 'ruler-label', { 'text-anchor': 'middle' });
        }
        function marker(val, cls, label, labelY) {
          if (!isFinite(val)) return;
          var px = rx(val);
          C.line(svg, px, yy - 13, px, yy + 8, cls);
          if (!label) return;
          C.text(svg, px, labelY, label, cls.indexOf('truth') >= 0 ? 'ruler-marker-label ruler-marker-label--truth' : 'ruler-marker-label', {
            'text-anchor': 'middle'
          });
        }
        marker(16.8958, 'ruler-marker ruler-marker--naive', 'naive', 12);
        marker(main.ateRaw, 'ruler-marker', '', 12);
        marker(main.ateCorrected, 'ruler-marker', '', 58);
        if (!practice) marker(-10, 'ruler-marker ruler-marker--truth', 'truth', 58);
      }

      function drawSpark() {
        if (!result || !curveEl) return;
        var svg = C.svg(curveEl, 220, 52, { className: 'chart-svg' });
        var vals = result.curve.map(function (d) { return d.ateRaw; }).filter(isFinite);
        if (!vals.length) return;
        var lo = Math.min.apply(null, vals);
        var hi = Math.max.apply(null, vals);
        if (hi - lo < 0.2) { hi += 0.1; lo -= 0.1; }
        var sx = C.scale(1, 10, 8, 212);
        var sy = C.scale(lo, hi, 46, 6);
        if (lo <= 0 && hi >= 0) C.line(svg, 8, sy(0), 212, sy(0), 'grid-line--zero');
        var d = '';
        result.curve.forEach(function (p, idx) {
          if (!isFinite(p.ateRaw)) return;
          d += (idx ? 'L' : 'M') + sx(p.k).toFixed(1) + ',' + sy(p.ateRaw).toFixed(1);
        });
        C.path(svg, d, 'spark-line');
        result.curve.forEach(function (p) {
          if (!isFinite(p.ateRaw)) return;
          C.circle(svg, sx(p.k), sy(p.ateRaw), p.k === (result.currentK || state.k) ? 3 : 1.8,
            p.k === (result.currentK || state.k) ? 'spark-dot spark-dot--current' : 'spark-dot');
        });
      }

      function drawDist() {
        if (!result || !distEl) return;
        var svg = C.svg(distEl, 220, 58, { className: 'chart-svg' });
        var vals = [];
        for (var s = 0; s < result.T.m; s++) if (result.T.match[s * result.kMax] >= 0) vals.push(result.T.dist[s * result.kMax]);
        for (s = 0; s < result.C.m; s++) if (result.C.match[s * result.kMax] >= 0) vals.push(result.C.dist[s * result.kMax]);
        var max = 3;
        var bins = 24;
        var counts = new Array(bins).fill(0);
        vals.forEach(function (v) {
          var b = Math.floor((Math.min(v, max) / max) * bins);
          counts[Math.max(0, Math.min(bins - 1, b))]++;
        });
        var peak = Math.max.apply(null, counts) || 1;
        var bw = 212 / bins;
        counts.forEach(function (c, i) {
          if (!c) return;
          var h = (c / peak) * 40;
          C.rect(svg, 4 + i * bw, 48 - h, Math.max(1, bw - 1), h, 'dist-bar');
        });
        C.line(svg, 4, 48, 216, 48, 'axis-line');
        C.text(svg, 4, 56, '0', 'ruler-label');
        C.text(svg, 216, 56, '3 SD', 'ruler-label', { 'text-anchor': 'end' });
        if (state.caliper > 0) {
          var cx = 4 + (Math.min(state.caliper, max) / max) * 212;
          C.line(svg, cx, 4, cx, 48, 'dist-caliper');
          C.text(svg, cx + 3, 10, 'caliper', 'ruler-label');
        }
      }

      function updateAll() {
        if (!result) return;
        var main = result.main;
        ateEl.textContent = C.fmtSigned(main.ateRaw, 2);
        correctedEl.textContent = C.fmtSigned(main.ateCorrected, 2);
        truthEl.textContent = '\u221210.00';
        medianEl.textContent = C.fmt(result.medianDistance, 2);
        p90El.textContent = C.fmt(result.p90Distance, 2);
        usedEl.textContent = C.fmt(main.usedT + main.usedC);
        droppedEl.textContent = C.fmt(main.droppedT + main.droppedC);
        correctedEl.classList.toggle('is-active', state.correct);
        ateEl.classList.toggle('is-active', !state.correct);

        var status = (result.currentK || state.k) + '-NN \u00b7 ' + state.features.length + ' feature' +
          (state.features.length === 1 ? '' : 's') + ' \u00b7 ' + (state.standardize ? 'z-scored' : 'raw units');
        if (state.caliper > 0) status += ' \u00b7 caliper ' + C.fmt(state.caliper, 1);
        if (!state.replace) status += ' \u00b7 no replacement';
        if (state.correct) status += ' \u00b7 corrected';
        statusEl.textContent = status;

        drawRuler();
        drawSpark();
        drawDist();
        updateCard();
        render();
        if (selectEl && state.selected >= 0) selectEl.value = String(state.selected);

        global.document.dispatchEvent(new global.CustomEvent('matchlab:knnchange', {
          detail: { k: result.currentK || state.k, features: state.features.slice(), correct: state.correct }
        }));
      }

      function busyStatus(text) {
        busy = true;
        statusEl.textContent = text;
        statusEl.classList.add('is-busy');
      }

      function rebuild() {
        if (busy) {
          pending = true;
          return;
        }
        busyStatus('matching 20,000 patients\u2026');
        global.setTimeout(function () {
          try {
            var t0 = global.performance ? global.performance.now() : Date.now();
            result = S.matching(data, {
              features: state.features,
              k: state.k,
              standardize: state.standardize,
              caliper: state.caliper,
              replace: state.replace
            });
            result.currentK = state.replace ? state.k : 1;
            if (!state.replace) {
              state.k = 1;
              kInput.value = '1';
              kOut.textContent = '1';
            }
            buildHash();
            populateSelect();
            updateAll();
            if (state.selected >= 0) selectUnit(state.selected);
            busy = false;
            statusEl.classList.remove('is-busy');
            if (Sound) Sound.tick();
            var elapsed = (global.performance ? global.performance.now() : Date.now()) - t0;
            statusEl.dataset.ms = String(Math.round(elapsed));
          } catch (err) {
            busy = false;
            statusEl.classList.remove('is-busy');
            statusEl.textContent = 'could not compute matches \u2014 try fewer features';
            if (global.console) global.console.error(err);
          }
          if (pending) {
            pending = false;
            rebuild();
          }
        }, 30);
      }

      function applyK(k) {
        if (!result || !state.replace) return;
        state.k = Math.max(1, Math.min(10, k));
        kInput.value = String(state.k);
        kOut.textContent = String(state.k);
        result.currentK = state.k;
        result.main = result.estimateAt(state.k, true);
        updateAll();
      }

      function readFeatures() {
        var f = [];
        if (useSeverity.checked) f.push('severity');
        if (useAge.checked) f.push('age');
        if (useSex.checked) f.push('sex');
        return f;
      }

      function syncControls() {
        kInput.value = String(state.k);
        kOut.textContent = String(state.k);
        useSeverity.checked = state.features.indexOf('severity') >= 0;
        useAge.checked = state.features.indexOf('age') >= 0;
        useSex.checked = state.features.indexOf('sex') >= 0;
        standardizeInput.checked = state.standardize;
        replaceInput.checked = state.replace;
        correctInput.checked = state.correct;
        caliperInput.value = String(state.caliper);
        caliperOut.textContent = state.caliper > 0 ? C.fmt(state.caliper, 1) : 'off';
        kInput.disabled = !state.replace;
      }

      // controls
      kInput.addEventListener('input', function () { applyK(Number(kInput.value)); });
      kInput.addEventListener('change', function () { if (Sound) Sound.tick(); });

      [useSeverity, useAge, useSex].forEach(function (box) {
        box.addEventListener('change', function () {
          var next = readFeatures();
          if (!next.length) {
            box.checked = true;
            return;
          }
          state.features = next;
          state.selected = -1;
          rebuild();
        });
      });

      standardizeInput.addEventListener('change', function () {
        state.standardize = standardizeInput.checked;
        state.selected = -1;
        rebuild();
      });

      replaceInput.addEventListener('change', function () {
        state.replace = replaceInput.checked;
        if (!state.replace) {
          state.k = 1;
        }
        syncControls();
        state.selected = -1;
        rebuild();
      });

      correctInput.addEventListener('change', function () {
        state.correct = correctInput.checked;
        updateAll();
        if (Sound) Sound.pluck(state.correct ? 4 : 1);
      });

      var caliperTimer = null;
      caliperInput.addEventListener('input', function () {
        var v = Number(caliperInput.value);
        state.caliper = v;
        caliperOut.textContent = v > 0 ? C.fmt(v, 1) : 'off';
        global.clearTimeout(caliperTimer);
        caliperTimer = global.setTimeout(function () {
          state.selected = -1;
          rebuild();
        }, 180);
      });

      function bookSettings() {
        state.k = 1;
        state.features = ['severity', 'age', 'sex'];
        state.standardize = true;
        state.caliper = 0;
        state.replace = true;
        state.correct = false;
        state.selected = -1;
        syncControls();
        rebuild();
      }

      bookBtn.addEventListener('click', bookSettings);
      resetBtn.addEventListener('click', bookSettings);

      var replayTL = new Timeline({
        duration: 1.3,
        onUpdate: function (t, p) {
          replayProgress = p;
          render();
        },
        onEnd: function () {
          replayProgress = 1;
          render();
        }
      });
      replayBtn.addEventListener('click', function () {
        replayProgress = 0;
        replayTL.play();
      });

      selectEl.addEventListener('change', function () {
        if (selectEl.value === '') return;
        selectUnit(Number(selectEl.value));
      });

      var moveRaf = null;
      canvas.addEventListener('mousemove', function (e) {
        var rect = wrap.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        if (moveRaf) return;
        moveRaf = global.requestAnimationFrame(function () {
          moveRaf = null;
          var hit = hitTest(mx, my);
          if (hit >= 0) {
            showTooltip(hit, mx, my);
            canvas.style.cursor = 'pointer';
            lastHit = hit;
          } else {
            hideTooltip();
            canvas.style.cursor = 'crosshair';
            lastHit = -1;
          }
        });
      });

      canvas.addEventListener('mouseleave', hideTooltip);

      canvas.addEventListener('click', function (e) {
        var rect = wrap.getBoundingClientRect();
        var hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        if (hit >= 0) selectUnit(hit);
      });

      var resizeTimer = null;
      function onResize() {
        global.clearTimeout(resizeTimer);
        resizeTimer = global.setTimeout(function () {
          if (!result) return;
          measure();
          drawAxes();
          buildBase();
          buildHash();
          render();
        }, 140);
      }

      if (global.ResizeObserver) {
        new global.ResizeObserver(onResize).observe(wrap);
      }
      global.addEventListener('resize', onResize);

      global.document.addEventListener('matchlab:practice', function () {
        drawRuler();
      });

      // boot
      measure();
      drawAxes();
      syncControls();
      rebuild();
    }
  }

  global.MatchLabScenes = global.MatchLabScenes || {};
  global.MatchLabScenes.knn = init;
})(typeof window !== 'undefined' ? window : globalThis);
