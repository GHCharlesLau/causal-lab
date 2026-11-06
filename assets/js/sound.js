/* Matching Lab — optional, synthesized paper-and-pencil sounds. */
(function (global) {
  'use strict';

  var enabled = false;
  var ctx = null;
  var master = null;
  var PENT = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    var C = global.AudioContext || global.webkitAudioContext;
    if (!C) return false;
    try {
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = 0.055;
      master.connect(ctx.destination);
      return true;
    } catch (e) {
      return false;
    }
  }

  function tone(freq, dur, gain, type, delay) {
    if (!enabled || !ensure()) return;
    var t0 = ctx.currentTime + (delay || 0);
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function pluck(index) {
    if (!enabled) return;
    var f = PENT[Math.abs(index) % PENT.length];
    tone(f, 0.26, 0.1, 'triangle', 0);
    tone(f * 2, 0.12, 0.03, 'sine', 0.01);
  }

  function tick() {
    tone(1180, 0.035, 0.018, 'square', 0);
  }

  function match() {
    tone(523.25, 0.09, 0.04, 'triangle', 0);
    tone(783.99, 0.12, 0.025, 'sine', 0.03);
  }

  function stamp() {
    tone(110, 0.28, 0.12, 'triangle', 0);
    tone(164.81, 0.2, 0.05, 'sine', 0.02);
  }

  function setEnabled(v) {
    enabled = !!v;
    if (enabled) {
      if (!ensure()) {
        enabled = false;
        return false;
      }
      pluck(2);
    }
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  global.MatchLabSound = {
    setEnabled: setEnabled,
    isEnabled: isEnabled,
    pluck: pluck,
    tick: tick,
    match: match,
    stamp: stamp,
    ensure: ensure
  };
})(typeof window !== 'undefined' ? window : globalThis);
