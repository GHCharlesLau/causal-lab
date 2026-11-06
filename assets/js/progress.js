/* Matching Lab — progress and preferences, with a safe localStorage fallback. */
(function (global) {
  'use strict';

  var KEY = 'matching-lab:v1';
  var SECTIONS = ['problem', 'regression', 'cells', 'exact', 'knn', 'bias', 'curse', 'practice'];

  var defaults = {
    visited: {},
    quiz: { answers: {}, score: 0, submitted: false },
    checklist: {},
    settings: { sound: false, practice: false },
    notes: {}
  };

  var state = JSON.parse(JSON.stringify(defaults));
  var listeners = [];

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(defaults));
  }

  function load() {
    try {
      var raw = global.localStorage ? global.localStorage.getItem(KEY) : null;
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          state.visited = parsed.visited || {};
          state.quiz = parsed.quiz || cloneDefaults().quiz;
          state.checklist = parsed.checklist || {};
          state.settings = Object.assign({}, defaults.settings, parsed.settings || {});
          state.notes = parsed.notes || {};
        }
      }
    } catch (e) {
      Object.assign(state, cloneDefaults());
    }
    return state;
  }

  function save() {
    try {
      if (global.localStorage) global.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* file:// or private mode: keep working in memory */
    }
  }

  function notify() {
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](state);
      } catch (e) {
        /* keep one listener from breaking the rest */
      }
    }
  }

  function onChange(fn) {
    if (typeof fn === 'function') listeners.push(fn);
    return function () {
      var i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  function markVisited(id) {
    if (!state.visited[id]) {
      state.visited[id] = true;
      save();
      notify();
    }
  }

  function isVisited(id) {
    return !!state.visited[id];
  }

  function visitedCount() {
    var n = 0;
    for (var i = 0; i < SECTIONS.length; i++) if (state.visited[SECTIONS[i]]) n++;
    return n;
  }

  function setSetting(key, value) {
    state.settings[key] = value;
    save();
    notify();
  }

  function getSetting(key) {
    return state.settings[key];
  }

  function setQuiz(payload) {
    state.quiz = Object.assign({}, state.quiz, payload);
    save();
    notify();
  }

  function setChecklist(id, value) {
    state.checklist[id] = !!value;
    save();
    notify();
  }

  function checklistCount() {
    var n = 0;
    for (var k in state.checklist) if (state.checklist[k]) n++;
    return n;
  }

  function setNote(id, value) {
    state.notes[id] = value;
    save();
  }

  function reset() {
    Object.assign(state, cloneDefaults());
    save();
    notify();
  }

  global.MatchLabProgress = {
    SECTIONS: SECTIONS,
    state: state,
    load: load,
    save: save,
    onChange: onChange,
    markVisited: markVisited,
    isVisited: isVisited,
    visitedCount: visitedCount,
    setSetting: setSetting,
    getSetting: getSetting,
    setQuiz: setQuiz,
    setChecklist: setChecklist,
    checklistCount: checklistCount,
    setNote: setNote,
    reset: reset,
    notify: notify
  };
})(typeof window !== 'undefined' ? window : globalThis);
