// MelodyMath — MeterSplit: divisibility, divisors, primes and the least
// common multiple heard as a cycle of equal beats (grades ה׳–ו׳; mechanism M2,
// accented and grouped beats; das2023). Research:
// docs/research/divisibility-meter-split-2026-11-13.md (Perplexity + Meta AI).
//
// A cycle of n equal beats is played with an accent every k beats. When k
// divides n the last group closes exactly on the cycle's end; when it does
// not, the last group is left broken (fewer beats) and the app marks it. A
// prime n can only be heard as 1 group or n groups: the child tries every k
// and hears every try break. The LCM is where two (or three) accent rows,
// each in its own timbre, first land together.
//   - Equal groups only. Aksak meters (7/8 = 2+2+3) group unequally, so they
//     are never used to explain divisibility.
//   - The cycle is played at one locked tempo; a try never speeds up to fit.
//   - Up to 24 beats per cycle: beyond that the ear cannot hear the groups,
//     and the item keeps its text.
//   - The widget shows only when the beats give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_METER_SPLIT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const MECHANISM = 'M2';
  const MAX_BEATS = 24;
  const STEP = 0.3;    // locked: every beat of every try lasts the same
  const ROUNDS = 2;    // the leftover is heard only at the seam of a second round (Meta AI)
  const TAGS = Object.freeze(['meters', 'meterGroups', 'accentSkip', 'lcmDrums', 'stickingParity']);

  function poly() {
    if (root && typeof root.lcmOf === 'function' && typeof root.factorsOf === 'function') return root;
    try { return require('../polyrhythm.js'); } catch (e) { return null; }
  }

  // Three sounds in a clear order: a weak beat, a group accent, and a strong,
  // unique cycle start (Meta AI). Only worlds whose cycles split EQUALLY:
  // aksak (2+2+3), rupak tala and sama'i thaqil close with unequal groups and
  // would teach that 7 "divides", so primes use a neutral circle.
  const WORLDS = Object.freeze({
    westAfrica: { he: 'מחזור של 12 ממערב אפריקה', beat: 'woodClick', accent: 'drumLow', start: 'metalBell',
      why: 'המחזור של 12 מכיל באמת קבוצות של 2, 3, 4 ו־6, והנגנים חושבים בתוכו' },
    tintal: { he: 'טין־טאל וקהרווה, הודו', beat: 'drumHigh', accent: 'drumLow', start: 'gong',
      why: 'מחזור שמתחלק לקבוצות שוות וסאם ברור שסוגר אותו' },
    circle: { he: 'מעגל תופים ומחיאות', beat: 'clap', accent: 'drumLow', start: 'gong',
      why: 'מעגל נעול וקבוצות שוות בלבד. מוזיקאים סוגרים מעגל גם בקבוצות לא שוות — זה יפה, אבל זה לא נקרא חלוקה' },
    meetClap: { he: 'שני ילדים מוחאים', beat: 'woodClick', rows: ['clap', 'drumLow', 'woodBar'], start: 'gong', meet: 'metalBell',
      why: 'כל אחד מוחא בקצב שלו, וכשהם נפגשים — צליל שלישי וחזק' },
    meetWest: { he: 'פוליריתמיקה של 12 ממערב אפריקה', beat: 'woodClick', rows: ['drumLow', 'woodBar', 'drumHigh'], start: 'gong', meet: 'metalBell',
      why: 'קצבים של 3, 4 ו־6 חיים יחד בתוך 12; כשהשורות נפגשות — צליל שלישי וחזק' },
  });
  function worldFor(spec) {
    if (spec.kind === 'meet') return spec.beats === 12 ? WORLDS.meetWest : WORLDS.meetClap;
    if (spec.kind === 'prime') return WORLDS.circle;
    const n = spec.n || 0;
    if (n === 12) return WORLDS.westAfrica;
    if (n === 8 || n === 16) return WORLDS.tintal;
    return WORLDS.circle;
  }

  function int(v, lo, hi) { const n = Number(v); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; }
  const numbers = (s) => (String(s || '').replace(/(\d),(\d{3})/g, '$1$2').match(/\d+/g) || []).map(Number);
  function answerOf(v) {
    if (typeof v === 'number') return v;
    const s = String(v == null ? '' : v).trim();
    if (s === 'כן' || s === 'לא') return s;
    return /^\d+$/.test(s) ? Number(s) : null;
  }

  // One try: n beats with an accent every k. closes = k divides n.
  function tryGroups(n, k) {
    const groups = Math.floor(n / k), left = n % k;
    return { n: n, k: k, groups: groups, left: left, closes: left === 0 };
  }

  // Builds the listening plan from the item. kinds:
  //   groups     n beats in groups of k → how many groups (or the group size)
  //   meters     how many equal groupings 2..n-1 a cycle of n has
  //   divisors   how many divisors (1 and n included)
  //   prime      is n prime? (every try from 2 to n-1 breaks)
  //   whichSplits which of several cycles splits into groups of k
  //   meet       when do rows every a, b (, c) beats land together (LCM)
  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const P = poly();
    if (!P) return null;
    const p = String(item.prompt || '');
    const ans = answerOf(item.answer);
    if (ans == null) return null;
    const ns = numbers(p);
    let spec = null, m;
    if (/נפגש|מכים שוב יחד|שלושתם/.test(p) && (m = p.match(/כל (\d+)/g))) {
      const every = m.map((x) => Number(x.replace(/\D/g, '')));
      if (every.length < 2 || every.length > 3) return null;
      const meet = P.lcmOf.apply(null, every);
      if (!meet || meet > MAX_BEATS) return null;
      spec = { kind: 'meet', every: every, beats: meet, answer: meet };
    } else if ((m = /(\d+)\s*פעימות מחולקת לקבוצות של (\d+)/.exec(p))) {
      const n = int(m[1], 2, MAX_BEATS), k = int(m[2], 1, MAX_BEATS);
      if (!n || !k || n % k) return null;
      spec = { kind: 'groups', n: n, tries: [tryGroups(n, k)], answer: n / k };
    } else if ((m = /(\d+) פעימות אפשר לספור בקבוצות שוות[^.]*\.\s*כמה פעימות בקבוצה אם יש (\d+) קבוצות/.exec(p))) {
      const n = int(m[1], 2, MAX_BEATS), g = int(m[2], 1, MAX_BEATS);
      if (!n || !g || n % g) return null;
      spec = { kind: 'groups', n: n, tries: [tryGroups(n, n / g)], answer: n / g };
    } else if (/לכמה גדלים שונים של קבוצות שוות/.test(p) && ns.length) {
      const n = int(ns[0], 2, MAX_BEATS);
      if (!n) return null;
      const tries = [];
      for (let k = 2; k < n; k++) tries.push(tryGroups(n, k));
      spec = { kind: 'meters', n: n, tries: tries, answer: P.metersOf(n).length };
    } else if (/כמה מחלקים יש למספר (\d+)/.test(p)) {
      const n = int(/כמה מחלקים יש למספר (\d+)/.exec(p)[1], 2, 12);
      if (!n) return null;
      const tries = [];
      for (let k = 1; k <= n; k++) tries.push(tryGroups(n, k));
      spec = { kind: 'divisors', n: n, tries: tries, answer: P.factorsOf(n).length };
    } else if ((m = /האם (\d+) הוא מספר ראשוני/.exec(p))) {
      const n = int(m[1], 2, 12);
      if (!n) return null;
      const tries = [];
      for (let k = 2; k < n; k++) tries.push(tryGroups(n, k));
      spec = { kind: 'prime', n: n, tries: tries, answer: P.isPrimeBeats(n) ? 'כן' : 'לא' };
    } else if (/איזו מהן אפשר לחלק לקבוצות שוות של (\d+)/.test(p) && (m = /תיבות של ([\d,\sו־-]+) פעימות/.exec(p))) {
      const k = Number(/קבוצות שוות של (\d+)/.exec(p)[1]);
      const cycles = numbers(m[1]).filter((n) => n >= 2 && n <= MAX_BEATS);
      const closing = cycles.filter((n) => n % k === 0);
      if (closing.length !== 1) return null;
      spec = { kind: 'whichSplits', k: k, tries: cycles.map((n) => tryGroups(n, k)), answer: closing[0] };
    }
    if (!spec || spec.answer !== ans) return null;   // the beats give exactly the answer
    spec.world = worldFor(spec);
    return spec;
  }

  function specForItem(item) { return plan(item); }

  // ---------------------------------------------------------------- sound
  // One try (the child picks it): ROUNDS rounds of the locked cycle. The cycle
  // start is a strong unique sound, every group start an accent, every other
  // beat weak. A broken last group is heard at the seam, where the next round
  // starts in the middle of a group. The rounds end on one more cycle start.
  function tryEvents(spec, i) {
    const tr = spec.tries[i];
    if (!tr) return [];
    const w = spec.world, ev = [];
    for (let r = 0; r < ROUNDS; r++) {
      for (let b = 0; b < tr.n; b++) {
        const at = (r * tr.n + b) * STEP;
        const role = b === 0 ? 'start' : b % tr.k === 0 ? 'accent' : 'beat';
        ev.push({ at: at, voice: role === 'start' ? w.start : role === 'accent' ? w.accent : w.beat, hz: role === 'start' ? 196 : role === 'accent' ? 330 : 523,
          dur: role === 'start' ? 0.4 : 0.1, gain: role === 'start' ? 0.3 : role === 'accent' ? 0.24 : 0.12, stage: role, try: i, round: r, beat: b,
          leftover: !tr.closes && b >= tr.groups * tr.k });
      }
    }
    ev.push({ at: ROUNDS * tr.n * STEP, voice: w.start, hz: 196, dur: 0.4, gain: 0.3, stage: 'start', try: i, round: ROUNDS, beat: 0 });
    return ev;
  }

  // Common multiples: one row per player, a strong third sound where all meet
  // (after `beats` beats, at the start of the next round — counted from 0).
  function meetEvents(spec) {
    const w = spec.world, ev = [];
    for (let b = 0; b <= spec.beats; b++) {
      const at = b * STEP;
      ev.push({ at: at, voice: w.beat, hz: 1800, dur: 0.04, gain: 0.04, stage: 'pulse', beat: b });
      const all = spec.every.every((x) => b % x === 0);
      spec.every.forEach((a, r) => { if (b % a === 0) ev.push({ at: at, voice: w.rows[r], hz: [392, 262, 523][r], dur: 0.12, gain: 0.22, stage: 'row', row: r, beat: b }); });
      if (all) ev.push({ at: at, voice: b === 0 ? w.start : w.meet, hz: b === 0 ? 196 : 1047, dur: 0.35, gain: 0.3, stage: b === 0 ? 'start' : 'meet', beat: b });
    }
    return ev;
  }

  function soundEvents(spec, i) {
    if (!spec) return [];
    if (spec.kind === 'meet') return meetEvents(spec);
    return tryEvents(spec, Number.isInteger(i) ? i : 0);
  }

  function play(spec, env, i) {
    const e = env || {};
    const events = soundEvents(spec, i);
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
  // Ear first (Meta AI): before the answer a try is a button and a plain
  // cycle; the groups, the broken leftover and ✓/✗ appear only after it.
  function tryRow(tr, i, revealed) {
    const cells = Array.from({ length: tr.n }, (_, b) => {
      if (!revealed) return '<span class="nb-cell' + (b === 0 ? ' nb-n0' : '') + '"></span>';
      const g = Math.floor(b / tr.k), broken = !tr.closes && b >= tr.groups * tr.k;
      return '<span class="nb-cell ' + (broken ? 'ms-broken' : g % 2 ? 'nb-n2' : 'nb-n0') + (b % tr.k === 0 && b > 0 ? ' nb-barline' : '') + '"></span>';
    }).join('');
    const tag = revealed ? (tr.closes ? ' ✓ נסגר' : ' ✗ נשבר') : '';
    return '<div class="ms-try"><button type="button" class="snd-play ms-play" data-try="' + i + '">▶ ' + tr.n + ' פעמות, קבוצות של ' + tr.k + '</button>'
      + '<span class="ms-label">' + esc(tag) + '</span>'
      + '<div class="nb-bar" dir="ltr" style="grid-template-columns:repeat(' + tr.n + ',1fr)">' + cells + '</div></div>';
  }
  function meetRows(spec) {
    return spec.every.map((a, r) => {
      const cells = Array.from({ length: spec.beats + 1 }, (_, b) => '<span class="nb-cell ' + (b % a === 0 ? 'nb-n' + (r % 3) : '') + '"></span>').join('');
      return '<div class="ms-try"><span class="ms-label">תוף ' + (r + 1) + ': כל ' + a + '</span><div class="nb-bar" dir="ltr" style="grid-template-columns:repeat(' + (spec.beats + 1) + ',1fr)">' + cells + '</div></div>';
    }).join('');
  }
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    const ans = String(spec.answer);
    const meet = spec.kind === 'meet';
    const body = meet ? (revealed ? meetRows(spec) : '') + '<button type="button" class="snd-play ms-play" data-try="0">▶ שמעו את השורות</button>'
      : spec.tries.map((tr, i) => tryRow(tr, i, revealed)).join('');
    const how = meet ? 'כל שורה בקצב שלה; צליל חזק ושונה כשכולן נפגשות. סופרים מ־0: הן נפגשות אחרי כמה פעימות.'
      : 'אותו קצב בכל ניסיון, שני סיבובים. צליל מיוחד פותח כל סיבוב: שומעים אם הקבוצה האחרונה נסגרת עליו או נשברת.';
    return '<div class="meter-split">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '. ' + how) + '</p>'
      + (revealed ? '' : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו לכל ניסיון וסמנו לעצמכם: נסגר או נשבר?</p>')
      + body
      + (revealed ? '<span class="snd-answer">' + esc(ans) + '</span>' : '<span class="snd-answer" data-reveal="' + esc(ans) + '">?</span>')
      + '</div>';
  }

  return { MECHANISM: MECHANISM, TAGS: TAGS, WORLDS: WORLDS, MAX_BEATS: MAX_BEATS, STEP: STEP,
    tryGroups: tryGroups, plan: plan, specForItem: specForItem, soundEvents: soundEvents, play: play, html: html };
});
