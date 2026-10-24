// MelodyMath — PercentMix logic: percent as sub-beats of one bar (#591,
// owner comment 6376162984, "DataBeats ו-PercentMix").
//
// Primary method: one 4/4 bar split into 100 equal sub-beats, 25 in every
// beat. X% is X of the 100 sub-beats: 25% is one beat (a quarter note), 50%
// is half the bar (a half note), 10% is ten sub-beats. This extends the
// note-duration fractions of FractionBarPad (M3, fractionBar.js) from
// eighths and sixteenths to hundredths, so percent shares the one method of
// fractions and decimals (instruments.TOPICS.percent).
//
// TODO-source: there is no direct study of percent taught through musical
// sub-beats. The owner marked this an extension of the note-duration
// fractions method (Azaryahu et al., MusiMath, https://doi.org/10.1111/desc.12882)
// and asked to keep the TODO-source mark until a source is found.
//
// Pure functions, no sound and no DOM.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_PERCENT_MIX = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MECHANISM = 'M3';
  const SUBBEATS = 100;
  const BEATS = 4;
  const PER_BEAT = SUBBEATS / BEATS; // 25
  const SOURCE = 'TODO-source';

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) { const t = y; y = x % y; x = t; }
    return x || 1;
  }

  function checkPercent(x) {
    if (!Number.isInteger(x) || x < 0 || x > 100) throw new RangeError('a percent of one bar is a whole number from 0 to 100, got ' + x);
  }

  // X% of the bar -> { percent, subbeats, of: 100, beats, fullBeats,
  // restSubbeats, fraction: 'a/b' (lowest terms), decimal }.
  // 30% -> 30 sub-beats = 1 beat and 5 sub-beats = 3/10 = 0.3.
  function percentToSubbeats(x) {
    checkPercent(x);
    const g = gcd(x, SUBBEATS);
    return {
      percent: x,
      subbeats: x,
      of: SUBBEATS,
      beats: x / PER_BEAT,
      fullBeats: Math.floor(x / PER_BEAT),
      restSubbeats: x % PER_BEAT,
      fraction: x === 0 ? '0' : (x / g) + '/' + (SUBBEATS / g),
      decimal: x / SUBBEATS,
      mechanism: MECHANISM,
      source: SOURCE,
    };
  }

  // n filled sub-beats out of `total` -> the percent of the bar (may be a
  // decimal when total is not 100; the screen always uses 100).
  function subbeatsToPercent(n, total) {
    const t = total || SUBBEATS;
    if (!Number.isInteger(n) || n < 0 || n > t) throw new RangeError('sub-beats out of the bar: ' + n);
    return (n * 100) / t;
  }

  // p% of a quantity (the transfer items: 25% of 20 children = 5).
  function percentOf(p, quantity) {
    checkPercent(p);
    return (p * quantity) / 100;
  }

  // The tiles of the pad, in sub-beats.
  const TILES = [
    { id: 'half', n: 50, he: 'חצי תיבה' },
    { id: 'beat', n: 25, he: 'פעמה' },
    { id: 'ten', n: 10, he: '10 תת־פעמות' },
    { id: 'five', n: 5, he: '5 תת־פעמות' },
    { id: 'one', n: 1, he: 'תת־פעמה' },
  ];
  function tile(id) { return TILES.filter(function (t) { return t.id === id; })[0] || null; }

  function filled(fill) { return fill.reduce(function (s, id) { const t = tile(id); return s + (t ? t.n : 0); }, 0); }

  // Add a tile toward target%. A tile past the target is refused with the
  // excess named in sub-beats, like FractionBarPad's overflow.
  function addTile(fill, id, target) {
    checkPercent(target);
    const t = tile(id);
    if (!t) return { accepted: false, fill: fill, over: 0, status: checkFill(fill, target).status };
    const sum = filled(fill) + t.n;
    if (sum > target) return { accepted: false, fill: fill, over: sum - target, status: 'over' };
    const next = fill.concat([id]);
    return { accepted: true, fill: next, over: 0, status: checkFill(next, target).status };
  }

  function checkFill(fill, target) {
    const sum = filled(fill);
    if (sum === target) return { status: 'exact', missing: 0, sum: sum };
    if (sum < target) return { status: 'under', missing: target - sum, sum: sum };
    return { status: 'over', missing: 0, sum: sum };
  }

  // "נגן תיבה": one stroke where each tile starts, one click per beat that
  // the fill reaches. Times in seconds.
  function barPlan(fill, bpm, voice) {
    const beat = 60 / (bpm || 90);
    const notes = [];
    let pos = 0;
    fill.forEach(function (id, i) {
      notes.push({ at: (pos / PER_BEAT) * beat, voice: voice || 'drumLow', kind: 'tile', tile: i });
      pos += tile(id).n;
    });
    for (let b = 0; b < Math.ceil(pos / PER_BEAT); b++) notes.push({ at: b * beat, voice: 'woodClick', hz: 1800, kind: 'click' });
    return notes.sort(function (a, b) { return a.at - b.at || (a.kind === 'click' ? 1 : -1); });
  }

  // Practice targets.
  const TARGETS = [
    { percent: 25, allowed: ['half', 'beat', 'ten', 'five'], he: 'מלאו 25% מהתיבה' },
    { percent: 75, allowed: ['half', 'beat', 'ten'], he: 'מלאו 75% מהתיבה' },
    { percent: 40, allowed: ['beat', 'ten', 'five'], he: 'מלאו 40% מהתיבה' },
    { percent: 60, allowed: ['half', 'ten', 'five', 'one'], he: 'מלאו 60% מהתיבה' },
    { percent: 35, allowed: ['beat', 'ten', 'five'], he: 'מלאו 35% מהתיבה' },
  ];

  return {
    MECHANISM: MECHANISM,
    SUBBEATS: SUBBEATS,
    BEATS: BEATS,
    PER_BEAT: PER_BEAT,
    SOURCE: SOURCE,
    TILES: TILES,
    TARGETS: TARGETS,
    tile: tile,
    filled: filled,
    percentToSubbeats: percentToSubbeats,
    subbeatsToPercent: subbeatsToPercent,
    percentOf: percentOf,
    addTile: addTile,
    checkFill: checkFill,
    barPlan: barPlan,
  };
});
