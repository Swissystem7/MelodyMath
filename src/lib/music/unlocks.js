// MelodyMath — instruments unlocked by progress in TimesTableGroove
// (#591, proposal 2/5).
//
// A column (one factor) is complete when factor × 1 … factor × 10 have each
// been answered correctly once. Every completed column unlocks the next
// instrument of the list the caller passes in (ids from the instruments
// data). An unlocked instrument changes only the timbre, never the method:
// the mechanism stays M2. An instrument record must carry a source, or the
// literal 'TODO' when no source is known yet; records without one are
// refused. Load/save go through an injectable storage like streak.js.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_UNLOCKS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const COLUMN_LENGTH = 10;
  const STORAGE_KEY = 'mm.groove.unlocks';

  function initialUnlocks() {
    return { solved: {}, completed: [], unlocked: [] };
  }

  // A record { instrument, source } is usable when source is a non-empty
  // string ('TODO' included); a bare id string is accepted as is.
  function hasSourceOrTodo(entry) {
    if (typeof entry === 'string') return entry.length > 0;
    return !!entry && typeof entry.instrument === 'string' && typeof entry.source === 'string' && entry.source.trim().length > 0;
  }

  function idOf(entry) {
    return typeof entry === 'string' ? entry : entry.instrument;
  }

  // Record a correct answer to factor × multiplier. Returns { state,
  // columnCompleted, unlocked } where unlocked is the new instrument id or
  // null; throws when the instrument list holds a record without a source.
  function recordCorrect(state, factor, multiplier, instruments) {
    const list = instruments || [];
    list.forEach(function (e) {
      if (!hasSourceOrTodo(e)) throw new Error('instrument without source (use TODO): ' + JSON.stringify(e));
    });
    const s = state || initialUnlocks();
    const next = { solved: Object.assign({}, s.solved), completed: s.completed.slice(), unlocked: s.unlocked.slice() };
    const f = String(factor);
    const m = Number(multiplier);
    if (!Number.isInteger(m) || m < 1 || m > COLUMN_LENGTH) return { state: next, columnCompleted: null, unlocked: null };
    const done = (next.solved[f] || []).slice();
    if (done.indexOf(m) === -1) done.push(m);
    done.sort(function (a, b) { return a - b; });
    next.solved[f] = done;
    if (done.length < COLUMN_LENGTH || next.completed.indexOf(f) !== -1) return { state: next, columnCompleted: null, unlocked: null };
    next.completed.push(f);
    const fresh = list.map(idOf).filter(function (id) { return next.unlocked.indexOf(id) === -1; })[0] || null;
    if (fresh) next.unlocked.push(fresh);
    return { state: next, columnCompleted: Number(f), unlocked: fresh };
  }

  function loadUnlocks(storage, key) {
    try {
      const raw = storage && storage.getItem(key || STORAGE_KEY);
      const v = raw ? JSON.parse(raw) : null;
      if (v && v.solved && Array.isArray(v.completed) && Array.isArray(v.unlocked)) return v;
    } catch (e) { /* unreadable storage -> start fresh */ }
    return initialUnlocks();
  }

  function saveUnlocks(storage, state, key) {
    if (!storage) return false;
    try {
      storage.setItem(key || STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    COLUMN_LENGTH: COLUMN_LENGTH,
    STORAGE_KEY: STORAGE_KEY,
    initialUnlocks: initialUnlocks,
    hasSourceOrTodo: hasSourceOrTodo,
    recordCorrect: recordCorrect,
    loadUnlocks: loadUnlocks,
    saveUnlocks: saveUnlocks,
  };
});
