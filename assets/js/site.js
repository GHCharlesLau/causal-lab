/* ============================================================
   Chapter shell: top bar, rail, course map, footer, reading
   progress. Every chapter page defines window.CHAPTER, loads
   chapters.js, then this file. No framework, no fetch.
   ============================================================ */
(function (global) {
  'use strict';

  var doc = global.document;
  var C = global.CHAPTER;
  if (!C) return;

  var root = '../';
  var parts = global.CAUSAL_PARTS || [];
  var chapters = global.CAUSAL_CHAPTERS || [];
  var current = null;
  var currentIndex = -1;

  for (var i = 0; i < chapters.length; i++) {
    if (chapters[i].slug === C.slug) {
      current = chapters[i];
      currentIndex = i;
      break;
    }
  }
  if (!current) {
    current = { num: C.num, title: C.title, slug: C.slug, status: 'live' };
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function chapterHref(ch) {
    return root + ch.href;
  }

  function ticket(ch) {
    var active = ch.slug === C.slug;
    var cls = 'course-ticket' + (active ? ' is-active' : '') + (ch.status === 'live' ? ' is-live' : ' is-planned');
    var label = active ? 'reading' : ch.status === 'live' ? 'ready' : 'planned';
    var inner = '<span class="mono">Ch. ' + esc(ch.num) + '</span>' +
      '<strong>' + esc(ch.title) + '</strong>' +
      '<span>' + label + '</span>';
    if (ch.status === 'live') {
      return '<a class="' + cls + '" href="' + chapterHref(ch) + '"' +
        (active ? ' aria-current="page"' : '') + '>' + inner + '</a>';
    }
    return '<div class="' + cls + '" aria-disabled="true">' + inner + '</div>';
  }

  function mapMarkup() {
    return parts.map(function (part) {
      return '<section class="course-part" aria-labelledby="map-' + esc(part.id) + '">' +
        '<p class="course-part-title" id="map-' + esc(part.id) + '">' + part.kicker + ' &middot; ' + esc(part.title) + '</p>' +
        '<div class="course-grid">' + part.chapters.map(function (ch) {
          var full = global.CAUSAL_BY_SLUG[ch.slug] || ch;
          return ticket(full);
        }).join('') + '</div>' +
        '</section>';
    }).join('');
  }

  /* ---------------------------------------------------------- top bar */
  var header = doc.getElementById('site-header');
  if (header) {
    header.innerHTML =
      '<header class="topbar" id="topbar">' +
        '<a class="brand" href="' + root + 'index.html" aria-label="Causal Field Notes, home">' +
          '<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">' +
            '<path d="M8 23 21 7l4 3-13 16z" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
            '<path d="M8 23l-3 4 5-1" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
            '<circle cx="23" cy="9" r="2.2" fill="#a8283a"/>' +
          '</svg>' +
          '<span class="brand-text">Causal Field Notes</span>' +
        '</a>' +
        '<div class="topbar-chapter">' +
          '<span class="mono">Ch. ' + esc(C.num) + '</span>' +
          '<span class="topbar-slash">/</span>' +
          '<span>' + esc(C.title) + '</span>' +
        '</div>' +
        '<div class="topbar-actions">' +
          '<button class="icon-btn" type="button" data-dialog="course" title="Course map" aria-label="Open course map">' +
            '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4h5v12H3zM12 4h5v12h-5z" fill="none" stroke="currentColor"/></svg>' +
            '<span class="icon-btn-text">Course map</span>' +
          '</button>' +
          '<button class="icon-btn practice-toggle" type="button" id="btn-practice" aria-pressed="false" title="Hide hints and answers" aria-label="Toggle practice mode">' +
            '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor"/><path d="M7 10l2 2 4-5" fill="none" stroke="currentColor"/></svg>' +
            '<span class="icon-btn-text">Practice</span>' +
          '</button>' +
        '</div>' +
      '</header>' +
      '<div class="reading-progress" aria-hidden="true"><span id="reading-fill"></span></div>';
  }

  /* ---------------------------------------------------------- rail */
  var rail = doc.getElementById('site-rail');
  var sections = C.sections || [];
  if (rail && sections.length) {
    rail.innerHTML =
      '<nav class="rail" aria-label="Chapter sections">' +
        '<div class="rail-progress" aria-hidden="true"><span id="rail-fill"></span></div>' +
        '<ol class="rail-list">' + sections.map(function (s) {
          return '<li><a class="rail-link" href="#' + esc(s.id) + '" data-section-link="' + esc(s.id) + '">' +
            '<span class="rail-num">' + esc(s.num) + '</span>' +
            '<span class="rail-name">' + esc(s.label) + '</span></a></li>';
        }).join('') + '</ol>' +
      '</nav>';
  }

  /* ---------------------------------------------------------- footer */
  var prev = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  var next = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  function pager(ch, direction) {
    if (!ch) return '';
    var label = direction === 'prev' ? 'Previous' : 'Next';
    if (ch.status === 'live') {
      return '<a class="chapter-pager-link" href="' + chapterHref(ch) + '"><span class="mono">' + label + '</span><strong>' +
        esc(ch.num) + ' &middot; ' + esc(ch.title) + '</strong></a>';
    }
    return '<span class="chapter-pager-link is-planned"><span class="mono">' + label + '</span><strong>' +
      esc(ch.num) + ' &middot; ' + esc(ch.title) + ' <em>(planned)</em></strong></span>';
  }
  var footer = doc.getElementById('site-footer');
  if (footer) {
    footer.innerHTML =
      '<footer class="footer sheet">' +
        '<div class="chapter-pager">' + pager(prev, 'prev') + pager(next, 'next') + '</div>' +
        '<div class="footer-grid">' +
          '<div>' +
            '<p class="footer-mark">Causal Field Notes</p>' +
            '<p class="footer-note">An independent, interactive field guide to <em>Causal Inference for the Brave and True</em>. The prose is adapted from the book (MIT); the mistakes and interfaces are ours.</p>' +
          '</div>' +
          '<div>' +
            '<p class="mono">Sources</p>' +
            '<ul class="footer-list">' +
              '<li><a href="' + esc(C.source || 'https://matheusfacure.github.io/python-causality-handbook/landing-page.html') + '" target="_blank" rel="noreferrer">Facure, Chapter ' + esc(C.num) + ' &mdash; ' + esc(C.title) + '</a></li>' +
              '<li><a href="https://github.com/matheusfacure/python-causality-handbook" target="_blank" rel="noreferrer">Book repository &amp; data (MIT)</a></li>' +
              '<li><a href="https://github.com/lemomo-ai/lemo-opuscar" target="_blank" rel="noreferrer">Lemo-Opuscar &mdash; Data Storytelling style (MIT)</a></li>' +
            '</ul>' +
          '</div>' +
          '<div>' +
            '<p class="mono">How to read</p>' +
            '<p class="footer-note">Read the story, play the lab, then write the assumption down. Every chapter ends with a short defense and a notebook.</p>' +
          '</div>' +
        '</div>' +
        '<div class="footer-bottom mono">' +
          '<span>Chapter ' + esc(C.num) + ' / 25</span>' +
          '<button class="link-btn" type="button" data-dialog="course">Course map</button>' +
          '<span>Built for learning, not for production estimates.</span>' +
        '</div>' +
      '</footer>';
  }

  /* ---------------------------------------------------------- course map */
  var dlg = doc.createElement('dialog');
  dlg.className = 'dialog';
  dlg.id = 'dlg-course';
  dlg.setAttribute('aria-labelledby', 'dlg-course-title');
  dlg.innerHTML =
    '<div class="dialog-inner dialog-inner--map">' +
      '<button class="dialog-close" type="button" data-close aria-label="Close">&times;</button>' +
      '<p class="kicker">The course map</p>' +
      '<h2 id="dlg-course-title">The whole book, in field notes.</h2>' +
      '<p class="dialog-deck">Ten chapters are live. The rest are being rebuilt one experiment at a time; planned pages are marked, not silently broken.</p>' +
      '<div class="course-map">' + mapMarkup() + '</div>' +
      '<p class="dialog-note mono">Live: 01, 02, 03, 04, 05, 06, 07, 08, 09 and 10 &middot; 25 chapters + 5 technical notes &middot; source: Facure (MIT)</p>' +
    '</div>';
  doc.body.appendChild(dlg);

  /* ---------------------------------------------------------- dialogs */
  function openDialog(id) {
    var el = doc.getElementById(id);
    if (el && el.showModal) el.showModal();
  }
  doc.querySelectorAll('[data-dialog]').forEach(function (btn) {
    btn.addEventListener('click', function () { openDialog('dlg-' + btn.dataset.dialog); });
  });
  doc.querySelectorAll('.dialog').forEach(function (d) {
    var close = d.querySelector('[data-close]');
    if (close) close.addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
  });

  /* ---------------------------------------------------------- practice mode */
  var practiceBtn = doc.getElementById('btn-practice');
  var practiceKey = 'causal-atlas:practice';
  function setPractice(on) {
    doc.body.classList.toggle('practice-mode', on);
    if (practiceBtn) practiceBtn.setAttribute('aria-pressed', String(on));
    try { global.localStorage.setItem(practiceKey, on ? '1' : '0'); } catch (e) {}
  }
  if (practiceBtn) {
    var savedPractice = false;
    try { savedPractice = global.localStorage.getItem(practiceKey) === '1'; } catch (e) {}
    setPractice(savedPractice);
    practiceBtn.addEventListener('click', function () {
      setPractice(!doc.body.classList.contains('practice-mode'));
    });
  }

  /* ---------------------------------------------------------- scroll spy + progress */
  var links = Array.prototype.slice.call(doc.querySelectorAll('[data-section-link]'));
  var fill = doc.getElementById('reading-fill');
  var railFill = doc.getElementById('rail-fill');
  var ticking = false;

  function updateScroll() {
    ticking = false;
    var max = doc.documentElement.scrollHeight - global.innerHeight;
    var ratio = max > 0 ? Math.min(1, Math.max(0, global.scrollY / max)) : 0;
    if (fill) fill.style.width = (ratio * 100).toFixed(2) + '%';
    if (railFill) railFill.style.height = (ratio * 100).toFixed(2) + '%';

    var active = sections.length ? sections[0].id : null;
    for (var i = 0; i < sections.length; i++) {
      var el = doc.getElementById(sections[i].id);
      if (el && el.getBoundingClientRect().top <= 160) active = sections[i].id;
    }
    links.forEach(function (link) {
      var on = link.getAttribute('data-section-link') === active;
      link.classList.toggle('is-active', on);
      if (on) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      global.requestAnimationFrame(updateScroll);
    }
  }
  global.addEventListener('scroll', onScroll, { passive: true });
  global.addEventListener('resize', onScroll);
  updateScroll();

  /* ---------------------------------------------------------- visited */
  try {
    var raw = global.localStorage.getItem('causal-atlas:v1');
    var state = raw ? JSON.parse(raw) : { visited: {} };
    state.visited = state.visited || {};
    state.visited[C.slug] = Date.now();
    global.localStorage.setItem('causal-atlas:v1', JSON.stringify(state));
  } catch (e) {}
})(window);
