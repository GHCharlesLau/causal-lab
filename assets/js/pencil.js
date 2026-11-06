/* Matching Lab — pencil geometry helpers.
 * Deterministic jitter, smooth paths, write-on progress, and tip tracking.
 */
(function (global) {
  'use strict';

  function rng(seed) {
    var a = (seed || 1) >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function jitter(points, amp, seed) {
    var r = rng(seed);
    return points.map(function (p) {
      return [p[0] + (r() - 0.5) * amp, p[1] + (r() - 0.5) * amp];
    });
  }

  /* Catmull-Rom -> cubic Bezier, for a soft handwritten line. */
  function smoothPath(points, tension) {
    if (!points.length) return '';
    if (points.length === 1) return 'M' + points[0][0] + ',' + points[0][1];
    var t = tension == null ? 0.5 : tension;
    var d = 'M' + points[0][0] + ',' + points[0][1];
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[i - 1] || points[i];
      var p1 = points[i];
      var p2 = points[i + 1];
      var p3 = points[i + 2] || p2;
      var c1x = p1[0] + ((p2[0] - p0[0]) / 6) * t;
      var c1y = p1[1] + ((p2[1] - p0[1]) / 6) * t;
      var c2x = p2[0] - ((p3[0] - p1[0]) / 6) * t;
      var c2y = p2[1] - ((p3[1] - p1[1]) / 6) * t;
      d += 'C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + p2[0] + ',' + p2[1];
    }
    return d;
  }

  /* A gentle arc between two points; `bow` is perpendicular offset in px. */
  function matchPath(x1, y1, x2, y2, bow, seed) {
    var r = rng(seed || 1);
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2;
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / len;
    var ny = dx / len;
    var b = (bow == null ? 8 : bow) * (0.7 + r() * 0.6);
    var cx = mx + nx * b;
    var cy = my + ny * b;
    return 'M' + x1 + ',' + y1 + 'Q' + cx + ',' + cy + ' ' + x2 + ',' + y2;
  }

  function setDrawProgress(el, p) {
    if (!el || !el.getTotalLength) return;
    var len = el.getTotalLength();
    el.style.strokeDasharray = len + ' ' + len;
    el.style.strokeDashoffset = String(len * (1 - Math.max(0, Math.min(1, p))));
  }

  function tipAt(el, p) {
    if (!el || !el.getTotalLength) return null;
    var len = el.getTotalLength();
    var pt = el.getPointAtLength(len * Math.max(0, Math.min(1, p)));
    return { x: pt.x, y: pt.y };
  }

  /* Reveal a text node left-to-right with a clip path. */
  function revealText(el, p) {
    if (!el) return;
    var w = el.getBBox ? el.getBBox().width : 0;
    el.setAttribute('clip-path', 'inset(0 ' + (100 - Math.max(0, Math.min(1, p)) * 100) + '% 0 0)');
    return w;
  }

  global.MatchLabPencil = {
    rng: rng,
    jitter: jitter,
    smoothPath: smoothPath,
    matchPath: matchPath,
    setDrawProgress: setDrawProgress,
    tipAt: tipAt,
    revealText: revealText
  };
})(typeof window !== 'undefined' ? window : globalThis);
