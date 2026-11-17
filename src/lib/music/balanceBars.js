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
  // Unequal sides must end far enough apart for a child to hear it (#830):
  // at least 250 ms and at least 15% of the bar, whichever is larger.
  const MIN_GAP_SEC = Math.max(0.25, 0.15 * BAR_SEC);

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

  // How far apart the two ends sound, in seconds (0 for equal sides).
  function endGap(left, right) {
    const big = Math.max(left, right);
    return big > 0 ? BAR_SEC * Math.abs(left - right) / big : 0;
  }

  function audibleGap(left, right) {
    return left === right || endGap(left, right) >= MIN_GAP_SEC;
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
    { grade: 'ד', topic: 'mm-cur-31', kind: 'sign', expr: '8 × 7 ? 40 + 5', answer: '>' },
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

  // ------------------------------------------------------------ bank items
  // The practice items whose way is balanceBars had it in words only. This
  // adapter plays them with the same balancePlan as the BalanceBars screen
  // (research: docs/research/equals-balance-2026-11-13.md).
  //   fill  — "10 = 6 + ☐": first the known side alone, then the child's
  //           number fills the other side and the two end together, or not.
  //   truth — "נכון או לא נכון: A = B": both sides; together means equal.
  // When the sound cannot decide (the ends are closer than MIN_GAP_SEC, as in
  // 83,580 vs 80,000) the item is not played: the ear must be able to judge.
  // Meta AI review: call-and-response would teach "= means after"; Bach's
  // two-part inventions (written as exercises for his son) have two
  // independent voices that must land together — the balance itself.
  const ITEM_WORLD = { he: 'אינוונציה בשני קולות, בהשראת באך', why: 'שני קולות עצמאיים — צ׳לו נמוך לצד שמאל, חלילית גבוהה לצד ימין — מתחילים יחד וחייבים לנחות יחד' };
  const COUNT_IN = 3, COUNT_STEP = 0.45;
  function itemExpr(prompt) {
    let s = String(prompt || '').replace(/\(כתבו בלי פסיק\)/, '').trim();
    s = s.replace(/^(השלימו|נכון או לא נכון):\s*/, '');
    return s.replace(/[?.]$/, '').trim();
  }
  function specForItem(item) {
    if (!item || item.noMusic || item.music !== WAY) return null;
    const p = String(item.prompt || '');
    if (/הגדול ביותר|הקטן ביותר/.test(p)) return null;
    const expr = itemExpr(p);
    const q = parse(expr);
    if (!q || !/[=<>]/.test(q.op)) return null;
    if (/^נכון או לא נכון:/.test(p)) {
      const s = sides(expr);
      if (!s) return null;
      const truth = s.sign === q.op ? 'נכון' : 'לא נכון';
      if (truth !== String(item.answer)) return null;
      if (!audibleGap(s.left, s.right)) return null;
      return { kind: 'truth', expr: expr, left: s.left, right: s.right, op: q.op, answer: truth, world: ITEM_WORLD };
    }
    if (expr.indexOf(BLANK) < 0 || q.op !== '=') return null;
    const ans = Number(String(item.answer).replace(/,/g, ''));
    const s = sides(expr, ans);
    if (!s || s.sign !== '=' || !(s.left > 0)) return null;
    const blankSide = q.left.indexOf(BLANK) >= 0 ? 0 : 1;
    return { kind: 'fill', expr: expr, left: s.left, right: s.right, blankSide: blankSide, answer: String(item.answer), world: ITEM_WORLD };
  }
  // A quiet inner pulse makes the sides countable, not a race of who is last
  // (Meta AI): one tick per `scale` units, the scale a power of ten that keeps
  // the longer side at 12 ticks or fewer and divides both sides. None fits →
  // no ticks; the held notes and the cadence still decide.
  function pulseScale(left, right) {
    const big = Math.max(left, right);
    for (let s = 1; s <= 1e6; s *= 10) {
      if (big / s <= 12 && Number.isInteger(left / s) && Number.isInteger(right / s)) return s;
      if (big / s < 1) break;
    }
    return null;
  }
  // mode 'known': a listening step only — the full side alone, the other side
  // marked «רק מקשיבים». 'try' (after the child's number) and 'both' (a
  // statement): a count-in, both voices start together on one breath, the
  // inner pulse, and — only when the sides are equal — a bell and a shared
  // final chord. Unequal: the longer voice goes on alone, unresolved.
  const VOICES = ['bowed', 'breathy'];
  function itemNotes(spec, mode, guess) {
    if (!spec) return [];
    if (spec.kind === 'fill' && mode !== 'try') return balancePlan(spec.left, spec.right, VOICES, spec.blankSide);
    let l = spec.left, r = spec.right;
    if (spec.kind === 'fill') { const g = sides(spec.expr, guess); if (!g) return []; l = g.left; r = g.right; }
    const t0 = COUNT_IN * COUNT_STEP;
    const notes = [];
    for (let i = 0; i < COUNT_IN; i++) notes.push({ at: i * COUNT_STEP, voice: 'woodClick', hz: 1200, dur: 0.06, gain: 0.12, stage: 'countIn' });
    balancePlan(l, r, VOICES, null).forEach(function (n) { notes.push(Object.assign({}, n, { at: n.at + t0, stage: n.end ? 'end' : 'side' })); });
    const big = Math.max(l, r), scale = pulseScale(l, r);
    if (scale && big > 0) {
      const ticks = big / scale, step = BAR_SEC / ticks;
      for (let i = 0; i < ticks; i++) notes.push({ at: t0 + i * step, voice: 'woodClick', hz: 1800, dur: 0.04, gain: 0.05, stage: 'pulse', scale: scale });
    }
    if (l === r && big > 0) {
      const end = t0 + BAR_SEC;
      notes.push({ at: end, voice: VOICES[0], hz: HZ[0], dur: 0.9, gain: 0.22, held: true, stage: 'chord' });
      notes.push({ at: end, voice: VOICES[1], hz: HZ[1], dur: 0.9, gain: 0.22, held: true, stage: 'chord' });
      notes.push({ at: end, voice: 'metalBell', hz: 1047, dur: 0.5, gain: 0.25, stage: 'bell' });
    }
    return notes.sort(function (a, b) { return a.at - b.at; });
  }
  function itemHtml(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    const esc = function (x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    const w = barWidths(spec.left, spec.right);
    const bar = function (k, label) { return '<div class="bb-side"><span class="ms-label">' + label + '</span><div class="bb-bar" style="width:' + (revealed || spec.kind === 'truth' || k !== spec.blankSide ? w[k] : 0) + '%"></div></div>'; };
    const buttons = spec.kind === 'truth'
      ? '<button type="button" class="snd-play bb-play" data-mode="both">▶ 3, 2, 1 — שני הצדדים יחד</button>'
      : '<button type="button" class="snd-play bb-play" data-mode="known">▶ רק מקשיבים: הצד השלם</button><button type="button" class="snd-play bb-play" data-mode="try">▶ 3, 2, 1 — נסו את המספר שלי</button>';
    const how = spec.kind === 'truth' ? 'שני הצדדים מתחילים יחד. רק אם הם שווים — פעמון ואקורד משותף. אם אחד ממשיך לבד ונמוג — הם לא שווים.'
      : 'שוויון הוא איזון, לא «התשובה באה אחרי הסימן». נחשו מספר, כתבו אותו ולחצו «נסו»: שני הצדדים יתחילו יחד, ורק אם הם שווים יישמעו פעמון ואקורד משותף.';
    return '<div class="balance-item">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '. ' + how) + '</p>'
      + bar(0, 'צד שמאל של הסימן') + bar(1, 'צד ימין של הסימן')
      + buttons
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '<span class="snd-answer" data-reveal="' + esc(spec.answer) + '">?</span>')
      + '</div>';
  }

  return { WAY, MECHANISM, BAR_SEC, MIN_GAP_SEC, BLANK, SCREEN, HZ, TARGETS, NO_MUSIC_CHECK_ITEMS, evalSide, parse, signOf, sides, fillCheck, balancePlan, endGap, audibleGap, barWidths, plainOk, screenForTopic,
    ITEM_WORLD, itemExpr, specForItem, itemNotes, itemHtml };
});
