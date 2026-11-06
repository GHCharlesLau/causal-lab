/* Matching Lab — tiny SVG chart toolkit. No dependencies. */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function el(name, attrs, parent) {
    var node = global.document.createElementNS(NS, name);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    if (parent) parent.appendChild(node);
    return node;
  }

  function svg(container, w, h, opts) {
    clear(container);
    var s = el('svg', {
      viewBox: '0 0 ' + w + ' ' + h,
      class: (opts && opts.className) || 'chart-svg',
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-hidden': (opts && opts.ariaHidden === false) ? 'false' : 'true'
    }, container);
    if (opts && opts.label) s.setAttribute('aria-label', opts.label);
    return s;
  }

  function scale(d0, d1, r0, r1) {
    var f = function (x) {
      if (d1 === d0) return (r0 + r1) / 2;
      return r0 + ((x - d0) / (d1 - d0)) * (r1 - r0);
    };
    f.invert = function (y) {
      if (r1 === r0) return d0;
      return d0 + ((y - r0) / (r1 - r0)) * (d1 - d0);
    };
    f.domain = [d0, d1];
    f.range = [r0, r1];
    return f;
  }

  function niceNum(range, round) {
    var exp = Math.floor(Math.log(range) / Math.LN10);
    var frac = range / Math.pow(10, exp);
    var nice;
    if (round) {
      if (frac < 1.5) nice = 1;
      else if (frac < 3) nice = 2;
      else if (frac < 7) nice = 5;
      else nice = 10;
    } else {
      if (frac <= 1) nice = 1;
      else if (frac <= 2) nice = 2;
      else if (frac <= 5) nice = 5;
      else nice = 10;
    }
    return nice * Math.pow(10, exp);
  }

  function niceTicks(min, max, count) {
    if (min === max) return [min];
    var span = niceNum(max - min, false);
    var step = niceNum(span / Math.max(1, count - 1), true);
    var start = Math.floor(min / step) * step;
    var end = Math.ceil(max / step) * step;
    var out = [];
    for (var v = start; v <= end + step * 0.5; v += step) {
      out.push(Math.round(v / step) * step);
    }
    return out;
  }

  function text(parent, x, y, str, cls, attrs) {
    var t = el('text', {
      x: x,
      y: y,
      class: cls || 'tick-label'
    }, parent);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) t.setAttribute(k, attrs[k]);
      }
    }
    t.textContent = str;
    return t;
  }

  function line(parent, x1, y1, x2, y2, cls, attrs) {
    var l = el('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: cls || 'axis-line' }, parent);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) l.setAttribute(k, attrs[k]);
      }
    }
    return l;
  }

  function path(parent, d, cls, attrs) {
    var p = el('path', { d: d, class: cls || 'match-line' }, parent);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) p.setAttribute(k, attrs[k]);
      }
    }
    return p;
  }

  function circle(parent, cx, cy, r, cls, attrs) {
    var c = el('circle', { cx: cx, cy: cy, r: r, class: cls || 'data-dot' }, parent);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) c.setAttribute(k, attrs[k]);
      }
    }
    return c;
  }

  function rect(parent, x, y, w, h, cls, attrs) {
    var r = el('rect', { x: x, y: y, width: w, height: h, class: cls || '' }, parent);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) r.setAttribute(k, attrs[k]);
      }
    }
    return r;
  }

  function group(parent, attrs) {
    return el('g', attrs || {}, parent);
  }

  function fmt(n, digits) {
    if (n == null || !isFinite(n)) return '\u2014';
    var d = digits == null ? 2 : digits;
    return Number(n).toLocaleString('en-US', {
      maximumFractionDigits: d,
      minimumFractionDigits: 0
    });
  }

  function fmtFixed(n, digits) {
    if (n == null || !isFinite(n)) return '\u2014';
    var s = Number(n).toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
    return s.replace('-', '\u2212');
  }

  function fmtSigned(n, digits) {
    if (n == null || !isFinite(n)) return '\u2014';
    var s = fmtFixed(Math.abs(n), digits);
    return (n > 0 ? '+' : n < 0 ? '\u2212' : '') + s;
  }

  function fmtMoney(n, digits) {
    if (n == null || !isFinite(n)) return '\u2014';
    var d = digits == null ? 0 : digits;
    var s = '$' + fmt(Math.abs(n), d);
    return (n > 0 ? '+' : n < 0 ? '\u2212' : '') + s;
  }

  function fmtPct(n, digits) {
    return fmtFixed(n * 100, digits == null ? 0 : digits) + '%';
  }

  function debounce(fn, ms) {
    var t = null;
    return function () {
      var args = arguments;
      var self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  function once(fn) {
    var done = false;
    return function () {
      if (done) return;
      done = true;
      return fn.apply(this, arguments);
    };
  }

  global.MatchLabCharts = {
    NS: NS,
    clear: clear,
    el: el,
    svg: svg,
    scale: scale,
    niceTicks: niceTicks,
    text: text,
    line: line,
    path: path,
    circle: circle,
    rect: rect,
    group: group,
    fmt: fmt,
    fmtFixed: fmtFixed,
    fmtSigned: fmtSigned,
    fmtMoney: fmtMoney,
    fmtPct: fmtPct,
    debounce: debounce,
    once: once
  };
})(typeof window !== 'undefined' ? window : globalThis);
