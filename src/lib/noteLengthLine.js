// MelodyMath — NoteLengthLine (#591): fraction size on the number line through
// note length (M3 fillBar; Siegler et al. 2011). The bar IS the 0–max line; a
// note lasts exactly value × BAR_SECONDS at one fixed pitch. Pure, Node-tested.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_NOTE_LENGTH_LINE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const FB = root.MM_FRACTION_BAR || require('./music/fractionBar.js');
  const WAY = 'fillBar';
  const BAR_SECONDS = 2; // one 4/4 bar at 120 BPM
  const HZ = 392; // one fixed pitch (G4): magnitude is never pitch (M5 is weak evidence)
  const DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 100];
  const STORE_KEY = 'mm.noteLengthLine.magnitudeError';
  const GRADES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
  const SCREEN = { 'mm-cur-42': 'nllCard' }; // ?topic=...&screen=1; not progression.js SCREENS (#798)
  // place: one note on the line; compare: two notes in a row, both placed.
  const ITEMS = ['3/4', '1/2', '1/3', '2/5', '5/6', '3/8', '7/10'].map(function (v) { return { kind: 'place', max: 1, values: [v] }; }).concat([
    { kind: 'compare', max: 1, values: ['2/3', '3/5'] }, { kind: 'compare', max: 1, values: ['3/8', '1/3'] },
    { kind: 'place', max: 2, values: ['3/2'], grade: 'ה' }, { kind: 'place', max: 3, values: ['7/3'], grade: 'ה' },
    { kind: 'place', max: 1, values: ['0.45'], grade: 'ו' }, { kind: 'compare', max: 1, values: ['0.75', '3/4'], grade: 'ו' },
  ]);
  const NO_MUSIC_CHECK_ITEMS = [
    { id: 'nll-nm-1', prompt: 'מה גדול יותר: 2/3 או 3/5? כתבו את הגדול.', answer: '2/3' },
    { id: 'nll-nm-2', prompt: 'איזה שבר נמצא באמצע הקו בין 0 ל־1?', answer: '1/2' },
    { id: 'nll-nm-3', prompt: 'כתבו את 0.75 כשבר.', answer: '3/4' },
  ];
  // 0-1 lines for every grade ('mm-grade'); an item marked ה׳/ו׳ only from that grade up.
  function itemsForGrade(grade) {
    const g = GRADES.indexOf(grade);
    return ITEMS.filter(function (it) { return !it.grade || (g >= 0 && g >= GRADES.indexOf(it.grade)); });
  }
  function storedGrade(storage) {
    try { const s = store(storage); return s ? s.getItem('mm-grade') : null; } catch (e) { return null; }
  }
  function screenForTopic(id) { return Object.prototype.hasOwnProperty.call(SCREEN, id) ? SCREEN[id] : null; }
  function value(v) { const f = FB.toFraction(v); return f ? f.n / f.d : null; }
  // Position x (0..1 of the line's width) -> value on a 0..max line.
  function positionToValue(x, max) { return Math.min(1, Math.max(0, Number(x) || 0)) * (max || 1); }
  function valueToPosition(v, max) { return value(v) / (max || 1); }
  // Nearest fraction with denominator d at position x: '3/4' at x = 0.75, d = 4.
  function fractionAt(x, max, d) { return FB.formatFraction(FB.toFraction({ n: Math.round(positionToValue(x, max) * d), d: d })); }
  // Exact length in seconds: n × BAR_SECONDS / d, with no rounding step.
  function durationOf(v) {
    const f = typeof v === 'number' ? null : FB.toFraction(v);
    return f ? (f.n * BAR_SECONDS) / f.d : Number(v) * BAR_SECONDS;
  }
  // One held note per length, same pitch, a short rest between them.
  function playPlan(lengths, voice) {
    let at = 0;
    return lengths.map(function (v, i) {
      const n = { at: at, voice: voice || 'pluck', hz: HZ, held: true, dur: durationOf(v), gain: 0.2, index: i };
      at += n.dur + 0.4;
      return n;
    });
  }
  // Distance on the line as a share of its length (Siegler's PAE).
  function magnitudeError(chosen, target, max) { return Math.abs(Number(chosen) - value(target)) / (max || 1); }
  function feedback(chosen, target, max) {
    const err = magnitudeError(chosen, target, max);
    const dir = Number(chosen) < value(target) ? 'קצר מדי' : 'ארוך מדי';
    if (err <= 0.05) return { level: 'close', err: err, he: 'קרוב מאוד! כמעט בדיוק ' + target };
    if (err <= 0.15) return { level: 'near', err: err, he: 'קרוב, אבל ' + dir + '. הקשיבו שוב.' };
    return { level: 'far', err: err, he: 'רחוק: התו שלכם ' + dir + '. הקשיבו לאורך האמיתי.' };
  }
  // Compare items: the order on the line must match (equal values: within 0.05).
  function orderRight(chosen, values, max) {
    const a = value(values[0]), b = value(values[1]), d = (chosen[0] - chosen[1]) / (max || 1);
    if (a === b) return Math.abs(d) <= 0.05;
    return (a > b) === (d > 0);
  }
  function store(storage) {
    try { return storage || root.localStorage || null; } catch (e) { return null; }
  }
  function key(childId) { return STORE_KEY + (childId ? '.' + childId : ''); }
  // Running mean of magnitudeError per child, kept to see the line improve.
  function recordError(err, childId, storage) {
    const s = store(storage);
    const cur = meanError(childId, s, true);
    const next = { sum: cur.sum + err, n: cur.n + 1 };
    try { if (s) s.setItem(key(childId), JSON.stringify(next)); } catch (e) { /* private mode */ }
    return next.sum / next.n;
  }
  function meanError(childId, storage, raw) {
    let x = { sum: 0, n: 0 };
    try { const s = store(storage); const v = s && JSON.parse(s.getItem(key(childId)) || 'null'); if (v && v.n > 0) x = v; } catch (e) { /* bad data */ }
    return raw ? x : (x.n ? x.sum / x.n : null);
  }
  return {
    WAY: WAY, SCREEN: SCREEN, itemsForGrade: itemsForGrade, storedGrade: storedGrade, screenForTopic: screenForTopic, BAR_SECONDS: BAR_SECONDS, HZ: HZ, DENOMINATORS: DENOMINATORS, ITEMS: ITEMS, NO_MUSIC_CHECK_ITEMS: NO_MUSIC_CHECK_ITEMS,
    value: value, positionToValue: positionToValue, valueToPosition: valueToPosition, fractionAt: fractionAt, durationOf: durationOf,
    playPlan: playPlan, magnitudeError: magnitudeError, feedback: feedback, orderRight: orderRight, recordError: recordError, meanError: meanError,
  };
});
