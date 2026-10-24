// MelodyMath — PatternEcho patterns (#591, owner feature proposal 4/5,
// mechanism M6 only, grades א׳-ה׳).
//
// generatePattern({ type, rule, length }) returns the notes the app plays and
// the number each note stands for:
//   repeat  rule 'ABB'          -> A B B A B B ...      values 1 2 2 1 2 2
//   grow    rule '+3' / '×2'    -> 3 6 9 12 / 1 2 4 8   (start defaults to the step for +, 1 for ×)
//   mirror  rule 'ABC'          -> A B C C B A          (odd length: A B C B A)
// The same way carries from a repeating pattern (א׳) to a sequence rule
// (ה׳). findRuleBreak() points at the first note of an echo that breaks the
// rule, so the feedback can replay the right phrase and mark that note.
// Marimba, gamelan and piano are timbre only; a timbre record needs a real
// source (an https URL, never 'TODO', #691 review item 6). Pure logic: no sound.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_PATTERNS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MECHANISM = 'M6';
  const TYPES = ['repeat', 'grow', 'mirror'];
  const SCALE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const MAX_LENGTH = 24;

  // Value 1 -> C4, 2 -> D4, ... 8 -> C5: a higher number is a higher bar.
  function pitchOf(value) {
    const i = value - 1;
    if (!Number.isInteger(i) || i < 0) return null;
    return SCALE[i % 7] + (4 + Math.floor(i / 7));
  }

  function note(symbol, value) {
    return { symbol: String(symbol), value: value, pitch: pitchOf(value) };
  }

  function letters(rule) {
    const s = String(rule == null ? '' : rule).replace(/\s/g, '').toUpperCase();
    return /^[A-H]+$/.test(s) ? s.split('') : null;
  }

  function letterValue(ch) { return ch.charCodeAt(0) - 64; }

  // '+3', '×2', 'x2', '*2' -> { op, step }.
  function parseGrowRule(rule) {
    if (rule && typeof rule === 'object') return parseGrowRule(String(rule.op) + String(rule.step));
    const m = /^([+×x*])(\d+)$/.exec(String(rule == null ? '' : rule).replace(/\s/g, ''));
    if (!m) return null;
    const step = Number(m[2]);
    const op = m[1] === '+' ? '+' : '×';
    if (op === '+' && step < 1) return null;
    if (op === '×' && step < 2) return null;
    return { op: op, step: step };
  }

  function generatePattern(opts) {
    const o = opts || {};
    const length = Number(o.length == null ? 6 : o.length);
    if (TYPES.indexOf(o.type) === -1 || !Number.isInteger(length) || length < 2 || length > MAX_LENGTH) return null;
    const notes = [];
    if (o.type === 'repeat') {
      const motif = letters(o.rule);
      if (!motif || motif.length < 2) return null;
      for (let i = 0; i < length; i++) notes.push(note(motif[i % motif.length], letterValue(motif[i % motif.length])));
    } else if (o.type === 'grow') {
      const r = parseGrowRule(o.rule);
      if (!r) return null;
      let v = o.start != null ? Number(o.start) : (r.op === '+' ? r.step : 1);
      if (!Number.isInteger(v) || v < 1) return null;
      for (let i = 0; i < length; i++) {
        notes.push(note(v, v));
        v = r.op === '+' ? v + r.step : v * r.step;
      }
    } else {
      const motif = letters(o.rule);
      if (!motif) return null;
      const half = Math.ceil(length / 2);
      const first = [];
      for (let i = 0; i < half; i++) first.push(motif[i % motif.length]);
      const back = first.slice(0, Math.floor(length / 2)).reverse();
      first.concat(back).forEach(function (ch) { notes.push(note(ch, letterValue(ch))); });
    }
    return { mechanism: MECHANISM, type: o.type, rule: o.rule, notes: notes, values: notes.map(function (n) { return n.value; }) };
  }

  // A pattern reads the same forwards and backwards.
  function isMirror(values) {
    for (let i = 0, j = values.length - 1; i < j; i++, j--) if (values[i] !== values[j]) return false;
    return true;
  }

  // Index of the first echoed value that breaks the pattern, -1 when the echo
  // is right, or the echo length when it stops short.
  function findRuleBreak(pattern, echo) {
    const want = pattern.values;
    const got = (echo || []).map(function (x) { return x && typeof x === 'object' ? x.value : Number(x); });
    for (let i = 0; i < want.length; i++) {
      if (i >= got.length) return i;
      if (got[i] !== want[i]) return i;
    }
    return got.length > want.length ? want.length : -1;
  }

  // A timbre record { instrument, source } needs a real source; 'TODO' does not count.
  function timbreHasSource(entry) {
    return !!entry && typeof entry.source === 'string' && /^https:\/\/\S+$/.test(entry.source);
  }

  return {
    MECHANISM: MECHANISM,
    TYPES: TYPES,
    pitchOf: pitchOf,
    parseGrowRule: parseGrowRule,
    generatePattern: generatePattern,
    isMirror: isMirror,
    findRuleBreak: findRuleBreak,
    timbreHasSource: timbreHasSource,
  };
});
