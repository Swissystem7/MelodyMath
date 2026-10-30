// MelodyMath — every exercise opens with a sound within 1 s (#665 req 2a).
//
// open(item) plays the item's own music; an item with none gets a short
// neutral chime (C5 then G5) that says nothing about the answer. When the
// browser blocked autoplay (context 'suspended') the sound waits for the
// first pointerdown/keydown or for resume() to succeed. Mute is checked at
// open and again just before a deferred sound fires. Opening the same item
// object again (a replay after a mistake) plays only the item's music.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_OPEN_CUE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CHIME_HZ = [523.25, 783.99]; // C5, G5
  const STEP = 0.14;

  function playChime(ctx) {
    if (!ctx || typeof ctx.createOscillator !== 'function') return null;
    const t0 = ctx.currentTime + 0.02;
    CHIME_HZ.forEach(function (hz, i) {
      const t = t0 + i * STEP;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(hz, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.32);
    });
    return t0;
  }

  // opts: getContext() -> AudioContext|null, playItemMusic(item) -> bool,
  // isMuted() -> bool, target: where to listen for the unlocking gesture.
  function createOpenCue(opts) {
    const o = opts || {};
    const getContext = o.getContext || function () { return null; };
    const isMuted = o.isMuted || function () { return false; };
    const playItemMusic = o.playItemMusic || function () { return false; };
    const target = o.target || null;
    let last = null;
    let pending = null;

    function unlisten() {
      if (!target || typeof target.removeEventListener !== 'function') return;
      target.removeEventListener('pointerdown', fire, true);
      target.removeEventListener('keydown', fire, true);
    }

    function sound(p) {
      if (!p.chimeOnly && playItemMusic(p.item)) return true;
      return playChime(getContext()) != null;
    }

    function fire() {
      const p = pending;
      pending = null;
      unlisten();
      if (!p || isMuted()) return false;
      const ctx = getContext();
      if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* still blocked */ } }
      return sound(p);
    }

    function open(item, how) {
      if (!item || item.noMusic || isMuted()) return false;
      const replay = item === last;
      last = item;
      pending = null;
      unlisten();
      if (replay) return !!playItemMusic(item);
      const p = { item: item, chimeOnly: !!(how && how.chimeOnly) };
      const ctx = getContext();
      if (ctx && ctx.state === 'suspended') {
        pending = p;
        if (target && typeof target.addEventListener === 'function') {
          target.addEventListener('pointerdown', fire, true);
          target.addEventListener('keydown', fire, true);
        }
        try {
          const r = ctx.resume();
          if (r && typeof r.then === 'function') r.then(function () { if (pending === p) fire(); }, function () {});
        } catch (e) { /* autoplay policy */ }
        return 'deferred';
      }
      return sound(p);
    }

    // Marks an item whose music the screen already played itself, so a later
    // replay of it never adds the chime.
    function seen(item) { last = item || null; }

    return { open: open, seen: seen, isPending: function () { return !!pending; } };
  }

  return { createOpenCue: createOpenCue, playChime: playChime, CHIME_HZ: CHIME_HZ };
});
