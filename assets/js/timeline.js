/* Matching Lab — deterministic, seekable timeline.
 * Small enough to read; used by every animated scene.
 */
(function (global) {
  'use strict';

  var reducedQuery = global.matchMedia
    ? global.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  function prefersReduced() {
    return !!(reducedQuery && reducedQuery.matches);
  }

  function Timeline(opts) {
    opts = opts || {};
    this.duration = opts.duration || 4;
    this.onUpdate = opts.onUpdate || function () {};
    this.onEnd = opts.onEnd || null;
    this.elapsed = 0;
    this.playing = false;
    this.raf = null;
    this._last = 0;
    this._tick = this._tick.bind(this);
    this.onUpdate(0, 0);
  }

  Timeline.prototype.play = function () {
    if (prefersReduced()) {
      this.seek(this.duration);
      return;
    }
    if (this.playing) return;
    if (this.elapsed >= this.duration - 1e-4) this.elapsed = 0;
    this.playing = true;
    this._last = global.performance ? global.performance.now() : Date.now();
    this.raf = global.requestAnimationFrame(this._tick);
  };

  Timeline.prototype.pause = function () {
    this.playing = false;
    if (this.raf) global.cancelAnimationFrame(this.raf);
    this.raf = null;
  };

  Timeline.prototype.toggle = function () {
    if (this.playing) this.pause();
    else this.play();
    return this.playing;
  };

  Timeline.prototype.seek = function (t) {
    this.elapsed = Math.max(0, Math.min(this.duration, t));
    var p = this.duration ? this.elapsed / this.duration : 1;
    this.onUpdate(this.elapsed, p);
  };

  Timeline.prototype.seekProgress = function (p) {
    this.seek((this.duration || 0) * Math.max(0, Math.min(1, p)));
  };

  Timeline.prototype._tick = function (now) {
    if (!this.playing) return;
    var dt = (now - this._last) / 1000;
    this._last = now;
    this.elapsed += dt;
    var p = this.duration ? this.elapsed / this.duration : 1;
    if (p >= 1) {
      this.elapsed = this.duration;
      this.playing = false;
      this.onUpdate(this.elapsed, 1);
      if (this.onEnd) this.onEnd();
      return;
    }
    this.onUpdate(this.elapsed, p);
    this.raf = global.requestAnimationFrame(this._tick);
  };

  Timeline.prototype.destroy = function () {
    this.pause();
    this.onUpdate = function () {};
  };

  /* Pause a timeline when its element scrolls away or the tab hides. */
  function bindVisibility(element, timeline) {
    if (!element || !global.IntersectionObserver) return null;
    var io = new global.IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) timeline.pause();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(element);
    return io;
  }

  function onHidden(timeline) {
    if (!global.document) return;
    global.document.addEventListener('visibilitychange', function () {
      if (global.document.hidden) timeline.pause();
    });
  }

  global.MatchLabTimeline = Timeline;
  global.MatchLabTimeline.prefersReduced = prefersReduced;
  global.MatchLabTimeline.bindVisibility = bindVisibility;
  global.MatchLabTimeline.onHidden = onHidden;
})(typeof window !== 'undefined' ? window : globalThis);
