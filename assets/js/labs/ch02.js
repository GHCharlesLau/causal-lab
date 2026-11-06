/* ============================================================
   Chapter 02 lab: the three classrooms and the balance table.
   Data: online_classroom.csv, 323 students.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch02Data;
  var mount = doc.getElementById('ch02-chart');
  if (!data || !mount) return;

  var NS = 'http://www.w3.org/2000/svg';
  var LABELS = ['Face-to-face', 'Blended', 'Online'];
  var COLORS = ['#2f5d8a', '#a85a3c', '#a8283a'];
  var selected = 2;

  function el(name, attrs, parent) {
    var node = doc.createElementNS(NS, name);
    if (attrs) {
      for (var key in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, key)) {
          node.setAttribute(key, attrs[key]);
        }
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

  function fmt(value) {
    if (!isFinite(value)) return '\u2014';
    return value.toFixed(2).replace('-', '\u2212');
  }

  function fmtPct(value) {
    if (!isFinite(value)) return '\u2014';
    return (value * 100).toFixed(1) + '%';
  }

  var groups = [0, 1, 2].map(function (f) {
    var scores = [];
    for (var i = 0; i < data.n; i++) {
      if (data.format[i] === f) scores.push(data.score[i]);
    }
    return {
      f: f,
      label: LABELS[f],
      n: scores.length,
      mean: mean(scores),
      scores: scores
    };
  });

  var refMean = groups[0].mean;

  /* ---------------------------------------------------------- chart */
  function drawChart() {
    mount.innerHTML = '';
    var W = 640;
    var H = 360;
    var m = { l: 44, r: 18, t: 26, b: 58 };
    var plotW = W - m.l - m.r;
    var plotH = H - m.t - m.b;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, mount);

    function y(score) {
      return m.t + plotH - (score / 100) * plotH;
    }

    var centers = [m.l + plotW / 6, m.l + plotW / 2, m.l + plotW * 5 / 6];
    var groupW = plotW / 3;
    var jitterW = groupW * 0.62;

    for (var t = 0; t <= 100; t += 20) {
      var yy = y(t);
      el('line', {
        x1: m.l, y1: yy, x2: W - m.r, y2: yy,
        stroke: t === 0 ? 'var(--rule-strong)' : 'var(--rule)',
        'stroke-width': 1
      }, svg);
      var label = el('text', {
        x: m.l - 9, y: yy + 3.2, 'text-anchor': 'end', class: 'ch02-tick'
      }, svg);
      label.textContent = String(t);
    }

    var yTitle = el('text', {
      x: 12, y: m.t + plotH / 2,
      transform: 'rotate(-90 12 ' + (m.t + plotH / 2) + ')',
      'text-anchor': 'middle', class: 'ch02-axis-title'
    }, svg);
    yTitle.textContent = 'Final exam score';

    groups.forEach(function (group, gi) {
      var active = gi === selected;
      var g = el('g', {
        class: 'ch02-group' + (active ? ' is-active' : ''),
        'data-format': String(group.f)
      }, svg);
      var center = centers[gi];

      group.scores.forEach(function (score, i) {
        var jitter = (((i * 37 + gi * 13) % 101) / 100 - 0.5) * jitterW;
        var dot = el('circle', {
          cx: center + jitter,
          cy: y(score),
          r: active ? 2.6 : 2.2,
          fill: COLORS[gi],
          class: 'ch02-dot ' + (active ? 'is-active' : 'is-muted')
        }, g);
        dot.setAttribute('data-score', String(score));
      });

      var line = el('line', {
        x1: center - groupW * 0.42,
        y1: y(group.mean),
        x2: center + groupW * 0.42,
        y2: y(group.mean),
        stroke: COLORS[gi],
        class: 'ch02-mean-line' + (active ? ' is-active' : '')
      }, g);

      var name = el('text', {
        x: center, y: H - 36, 'text-anchor': 'middle',
        class: 'ch02-group-label'
      }, g);
      name.textContent = group.label + ' \u00b7 n = ' + group.n;
      var meanLabel = el('text', {
        x: center, y: H - 18, 'text-anchor': 'middle',
        class: 'ch02-group-mean'
      }, g);
      meanLabel.textContent = fmt(group.mean);

      var hit = el('rect', {
        x: center - groupW / 2,
        y: m.t,
        width: groupW,
        height: plotH,
        class: 'ch02-hit',
        tabindex: '0',
        role: 'button',
        'aria-label': 'Show ' + group.label + ', mean ' + fmt(group.mean) + ', n ' + group.n
      }, g);
      hit.addEventListener('click', function () { select(group.f); });
      hit.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(group.f);
        }
      });
    });

  }

  /* ---------------------------------------------------------- readout */
  var statusEl = doc.getElementById('ch02-status');
  var sideLabel = doc.getElementById('ch02-side-label');
  var meanEl = doc.getElementById('ch02-mean');
  var subEl = meanEl.nextElementSibling;
  var gapEl = doc.getElementById('ch02-gap');
  var gapSub = gapEl.nextElementSibling;
  var refEl = doc.getElementById('ch02-ref');
  var noteEl = doc.getElementById('ch02-note');
  var tabs = Array.prototype.slice.call(doc.querySelectorAll('.ch02-tab'));

  function select(f) {
    selected = f;
    var group = groups[f];
    var gap = group.mean - refMean;
    sideLabel.textContent = group.label;
    meanEl.textContent = fmt(group.mean);
    subEl.textContent = 'final exam mean, n = ' + group.n;
    gapEl.textContent = fmt(gap);
    gapSub.textContent = f === 0 ? 'reference group' : 'exam points vs. face-to-face';
    statusEl.textContent = group.label.toLowerCase() + ' \u00b7 n = ' + group.n;
    refEl.textContent = fmt(refMean);
    noteEl.textContent = f === 0
      ? 'the baseline; everyone else is compared with this.'
      : f === 1
        ? 'blended sits between the two, and closer to the classroom.'
        : 'the coin did the selecting.';
    tabs.forEach(function (tab) {
      var on = Number(tab.getAttribute('data-format')) === f;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-pressed', String(on));
    });
    drawChart();
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      select(Number(tab.getAttribute('data-format')));
    });
  });

  /* ---------------------------------------------------------- balance table */
  var metrics = [
    { key: 'gender', label: 'Gender = 1' },
    { key: 'asian', label: 'Asian' },
    { key: 'black', label: 'Black' },
    { key: 'hawaiian', label: 'Hawaiian' },
    { key: 'hispanic', label: 'Hispanic' },
    { key: 'unknown', label: 'Unknown' },
    { key: 'white', label: 'White' }
  ];
  var balanceBody = doc.getElementById('balance-body');
  function share(key, f) {
    var values = [];
    for (var i = 0; i < data.n; i++) {
      if (data.format[i] === f && data[key][i] !== null) values.push(data[key][i]);
    }
    return mean(values);
  }
  if (balanceBody) {
    metrics.forEach(function (metric) {
      var tr = doc.createElement('tr');
      if (metric.key === 'black') tr.className = 'is-highlight';
      var th = doc.createElement('td');
      th.textContent = metric.label;
      tr.appendChild(th);
      for (var f = 0; f < 3; f++) {
        var td = doc.createElement('td');
        td.textContent = fmtPct(share(metric.key, f));
        tr.appendChild(td);
      }
      balanceBody.appendChild(tr);
    });
    var note = doc.getElementById('balance-note');
    if (note) {
      var missing = data.black.filter(function (value) { return value === null; }).length;
      note.textContent = 'Black: ' + fmtPct(share('black', 2)) + ' online vs. ' +
        fmtPct(share('black', 0)) + ' face-to-face. Ethnicity is missing for ' + missing +
        ' records; shares use non-missing responses, as in the book.';
    }
  }

  select(2);
})(window);

