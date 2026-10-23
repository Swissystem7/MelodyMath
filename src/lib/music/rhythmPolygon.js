// MelodyMath — RhythmPolygon logic: the rhythm clock (#591, owner comment
// 6376161263, geometry).
//
// A cycle of `cycle` beats sits on a circle, beat 0 at the top, clockwise.
// The beats that sound are the corners of a polygon. N evenly spaced beats
// make a regular N-gon: N sides, 360/N degrees between neighbouring corners
// seen from the centre, N symmetry axes and N turns that map it onto itself.
// Turning the polygon by one step of the clock (360/cycle degrees) is heard
// as the same rhythm starting one beat later; rotationEquivalence() is that
// check.
//
// Method: M6 (rhythmic patterns and symmetry), the primary music way of the
// geometry topic (instruments.TOPICS.polygons). Source for the rhythm clock
// lessons: An, Tillman & Paik 2013/2015, third graders, "measurement and
// geometry" in the test, https://doi.org/10.30935/scimath/9420
//
// Pitch by angle is an optional add-on with weak evidence (M5). It is off by
// default, labelled as such on screen, and never the way an item is solved.
// TODO-source: no study found yet for pitch-by-angle in geometry.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_RHYTHM_POLYGON = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MECHANISM = 'M6';
  const PITCH_ADDON = { mechanism: 'M5', optional: true, evidence: 'weak', he: 'גובה צליל לפי זווית (תוספת, ראיות חלשות)' };
  const NAMES_HE = { 3: 'משולש', 4: 'ריבוע', 5: 'מחומש', 6: 'משושה', 7: 'משובע', 8: 'מתומן', 9: 'מתושע', 10: 'מעושר', 12: 'מצולע בן 12 צלעות' };

  function mod(a, n) { return ((a % n) + n) % n; }
  function round(x, p) { const f = Math.pow(10, p || 4); return Math.round(x * f) / f + 0; }

  // beats: N (N evenly spaced beats), an array of beat indices, or an array of
  // booleans one per beat. Returns { cycle, onsets } with sorted unique onsets,
  // or null when the input cannot sit on the clock.
  function normalize(beats, cycle) {
    if (typeof beats === 'number') {
      const n = beats;
      const c = cycle == null ? n : cycle;
      if (!Number.isInteger(n) || !Number.isInteger(c) || n < 1 || c < n || c % n !== 0) return null;
      const onsets = [];
      for (let i = 0; i < n; i++) onsets.push(i * c / n);
      return { cycle: c, onsets: onsets };
    }
    if (!Array.isArray(beats)) return null;
    if (beats.length && typeof beats[0] === 'boolean') {
      const on = [];
      beats.forEach(function (b, i) { if (b) on.push(i); });
      return normalize(on, beats.length);
    }
    const c = Number(cycle);
    if (!Number.isInteger(c) || c < 1) return null;
    if (beats.some(function (b) { return !Number.isInteger(b); })) return null;
    const seen = {};
    beats.forEach(function (b) { seen[mod(b, c)] = true; });
    return { cycle: c, onsets: Object.keys(seen).map(Number).sort(function (a, b) { return a - b; }) };
  }

  function sameSet(a, b) {
    return a.length === b.length && a.every(function (x, i) { return x === b[i]; });
  }

  function rotate(onsets, k, cycle) {
    return onsets.map(function (b) { return mod(b + k, cycle); }).sort(function (a, b) { return a - b; });
  }

  // i -> (c - i) mod cycle, one mirror of the clock for each c.
  function reflect(onsets, c, cycle) {
    return onsets.map(function (b) { return mod(c - b, cycle); }).sort(function (a, b) { return a - b; });
  }

  // The polygon a rhythm draws on the clock.
  function polygonFromBeats(beats, cycle) {
    const r = normalize(beats, cycle);
    if (!r) return null;
    const c = r.cycle;
    const on = r.onsets;
    const sides = on.length;
    const vertices = on.map(function (b) {
      const deg = b * 360 / c;
      const rad = deg * Math.PI / 180;
      return { beat: b, deg: round(deg, 4), x: round(Math.sin(rad)), y: round(-Math.cos(rad)) };
    });
    const gaps = on.map(function (b, i) { return i + 1 < sides ? on[i + 1] - b : on[0] + c - b; });
    const isPolygon = sides >= 3;
    const regular = isPolygon && gaps.every(function (g) { return g === gaps[0]; });
    let rotationOrder = 0;
    let axes = 0;
    for (let k = 0; k < c; k++) {
      if (sameSet(rotate(on, k, c), on)) rotationOrder += 1;
      if (sameSet(reflect(on, k, c), on)) axes += 1;
    }
    return {
      cycle: c,
      onsets: on,
      sides: isPolygon ? sides : 0,
      isPolygon: isPolygon,
      regular: regular,
      vertices: vertices,
      gaps: gaps,
      stepDeg: round(360 / c),
      centralAngle: regular ? round(360 / sides) : null,
      interiorAngle: regular ? round(180 * (sides - 2) / sides) : null,
      rotationOrder: rotationOrder,
      axes: axes,
      nameHe: isPolygon ? (regular ? (NAMES_HE[sides] || ('מצולע בן ' + sides + ' צלעות')) + ' משוכלל' : 'מצולע בן ' + sides + ' צלעות') : 'לא מצולע',
    };
  }

  // Is rhythm b the rhythm a turned on the clock? steps lists every turn k
  // (in beats, 0 <= k < cycle) with rotate(a, k) = b; degrees = k * 360/cycle.
  function rotationEquivalence(a, b, cycle) {
    const ra = normalize(a, cycle);
    const rb = normalize(b, cycle == null && ra ? ra.cycle : cycle);
    const none = { equivalent: false, steps: [], degrees: [], minSteps: null, minDegrees: null };
    if (!ra || !rb || ra.cycle !== rb.cycle || ra.onsets.length !== rb.onsets.length) return none;
    const c = ra.cycle;
    const steps = [];
    for (let k = 0; k < c; k++) if (sameSet(rotate(ra.onsets, k, c), rb.onsets)) steps.push(k);
    if (!steps.length) return none;
    const degrees = steps.map(function (k) { return round(k * 360 / c); });
    return { equivalent: true, steps: steps, degrees: degrees, minSteps: steps[0], minDegrees: degrees[0] };
  }

  // Optional add-on (weak evidence): one octave around the circle from baseHz.
  function pitchForAngle(deg, baseHz) {
    return round((baseHz || 261.63) * Math.pow(2, mod(deg, 360) / 360), 2);
  }

  // Notes for one turn of the clock: a soft click on every beat, the
  // instrument on every corner. With pitch on, a corner's pitch follows its angle.
  function cyclePlan(beats, cycle, opts) {
    const o = opts || {};
    const r = normalize(beats, cycle);
    if (!r) return [];
    const beat = 60 / (o.bpm || 100);
    const notes = [];
    for (let b = 0; b < r.cycle; b++) {
      const at = round(b * beat, 4);
      if (r.onsets.indexOf(b) >= 0) {
        const n = { at: at, voice: o.voice || 'woodBar', kind: 'corner', beat: b };
        if (o.pitch) n.hz = pitchForAngle(b * 360 / r.cycle);
        notes.push(n);
      } else {
        notes.push({ at: at, voice: 'woodClick', hz: 1800, kind: 'click', beat: b });
      }
    }
    return notes;
  }

  return {
    MECHANISM: MECHANISM,
    PITCH_ADDON: PITCH_ADDON,
    NAMES_HE: NAMES_HE,
    normalize: normalize,
    rotate: rotate,
    polygonFromBeats: polygonFromBeats,
    rotationEquivalence: rotationEquivalence,
    pitchForAngle: pitchForAngle,
    cyclePlan: cyclePlan,
  };
});
