/* ============================================================
   Chapter 09 — the compliance matrix and the three estimates.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch09Data;
  var models = global.Ch09Models;
  var estMount = doc.getElementById('ch09-est-chart');
  if (!data || !models || !estMount) return;

  var NS = 'http://www.w3.org/2000/svg';
  var cells = {
    a0d0: {
      type: 'Mixed cell',
      count: data.counts.assigned0_delivered0,
      share: Math.round((data.counts.assigned0_delivered0 / data.n) * 1000) / 10 + '% of all users',
      note: 'The 5,057 unassigned non-deliveries contain compliers and never takers. We can estimate the mix; we cannot label each person.',
      status: 'mixed cell \u00b7 5,057 users'
    },
    a0d1: {
      type: 'Always takers',
      count: data.counts.assigned0_delivered1,
      share: '0% of unassigned users',
      note: 'Nobody receives the push without assignment. That is why there are no always takers in this experiment.',
      status: 'always takers \u00b7 0 users'
    },
    a1d0: {
      type: 'Never takers',
      count: data.counts.assigned1_delivered0,
      share: Math.round((data.counts.assigned1_delivered0 / data.assigned) * 1000) / 10 + '% of assigned users',
      note: 'They do not receive the push even when assigned. Their treatment is unchanged, so IV says nothing about their effect.',
      status: 'never takers \u00b7 1,396 users'
    },
    a1d1: {
      type: 'Compliers',
      count: data.counts.assigned1_delivered1,
      share: Math.round((data.counts.assigned1_delivered1 / data.assigned) * 1000) / 10 + '% of assigned users',
      note: 'They receive the push when assigned and do not when unassigned. The instrument changes their treatment.',
      status: 'compliers \u00b7 3,547 users'
    }
  };

  var matrixButtons = Array.prototype.slice.call(doc.querySelectorAll('.matrix-cell'));
  var matrixLabel = doc.getElementById('ch09-matrix-type-label');
  var matrixCount = doc.getElementById('ch09-matrix-count');
  var matrixShare = doc.getElementById('ch09-matrix-share');
  var matrixNote = doc.getElementById('ch09-matrix-note');
  var matrixStatus = doc.getElementById('ch09-matrix-status');

  function setCell(key) {
    var info = cells[key];
    matrixLabel.textContent = info.type;
    matrixCount.textContent = info.count.toLocaleString('en-US');
    matrixShare.textContent = info.share;
    matrixNote.textContent = info.note;
    matrixStatus.textContent = info.status;
    matrixButtons.forEach(function (button) {
      var on = button.getAttribute('data-cell') === key;
      button.classList.toggle('is-selected', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  matrixButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setCell(button.getAttribute('data-cell'));
    });
  });

  /* ---------------------------------------------------------- estimator chart */
  var estCurrent = 'late';
  var estButtons = Array.prototype.slice.call(doc.querySelectorAll('#lab-estimators .ch09-preset'));
  var estLabel = doc.getElementById('ch09-est-label');
  var estCoef = doc.getElementById('ch09-est-coef');
  var estSe = doc.getElementById('ch09-est-se');
  var estCi = doc.getElementById('ch09-est-ci');
  var estStatus = doc.getElementById('ch09-est-status');
  var estNote = doc.getElementById('ch09-est-note');

  function fmt(value, digits) {
    return value.toFixed(digits == null ? 2 : digits).replace('-', '\u2212');
  }

  function draw() {
    var current = models.models[estCurrent];
    estMount.innerHTML = '';
    var W = 640;
    var H = 290;
    var m = { l: 66, r: 26, t: 30, b: 46 };
    var plotW = W - m.l - m.r;
    var axisY = H - 42;
    var minX = 0;
    var maxX = 30;
    var svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('role', 'presentation');
    svg.setAttribute('aria-hidden', 'true');
    estMount.appendChild(svg);

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

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }

    [0, 5, 10, 15, 20, 25, 30].forEach(function (tick) {
      el('line', {
        x1: x(tick), y1: m.t, x2: x(tick), y2: axisY,
        stroke: 'var(--rule)', 'stroke-width': 1
      }, svg);
      var label = el('text', {
        x: x(tick), y: axisY + 16, 'text-anchor': 'middle', class: 'ch09-tick'
      }, svg);
      label.textContent = String(tick);
    });

    el('line', {
      x1: m.l, y1: axisY, x2: W - m.r, y2: axisY,
      stroke: 'var(--ink)', 'stroke-width': 1.2
    }, svg);

    ['ols', 'itt', 'late'].forEach(function (key, i) {
      var row = models.models[key];
      var y = 66 + i * 62;
      var isCurrent = key === estCurrent;
      var group = el('g', { class: 'ch09-row' + (isCurrent ? ' is-current' : '') }, svg);
      var label = el('text', {
        x: m.l - 9, y: y + 4, 'text-anchor': 'end', class: 'ch09-row-label'
      }, group);
      label.textContent = row.short;

      el('line', {
        x1: x(row.lo), y1: y, x2: x(row.hi), y2: y, class: 'ch09-row-line'
      }, group);
      [row.lo, row.hi].forEach(function (edge) {
        el('line', {
          x1: x(edge), y1: y - 5, x2: x(edge), y2: y + 5, class: 'ch09-row-line'
        }, group);
      });
      el('circle', { cx: x(row.coef), cy: y, r: isCurrent ? 5 : 3.5, class: 'ch09-row-dot' }, group);
      var value = el('text', {
        x: x(row.coef), y: y - 11, 'text-anchor': 'middle', class: 'ch09-row-value'
      }, group);
      value.textContent = fmt(row.coef);
    });

    var axisTitle = el('text', {
      x: m.l + plotW / 2, y: H - 4,
      'text-anchor': 'middle', class: 'ch09-axis-title'
    }, svg);
    axisTitle.textContent = 'in-app purchase \u00b7 reais';

    estLabel.textContent = current.label;
    estCoef.textContent = fmt(current.coef);
    estSe.textContent = fmt(current.se);
    estCi.textContent = '(' + fmt(current.lo) + ', ' + fmt(current.hi) + ')';
    estStatus.textContent = current.label;
    estNote.textContent = current.note;

    estButtons.forEach(function (button) {
      var on = button.getAttribute('data-model') === estCurrent;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
  }

  estButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      estCurrent = button.getAttribute('data-model');
      draw();
    });
  });

  setCell('a1d1');
  draw();
})(window);
