// MelodyMath — every exercise opens with a sound (#665 requirement 2a).
//
// maybeHear already plays the item's own music (count clicks, the number
// play button, a NumberPlay plan) when an exercise opens. Two gaps stayed
// silent: items with none of those, and browsers that block autoplay, where
// the sound was scheduled on a suspended context and lost. This file closes
// both and nothing else:
// - an item with no music of its own gets a short two-note chime;
// - a suspended context defers the item's sound to the first tap or key
//   press, which is the moment the browser allows audio;
// - the existing mute toggle (access prefs, quiet) and the no-music mastery
//   checks (item.noMusic) stay silent.
// The tap sound on an answer (#744) and the spoken instructions (#725) are
// separate; this only covers the moment the exercise opens.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_OPEN_CUE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEADLINE_MS = 1000;
  // C5 then G5: a neutral "here is a new one" call, never the answer.
  const CHIME = [523.25, 783.99];
  const CHIME_LEAD = 0.02;
  const CHIME_STEP = 0.11;

  function playChime(ac) {
    const t0 = ac.currentTime + CHIME_LEAD;
    CHIME.forEach(function (freq, i) {
      const at = t0 + i * CHIME_STEP;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.16, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(at);
      osc.stop(at + 0.2);
    });
    return t0;
  }

  // env.getContext() -> AudioContext or null; env.isQuiet() -> bool;
  // env.unlock() resumes inside a gesture; env.target gets the gesture
  // listeners (document on the page).
  function createOpenCue(env) {
    const e = env || {};
    let pending = null;
    let lastItem = null;

    function getContext() {
      try { return typeof e.getContext === 'function' ? e.getContext() : null; } catch (err) { return null; }
    }
    function isQuiet() { return typeof e.isQuiet === 'function' && !!e.isQuiet(); }

    function flush() {
      const run = pending;
      pending = null;
      if (run) run();
    }

    function onGesture() {
      if (!pending) return;
      const done = typeof e.unlock === 'function' ? e.unlock() : null;
      const ac = getContext();
      if (ac && ac.state === 'running') { flush(); return; }
      Promise.resolve(done).then(flush, flush);
    }
    if (e.target && typeof e.target.addEventListener === 'function') {
      e.target.addEventListener('pointerdown', onGesture, true);
      e.target.addEventListener('keydown', onGesture, true);
    }

    // playMain() plays the item's own music and returns true if it did.
    // A repeat of the same item (the replay after a mistake) never chimes.
    function open(item, playMain) {
      pending = null;
      if (!item) return { status: 'none' };
      const fresh = item !== lastItem;
      lastItem = item;
      if (item.noMusic) return { status: 'no-music' };
      if (isQuiet()) return { status: 'muted' };
      const ac = getContext();
      if (!ac) return { status: 'unavailable' };
      function run() {
        if (isQuiet()) return;
        const ctx = getContext();
        if (!ctx) return;
        const played = typeof playMain === 'function' && playMain() === true;
        if (!played && fresh) playChime(ctx);
      }
      if (ac.state === 'running') { run(); return { status: 'played' }; }
      pending = run;
      // A page the child already tapped on may resume without a new gesture.
      try {
        const p = ac.resume && ac.resume();
        Promise.resolve(p).then(function () {
          if (pending === run && ac.state === 'running') flush();
        }, function () { /* still blocked: wait for the gesture */ });
      } catch (err) { /* autoplay policy */ }
      return { status: 'waiting' };
    }

    return { open: open, hasPending: function () { return !!pending; } };
  }

  return { createOpenCue: createOpenCue, playChime: playChime, DEADLINE_MS: DEADLINE_MS, CHIME: CHIME };
});
