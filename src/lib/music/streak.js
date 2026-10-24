// MelodyMath — streak layers for TimesTableGroove (#591, proposal 2/5).
//
// Every 3 correct answers in a row add one layer to the tune (bass, then
// melody, then harmony). A wrong answer restarts the count but never removes
// a layer and never plays a punishment sound: the reward is musical and
// shows mastery, with no points (proposal 2/5, Deci, Koestner & Ryan 1999).
// State is a plain object; load/save go through an injectable storage
// (localStorage in the browser, a Map-like stub in tests).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_STREAK = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LAYERS = ['bass', 'melody', 'harmony'];
  const PER_LAYER = 3;
  const STORAGE_KEY = 'mm.groove.streak';

  function initialStreak() {
    return { streak: 0, layers: [] };
  }

  // Record one answer. Returns { state, layerAdded, sound } and never mutates
  // the given state. sound is 'layer' when a layer was added, else null.
  function recordAnswer(state, correct) {
    const s = state || initialStreak();
    const layers = (s.layers || []).slice();
    if (!correct) return { state: { streak: 0, layers: layers }, layerAdded: null, sound: null };
    const streak = (s.streak || 0) + 1;
    let added = null;
    if (streak % PER_LAYER === 0 && layers.length < LAYERS.length) {
      added = LAYERS[layers.length];
      layers.push(added);
    }
    return { state: { streak: streak, layers: layers }, layerAdded: added, sound: added ? 'layer' : null };
  }

  function loadStreak(storage, key) {
    try {
      const raw = storage && storage.getItem(key || STORAGE_KEY);
      const v = raw ? JSON.parse(raw) : null;
      if (v && Number.isInteger(v.streak) && Array.isArray(v.layers)) {
        return { streak: v.streak, layers: v.layers.filter(function (l) { return LAYERS.indexOf(l) !== -1; }) };
      }
    } catch (e) { /* unreadable storage -> start fresh */ }
    return initialStreak();
  }

  function saveStreak(storage, state, key) {
    if (!storage) return false;
    try {
      storage.setItem(key || STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    LAYERS: LAYERS,
    PER_LAYER: PER_LAYER,
    STORAGE_KEY: STORAGE_KEY,
    initialStreak: initialStreak,
    recordAnswer: recordAnswer,
    loadStreak: loadStreak,
    saveStreak: saveStreak,
  };
});
