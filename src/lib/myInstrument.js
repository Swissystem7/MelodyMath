// MelodyMath — "my instrument": the one instrument the child chose, for the
// whole app (#679, mid-session switch). Every screen reads the choice from
// here; no screen keeps its own key or its own instrument list.
//
// - One storage key, validated against instrumentById of instruments.js, so
//   any world instrument is allowed and an unknown id is never returned.
// - One-time migration of the old per-screen key 'mm-tap-instrument'.
// - setMyInstrument() fires 'mm:instrument' on the window so an open screen
//   can redraw in the new timbre without losing its progress.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_MY_INSTRUMENT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const KEY = 'mm.myInstrument';
  const LEGACY_KEY = 'mm-tap-instrument';
  const EVENT = 'mm:instrument';

  function data() {
    if (root && typeof root.instrumentById === 'function') return root;
    try { return require('./instruments.js'); } catch (e) { return null; }
  }
  function valid(id) {
    const d = data();
    return typeof id === 'string' && !!d && !!d.instrumentById(id);
  }
  function store(storage) {
    try { return storage || root.localStorage || null; } catch (e) { return null; }
  }

  // The chosen instrument id, or null when the child has not chosen one.
  function getMyInstrument(storage) {
    const s = store(storage);
    if (!s) return null;
    try {
      let id = s.getItem(KEY);
      if (id == null) {
        const old = s.getItem(LEGACY_KEY);
        if (old != null) {
          s.removeItem(LEGACY_KEY);
          if (valid(old)) { s.setItem(KEY, old); id = old; }
        }
      }
      return valid(id) ? id : null;
    } catch (e) { return null; }
  }

  // Saves the choice; false for an unknown id (the old choice stays).
  function setMyInstrument(id, storage) {
    if (!valid(id)) return false;
    const s = store(storage);
    try { if (s) s.setItem(KEY, id); } catch (e) { /* private mode */ }
    try {
      if (root && typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {
        root.dispatchEvent(new root.CustomEvent(EVENT, { detail: { id: id } }));
      }
    } catch (e) { /* no DOM */ }
    return true;
  }

  // The instrument a screen should sound: the child's choice first, then the
  // screen's own default. `allowed` limits it to the ids the screen offers.
  function instrumentFor(fallbackId, allowed, storage) {
    const id = getMyInstrument(storage);
    if (id && (!allowed || allowed.indexOf(id) >= 0)) return id;
    return fallbackId;
  }

  return { KEY, LEGACY_KEY, EVENT, getMyInstrument, setMyInstrument, instrumentFor };
});
