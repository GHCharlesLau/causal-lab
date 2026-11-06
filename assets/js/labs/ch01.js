/* ============================================================
   Chapter 01 lab: the counterfactual lens.
   Four schools, two potential outcomes, one observed road.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var table = doc.getElementById('po-body');
  if (!table) return;

  var units = [
    { i: 1, Y0: 500, Y1: 450, T: 0 },
    { i: 2, Y0: 600, Y1: 600, T: 0 },
    { i: 3, Y0: 800, Y1: 600, T: 1 },
    { i: 4, Y0: 700, Y1: 750, T: 1 }
  ];

  var lens = false;
  var selected = null;

  var body = doc.getElementById('po-body');
  var lensBtn = doc.getElementById('po-lens');
  var resetBtn = doc.getElementById('po-reset');
  var statusEl = doc.getElementById('po-status');
  var hintEl = doc.getElementById('po-hint');
  var detailEl = doc.getElementById('po-detail');
  var ateEl = doc.getElementById('po-ate');
  var attEl = doc.getElementById('po-att');
  var naiveEl = doc.getElementById('po-naive');
  var biasEl = doc.getElementById('po-bias');

  function mean(xs) {
    var s = 0;
    for (var i = 0; i < xs.length; i++) s += xs[i];
    return xs.length ? s / xs.length : NaN;
  }

  function fmt(n, plus) {
    if (!isFinite(n)) return '\u2014';
    var abs = Math.abs(n);
    var text = String(abs);
    if (n < 0) return '\u2212' + text;
    if (n > 0 && plus) return '+' + text;
    return text;
  }

  var ate = mean(units.map(function (u) { return u.Y1 - u.Y0; }));
  var att = mean(units.filter(function (u) { return u.T === 1; }).map(function (u) { return u.Y1 - u.Y0; }));
  var naive = mean(units.filter(function (u) { return u.T === 1; }).map(function (u) { return u.Y1; })) -
    mean(units.filter(function (u) { return u.T === 0; }).map(function (u) { return u.Y0; }));
  var bias = naive - att;

  function observed(u) {
    return u.T === 1 ? u.Y1 : u.Y0;
  }

  function detailFor(u) {
    if (!u) {
      return lens
        ? 'Both roads are visible. The ATE is the average of the four individual effects; the ATT uses only the treated schools.'
        : 'Select a school to inspect its two roads. Or reveal the lens to see the missing column.';
    }
    if (lens) {
      return 'School ' + u.i + ': if treated, ' + u.Y1 + '; if not, ' + u.Y0 + '. The individual effect is ' + fmt(u.Y1 - u.Y0) + '.';
    }
    return 'School ' + u.i + ' is ' + (u.T === 1 ? 'treated' : 'untreated') + '. We observe Y = ' + observed(u) +
      '. The ' + (u.T === 1 ? 'Y0' : 'Y1') + ' cell is the counterfactual.';
  }

  function render() {
    body.innerHTML = '';
    units.forEach(function (u) {
      var tr = doc.createElement('tr');
      tr.className = (u.T === 1 ? 'is-treated' : '') + (selected === u.i ? ' is-selected' : '');
      tr.tabIndex = 0;
      tr.setAttribute('role', 'row');
      tr.setAttribute('aria-label', 'School ' + u.i + ', ' + (u.T === 1 ? 'treated' : 'untreated'));

      var name = doc.createElement('td');
      name.textContent = 'School ' + u.i;
      tr.appendChild(name);

      var y0 = doc.createElement('td');
      if (u.T === 0) {
        y0.textContent = String(u.Y0);
        y0.className = 'is-observed';
      } else if (lens) {
        y0.textContent = String(u.Y0);
        y0.className = 'is-counterfactual';
      } else {
        y0.innerHTML = '<span class="missing">\u2014</span>';
      }
      tr.appendChild(y0);

      var y1 = doc.createElement('td');
      if (u.T === 1) {
        y1.textContent = String(u.Y1);
        y1.className = 'is-observed';
      } else if (lens) {
        y1.textContent = String(u.Y1);
        y1.className = 'is-counterfactual';
      } else {
        y1.innerHTML = '<span class="missing">\u2014</span>';
      }
      tr.appendChild(y1);

      var t = doc.createElement('td');
      var pill = doc.createElement('span');
      pill.className = 't-pill';
      pill.textContent = String(u.T);
      t.appendChild(pill);
      tr.appendChild(t);

      var y = doc.createElement('td');
      y.textContent = String(observed(u));
      y.className = 'is-observed';
      tr.appendChild(y);

      var te = doc.createElement('td');
      if (lens) {
        te.textContent = fmt(u.Y1 - u.Y0);
      } else {
        te.innerHTML = '<span class="missing">?</span>';
      }
      tr.appendChild(te);

      function choose() {
        selected = selected === u.i ? null : u.i;
        render();
      }
      tr.addEventListener('click', choose);
      tr.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          choose();
        }
      });
      body.appendChild(tr);
    });

    lensBtn.setAttribute('aria-pressed', String(lens));
    lensBtn.textContent = lens ? 'Hide the other road' : 'Reveal the other road';
    statusEl.textContent = lens ? 'both roads visible' : 'one road observed';
    hintEl.textContent = lens
      ? 'This is the table the causal deity sees. The researcher never does.'
      : 'The table is showing what the researcher actually sees.';

    if (lens) {
      ateEl.textContent = fmt(ate);
      attEl.textContent = fmt(att);
      biasEl.textContent = fmt(bias, true);
    } else {
      ateEl.textContent = '?';
      attEl.textContent = '?';
      biasEl.textContent = '?';
    }
    naiveEl.textContent = fmt(naive, true);

    var chosen = units.filter(function (u) { return u.i === selected; })[0] || null;
    detailEl.textContent = detailFor(chosen);
  }

  lensBtn.addEventListener('click', function () {
    lens = !lens;
    render();
  });

  resetBtn.addEventListener('click', function () {
    lens = false;
    selected = null;
    render();
  });

  render();
})(window);

