// MelodyMath — LawsSix: the order of operations and the laws of arithmetic,
// heard (grade ו׳; tags groupsFirstLongChain, barFill, reciprocalNotes,
// bracketNoteFirst, bracketBeatsFirst). Research:
// docs/research/laws-six-2026-11-13.md (Perplexity + Meta AI).
//
// Relational thinking (Carpenter, Franke & Levi): use what is known and how a
// change in one number changes the result, instead of computing again; the
// equals sign as a relation between two expressions (Kieran).
//   stages — every operation is a stage with its own sign, played in the
//     order the rules give: brackets first (a leader's clap opens the refrain,
//     as in a Yemenite piyyut), then × and : from left to right, then + and −.
//     After each stage its result is heard in packages (a deep gong is a
//     thousand, a middle gong a hundred, a drum ten, a tick one; a woodblock is
//     a tenth). A stage's result is the next stage's start.
//   relations — the known result is heard first; then the change (half a
//     factor, ten times the dividend, twice the divisor) and what it does.
//   the distributive law — two layers heard apart, then together.
//   fractions — beats of a bar: 1/2 is two quarter-beats of a 4-beat bar; a
//     number and its reciprocal are a phrase and its exact undoing.
// Never more than 12 sounds in a row; the widget shows only when the sounds
// (with the numbers in the text) give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_LAWS_SIX = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['groupsFirstLongChain', 'barFill', 'reciprocalNotes', 'bracketNoteFirst', 'bracketBeatsFirst', 'barCount', 'balanceBars']);
  const MAX_RUN = 12;
  const MAX_EVENTS = 56;
  const GAP = 0.7;

  const WORLDS = Object.freeze({
    stages: { he: 'פזמון ושלבים', why: 'כמו בפיוט תימני: מחיאת המוביל פותחת את הפזמון — מה שבסוגריים. אחר כך כל פעולה בתורה, וכל שלב נגמר בתוצאה שלו' },
    relation: { he: 'אותו משפט, שינוי אחד', why: 'שומעים את מה שידוע, ואז רק את השינוי — ומה הוא עושה לתוצאה' },
    layers: { he: 'שתי שכבות', why: 'שתי שכבות נשמעות לחוד, ואחר כך יחד — אותה כמות בשתי דרכים' },
    bar: { he: 'תיבה של פעמות', why: 'שבר הוא פעמות מתוך תיבה; מספר והופכי שלו הם משפט והביטול המדויק שלו' },
  });

  const SIGN = { '(': ['clap', 1600, 'bracket'], '×': ['shaker', 300, 'times'], ':': ['shaker', 620, 'share'], '+': ['metalBell', 784, 'join'], '−': ['bowed', 196, 'take'], 'undo': ['bowed', 330, 'undo'], 'half': ['shaker', 520, 'halve'], 'ten': ['shaker', 260, 'tenfold'] };
  const PKG = [[1000, 'gong', 82], [100, 'gong', 165], [10, 'drumLow', 110], [1, 'woodClick', 1600], [0.1, 'tine', 2400], [0.01, 'jingle', 3000]];
  const r4 = (x) => Math.round(x * 10000) / 10000;

  // JumpLine keeps the small bracket items it already plays (brackets as a pizmon, in beats)
  let nodeJumpLine = null;
  if (typeof module === 'object' && module.exports && typeof require === 'function') { try { nodeJumpLine = require('./jumpLine.js'); } catch (e) { nodeJumpLine = null; } }
  const jumpLinePlays = (item) => { const j = nodeJumpLine || (root && root.MM_JUMP_LINE); try { return !!(j && j.specForItem && j.specForItem(item)); } catch (e) { return false; } };
  // BalanceBars keeps the equations and inequalities it already plays (two players that end together or apart)
  let nodeBalance = null;
  if (typeof module === 'object' && module.exports && typeof require === 'function') { try { nodeBalance = require('./balanceBars.js'); } catch (e) { nodeBalance = null; } }
  const balancePlays = (item) => { const b = nodeBalance || (root && root.MM_BALANCE_BARS); try { return !!(b && b.specForItem && b.specForItem(item)); } catch (e) { return false; } };

  // an expression with one level of brackets → stages in the order they are done: [sign, value of that step]
  function orderStages(expr) {
    let toks = expr.replace(/\s+/g, '').match(/\d+|[()+−×:]/g);
    if (!toks) return null;
    const stages = [];
    const calc = (a, op, b) => (op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b);
    const flat = (list, record) => {
      let l = list.slice();
      for (const ops of [['×', ':'], ['+', '−']]) {
        for (let i = 1; i < l.length; i += 2) {
          if (ops.indexOf(l[i]) < 0) continue;
          const v = calc(+l[i - 1], l[i], +l[i + 1]);
          if (!Number.isInteger(v) || v < 0) return null;
          if (record) stages.push([l[i], v]);
          l.splice(i - 1, 3, String(v)); i -= 2;
        }
      }
      return l.length === 1 ? +l[0] : null;
    };
    const open = toks.indexOf('(');
    if (open >= 0) {
      const close = toks.indexOf(')');
      if (close < open || toks.indexOf('(', open + 1) >= 0) return null;
      const inner = flat(toks.slice(open + 1, close), false);
      if (inner == null) return null;
      stages.push(['(', inner]);
      toks = toks.slice(0, open).concat([String(inner)], toks.slice(close + 1));
    }
    const total = flat(toks, true);
    return total == null || !stages.length || stages.length > 4 ? null : stages;
  }

  // stage lists for each item: [sign, valueAfter]
  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const p = String(item.prompt || '').trim();
    const raw = String(item.answer).trim();
    let m, s = null;
    const st = (stages) => ({ kind: 'stages', stages: stages, value: stages[stages.length - 1][1], world: WORLDS.stages });
    if ((m = /^(\d+) − (\d+) × \((\d+) − (\d+)\) = \?$/.exec(p))) { const b = +m[3] - +m[4], x = +m[2] * b; s = st([['(', b], ['×', x], ['−', +m[1] - x]]); }
    else if ((m = /^\((\d+) \+ (\d+)\) : (\d+) × (\d+) = \?$/.exec(p))) { const b = +m[1] + +m[2], q = b / +m[3]; s = st([['(', b], [':', q], ['×', q * +m[4]]]); }
    else if ((m = /^0\.5 × \((\d+) − (\d+)\) = \?$/.exec(p))) { const b = +m[1] - +m[2]; s = st([['(', b], ['half', b / 2]]); }
    else if ((m = /^1\/2 \+ 0\.25 × 2 = \?$/.exec(p))) s = { kind: 'beats', bar: 4, steps: [['×', 2], ['+', 4]], value: 1, world: WORLDS.bar };
    else if ((m = /^(\d) ?\/ ?2 \+ 1\/2 × 1\/2 = \?$/.exec(p)) || /^1\/2 \+ 1\/2 × 1\/2 = \?$/.test(p)) s = { kind: 'beats', bar: 4, steps: [['×', 1], ['+', 3]], value: '3/4', world: WORLDS.bar };
    else if (/^\(1\/2 \+ 1\/2\) × 1\/2 = \?$/.test(p)) s = { kind: 'beats', bar: 4, steps: [['(', 4], ['×', 2]], value: '1/2', world: WORLDS.bar };
    else if ((m = /^השלימו: \(☐ − ([\d.]+)\) : (\d+) = (\d+)$/.exec(p))) { const inner = +m[3] * +m[2]; s = st([['undo', inner], ['undo', r4(inner + +m[1])]]); s.undo = true; }
    else if ((m = /^השלימו: 0\.5 × \(☐ − (\d+)\) = (\d+)$/.exec(p))) { const inner = +m[2] / 0.5; s = st([['undo', inner], ['undo', inner + +m[1]]]); s.undo = true; }
    else if ((m = /^([\d.]+) × ([\d.]+) × (\d+) = \?$/.exec(p)) && +m[1] * +m[3] === 10) { s = st([['×', 10], ['ten', r4(10 * +m[2])]]); s.swapNote = true; }
    else if ((m = /^([\d.]+) × 99 \+ \1 = \?$/.exec(p))) s = { kind: 'layers', a: r4(+m[1] * 99), b: +m[1], value: r4(+m[1] * 100), unitHint: +m[1], world: WORLDS.layers };
    else if ((m = /^(\d+) × (\d+) = ([\d,]+)\. כמה זה (\d+) × \2\?$/.exec(p))) { const known = +m[3].replace(/,/g, ''), f = +m[4] / +m[1]; if (f === 0.5) s = { kind: 'relation', known: known, change: 'half', value: known / 2, world: WORLDS.relation }; }
    else if ((m = /^([\d,]+) : (\d+) = (\d+)\. כמה זה ([\d,]+) : (\d+)\?/.exec(p))) {
      const D1 = +m[1].replace(/,/g, ''), d1 = +m[2], q = +m[3], D2 = +m[4].replace(/,/g, ''), d2 = +m[5];
      if (D2 === D1 * 10 && d2 === d1) s = { kind: 'relation', known: q, change: 'ten', value: q * 10, world: WORLDS.relation };
      else if (D2 === D1 && d2 === d1 * 2) s = { kind: 'relation', known: q, change: 'half', value: q / 2, world: WORLDS.relation };
    } else if ((m = /^חבילת אריחים עולה (\d+) ש״ח\. רעות קנתה (\d+) חבילות, כל אחת יקרה ב־(\d+) ש״ח\. כמה שילמה\?/.exec(p))) {
      const base = +m[1], k = +m[2], extra = +m[3];
      s = { kind: 'layers', a: k * base, b: k * extra, value: k * (base + extra), world: WORLDS.layers };
    } else if (item.music === 'barCount' && !jumpLinePlays(item) && (m = /^([\d()+−×: ]+) = \?(?: \(כתבו בלי פסיק\))?$/.exec(p))) {
      // grade 4 order of operations: brackets, then × and : from the left, then + and − from the left
      const stages = orderStages(m[1]);
      if (stages) s = st(stages);
    } else if (item.music === 'balanceBars' && !balancePlays(item) && (m = /^נכון או לא נכון: ([\d()+−×: ]+) ([<>=]) ([\d()+−×: ]+)$/.exec(p))) {
      // each side in its own stages, one after the other; then the child compares the two results
      const A = orderStages(m[1]), B = orderStages(m[3]);
      if (A && B) {
        const a = A[A.length - 1][1], b = B[B.length - 1][1], ok = m[2] === '<' ? a < b : m[2] === '>' ? a > b : a === b;
        s = { kind: 'twoSides', sides: [A, B], rel: m[2], value: ok ? 'נכון' : 'לא נכון', world: WORLDS.stages };
      }
    } else if (item.music === 'balanceBars' && !balancePlays(item) && (m = /^מהו המספר השלם (הגדול|הקטן) ביותר שמתאים ל־☐: ☐ × (\d+) ([<>]) ([\d,]+)$/.exec(p))) {
      // try the multiplier near the bound and the next one: which product still fits?
      const k = +m[2], lim = +m[4].replace(/,/g, ''), less = m[3] === '<';
      const best = less ? Math.ceil(lim / k) - 1 : Math.floor(lim / k) + 1;
      const tries = less ? [best, best + 1] : [best - 1, best];
      s = { kind: 'bound', tries: tries.map((x) => [x * k, less ? x * k < lim : x * k > lim]), value: best, world: WORLDS.stages };
    } else if ((m = /^(\S+) קוראת (\d+) עמודים בכל יום\. אחרי (\d) שבועות נשארו לה (\d+) עמודים\. כמה עמודים יש בספר\?$/.exec(p))) {
      const perDay = +m[2], days = 7 * +m[3], read = perDay * days;
      s = st([['×', days], ['×', read], ['+', read + +m[4]]]);
    } else if (/^מהו המספר ההופכי ל־2\/5\? \(כשבר\)$/.test(p)) s = { kind: 'reciprocal', bar: 5, part: 2, value: '5/2', world: WORLDS.bar };
    else if (/^3\/4 × 5 × 4\/3 = \?$/.test(p)) s = { kind: 'undoPair', wholes: 5, d: 4, n: 3, value: 5, world: WORLDS.bar };
    else if (/^חילוק ב־1\/3 שווה לכפל באיזה מספר\?$/.test(p)) s = { kind: 'thirds', value: 3, world: WORLDS.bar };
    else if (/^7\/8 × 3\/5 \+ 7\/8 × 2\/5 = \?$/.test(p)) s = { kind: 'fifthsLayers', a: 3, b: 2, d: 5, value: '7/8', world: WORLDS.layers };
    if (!s || String(s.value) !== raw) return null;   // the sounds give exactly the answer
    s.answer = String(s.value);
    let ev;
    try { ev = soundEvents(s); } catch (e) { return null; }
    if (!ev.length || longestRun(ev) > MAX_RUN || ev.length > MAX_EVENTS) return null;
    return s;
  }
  function specForItem(item) { return plan(item); }

  function longestRun(ev) {
    let best = 0, run = 0, last = -9;
    [...new Set(ev.map((e) => Math.round(e.at * 1000)))].sort((a, b) => a - b).forEach((ms) => {
      const at = ms / 1000; run = at - last < 0.3 ? run + 1 : 1; last = at; best = Math.max(best, run);
    });
    return best;
  }

  // ---------------------------------------------------------------- sound
  function soundEvents(spec) {
    if (!spec) return [];
    const ev = [];
    let t = 0;
    const hit = (voice, hz, dur, gain, stage, extra) => { ev.push(Object.assign({ at: t, voice: voice, hz: hz, dur: dur, gain: gain, stage: stage }, extra || {})); };
    const packages = (v, stage, extra) => {
      let rest = Math.round(v * 100);
      PKG.forEach(([w, voice, hz]) => {
        const unit = Math.round(w * 100), c = Math.floor(rest / unit); rest -= c * unit;
        if (c > 9) throw new Error('too many');
        for (let i = 0; i < c; i++) { hit(voice, hz, w >= 100 ? 0.45 : 0.12, 0.22, stage, Object.assign({ worth: w }, extra)); t += w >= 100 ? 0.38 : 0.28; }
        if (c) t += 0.3;
      });
      t += GAP;
    };
    const sign = (s, extra) => { const v = SIGN[s]; hit(v[0], v[1], 0.3, 0.16, 'sign', Object.assign({ op: v[2] }, extra)); t += 0.5; };
    const beats = (n, bar, stage) => { for (let i = 0; i < bar; i++) { if (i < n) hit('drumLow', 110, 0.2, 0.22, stage, { beat: i }); t += 0.36; } t += GAP; };
    switch (spec.kind) {
      case 'stages':
        spec.stages.forEach(([op, val], i) => { sign(op, { n: i }); packages(val, 'result', { n: i }); });
        break;
      case 'twoSides':
        spec.sides.forEach((side, k) => { side.forEach(([op, val], i) => { sign(op, { side: k, n: i }); packages(val, 'result', { side: k, n: i }); }); t += GAP; });
        break;
      case 'bound':
        // each try: the product, then a bell when it still fits, real silence when it does not
        spec.tries.forEach(([prod, fits], i) => { sign('×', { n: i }); packages(prod, 'try', { n: i }); if (fits) { hit('metalBell', 1568, 0.3, 0.14, 'fits', { n: i }); } t += 0.6; });
        break;
      case 'relation':
        packages(spec.known, 'known');
        sign(spec.change);
        packages(spec.value, 'changed');
        break;
      case 'layers':
        packages(spec.a, 'layerA');
        packages(spec.b, 'layerB');
        sign('+');
        packages(spec.value, 'together');
        break;
      case 'beats':
        spec.steps.forEach(([op, n], i) => { sign(op, { n: i }); beats(n, spec.bar, 'barBeats'); });
        break;
      case 'reciprocal':
        beats(spec.bar, spec.bar, 'whole');
        // how many parts of two beats fit the whole bar: two, and half of one more
        for (let k = 0; k < 2; k++) { for (let i = 0; i < spec.part; i++) { hit('pluck', 392, 0.15, 0.2, 'part', { copy: k }); t += 0.36; } t += 0.4; }
        hit('pluck', 392, 0.15, 0.2, 'halfPart', { copy: 2 }); t += 0.36;
        break;
      case 'undoPair':
        for (let i = 0; i < spec.wholes; i++) { hit('drumLow', 98, 0.35, 0.24, 'whole'); t += 0.45; }
        t += GAP;
        sign('×');
        beats(spec.n, spec.d, 'taken');                       // each whole: 3 of 4 quarters
        sign('undo');
        beats(spec.d, spec.d, 'restored');                    // ×4/3 brings the quarter back: a whole again
        for (let i = 0; i < spec.wholes; i++) { hit('drumLow', 98, 0.35, 0.24, 'wholeAgain'); t += 0.45; }
        break;
      case 'thirds':
        hit('drumLow', 98, 0.4, 0.24, 'whole'); t += 0.6;
        for (let i = 0; i < 3; i++) { hit('drumHigh', 660, 0.1, 0.2, 'third'); t += 0.4; }
        break;
      case 'fifthsLayers':
        beats(spec.a, spec.d, 'layerA');
        beats(spec.b, spec.d, 'layerB');
        sign('+');
        beats(spec.d, spec.d, 'whole');                       // together a whole bar of fifths
        sign('×');
        beats(7, 8, 'ofWhole');                               // seven eighths of one whole
        break;
      default:
        break;
    }
    return ev;
  }

  function play(spec, env) {
    const e = env || {};
    const events = soundEvents(spec);
    if (!events.length) return null;
    const pv = e.playVoice || (root && root.playVoice);
    const ac = e.audioContext || (root && typeof root.getSharedAudioContext === 'function' ? root.getSharedAudioContext() : null);
    if (typeof pv === 'function' && ac) {
      if (ac.state === 'suspended' && ac.resume) { try { ac.resume(); } catch (err) { /* autoplay */ } }
      const start = ac.currentTime + 0.05;
      events.forEach((n) => pv(ac, n.voice, n.hz, start + n.at, null, { dur: n.dur, gain: n.gain }));
      return { notes: events.length };
    }
    return { notes: events.length, silent: true };
  }

  // ---------------------------------------------------------------- picture
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  const LEGEND = 'גונג עמוק = אלף, גונג אמצעי = מאה, תוף = עשר, נקישה = אחד, צליל דק = עשירית.';
  const HOW = {
    twoSides: 'כל צד בשלבים משלו: הסימן, ואחריו התוצאה בחבילות. קודם הצד השמאלי, אחריו הימני. אחר כך משווים: האם היחס שבתרגיל מתקיים?',
    bound: 'מנסים כופל ליד הגבול: המכפלה בחבילות, ופעמון אם היא עדיין מתאימה — שקט אם כבר לא. אחר כך הכופל הבא. איזה כופל הוא האחרון שמתאים, או הראשון?',
    stages: 'כל פעולה היא שלב עם סימן משלו: מחיאה פותחת את הסוגריים, ואחר כך כפל וחילוק משמאל לימין, ובסוף חיבור וחיסור. אחרי כל שלב — התוצאה שלו.',
    stagesUndo: 'הולכים אחורה: כל שלב מבטל את הפעולה האחרונה, עד שמגיעים למשבצת.',
    relation: 'קודם מה שידוע. אחר כך רק השינוי — ומה הוא עושה לתוצאה. אין צורך לחשב מחדש.',
    layers: 'שתי שכבות, כל אחת לחוד, ואחר כך יחד. אותה כמות בשתי דרכים.',
    beats: 'תיבה של ארבע פעמות: כל פעמה היא רבע. כל שלב בסימן משלו, ואחריו כמה פעמות נשמעות בתיבה.',
    reciprocal: 'התיבה השלמה, ואחריה החלק: כמה חלקים כאלה נכנסים בתיבה השלמה?',
    undoPair: 'השלמים; אחר כך כפל בשבר לוקח חלק מכל שלם — והכפל בהופכי מחזיר בדיוק את מה שנלקח.',
    thirds: 'שלם אחד, ואחריו השלישים שלו: כמה שלישים נכנסים בשלם?',
    fifthsLayers: 'שתי שכבות של חמישיות, יחד הן תיבה שלמה. אחר כך החלק מתוך השלם.',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    const how = spec.kind === 'stages' && spec.undo ? HOW.stagesUndo : HOW[spec.kind];
    const legend = ['stages', 'relation', 'layers'].includes(spec.kind) ? ' ' + LEGEND : '';
    return '<div class="laws-six">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc(how + legend) + '</p>'
      + (revealed
        ? '<p class="band-predict ls-silent">עכשיו בלי צליל: כתבו את השלבים בסדר, ובדקו שהשוויון נשמר בשני הצדדים.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו לשלבים.</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, WORLDS: WORLDS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html };
});
