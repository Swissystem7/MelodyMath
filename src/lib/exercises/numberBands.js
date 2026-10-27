// MelodyMath — number-range variety inside one exercise type (#759, Refs #687, Refs #665).
// A practice step keeps one skill, so the exercise type never changes. What
// changes is the size of the numbers: an item up to 10, then one up to 20,
// then one past 100, instead of three "up to 10" items in a row. The ranges
// themselves come from the grade's bank — nothing here invents numbers, so
// it cannot leave the grade's range (#741 owns the per-topic ranges).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_NUMBER_BANDS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Upper edges of the bands the curriculum steps through, grades א׳–ו׳.
  const BAND_CAPS = [10, 20, 100, 1000, 10000, 100000, 1000000];
  const HE = ['עד 10', 'עד 20', 'עד 100', 'עד 1,000', 'עד 10,000', 'עד 100,000', 'עד מיליון', 'מעל מיליון'];
  const NO_REPEAT = 5;

  function numbersOf(item) {
    const text = String((item && item.prompt) || '');
    return (text.match(/\d[\d,]*(?:\.\d+)?/g) || [])
      .map((s) => Number(s.replace(/,/g, '')))
      .filter(Number.isFinite);
  }

  function bandOf(item) {
    const nums = numbersOf(item);
    if (!nums.length) return null;
    const top = Math.max(...nums.map(Math.abs));
    const i = BAND_CAPS.findIndex((cap) => top <= cap);
    return i < 0 ? BAND_CAPS.length : i;
  }

  function bandHe(band) {
    return band == null ? '' : HE[band] || '';
  }

  // Same numbers in any order count as the same exercise: 1+4 and 4+1 differ
  // in the prompt but the child hears the same two numbers.
  function signature(item) {
    return numbersOf(item).slice().sort((a, b) => a - b).join('|');
  }

  function distinctBands(list) {
    return new Set(list.map(bandOf).filter((b) => b != null)).size;
  }

  // pool: what adaptive.eligibleExercises already allows (level, retries).
  // history: [{id, correct}] of this step; items: the step's full item list.
  // Returns a non-empty subset of pool, or pool itself when nothing to vary.
  function diversify(pool, history, items) {
    const list = Array.isArray(pool) ? pool : [];
    if (list.length < 2) return list;
    const byId = new Map((Array.isArray(items) ? items : list).map((x) => [x.id, x]));
    const recent = (Array.isArray(history) ? history : [])
      .slice(-NO_REPEAT)
      .map((h) => byId.get(h && h.id))
      .filter(Boolean);
    if (!recent.length) return list;

    const seen = new Set(recent.map(signature).filter(Boolean));
    let out = list.filter((x) => !signature(x) || !seen.has(signature(x)));
    if (!out.length) out = list;

    const spread = distinctBands(out);
    if (spread < 2) return out;
    // With three or more bands, skip the last two shown; with two, alternate.
    const avoid = new Set(recent.slice(spread > 2 ? -2 : -1).map(bandOf).filter((b) => b != null));
    const fresh = out.filter((x) => !avoid.has(bandOf(x)));
    return fresh.length ? fresh : out;
  }

  return { BAND_CAPS, numbersOf, bandOf, bandHe, signature, diversify };
});
