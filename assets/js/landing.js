/* ============================================================
   Landing page renderer: course map + local visit state.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var parts = global.CAUSAL_PARTS || [];
  var chapters = global.CAUSAL_CHAPTERS || [];
  var mount = doc.getElementById('course-parts');
  if (!mount) return;

  var visited = {};
  try {
    var raw = global.localStorage.getItem('causal-atlas:v1');
    var state = raw ? JSON.parse(raw) : null;
    visited = (state && state.visited) || {};
  } catch (e) {}

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function statusText(ch) {
    if (ch.status === 'live') return visited[ch.slug] ? 'read again' : 'ready to read';
    return 'planned';
  }

  function card(ch) {
    var isVisited = !!visited[ch.slug];
    var cls = 'chapter-card ' + (ch.status === 'live' ? 'is-live' : 'is-planned') + (isVisited ? ' is-visited' : '');
    var inner =
      '<span class="chapter-num">Ch. ' + esc(ch.num) + '</span>' +
      '<h3>' + esc(ch.title) + '</h3>' +
      '<p class="chapter-short">' + esc(ch.short) + '</p>' +
      '<p class="chapter-deck">' + esc(ch.deck) + '</p>' +
      '<span class="chapter-status"><span class="status-dot" aria-hidden="true"></span>' + esc(statusText(ch)) + '</span>';
    if (ch.status === 'live') {
      return '<a class="' + cls + '" href="' + esc(ch.href) + '">' + inner + '</a>';
    }
    return '<div class="' + cls + '" aria-disabled="true">' + inner + '</div>';
  }

  mount.innerHTML = parts.map(function (part) {
    var live = part.chapters.filter(function (ch) { return ch.status === 'live'; }).length;
    return '<section class="course-part" aria-labelledby="part-' + esc(part.id) + '">' +
      '<div class="course-part-head">' +
        '<div>' +
          '<p class="course-part-kicker">' + part.kicker + '</p>' +
          '<h2 class="course-part-title" id="part-' + esc(part.id) + '">' + esc(part.title) + '</h2>' +
          '<p class="course-part-blurb">' + esc(part.blurb) + '</p>' +
        '</div>' +
        '<p class="course-part-count mono">' + live + ' live / ' + part.chapters.length + '</p>' +
      '</div>' +
      '<div class="chapter-grid">' + part.chapters.map(function (ch) {
        return card(global.CAUSAL_BY_SLUG[ch.slug] || ch);
      }).join('') + '</div>' +
    '</section>';
  }).join('');

  var liveCount = chapters.filter(function (ch) { return ch.status === 'live'; }).length;
  var visitedCount = Object.keys(visited).filter(function (slug) {
    return global.CAUSAL_BY_SLUG[slug];
  }).length;

  var liveEl = doc.getElementById('live-count');
  var visitedEl = doc.getElementById('visited-count');
  if (liveEl) liveEl.textContent = String(liveCount);
  if (visitedEl) visitedEl.textContent = String(visitedCount);
})(window);
