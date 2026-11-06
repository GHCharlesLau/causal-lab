/* Scene 03 — exact matching on age, one pair at a time. */
(function (global) {
  'use strict';

  function init() {
    var root = global.document.getElementById('lab-exact');
    if (!root || root.dataset.ready) return;
    root.dataset.ready = '1';

    var C = global.MatchLabCharts;
    var S = global.MatchLabStats;
    var P = global.MatchLabPencil;
    var data = global.MatchLabData.trainees;
    var Sound = global.MatchLabSound;
    var Timeline = global.MatchLabTimeline;

    var treated = data.filter(function (d) { return d.treated === 1; });
    var control = data.filter(function (d) { return d.treated === 0; });
    var firstByAge = new Map();
    control.forEach(function (d) { if (!firstByAge.has(d.age)) firstByAge.set(d.age, d); });

    var pairs = [];
    treated.forEach(function (t) {
      var c = firstByAge.get(t.age);
      if (c) pairs.push({ t: t, c: c, age: t.age, diff: t.earnings - c.earnings });
    });

    var chartEl = global.document.getElementById('exact-chart');
    var estEl = global.document.getElementById('exact-estimate');
    var pairsEl = global.document.getElementById('exact-pairs');
    var stepEl = global.document.getElementById('exact-step-out');
    var statusEl = global.document.getElementById('exact-status');
    var noteEl = global.document.getElementById('exact-note');
    var playBtn = global.document.getElementById('exact-play');
    var resetBtn = global.document.getElementById('exact-reset');
    var tieBtn = global.document.getElementById('exact-tiebreak');
    var scrub = global.document.getElementById('exact-scrub');
    var cardEl = global.document.getElementById('exact-card');
    var histEl = global.document.getElementById('exact-hist');

    var W = 640;
    var H = 400;
    var m = { l: 62, r: 22, t: 22, b: 46 };
    var x = C.scale(21, 56, m.l, W - m.r);
    var y = C.scale(0, 45000, H - m.b, m.t);

    var svg = C.svg(chartEl, W, H);
    var gGrid = C.group(svg);
    var gLines = C.group(svg);
    var gDots = C.group(svg);
    var gFocus = C.group(svg);

    var step = 0;
    var selected = -1;
    var currentPairs = pairs;
    var bookEstimate = S.mean(pairs.map(function (p) { return p.diff; }));
    var histEstimates = [];
    var histMin = 0;
    var histMax = 0;
    var histMark = null;
    var runningLabel = null;

    // grid
    var yTicks = [0, 10000, 20000, 30000, 40000];
    yTicks.forEach(function (v) {
      C.line(gGrid, m.l, y(v), W - m.r, y(v), v === 0 ? 'grid-line grid-line--zero' : 'grid-line');
      C.text(gGrid, m.l - 8, y(v) + 3, '$' + (v / 1000) + 'k', 'tick-label', { 'text-anchor': 'end' });
    });
    [25, 30, 35, 40, 45, 50, 55].forEach(function (v) {
      C.line(gGrid, x(v), m.t, x(v), H - m.b, 'grid-line');
      C.text(gGrid, x(v), H - m.b + 15, String(v), 'tick-label', { 'text-anchor': 'middle' });
    });
    C.line(gGrid, m.l, H - m.b, W - m.r, H - m.b, 'axis-line');
    C.line(gGrid, m.l, m.t, m.l, H - m.b, 'axis-line');
    C.text(gGrid, m.l, m.t - 7, 'EARNINGS', 'axis-title');
    C.text(gGrid, W - m.r, H - 9, 'AGE', 'axis-title', { 'text-anchor': 'end' });

    // naive mean lines
    var tMean = S.mean(treated.map(function (d) { return d.earnings; }));
    var cMean = S.mean(control.map(function (d) { return d.earnings; }));
    C.line(gGrid, m.l, y(tMean), W - m.r, y(tMean), 'mean-line mean-line--treated');
    C.line(gGrid, m.l, y(cMean), W - m.r, y(cMean), 'mean-line mean-line--control');
    C.text(gGrid, W - m.r - 2, y(tMean) - 5, 'trainee mean', 'annotation-text annotation-text--red', {
      'text-anchor': 'end'
    });
    C.text(gGrid, W - m.r - 2, y(cMean) - 5, 'control mean', 'annotation-text annotation-text--blue', {
      'text-anchor': 'end'
    });
    C.text(gGrid, W - m.r - 2, y(cMean) + 10, C.fmtMoney(cMean - tMean), 'annotation-text annotation-text--red', {
      'text-anchor': 'end'
    });

    runningLabel = C.text(gGrid, m.l + 4, m.t + 12, 'running mean \u2014', 'annotation-text', {
      'text-anchor': 'start'
    });

    // dots
    data.forEach(function (d) {
      var cls = 'data-dot ' + (d.treated ? 'data-dot--treated' : 'data-dot--control');
      var cx = x(d.age);
      var cy = y(d.earnings);
      var hit = C.circle(gDots, cx, cy, 11, '', { fill: 'transparent', 'data-unit': d.unit });
      hit.style.cursor = 'pointer';
      hit.addEventListener('click', function () { selectUnit(d.unit); });
      var dot = C.circle(gDots, cx, cy, d.treated ? 5 : 4.6, cls);
      dot.style.pointerEvents = 'none';
      var title = C.el('title', {}, dot);
      title.textContent = (d.treated ? 'Trainee' : 'Control') + ' #' + d.unit +
        ' \u00b7 age ' + d.age + ' \u00b7 $' + C.fmt(d.earnings);
    });

    function drawLines(animateIndex) {
      C.clear(gLines);
      var upto = Math.min(step, currentPairs.length);
      for (var i = 0; i < upto; i++) {
        var p = currentPairs[i];
        var path = C.path(
          gLines,
          P.matchPath(x(p.t.age), y(p.t.earnings), x(p.c.age), y(p.c.earnings), 5, i + 3),
          'match-line' + (i === selected ? ' is-selected' : '')
        );
        if (i === animateIndex && animateIndex >= 0) {
          var len = path.getTotalLength();
          path.style.strokeDasharray = len + ' ' + len;
          path.style.strokeDashoffset = len;
          (function (node) {
            global.requestAnimationFrame(function () {
              node.style.transition = 'stroke-dashoffset .2s linear';
              node.style.strokeDashoffset = '0';
            });
          })(path);
        }
      }
    }

    function drawFocus() {
      C.clear(gFocus);
      if (selected < 0 || selected >= currentPairs.length) return;
      var p = currentPairs[selected];
      var tx = x(p.t.age);
      var y1 = y(p.t.earnings);
      var y2 = y(p.c.earnings);
      C.line(gFocus, tx, y1, tx, y2, 'estimate-marker-line');
      C.line(gFocus, tx - 4, y1, tx + 4, y1, 'annotation-line');
      C.line(gFocus, tx - 4, y2, tx + 4, y2, 'annotation-line');
      C.circle(gFocus, x(p.t.age), y1, 7, 'data-dot data-dot--treated is-selected');
      C.circle(gFocus, x(p.c.age), y2, 7, 'data-dot data-dot--control is-selected');
      var labelX = tx + 12;
      var anchor = 'start';
      if (labelX > W - 100) { labelX = tx - 12; anchor = 'end'; }
      C.text(gFocus, labelX, (y1 + y2) / 2 + 4, C.fmtMoney(p.diff), 'annotation-text annotation-text--red', {
        'text-anchor': anchor
      });
      C.text(gFocus, labelX, (y1 + y2) / 2 - 10, 'same age', 'annotation-hand', {
        'text-anchor': anchor
      });
    }

    function updateReadout() {
      var upto = Math.min(step, currentPairs.length);
      var shown = currentPairs.slice(0, upto);
      var est = shown.length ? S.mean(shown.map(function (p) { return p.diff; })) : NaN;
      estEl.textContent = shown.length ? C.fmtMoney(est) : '\u2014';
      pairsEl.textContent = upto + ' / ' + currentPairs.length;
      stepEl.textContent = upto + ' / ' + currentPairs.length;
      statusEl.textContent = upto + ' / ' + currentPairs.length + ' pairs drawn';
      runningLabel.textContent = 'running mean ' + (shown.length ? C.fmtMoney(est) : '\u2014');
      if (upto === currentPairs.length) {
        noteEl.textContent = 'all pairs drawn. the sign flips.';
      } else if (upto === 0) {
        noteEl.textContent = 'press play to draw the pairs.';
      } else {
        noteEl.textContent = 'one control per trainee, same age.';
      }
    }

    function setStep(n, animate) {
      var next = Math.max(0, Math.min(currentPairs.length, Math.round(n)));
      var prev = step;
      step = next;
      scrub.value = String(step);
      drawLines(animate && step > prev ? step - 1 : -1);
      drawFocus();
      updateReadout();
      if (step > prev && Sound) Sound.pluck(step);
    }

    function selectUnit(unit) {
      var idx = -1;
      for (var i = 0; i < currentPairs.length; i++) {
        if (currentPairs[i].t.unit === unit || currentPairs[i].c.unit === unit) { idx = i; break; }
      }
      if (idx < 0) return;
      selected = idx;
      if (step < idx + 1) setStep(idx + 1, true);
      else {
        drawLines(-1);
        drawFocus();
      }
      var p = currentPairs[idx];
      cardEl.innerHTML =
        '<p class="pair-card-label mono">Selected pair</p>' +
        '<div class="pair-row"><span>trainee #' + p.t.unit + '</span><span>age ' + p.t.age + ' \u00b7 ' + C.fmtMoney(p.t.earnings).replace('+', '') + '</span></div>' +
        '<div class="pair-row"><span>control #' + p.c.unit + '</span><span>age ' + p.c.age + ' \u00b7 ' + C.fmtMoney(p.c.earnings).replace('+', '') + '</span></div>' +
        '<div class="pair-row"><span>difference</span><strong>' + C.fmtMoney(p.diff) + '</strong></div>';
      if (Sound) Sound.match();
    }

    // histogram of random tie-breaks
    function computeTieBreaks() {
      var byAge = new Map();
      control.forEach(function (d) {
        if (!byAge.has(d.age)) byAge.set(d.age, []);
        byAge.get(d.age).push(d);
      });
      histEstimates = [];
      for (var run = 0; run < 200; run++) {
        var rng = S.mulberry32(1000 + run);
        var diffs = [];
        treated.forEach(function (t) {
          var opts = byAge.get(t.age);
          if (!opts || !opts.length) return;
          var c = opts[Math.floor(rng() * opts.length)];
          diffs.push(t.earnings - c.earnings);
        });
        histEstimates.push(S.mean(diffs));
      }
      histMin = Math.min.apply(null, histEstimates);
      histMax = Math.max.apply(null, histEstimates);
      var pad = (histMax - histMin) * 0.08 || 100;
      histMin -= pad;
      histMax += pad;
    }

    function drawHistogram(current) {
      histEl.innerHTML = '';
      var bins = 26;
      var counts = new Array(bins).fill(0);
      histEstimates.forEach(function (v) {
        var b = Math.floor(((v - histMin) / (histMax - histMin)) * bins);
        counts[Math.max(0, Math.min(bins - 1, b))]++;
      });
      var max = Math.max.apply(null, counts) || 1;
      counts.forEach(function (c) {
        var bar = global.document.createElement('div');
        bar.className = 'hist-bar';
        bar.style.height = Math.max(2, (c / max) * 100) + '%';
        histEl.appendChild(bar);
      });
      var mark = global.document.createElement('div');
      mark.className = 'hist-mark';
      var pos = ((current - histMin) / (histMax - histMin)) * 100;
      mark.style.left = Math.max(0, Math.min(100, pos)) + '%';
      histEl.appendChild(mark);
    }

    function randomTieBreak() {
      var byAge = new Map();
      control.forEach(function (d) {
        if (!byAge.has(d.age)) byAge.set(d.age, []);
        byAge.get(d.age).push(d);
      });
      var rng = S.mulberry32(Date.now() % 100000);
      currentPairs = [];
      treated.forEach(function (t) {
        var opts = byAge.get(t.age);
        if (!opts || !opts.length) return;
        var c = opts[Math.floor(rng() * opts.length)];
        currentPairs.push({ t: t, c: c, age: t.age, diff: t.earnings - c.earnings });
      });
      selected = -1;
      setStep(currentPairs.length, false);
      var est = S.mean(currentPairs.map(function (p) { return p.diff; }));
      drawHistogram(est);
      if (Sound) Sound.match();
    }

    var playTL = new Timeline({
      duration: 2.8,
      onUpdate: function (t, p) {
        var n = Math.min(currentPairs.length, Math.floor(p * currentPairs.length + 0.0001));
        if (n !== step) setStep(n, true);
      },
      onEnd: function () {
        playBtn.textContent = 'Replay pairs';
        setStep(currentPairs.length, false);
        if (Sound) Sound.match();
      }
    });

    playBtn.addEventListener('click', function () {
      if (playTL.playing) {
        playTL.pause();
        playBtn.textContent = 'Resume';
      } else {
        if (step >= currentPairs.length) setStep(0, false);
        playBtn.textContent = 'Pause';
        playTL.play();
      }
    });

    resetBtn.addEventListener('click', function () {
      playTL.pause();
      playBtn.textContent = 'Play pairs';
      selected = -1;
      currentPairs = pairs;
      setStep(0, false);
      drawHistogram(bookEstimate);
      cardEl.innerHTML = '<p class="pair-card-label mono">Selected pair</p><p class="pair-card-body">Click a red dot, or press play.</p>';
    });

    tieBtn.addEventListener('click', function () {
      playTL.pause();
      playBtn.textContent = 'Play pairs';
      randomTieBreak();
    });

    scrub.addEventListener('input', function () {
      playTL.pause();
      playBtn.textContent = 'Play pairs';
      setStep(Number(scrub.value), false);
    });

    Timeline.bindVisibility(root, playTL);

    computeTieBreaks();
    drawHistogram(bookEstimate);
    setStep(0, false);
  }

  global.MatchLabScenes = global.MatchLabScenes || {};
  global.MatchLabScenes.exact = init;
})(typeof window !== 'undefined' ? window : globalThis);
