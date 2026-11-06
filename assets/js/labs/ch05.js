/* ============================================================
   Chapter 05 control dial: group toggles -> OLS -> coefficient rows.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var data = global.Ch05Data;
  var olsApi = global.Ch05OLS;
  var mount = doc.getElementById('ch05-chart');
  if (!data || !olsApi || !mount) return;

  var NS = 'http://www.w3.org/2000/svg';
  var GROUPS = {
    IQ: ['IQ'],
    human: ['exper', 'tenure', 'age'],
    family: ['meduc', 'feduc', 'brthord', 'sibs'],
    demographics: ['married', 'black', 'south', 'urban']
  };
  var GROUP_ORDER = ['IQ', 'human', 'family', 'demographics'];
  var PRESETS = {
    raw: { label: 'none', groups: [] },
    iq: { label: 'IQ', groups: ['IQ'] },
    human: { label: 'human', groups: ['IQ', 'human'] },
    full: { label: 'full', groups: GROUP_ORDER }
  };
  var PRESET_ORDER = ['raw', 'iq', 'human', 'full'];

  var state = { groups: { IQ: false, human: false, family: false, demographics: false } };
  var presetResults = {};

  var coefEl = doc.getElementById('ch05-coef');
  var ciEl = doc.getElementById('ch05-ci');
  var countEl = doc.getElementById('ch05-count');
  var r2El = doc.getElementById('ch05-r2');
  var statusEl = doc.getElementById('ch05-status');
  var noteEl = doc.getElementById('ch05-note');
  var presetButtons = Array.prototype.slice.call(doc.querySelectorAll('.ch05-preset'));
  var checkboxes = Array.prototype.slice.call(doc.querySelectorAll('.ch05-toggle input'));

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

  function unique(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (out.indexOf(list[i]) === -1) out.push(list[i]);
    }
    return out;
  }

  function controlsForGroups(groups) {
    var out = [];
    GROUP_ORDER.forEach(function (key) {
      if (groups[key]) out = out.concat(GROUPS[key]);
    });
    return unique(out);
  }

  function groupsForPreset(key) {
    var groups = {};
    GROUP_ORDER.forEach(function (g) { groups[g] = PRESETS[key].groups.indexOf(g) !== -1; });
    return groups;
  }

  function sameGroups(a, b) {
    return GROUP_ORDER.every(function (key) { return !!a[key] === !!b[key]; });
  }

  function currentControls() {
    return controlsForGroups(state.groups);
  }

  function compute(controls) {
    return olsApi.ols(data, 'lhwage', ['educ'].concat(controls));
  }

  function fmt(value) {
    return value.toFixed(4).replace('-', '\u2212');
  }

  function drawChart(current, presetKey) {
    mount.innerHTML = '';
    var W = 640;
    var H = 320;
    var m = { l: 78, r: 24, t: 26, b: 44 };
    var plotW = W - m.l - m.r;
    var minX = 0.02;
    var maxX = 0.07;
    var axisY = H - 36;
    var rows = PRESET_ORDER.map(function (key) {
      return {
        key: key,
        label: PRESETS[key].label,
        result: presetResults[key],
        current: false
      };
    });
    var matched = PRESET_ORDER.indexOf(presetKey) !== -1 ? presetKey : null;

    if (matched) {
      rows.forEach(function (row) { row.current = row.key === matched; });
    } else {
      rows.forEach(function (row) { row.current = false; });
      rows.push({ key: 'custom', label: 'current', result: current, current: true });
    }

    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'presentation',
      'aria-hidden': 'true'
    }, mount);

    function x(value) {
      return m.l + ((value - minX) / (maxX - minX)) * plotW;
    }

    for (var t = 2; t <= 7; t++) {
      var value = t / 100;
      el('line', {
        x1: x(value), y1: 28, x2: x(value), y2: axisY,
        stroke: 'var(--rule)',
        'stroke-width': 1
      }, svg);
      var tick = el('text', {
        x: x(value), y: axisY + 16, 'text-anchor': 'middle', class: 'ch05-tick'
      }, svg);
      tick.textContent = value.toFixed(2);
    }

    el('line', {
      x1: m.l, y1: axisY, x2: W - m.r, y2: axisY,
      class: 'ch05-axis'
    }, svg);

    var rowStart = 58;
    var rowGap = 50;
    rows.forEach(function (row, i) {
      var y = rowStart + i * rowGap;
      var result = row.result;
      var group = el('g', { class: 'ch05-row' + (row.current ? ' is-current' : '') }, svg);

      var label = el('text', {
        x: m.l - 9, y: y + 3, 'text-anchor': 'end', class: 'ch05-row-label'
      }, group);
      label.textContent = row.label;

      el('line', {
        x1: x(result.lo), y1: y, x2: x(result.hi), y2: y,
        class: 'ch05-row-line'
      }, group);
      [result.lo, result.hi].forEach(function (edge) {
        el('line', {
          x1: x(edge), y1: y - 4, x2: x(edge), y2: y + 4,
          class: 'ch05-row-line'
        }, group);
      });
      el('circle', {
        cx: x(result.coef), cy: y, r: row.current ? 5 : 3.5,
        class: 'ch05-row-dot'
      }, group);

      var valueLabel = el('text', {
        x: x(result.coef), y: y - 10, 'text-anchor': 'middle', class: 'ch05-row-value'
      }, group);
      valueLabel.textContent = result.coef.toFixed(4);
    });

    var axisTitle = el('text', {
      x: m.l + plotW / 2, y: H - 4,
      'text-anchor': 'middle', class: 'ch05-axis-title'
    }, svg);
    axisTitle.textContent = 'Education coefficient \u00b7 log wage per year';
  }

  function presetKeyForControls(controls) {
    for (var i = 0; i < PRESET_ORDER.length; i++) {
      var key = PRESET_ORDER[i];
      if (sameGroups(groupsForPreset(key), state.groups)) return key;
    }
    return null;
  }

  function update() {
    var controls = currentControls();
    var result;
    try {
      result = compute(controls);
    } catch (e) {
      statusEl.textContent = 'design matrix is singular';
      return;
    }

    var presetKey = presetKeyForControls(controls);
    var label = presetKey ? PRESETS[presetKey].label : 'custom';

    coefEl.textContent = result.coef.toFixed(4);
    ciEl.textContent = '(' + fmt(result.lo) + ', ' + fmt(result.hi) + ')';
    countEl.textContent = String(controls.length);
    r2El.textContent = result.r2.toFixed(3);
    statusEl.textContent = (presetKey ? label : 'custom') + ' \u00b7 ' +
      (controls.length ? controls.length + ' control' + (controls.length === 1 ? '' : 's') : 'no controls') +
      ' \u00b7 663 workers';

    var notes = {
      raw: 'ability is still in the error.',
      iq: 'IQ absorbs part of ability.',
      human: 'experience and tenure change the comparison.',
      full: 'the book\u2019s full specification.',
      custom: 'a custom comparison; the graph decides.'
    };
    noteEl.textContent = notes[presetKey || 'custom'];

    drawChart(result, presetKey);

    presetButtons.forEach(function (button) {
      var on = button.getAttribute('data-preset') === presetKey;
      button.classList.toggle('is-active', on);
      button.setAttribute('aria-pressed', String(on));
    });

    checkboxes.forEach(function (box) {
      box.checked = !!state.groups[box.getAttribute('data-group')];
    });
  }

  presetButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      state.groups = groupsForPreset(button.getAttribute('data-preset'));
      update();
    });
  });

  checkboxes.forEach(function (box) {
    box.addEventListener('change', function () {
      state.groups[box.getAttribute('data-group')] = box.checked;
      update();
    });
  });

  PRESET_ORDER.forEach(function (key) {
    presetResults[key] = compute(controlsForGroups(groupsForPreset(key)));
  });

  update();
})(window);
