/* Matching Lab - application shell, progress, dialogs, quiz, checklist, code mirror. */
(function (global) {
  'use strict';

  var doc = global.document;
  var C = null;
  var CHAPTERS = [
    ['01', 'Introduction to Causality', 'planned'],
    ['02', 'Randomised Experiments', 'planned'],
    ['03', 'Stats Review', 'planned'],
    ['04', 'Graphical Causal Models', 'planned'],
    ['05', 'Linear Regression', 'planned'],
    ['06', 'Grouped & Dummy Regression', 'planned'],
    ['07', 'Beyond Confounders', 'planned'],
    ['08', 'Instrumental Variables', 'planned'],
    ['09', 'Non Compliance & LATE', 'planned'],
    ['10', 'Matching', 'active'],
    ['11', 'Propensity Score', 'next'],
    ['12', 'Doubly Robust Estimation', 'planned'],
    ['13', 'Difference-in-Differences', 'planned'],
    ['14', 'Panel Data & Fixed Effects', 'planned'],
    ['15', 'Synthetic Control', 'planned'],
    ['16', 'Regression Discontinuity', 'planned']
  ];

  var toastTimer = null;
  var knnSettings = { k: 1, features: ['severity', 'age', 'sex'], correct: false };

  function toast(message) {
    var el = doc.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    global.clearTimeout(toastTimer);
    toastTimer = global.setTimeout(function () {
      el.classList.remove('is-visible');
    }, 2300);
  }

  function initProgressArc() {
    var arc = doc.getElementById('progress-arc');
    if (!arc) return;
    var circumference = 2 * Math.PI * 16;
    arc.setAttribute('stroke-dasharray', circumference.toFixed(2));
  }

  function updateProgressUI() {
    var P = global.MatchLabProgress;
    var count = P.visitedCount();
    var total = P.SECTIONS.length;
    var arc = doc.getElementById('progress-arc');
    if (arc) {
      var circumference = 2 * Math.PI * 16;
      arc.setAttribute('stroke-dashoffset', (circumference * (1 - count / total)).toFixed(2));
    }
    var label = doc.getElementById('progress-label');
    if (label) label.textContent = count + ' of ' + total + ' sections visited';
    var countEl = doc.getElementById('progress-count');
    if (countEl) countEl.textContent = count + '/' + total;
    var railFill = doc.getElementById('rail-fill');
    if (railFill) railFill.style.height = (count / total) * 100 + '%';
    var railLinks = doc.querySelectorAll('[data-section-link]');
    railLinks.forEach(function (link) {
      link.classList.toggle('is-done', P.isVisited(link.dataset.sectionLink));
    });
  }

  function setActive(id) {
    doc.querySelectorAll('[data-section-link]').forEach(function (link) {
      link.classList.toggle('is-active', link.dataset.sectionLink === id);
    });
    global.MatchLabProgress.markVisited(id);
    updateProgressUI();
  }

  function initScrollSpy() {
    var sections = Array.prototype.slice.call(doc.querySelectorAll('[data-section]'));
    if (!sections.length) return;
    var current = null;
    var raf = null;

    function update() {
      raf = null;
      var probe = global.scrollY + 150;
      var best = sections[0];
      sections.forEach(function (s) {
        var top = s.getBoundingClientRect().top + global.scrollY;
        if (top <= probe) best = s;
      });
      if (best && best.id !== current) {
        current = best.id;
        setActive(current);
      }
    }

    function request() {
      if (raf) return;
      raf = global.requestAnimationFrame(update);
    }

    global.addEventListener('scroll', request, { passive: true });
    global.addEventListener('resize', request);
    update();
  }

  function initRailLinks() {
    doc.querySelectorAll('[data-section-link]').forEach(function (link) {
      link.addEventListener('click', function () {
        var id = link.dataset.sectionLink;
        if (id) setActive(id);
      });
    });
  }

  function initDialogs() {
    doc.querySelectorAll('[data-dialog]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = 'dlg-' + btn.dataset.dialog;
        var dlg = doc.getElementById(id);
        if (dlg && dlg.showModal) {
          dlg.showModal();
          if (id === 'dlg-film') {
            var video = doc.getElementById('film-video');
            if (video) video.load();
          }
        }
      });
    });

    doc.querySelectorAll('.dialog').forEach(function (dlg) {
      var close = dlg.querySelector('[data-close]');
      if (close) close.addEventListener('click', function () { dlg.close(); });
      dlg.addEventListener('click', function (e) {
        if (e.target === dlg) dlg.close();
      });
    });
  }

  function initCourseMap() {
    var grid = doc.getElementById('course-grid');
    if (!grid) return;

    if (global.CAUSAL_PARTS) {
      global.CAUSAL_PARTS.forEach(function (part) {
        var heading = doc.createElement('p');
        heading.className = 'course-group-label mono';
        heading.textContent = part.kicker + ' / ' + part.title;
        grid.appendChild(heading);

        part.chapters.forEach(function (ch) {
          var active = ch.slug === '10-matching';
          var live = ch.status === 'live';
          var ticket = doc.createElement(live && !active ? 'a' : 'div');
          ticket.className = 'course-ticket' + (active ? ' is-active' : '') + (live ? ' is-live' : ' is-planned');
          if (live && !active) ticket.href = '../' + ch.href;
          if (!live) ticket.setAttribute('aria-disabled', 'true');
          if (active) ticket.setAttribute('aria-current', 'page');

          var num = doc.createElement('span');
          num.className = 'mono';
          num.textContent = 'Ch. ' + ch.num;
          var title = doc.createElement('strong');
          title.textContent = ch.title;
          var status = doc.createElement('span');
          status.textContent = active ? 'reading' : live ? 'ready' : 'planned';
          ticket.appendChild(num);
          ticket.appendChild(title);
          ticket.appendChild(status);
          grid.appendChild(ticket);
        });
      });
      return;
    }

    CHAPTERS.forEach(function (row) {
      var ticket = doc.createElement('div');
      ticket.className = 'course-ticket' + (row[2] === 'active' ? ' is-active' : row[2] === 'planned' ? ' is-planned' : '');
      var num = doc.createElement('span');
      num.className = 'mono';
      num.textContent = 'Ch. ' + row[0];
      var title = doc.createElement('strong');
      title.textContent = row[1];
      var status = doc.createElement('span');
      status.textContent = row[2] === 'active' ? 'ready' : row[2] === 'next' ? 'next' : 'planned';
      ticket.appendChild(num);
      ticket.appendChild(title);
      ticket.appendChild(status);
      if (row[2] === 'active') {
        ticket.style.cursor = 'pointer';
        ticket.setAttribute('role', 'button');
        ticket.setAttribute('tabindex', '0');
        ticket.setAttribute('aria-label', 'Open the Matching chapter');
        var openChapter = function () {
          var dlg = doc.getElementById('dlg-course');
          if (dlg) dlg.close();
          var target = doc.getElementById('top');
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        };
        ticket.addEventListener('click', openChapter);
        ticket.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openChapter();
          }
        });
      }
      grid.appendChild(ticket);
    });
  }

  function initFilm() {
    var video = doc.getElementById('film-video');
    var fallback = doc.getElementById('film-fallback');
    if (!video || !fallback) return;
    fallback.hidden = false;
    video.addEventListener('loadedmetadata', function () {
      if (video.videoWidth > 0) fallback.hidden = true;
    });
    video.addEventListener('error', function () {
      fallback.hidden = false;
    });
  }

  function initSound() {
    var btn = doc.getElementById('btn-sound');
    var label = doc.getElementById('sound-label');
    if (!btn) return;

    function paint(on) {
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (label) label.textContent = on ? 'Sound on' : 'Sound off';
    }

    var saved = global.MatchLabProgress.getSetting('sound');
    if (saved) {
      var ok = global.MatchLabSound.setEnabled(true);
      paint(ok);
      if (!ok) global.MatchLabProgress.setSetting('sound', false);
    } else {
      paint(false);
    }

    btn.addEventListener('click', function () {
      var on = !global.MatchLabSound.isEnabled();
      var ok = global.MatchLabSound.setEnabled(on);
      if (on && !ok) {
        paint(false);
        toast('Audio is not available in this browser.');
        return;
      }
      paint(on);
      global.MatchLabProgress.setSetting('sound', on);
    });
  }

  function initPractice() {
    var btn = doc.getElementById('btn-practice');
    if (!btn) return;
    var saved = !!global.MatchLabProgress.getSetting('practice');

    function paint(on) {
      doc.body.classList.toggle('practice-mode', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (btn.querySelector('.icon-btn-text')) {
        btn.querySelector('.icon-btn-text').textContent = on ? 'Practice on' : 'Practice';
      }
      doc.dispatchEvent(new global.CustomEvent('matchlab:practice', { detail: { on: on } }));
    }

    paint(saved);
    btn.addEventListener('click', function () {
      var on = !doc.body.classList.contains('practice-mode');
      paint(on);
      global.MatchLabProgress.setSetting('practice', on);
      toast(on ? 'Practice mode: hints and truths hidden.' : 'Guided mode restored.');
    });
  }

  function initChecklist() {
    var inputs = Array.prototype.slice.call(doc.querySelectorAll('[data-check]'));
    var status = doc.getElementById('checklist-status');
    var stamp = doc.getElementById('checklist-stamp');
    if (!inputs.length) return;
    var state = global.MatchLabProgress.state.checklist || {};

    function paint() {
      var n = inputs.filter(function (i) { return i.checked; }).length;
      if (status) status.textContent = n + ' / ' + inputs.length;
      if (stamp) stamp.hidden = n !== inputs.length;
    }

    inputs.forEach(function (input) {
      input.checked = !!state[input.dataset.check];
      input.addEventListener('change', function () {
        global.MatchLabProgress.setChecklist(input.dataset.check, input.checked);
        paint();
        if (input.checked && global.MatchLabSound) global.MatchLabSound.tick();
        var n = inputs.filter(function (i) { return i.checked; }).length;
        if (n === inputs.length && global.MatchLabSound) global.MatchLabSound.stamp();
      });
    });
    paint();
  }

  var KEYWORDS = new Set(['import', 'from', 'as', 'def', 'return', 'for', 'in', 'if', 'else',
    'None', 'True', 'False', 'np', 'pd', 'and', 'or', 'not']);

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlightPython(code) {
    var out = '';
    var i = 0;
    while (i < code.length) {
      var ch = code[i];
      if (ch === '#') {
        var end = code.indexOf('\n', i);
        if (end < 0) end = code.length;
        out += '<span class="tok-c">' + escapeHtml(code.slice(i, end)) + '</span>';
        i = end;
      } else if (ch === '"' || ch === "'") {
        var quote = ch;
        var j = i + 1;
        while (j < code.length && code[j] !== quote) {
          if (code[j] === '\\') j++;
          j++;
        }
        j = Math.min(code.length, j + 1);
        out += '<span class="tok-s">' + escapeHtml(code.slice(i, j)) + '</span>';
        i = j;
      } else if (/[A-Za-z_]/.test(ch)) {
        var k = i + 1;
        while (k < code.length && /[A-Za-z0-9_]/.test(code[k])) k++;
        var word = code.slice(i, k);
        out += KEYWORDS.has(word) ? '<span class="tok-k">' + word + '</span>' : escapeHtml(word);
        i = k;
      } else if (/[0-9]/.test(ch)) {
        var n = i + 1;
        while (n < code.length && /[0-9._]/.test(code[n])) n++;
        out += '<span class="tok-n">' + code.slice(i, n) + '</span>';
        i = n;
      } else {
        out += escapeHtml(ch);
        i++;
      }
    }
    return out;
  }

  function codeFor(settings) {
    var features = settings.features || ['severity', 'age', 'sex'];
    var k = settings.k || 1;
    var featureList = features.map(function (f) { return '"' + f + '"'; }).join(', ');
    var lines = [
      'import numpy as np',
      'import pandas as pd',
      'from sklearn.neighbors import KNeighborsRegressor',
      'from sklearn.linear_model import LinearRegression',
      '',
      'med = pd.read_csv("data/medicine_impact_recovery.csv")',
      'X = [' + featureList + ']',
      'y = "recovery"',
      '',
      '# standardize before matching',
      'med[X] = (med[X] - med[X].mean()) / med[X].std()',
      '',
      'treated = med.query("medication == 1")',
      'untreated = med.query("medication == 0")',
      '',
      'mt0 = KNeighborsRegressor(n_neighbors=' + k + ').fit(untreated[X], untreated[y])',
      'mt1 = KNeighborsRegressor(n_neighbors=' + k + ').fit(treated[X], treated[y])',
      '',
      'predicted = pd.concat([',
      '    treated.assign(match=mt0.predict(treated[X])),',
      '    untreated.assign(match=mt1.predict(untreated[X])),',
      '])',
      '',
      'ate = np.mean((2 * predicted["medication"] - 1) *',
      '              (predicted["recovery"] - predicted["match"]))',
      'print("matching ATE:", round(ate, 3))'
    ];
    if (settings.correct) {
      lines = lines.concat([
        '',
        '# bias correction: fit mu0 on the untreated, mu1 on the treated',
        'ols0 = LinearRegression().fit(untreated[X], untreated[y])',
        'ols1 = LinearRegression().fit(treated[X], treated[y])',
        '',
        'treated_match = mt0.kneighbors(treated[X], n_neighbors=' + k + ')[1]',
        'untreated_match = mt1.kneighbors(untreated[X], n_neighbors=' + k + ')[1]',
        '',
        'predicted_t = treated.assign(match=mt0.predict(treated[X]))',
        'predicted_t["corr"] = (ols0.predict(treated[X]) -',
        '    ols0.predict(untreated.iloc[treated_match.ravel()][X]).reshape(len(treated), ' + k + ').mean(1))',
        '',
        'predicted_c = untreated.assign(match=mt1.predict(untreated[X]))',
        'predicted_c["corr"] = (ols1.predict(untreated[X]) -',
        '    ols1.predict(treated.iloc[untreated_match.ravel()][X]).reshape(len(untreated), ' + k + ').mean(1))',
        '',
        'ate_bc = np.mean((2 * predicted["medication"] - 1) *',
        '                 ((predicted["recovery"] - predicted["match"]) -',
        '                  pd.concat([predicted_t["corr"], predicted_c["corr"]])))',
        'print("bias-corrected ATE:", round(ate_bc, 3))'
      ]);
    }
    return lines.join('\n');
  }

  function renderCode(settings) {
    var codeEl = doc.getElementById('code-mirror');
    if (!codeEl) return;
    var code = codeFor(settings);
    codeEl.innerHTML = highlightPython(code);
    codeEl.dataset.raw = code;
  }

  function initCode() {
    var copy = doc.getElementById('copy-code');
    renderCode(knnSettings);
    doc.addEventListener('matchlab:knnchange', function (e) {
      knnSettings = e.detail || knnSettings;
      renderCode(knnSettings);
    });
    if (copy) {
      copy.addEventListener('click', function () {
        var codeEl = doc.getElementById('code-mirror');
        var text = codeEl ? codeEl.dataset.raw || codeEl.textContent : '';
        function done() { toast('Python copied to clipboard.'); }
        function fallback() {
          var ta = doc.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          doc.body.appendChild(ta);
          ta.select();
          try { doc.execCommand('copy'); done(); } catch (e) { toast('Select the code and copy it manually.'); }
          doc.body.removeChild(ta);
        }
        if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
          global.navigator.clipboard.writeText(text).then(done).catch(fallback);
        } else {
          fallback();
        }
      });
    }
  }

  function initScenes() {
    var scenes = global.MatchLabScenes || {};
    ['problem', 'regression', 'cells', 'exact', 'knn', 'bias', 'curse'].forEach(function (id) {
      if (typeof scenes[id] !== 'function') return;
      try {
        scenes[id]();
      } catch (err) {
        if (global.console) global.console.error('scene ' + id + ' failed', err);
      }
    });
  }

  function boot() {
    C = global.MatchLabCharts;
    global.MatchLabProgress.load();
    initProgressArc();
    initDialogs();
    initCourseMap();
    initFilm();
    initSound();
    initPractice();
    initRailLinks();
    initScrollSpy();
    initChecklist();
    initCode();
    if (global.MatchLabQuiz) global.MatchLabQuiz.init();
    initScenes();
    updateProgressUI();
    setActive('problem');

    global.MatchLab = {
      ready: true,
      version: '1.0',
      stats: global.MatchLabStats,
      data: global.MatchLabData,
      reference: global.MatchLabReference,
      toast: toast
    };
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);

