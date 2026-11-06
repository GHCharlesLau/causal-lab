/* ============================================================
   Chapter 04 workbench: render a DAG, toggle conditioning,
   and let CausalDag.evaluate decide the verdict.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var api = global.CausalDag;
  var mount = doc.getElementById('dag-chart');
  if (!api || !mount) return;

  var NS = 'http://www.w3.org/2000/svg';
  var scenarios = api.scenarios;
  var current = 'confounding';
  var conditioned = {};

  var statusEl = doc.getElementById('dag-status');
  var scenarioLabel = doc.getElementById('dag-scenario-label');
  var headlineEl = doc.getElementById('dag-headline');
  var bodyEl = doc.getElementById('dag-body');
  var conditionedEl = doc.getElementById('dag-conditioned');
  var pathsEl = doc.getElementById('dag-paths');
  var resetBtn = doc.getElementById('dag-reset');
  var tabs = Array.prototype.slice.call(doc.querySelectorAll('.dag-tab'));

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

  function names() {
    var out = [];
    var scenario = scenarios[current];
    scenario.nodes.forEach(function (node) {
      if (conditioned[node.id]) out.push(node.label);
    });
    return out;
  }

  function edgeGeometry(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len;
    var uy = dy / len;
    var hw = 82;
    var hh = 31;
    var ta = Math.min(ux === 0 ? Infinity : hw / Math.abs(ux), uy === 0 ? Infinity : hh / Math.abs(uy));
    var tb = Math.min(ux === 0 ? Infinity : hw / Math.abs(ux), uy === 0 ? Infinity : hh / Math.abs(uy));
    return {
      x1: a.x + ux * ta,
      y1: a.y + uy * ta,
      x2: b.x - ux * tb,
      y2: b.y - uy * tb
    };
  }

  function draw() {
    var scenario = scenarios[current];
    var result = api.evaluate(current, conditioned);
    var nodeById = {};
    scenario.nodes.forEach(function (node) { nodeById[node.id] = node; });

    mount.innerHTML = '';
    var W = 640;
    var H = 320;
    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      role: 'group',
      'aria-label': scenario.title + '. Click a dashed node to condition on it.'
    }, mount);

    var defs = el('defs', {}, svg);
    var marker = el('marker', {
      id: 'dag-arrow',
      viewBox: '0 0 10 10',
      refX: '9',
      refY: '5',
      markerWidth: '6',
      markerHeight: '6',
      orient: 'auto-start-reverse'
    }, defs);
    el('path', { d: 'M0 0L10 5L0 10z', fill: 'var(--ink-2)' }, marker);

    scenario.edges.forEach(function (pair) {
      var a = nodeById[pair[0]];
      var b = nodeById[pair[1]];
      var g = edgeGeometry(a, b);
      el('line', {
        x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2,
        class: 'dag-edge',
        'marker-end': 'url(#dag-arrow)'
      }, svg);
    });

    result.paths.forEach(function (path) {
      var alert = (path.kind === 'backdoor' && path.open) || (path.kind === 'collider' && path.open);
      var blocked = (path.kind === 'backdoor' && !path.open) || (path.kind === 'mediator' && !path.open);
      if (!alert && !blocked) return;
      var points = path.label
        ? scenario.paths.filter(function (p) { return p.label === path.label; })[0]
        : null;
      if (!points) return;
      var d = points.nodes.map(function (id, i) {
        var n = nodeById[id];
        return (i === 0 ? 'M' : 'L') + n.x + ' ' + n.y;
      }).join(' ');
      el('path', {
        d: d,
        class: 'dag-path-overlay ' + (alert ? 'dag-path-overlay--alert' : 'dag-path-overlay--blocked')
      }, svg);
    });

    scenario.nodes.forEach(function (node) {
      var isConditioned = !!conditioned[node.id];
      var group = el('g', {
        class: 'dag-node' +
          (node.conditionable ? ' dag-node--conditionable' : '') +
          (isConditioned ? ' is-conditioned' : ''),
        transform: 'translate(' + node.x + ' ' + node.y + ')'
      }, svg);
      if (node.conditionable) {
        group.setAttribute('tabindex', '0');
        group.setAttribute('role', 'button');
        group.setAttribute('aria-pressed', String(isConditioned));
        group.setAttribute('aria-label', (isConditioned ? 'Stop conditioning on ' : 'Condition on ') + node.label);
      }

      el('rect', {
        x: -82, y: -31, width: 164, height: 62, rx: 2,
        class: 'dag-node-box'
      }, group);

      var label = el('text', {
        x: 0, y: -2, 'text-anchor': 'middle', class: 'dag-node-label'
      }, group);
      label.textContent = node.label;

      var role = el('text', {
        x: 0, y: 17, 'text-anchor': 'middle', class: 'dag-node-sub'
      }, group);
      role.textContent = node.role;

      if (node.conditionable) {
        var mark = el('g', { class: 'dag-condition-mark' }, group);
        el('circle', { cx: 64, cy: -22, r: 8, class: 'dag-condition-mark' }, mark);
        var glyph = el('text', {
          x: 64, y: -18, 'text-anchor': 'middle', class: 'dag-condition-glyph'
        }, mark);
        glyph.textContent = isConditioned ? '\u2212' : '+';

        group.addEventListener('click', function () {
          toggle(node.id);
        });
        group.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle(node.id);
          }
        });
      }
    });

    // Side panel
    scenarioLabel.textContent = scenario.label;
    var namesList = names();
    statusEl.textContent = scenario.label.toLowerCase() + ' \u00b7 ' +
      (namesList.length ? namesList.join(', ').toLowerCase() : 'nothing conditioned');
    headlineEl.textContent = result.headline;
    headlineEl.className = 'dag-headline' +
      (result.status === 'ok' ? ' is-ok' : result.status === 'warn' ? ' is-warn' : '');
    bodyEl.textContent = result.body;
    conditionedEl.textContent = namesList.length ? namesList.join(', ') : 'nothing';

    pathsEl.innerHTML = result.paths.map(function (path) {
      return '<div class="dag-path' + (path.open ? ' is-open' : '') + '">' +
        '<span>' + path.label + '</span>' +
        '<span>' + path.text + '</span></div>';
    }).join('');

    tabs.forEach(function (tab) {
      var on = tab.getAttribute('data-scenario') === current;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-pressed', String(on));
    });
  }

  function toggle(id) {
    if (conditioned[id]) delete conditioned[id];
    else conditioned[id] = true;
    draw();
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      current = tab.getAttribute('data-scenario');
      conditioned = {};
      draw();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      conditioned = {};
      draw();
    });
  }

  draw();
})(window);
