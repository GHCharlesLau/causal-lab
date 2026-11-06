/* ============================================================
   Chapter 07 â€” the email control diet and the hospital precision tax.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch07Data;
  var ols = global.Ch05OLS;
  var emailMount = doc.getElementById('ch07-email-chart');
  var hospMount = doc.getElementById('ch07-hosp-chart');
  if (!data || !ols || !emailMount || !hospMount) return;

  var NS = 'http://www.w3.org/2000/svg';

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

  function fmt(value, digits) {
    return value.toFixed(digits == null ? 2 : digits).replace('-', '\u2212');
  }

  function fmtInt(value) {
    return Math.round(value).toLocaleString('en-US');
  }

  function residualVariance(dataset, yName, cols, model) {
    var total = 0;
    for (var i = 0; i < dataset.n; i++) {
      var fit = model.coefficients[0];
      for (var j = 0; j < cols.length; j++) {
        fit += model.coefficients[j + 1] * dataset[cols[j]][i];
      }
      var e = dataset[yName][i] - fit;
      total += e * e;
    }
    return total / dataset.n;
  }

  var EMAIL_MODELS = {
    none: {
      label: 'No controls',
      short: 'none',
      cols: ['email'],
      varianceCols: [],
      controls: 'none',
      note: 'the outcome is drowning in noise.'
    },
    good: {
      label: '+ Credit & risk',
      short: 'credit/risk',
      cols: ['email', 'credit_limit', 'risk_score'],
      varianceCols: ['credit_limit', 'risk_score'],
      controls: 'credit + risk',
      note: 'the noise falls; the effect appears.'
    },
    bad: {
      label: '+ Opened & agreement',
      short: 'opened/agree',
      cols: ['email', 'credit_limit', 'risk_score', 'opened', 'agreement'],
      varianceCols: ['credit_limit', 'risk_score', 'opened', 'agreement'],
      controls: 'credit + risk + post-treatment',
      note: 'post-treatment controls eat the effect.'
    }
  };

  var HOSP_MODELS = {
    none: {
      label: 'Treatment only',
      short: 'none',
      cols: ['treatment'],
      controls: 'none',
      note: 'severity is the confounder.'
    },
    severity: {
      label: '+ Severity',
      short: '+ severity',
      cols: ['treatment', 'severity'],
      controls: 'severity',
      note: 'the sign flips once severity is held fixed.'
    },
    both: {
      label: '+ Severity + hospital',
      short: '+ hospital',
      cols: ['treatment', 'severity', 'hospital'],
      controls: 'severity + hospital',
      note: 'hospital adds variance, not explanation.'
    }
  };

  var emailResults = {};
  var hospResults = {};
  Object.keys(EMAIL_MODELS).forEach(function (key) {
    var spec = EMAIL_MODELS[key];
    var model = ols.ols(data.email, 'payments', spec.cols);
    var varianceModel = ols.ols(data.email, 'payments', spec.varianceCols);
    emailResults[key] = {
      label: spec.label,
      short: spec.short,
      coef: model.coefficients[1],
      se: model.seAll[1],
      variance: residualVariance(data.email, 'payments', spec.varianceCols, varianceModel),
      controls: spec.controls,
      note: spec.note
    };
  });
  Object.keys(HOSP_MODELS).forEach(function (key) {
    var spec = HOSP_MODELS[key];
    var model = ols.ols(data.hospital, 'days', spec.cols);
    hospResults[key] = {
      label: spec.label,
      short: spec.short,
      coef: model.coefficients[1],
      se: model.seAll[1],
      controls: spec.controls,
      note: spec.note
    };
  });

  var emailCurrent = 'none';
  var hospCurrent = 'none';

  var emailCoef = doc.getElementById('ch07-email-coef');
  var emailSe = doc.getElementById('ch07-email-se');
  var emailVar = doc.getElementById('ch07-email-var');
  var emailControls = doc.getElementById('ch07-email-controls');
  var emailStatus = doc.getElementById('ch07-email-status');
  var emailNote = doc.getElementById('ch07-email-note');
  var emailButtons = Array.prototype.slice.call(doc.querySelectorAll('#lab-email .ch07-preset'));

  var hospCoef = doc.getElementById('ch07-hosp-coef');
  var hospSe = doc.getElementById('ch07-hosp-se');
  var hospControls = doc.getElementById('ch07-hosp-controls');
  var hospSign = doc.getElementById('ch07-hosp-sign');
  var hospStatus = doc.getElementById('ch07-hosp-status');
  var hospNote = doc.getElementById('ch07-hosp-note');
  var hospButtons = Array.prototype.slice.call(doc.querySelectorAll('#lab-hospital .ch07-preset'));

  function drawChart(mount, rows, opts) {
    mount.innerHTML = '';
    var W = 640;
    var H = 310;
    var m = { l: 100, r: 24, t: 30, b: 48 };
    var plotW = W - m.l - m.r;
    var axisY = H - 44;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, mount);

    function x(value) {
      return m.l + ((value - opts.minX) / (opts.maxX - opts.minX)) * plotW;
    }

    opts.ticks.forEach(function (tick) {
      el('line', {
        x1: x(tick), y1: m.t, x2: x(tick), y2: axisY,
        stroke: 'var(--rule)', 'stroke-width': 1
      }, svg);
      var label = el('text', {
        x: x(tick), y: axisY + 16, 'text-anchor': 'middle', class: 'ch07-tick'
      }, svg);
      label.textContent = String(tick);
    });

    el('line', {
      x1: m.l, y1: axisY, x2: W - m.r, y2: axisY,
      stroke: 'var(--ink)', 'stroke-width': 1.2
    }, svg);
    el('line', {
      x1: x(0), y1: m.t, x2: x(0), y2: axisY,
      stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '4 4'
    }, svg);

    var rowStart = 68;
    var rowGap = 62;
    var narrow = global.innerWidth <= 720;
    rows.forEach(function (row, i) {
      var y = rowStart + i * rowGap;
      var current = row.current;
      var group = el('g', { class: 'ch07-row' + (current ? ' is-current' : '') }, svg);
      var label = el('text', {
        x: narrow ? m.l : m.l - 10,
        y: narrow ? y - 16 : y + 4,
        'text-anchor': narrow ? 'start' : 'end',
        class: 'ch07-row-label'
      }, group);
      label.textContent = row.label;

      var lo = row.coef - 2 * row.se;
      var hi = row.coef + 2 * row.se;
      el('line', {
        x1: x(lo), y1: y, x2: x(hi), y2: y, class: 'ch07-row-line'
      }, group);
      [lo, hi].forEach(function (edge) {
        el('line', {
          x1: x(edge), y1: y - 5, x2: x(edge), y2: y + 5, class: 'ch07-row-line'
        }, group);
      });
      el('circle', { cx: x(row.coef), cy: y, r: current ? 5 : 3.5, class: 'ch07-row-dot' }, group);
      var value = el('text', {
        x: x(row.coef), y: y - 11, 'text-anchor': 'middle', class: 'ch07-row-value'
      }, group);
      value.textContent = fmt(row.coef);
    });

    var axisTitle = el('text', {
      x: m.l + plotW / 2, y: H - 4,
      'text-anchor': 'middle', class: 'ch07-axis-title'
    }, svg);
    axisTitle.textContent = opts.axisTitle;
    var note = el('text', {
      x: W - m.r, y: H - 22, 'text-anchor': 'end', class: 'ch07-axis-title'
    }, svg);
    note.textContent = '\u00b1 2 SE';
  }

  function setEmail(key) {
    emailCurrent = key;
    var result = emailResults[key];
    emailCoef.textContent = fmt(result.coef);
    emailSe.textContent = fmt(result.se);
    emailVar.textContent = fmtInt(result.variance);
    emailControls.textContent = result.controls;
    emailStatus.textContent = result.label.toLowerCase() + ' \u00b7 5,000 customers';
    emailNote.textContent = result.note;
    emailButtons.forEach(function (button) {
      var on = button.getAttribute('data-model') === key;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
    drawChart(emailMount, ['none', 'good', 'bad'].map(function (id) {
      return {
        label: emailResults[id].short,
        coef: emailResults[id].coef,
        se: emailResults[id].se,
        current: id === key
      };
    }), {
      minX: -7.5,
      maxX: 9.5,
      ticks: [-6, -4, -2, 0, 2, 4, 6, 8],
      axisTitle: 'email coefficient \u00b7 payments (R$)'
    });
  }

  function setHosp(key) {
    hospCurrent = key;
    var result = hospResults[key];
    hospCoef.textContent = fmt(result.coef);
    hospSe.textContent = fmt(result.se);
    hospControls.textContent = result.controls;
    hospSign.textContent = result.coef > 0 ? 'more days' : 'fewer days';
    hospStatus.textContent = result.label.toLowerCase() + ' \u00b7 80 patients';
    hospNote.textContent = result.note;
    hospButtons.forEach(function (button) {
      var on = button.getAttribute('data-model') === key;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });
    drawChart(hospMount, ['none', 'severity', 'both'].map(function (id) {
      return {
        label: hospResults[id].short,
        coef: hospResults[id].coef,
        se: hospResults[id].se,
        current: id === key
      };
    }), {
      minX: -14,
      maxX: 22,
      ticks: [-10, 0, 10, 20],
      axisTitle: 'treatment coefficient \u00b7 days'
    });
  }

  emailButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setEmail(button.getAttribute('data-model'));
    });
  });
  hospButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setHosp(button.getAttribute('data-model'));
    });
  });

  setEmail('none');
  setHosp('none');
})(window);


