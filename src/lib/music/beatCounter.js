// MelodyMath — BeatCounter logic: one object per steady beat (#591, owner
// feature proposal 3/5, grades א׳-ב׳).
//
// The primary way is M1, steady-beat counting, and it builds to M2 (accented
// beats) in grade ב׳. Every beat lights one empty slot; the child places one
// object per beat. A second tap on a slot that already holds an object is
// refused with a gentle hint ("כל צליל = חפץ אחד"). A second round plays a
// number of beats in another tempo or instrument and asks more, less or
// equal: the number does not change when the sound changes.
// The pitch-to-number-line extra (M5) is weak evidence: it is never the
// primary way and is offered only after the exercise is solved.
// Pure logic: the touch layer plays the bells.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_BEAT_COUNTER = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PRIMARY = Object.freeze({ mechanism: 'M1', buildsTo: 'M2' });
  const ADDON = Object.freeze({ mechanism: 'M5', evidence: 'weak', he: 'תרגול נוסף (ראיות חלשות)' });
  const HINT_ONE_EACH = 'כל צליל = חפץ אחד';
  const MAX_COUNT = 20;

  function wholeIn(v, lo, hi) {
    const n = Number(v);
    return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
  }

  // { count 1-20, bpm 40-200, instrument } -> a round with one empty slot per beat.
  function createRound(opts) {
    const o = opts || {};
    const count = wholeIn(o.count, 1, MAX_COUNT);
    const bpm = wholeIn(o.bpm == null ? 80 : o.bpm, 40, 200);
    if (count == null || bpm == null) return null;
    const slots = [];
    for (let i = 0; i < count; i++) slots.push(false);
    return { primary: PRIMARY, count: count, bpm: bpm, instrument: o.instrument || 'handbells', slots: slots };
  }

  // Place one object on beat i (0-based). Returns { round, accepted, hint }.
  function placeObject(round, i) {
    if (!round || !Number.isInteger(i) || i < 0 || i >= round.slots.length) {
      return { round: round, accepted: false, hint: null };
    }
    if (round.slots[i]) return { round: round, accepted: false, hint: HINT_ONE_EACH };
    const slots = round.slots.slice();
    slots[i] = true;
    return { round: Object.assign({}, round, { slots: slots }), accepted: true, hint: null };
  }

  function placedCount(round) {
    return round ? round.slots.filter(Boolean).length : 0;
  }

  // One-to-one: every beat holds exactly one object.
  function isMatched(round) {
    return !!round && round.slots.length === round.count && round.slots.every(Boolean);
  }

  // "How many in all?" is right when it is the number of beats.
  function checkTotal(round, answer) {
    return !!round && String(answer).trim() !== '' && Number(answer) === round.count;
  }

  // The second round changes the tempo or the instrument (or both).
  function secondRound(first, opts) {
    const o = Object.assign({ count: first.count, bpm: first.bpm, instrument: first.instrument }, opts || {});
    if (Number(o.bpm) === first.bpm && o.instrument === first.instrument) return null;
    return createRound(o);
  }

  // Compare the second round's count with the first: 'more' | 'less' | 'equal'.
  function compareRounds(first, second) {
    if (second.count > first.count) return 'more';
    if (second.count < first.count) return 'less';
    return 'equal';
  }

  const COMPARE_HE = { more: 'יותר', less: 'פחות', equal: 'שווה' };

  function checkCompare(first, second, answer) {
    const want = compareRounds(first, second);
    return answer === want || answer === COMPARE_HE[want];
  }

  // The weak-evidence extra appears only once the exercise is solved.
  function addonFor(solved) {
    return solved ? { mechanism: ADDON.mechanism, evidence: ADDON.evidence, he: ADDON.he } : null;
  }

  return {
    PRIMARY: PRIMARY,
    ADDON: ADDON,
    HINT_ONE_EACH: HINT_ONE_EACH,
    COMPARE_HE: COMPARE_HE,
    createRound: createRound,
    placeObject: placeObject,
    placedCount: placedCount,
    isMatched: isMatched,
    checkTotal: checkTotal,
    secondRound: secondRound,
    compareRounds: compareRounds,
    checkCompare: checkCompare,
    addonFor: addonFor,
  };
});
