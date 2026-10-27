// MelodyMath — BalanceBars: equations and inequalities, grades ד׳–ה׳
// (mm-cur-31, mm-cur-39). Refs #710 #591 #665. Not a new way: it is
// `balanceBars` of א׳-ב׳ EQ_LEFT, and it extends fillBar (fractionBar.js).
// Each side of the sign is one bar; two players start together. They end
// together: the sides are equal. One still sounds: its side is bigger.
// An equation is a bar with a silent part: the child's number fills it, and
// fillBar's checkFill says how much of the bar is still missing or over.
(function (root, factory) {
  const IN_NODE = typeof module === 'object' && !!module.exports;
  const api = factory(IN_NODE ? require('./fractionBar.js') : root.MM_FRACTION_BAR);
  if (IN_NODE) module.exports = api;
  else root.MM_BALANCE_BARS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (FB) {
  'use strict';

  const WAY = 'balanceBars', MECHANISM = FB.MECHANISM, BAR_SEC = 2.4, BLANK = '☐';
  const SCREEN = { 'mm-cur-31': 'bbCard', 'mm-cur-39': 'bbCard' };
  const HZ = [262, 392]; // C4 and G4: one pitch per side, both above 220 Hz.

  // One side, as printed in the bank: digits with thousands commas, + − × :,
  // brackets. A small parser, never eval. null when it does not read.
  function evalSide(text, blank) {
    const src = String(text == null ? '' : text).replace(/,/g, '').replace(BLANK, blank == null ? BLANK : String(blank));
    const toks = src.match(/\d+(?:\.\d+)?|[+−\-×:()☐]/g) || [];
    if (toks.join('') !== src.replace(/\s/g, '')) return null;
    let i = 0;
    function atom() {
      const t = toks[i++];
      if (t === '(') { const v = sum(); return toks[i++] === ')' ? v : NaN; }
      return /^\d/.test(t || '') ? Number(t) : NaN;
    }
    function product() {
      let v = atom();
      while (toks[i] === '×' || toks[i] === ':') v = toks[i++] === '×' ? v * atom() : v / atom();
      return v;
    }
    function sum() {
      let v = product();
      while (toks[i] === '+' || toks[i] === '−' || toks[i] === '-') v = toks[i++] === '+' ? v + product() : v - product();
      return v;
    }
    const v = sum();
    return i === toks.length && Number.isFinite(v) ? v : null;
  }

  // 'A = B', 'A < B', 'A > B' → { left, op, right } (op '?' asks for the sign).
  function parse(expr) {
    const m = /^(.+?) ([=<>?]) (.+)$/.exec(String(expr || ''));
    return m ? { left: m[1], op: m[2], right: m[3] } : null;
  }

  function signOf(l, r) { return l === r ? '=' : l < r ? '<' : '>'; }

  // The two bars of an expression, with `blank` in place of ☐.
  function sides(expr, blank) {
    const p = parse(expr);
    if (!p) return null;
    const l = evalSide(p.left, blank), r = evalSide(p.right, blank);
    return l == null || r == null ? null : { left: l, right: r, sign: signOf(l, r), op: p.op };
  }

  // fillBar on the balance: the full side is the target bar, the side with ☐
  // is the fill. checkFill gives 'exact' | 'under' | 'over' and the part of
  // the bar that is missing or over, as an exact fraction.
  function fillCheck(expr, guess) {
    const p = parse(expr);
    const s = p && sides(expr, guess);
    if (!s || Number.isNaN(Number(guess))) return { status: 'invalid', he: null };
    const blankLeft = p.left.indexOf(BLANK) >= 0;
    const fill = blankLeft ? s.left : s.right, goal = blankLeft ? s.right : s.left;
    if (fill === goal) return FB.checkFill([1], 1);
    const f = Number.isInteger(fill) && Number.isInteger(goal) && goal > 0 && fill >= 0 ? FB.checkFill([{ n: fill, d: goal }], 1) : null;
    if (f && f.status !== 'invalid') return Object.assign({}, f, { he: (f.status === 'under' ? 'חסר ' : 'עברת ב־') + f.diff + ' תיבה' });
    return { status: fill < goal ? 'under' : 'over', he: fill < goal ? 'התיבה עוד לא מלאה' : 'התיבה עברה את הצד השני' };
  }

  // Two held notes start together, each as long as its side (the bigger side
  // is one bar), and a click marks where each side ends. side: null plays both;
  // 'known' leaves the side with ☐ silent — the empty bar to fill.
  function balancePlan(left, right, voices, side) {
    const big = Math.max(left, right);
    if (!(big > 0) || left < 0 || right < 0) return [];
    const v = voices || ['woodBar', 'woodBar'];
    const notes = [];
    [left, right].forEach(function (val, k) {
      if (side === k || val === 0) return;
      const dur = BAR_SEC * val / big;
      notes.push({ at: 0, voice: v[k], hz: HZ[k], held: true, dur: dur, gain: 0.25, side: k });
      notes.push({ at: dur, voice: 'woodClick', hz: HZ[k] * 2, side: k, end: true });
    });
    return notes.sort(function (a, b) { return a.at - b.at; });
  }

  // Bar widths in percent of the bigger side, for the picture.
  function barWidths(left, right) {
    const big = Math.max(left, right);
    return big > 0 ? [Math.round(100 * left / big), Math.round(100 * right / big)] : [0, 0];
  }

  // The exercises, then the no-music check (#665). kind 'fill': the number in
  // ☐; kind 'sign': which sign goes in place of ?.
  const TARGETS = [
    { grade: 'ד', topic: 'mm-cur-31', kind: 'fill', expr: '☐ + 2,500 = 7,000', answer: 4500 },
    { grade: 'ד', topic: 'mm-cur-31', kind: 'fill', expr: '25 × 4 = 50 × ☐', answer: 2 },
    { grade: 'ד', topic: 'mm-cur-31', kind: 'sign', expr: '8 × 7 ? 50 + 5', answer: '>' },
    { grade: 'ה', topic: 'mm-cur-39', kind: 'fill', expr: '☐ : 8 = 125', answer: 1000 },
    { grade: 'ה', topic: 'mm-cur-39', kind: 'fill', expr: '36 × 25 = 9 × ☐', answer: 100 },
    { grade: 'ה', topic: 'mm-cur-39', kind: 'sign', expr: '999 × 0 ? 1 × 1', answer: '<' },
  ];
  // A typed < or > flips in the RTL answer box, so the plain check asks
  // נכון / לא נכון for an inequality, as the bank items do.
  const NO_MUSIC_CHECK_ITEMS = [
    { id: 'bb-nm-31-1', topic: 'mm-cur-31', grade: 'ד', expr: '☐ + 1,200 = 5,000', prompt: 'השלימו: ☐ + 1,200 = 5,000', answer: 3800 },
    { id: 'bb-nm-31-2', topic: 'mm-cur-31', grade: 'ד', expr: '9 × ☐ = 3 × 12', prompt: 'השלימו: 9 × ☐ = 3 × 12', answer: 4 },
    { id: 'bb-nm-31-3', topic: 'mm-cur-31', grade: 'ד', expr: '7 × 8 < 60', prompt: 'נכון או לא נכון: 7 × 8 < 60', answer: 'נכון' },
    { id: 'bb-nm-39-1', topic: 'mm-cur-39', grade: 'ה', expr: '☐ : 6 = 250', prompt: 'השלימו: ☐ : 6 = 250', answer: 1500 },
    { id: 'bb-nm-39-2', topic: 'mm-cur-39', grade: 'ה', expr: '45 × 4 = 9 × ☐', prompt: 'השלימו: 45 × 4 = 9 × ☐', answer: 20 },
    { id: 'bb-nm-39-3', topic: 'mm-cur-39', grade: 'ה', expr: '12 × 25 > 299', prompt: 'נכון או לא נכון: 12 × 25 > 299', answer: 'נכון' },
  ];

  function plainOk(item, typed) {
    const t = String(typed == null ? '' : typed).trim().replace(/,/g, '');
    return typeof item.answer === 'number' ? t !== '' && Number(t) === item.answer : t === item.answer;
  }

  function screenForTopic(id) {
    return Object.prototype.hasOwnProperty.call(SCREEN, id) ? SCREEN[id] : null;
  }

  return { WAY, MECHANISM, BAR_SEC, BLANK, SCREEN, HZ, TARGETS, NO_MUSIC_CHECK_ITEMS, evalSide, parse, signOf, sides, fillCheck, balancePlan, barWidths, plainOk, screenForTopic };
});
