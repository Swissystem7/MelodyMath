// MelodyMath — JumpLine: jumps on the empty number line, two-step problems and
// brackets, heard (grades א׳–ד׳). Research: docs/research/jump-line-2026-11-13.md
// (Perplexity + Meta AI).
//
//   jumps (N10) — a darbuka: dum (low) is a jump of ten, tak (high) a step of
//     one; from grade 3 a deep dum is a hundred. The start number is NOT a
//     sound (a long sound cannot tell 28 from 280): it is in the text, and a
//     short opening sign only says "here we start" and which way we go —
//     rising for forward, falling for back. Kinds of jumps are kept apart by a
//     silence, never more than nine of a kind.
//   comparison — counting up from the smaller number; a stop sign (not counted)
//     says "we arrived". The answer is what the jumps are worth, not their
//     number and not the place we arrived at.
//   two-step problems — inspired by the Andalusian orchestra of the Jews of
//     Morocco and North Africa: rows of players, a phrase for each row, a
//     silence between rows; a checkpoint chime (not counted) asks the child to
//     say the middle result; the second step has its own voice: singers who
//     join, or a falling sound for what is taken away.
//   brackets — the refrain of a Yemenite piyyut repeats whole: what is inside
//     the brackets is the refrain. A leader's clap starts every repetition;
//     outside the brackets a number stands alone, after a silence.
// The widget shows only when the sounds (with the numbers in the text) give
// exactly the item's answer; never more than 12 sounds in a row.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_JUMP_LINE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['callResponse', 'twoDrums', 'tenThenMore', 'tensBarsBack', 'groupsThenMore', 'barCount']);
  const MAX_RUN = 12;
  const MAX_KIND = 9;
  const MAX_EVENTS = 40;
  const STEP = 0.27;
  const GAP = 0.6;
  const GRADE = { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6 };

  const WORLDS = Object.freeze({
    darbuka: { he: 'דרבוקה', why: 'תוף גביע שמנגנים בו במוזיקה ערבית, טורקית ומזרחית. דום — מכה עמוקה במרכז, טק — מכה חדה בשפה' },
    andalus: { he: 'בהשראת התזמורת האנדלוסית', why: 'מוזיקה של יהודי מרוקו וצפון אפריקה: הנגנים יושבים בשורות, והפייטן והמקהלה עונים זה לזה' },
    pizmon: { he: 'פזמון חוזר בפיוט תימני', why: 'אחרי כל בית חוזר הפזמון בשלמותו — מה שבתוך הסוגריים חוזר כחבילה אחת' },
  });
  const LEGEND = {
    jumps2: 'דום = קפיצה של עשר. טק = צעד של אחד. צליל הפתיחה רק אומר מאיפה מתחילים ולאן — הוא לא נספר.',
    jumps3: 'דום עמוק = קפיצה של מאה. דום = קפיצה של עשר. טק = צעד של אחד. צליל הפתיחה לא נספר.',
  };

  const nums = (s) => (String(s).replace(/[א-ת]׳\d/g, ' ').match(/\d[\d,]*/g) || []).map((x) => +x.replace(/,/g, ''));
  const split = (d, hundreds) => {
    const h = hundreds ? Math.floor(d / 100) : 0;
    const rest = d - h * 100;
    return { h: h, t: Math.floor(rest / 10), o: rest % 10 };
  };
  const fitsKinds = (j) => j.h <= MAX_KIND && j.t <= MAX_KIND && j.o <= MAX_KIND;

  function jumps(start, delta, dir, grade, extra) {
    const hundreds = grade >= 3;
    const j = split(delta, hundreds);
    if (!fitsKinds(j)) return null;
    return Object.assign({ start: start, delta: delta, dir: dir, jumps: j, hundreds: hundreds }, extra || {});
  }

  // EarlyBeats keeps the small counting-on items of grades 1–2 (it comes first
  // in the app); JumpLine never plays an item EarlyBeats already plays.
  function earlyBeats() {
    if (root && root.MM_EARLY_BEATS) return root.MM_EARLY_BEATS;
    try { return typeof require === 'function' ? require('./earlyBeats') : null; } catch (e) { return null; }
  }

  // Reads the item into a listening plan, or null.
  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const eb = earlyBeats();
    if (eb && eb.specForItem(item)) return null;
    const p = String(item.prompt || '').trim(), g = GRADE[item.grade] || 2;
    const ans = Number(String(item.answer).replace(/,/g, ''));
    if (!Number.isFinite(ans)) return null;
    let m, s = null;
    if ((m = /^(\(?)(\d+) \+ (\d+)(\)?) × (\d+) = \?$/.exec(p)) && !!m[1] === !!m[4]) {
      const a = +m[2], b = +m[3], k = +m[5], br = !!m[1];
      if (a <= MAX_KIND && b <= MAX_KIND && k <= 6) s = { kind: 'brackets', a: a, b: b, k: k, brackets: br, value: br ? (a + b) * k : a + b * k, world: WORLDS.pizmon };
    } else if (item.music === 'groupsThenMore' && (s = twoStep(p))) {
      s.world = WORLDS.andalus;
    } else if (/בכמה .*(?:יותר|מהיר|גבוה|ארוכה)|יקר יותר/.test(p)) {
      const ns = nums(p);
      if (ns.length === 2 && ns[0] !== ns[1]) {
        const lo = Math.min(ns[0], ns[1]), hi = Math.max(ns[0], ns[1]);
        s = jumps(lo, hi - lo, 1, g, { kind: 'compare', target: hi, value: hi - lo, world: WORLDS.darbuka });
      }
    } else if ((m = /^(\d+) \+ (\d+) = \?$/.exec(p)) || (item.music === 'callResponse' && /בסך הכול|בשתי/.test(p) && nums(p).length === 2 && (m = [null].concat(nums(p))))) {
      const a = +m[1], b = +m[2];
      s = jumps(a, b, 1, g, { kind: 'add', value: a + b, world: WORLDS.darbuka });
    } else if ((m = /^(\d+) − (\d+) = \?$/.exec(p))) {
      const a = +m[1], b = +m[2];
      if (a > b) s = jumps(a, b, -1, g, { kind: 'sub', value: a - b, world: WORLDS.darbuka });
    }
    if (!s || s.value !== ans) return null;      // the sounds give exactly the answer
    s.answer = String(s.value);
    const ev = soundEvents(s);
    if (!ev.length || longestRun(ev) > MAX_RUN || ev.length > MAX_EVENTS) return null;
    return s;
  }

  // grade 3 two-step stories: groups first, then more / less; or a start minus groups
  function twoStep(p) {
    let m;
    const G = (groups, size, then, extra, start) => (groups <= 9 && size <= MAX_RUN && extra <= MAX_RUN ? { kind: 'twoStep', groups: groups, size: size, then: then, extra: extra, start: start } : null);
    let s = null;
    if ((m = /(\d+) שורות של (\d+) נגנים, ועל הבמה עוד (\d+) זמרים/.exec(p))) s = G(+m[1], +m[2], 'more', +m[3]);
    else if ((m = /תוף מנגן (\d+) פעימות בתיבה\. ניגנו (\d+) תיבות, ועוד (\d+) פעימות/.exec(p))) s = G(+m[2], +m[1], 'more', +m[3]);
    else if ((m = /במשקל (\d)\/4 ניגנו (\d+) תיבות, ואחריהן עוד (\d+) פעמות/.exec(p))) s = G(+m[2], +m[1], 'more', +m[3]);
    else if ((m = /(\d+) שורות של (\d+) זמרים\. (\d+) זמרים יצאו/.exec(p))) s = G(+m[1], +m[2], 'less', +m[3]);
    else if ((m = /היו (\d+) כרטיסים\. חילקו (\d+) קבוצות של (\d+) כרטיסים/.exec(p))) s = G(+m[2], +m[3], 'from', 0, +m[1]);
    else if ((m = /היו (\d+) ₪\. הוא קנה (\d+) מיתרים ב־(\d+) ₪/.exec(p))) s = G(+m[2], +m[3], 'from', 0, +m[1]);
    else if ((m = /קנינו (\d+) חוברות תווים ב־(\d+) ₪ כל אחת, ושילמנו בשטר של (\d+) ₪/.exec(p))) s = G(+m[1], +m[2], 'from', 0, +m[3]);
    if (!s) return null;
    const mid = s.groups * s.size;
    s.mid = mid;
    s.value = s.then === 'more' ? mid + s.extra : s.then === 'less' ? mid - s.extra : s.start - mid;
    return s;
  }
  function specForItem(item) { return plan(item); }

  function longestRun(ev) {
    let best = 0, run = 0, last = -9;
    [...new Set(ev.map((n) => Math.round(n.at * 1000)))].sort((a, b) => a - b).forEach((ms) => {
      const at = ms / 1000; run = at - last < 0.4 ? run + 1 : 1; last = at; best = Math.max(best, run);
    });
    return best;
  }

  // ---------------------------------------------------------------- sound
  function soundEvents(spec) {
    if (!spec) return [];
    const ev = [];
    let t = 0;
    const hit = (voice, hz, dur, gain, stage, extra) => { ev.push(Object.assign({ at: t, voice: voice, hz: hz, dur: dur, gain: gain, stage: stage }, extra || {})); };
    if (spec.kind === 'add' || spec.kind === 'sub' || spec.kind === 'compare') {
      // the opening sign: two short pings, rising = forward, falling = back; not counted
      const up = spec.dir > 0;
      hit('metalBell', up ? 1047 : 1568, 0.1, 0.16, 'start'); t += 0.16;
      hit('metalBell', up ? 1568 : 1047, 0.12, 0.16, 'start'); t += 0.16 + GAP;
      let k = 0;
      const glide = (base) => base * Math.pow(2, (spec.dir * k++) / 24);   // the line moves on, gently
      const kinds = [['h', 'drumLow', 62, 0.5, 0.32, 100], ['t', 'drumLow', 110, 0.3, 0.3, 10], ['o', 'drumHigh', 660, 0.08, 0.2, 1]];
      kinds.forEach(([key, voice, hz, dur, gain, worth]) => {
        const n = spec.jumps[key];
        for (let i = 0; i < n; i++) { hit(voice, glide(hz), dur, gain, 'jump', { worth: worth, dir: spec.dir }); t += STEP + (worth === 100 ? 0.25 : 0); }
        if (n) t += GAP;
      });
      if (spec.kind === 'compare') hit('metalBell', 2093, 0.4, 0.18, 'arrived');
      return ev;
    }
    if (spec.kind === 'twoStep') {
      for (let g = 0; g < spec.groups; g++) {
        for (let i = 0; i < spec.size; i++) {
          hit('pluck', 392 + 20 * i, 0.14, i === 0 ? 0.26 : 0.18, 'row', { group: g, accent: i === 0 });
          t += STEP * 0.85;
        }
        t += GAP;
      }
      hit('metalBell', 2637, 0.3, 0.1, 'checkpoint'); t += 0.4 + GAP;   // stop: say the middle result
      if (spec.then === 'more') for (let i = 0; i < spec.extra; i++) { hit('voiceAh', 440, 0.22, 0.2, 'join'); t += STEP * 1.2; }
      if (spec.then === 'less') for (let i = 0; i < spec.extra; i++) { hit('woodBar', 784 * Math.pow(2, -i / 12), 0.14, 0.18, 'leave'); t += STEP * 1.2; }
      return ev;
    }
    if (spec.kind === 'brackets') {
      const tak = (stage, extra) => { hit('drumHigh', 660, 0.08, 0.2, stage, extra); t += STEP; };
      const ka = (stage, extra) => { hit('woodClick', 1200, 0.06, 0.2, stage, extra); t += STEP; };
      if (!spec.brackets) {
        for (let i = 0; i < spec.a; i++) tak('alone');
        t += GAP * 1.5;                                          // the first number stands alone
      }
      for (let r = 0; r < spec.k; r++) {
        hit('clap', 1600, 0.06, 0.22, 'leader', { rep: r }); t += 0.4;   // the leader starts every repetition
        if (spec.brackets) for (let i = 0; i < spec.a; i++) tak('refrain', { rep: r, part: 0 });
        for (let i = 0; i < spec.b; i++) ka('refrain', { rep: r, part: 1 });
        t += GAP;
      }
      return ev;
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
  const HOW = {
    add: 'מתחילים מהמספר הראשון שבתרגיל — הוא לא נשמע. צליל עולה = קדימה. קודם הקפיצות הגדולות, שקט, ואז הצעדים. איפה נחתנו?',
    sub: 'מתחילים מהמספר הראשון שבתרגיל — הוא לא נשמע. צליל יורד = אחורה. קודם הקפיצות הגדולות, שקט, ואז הצעדים. איפה נחתנו?',
    compare: 'מתחילים מהמספר הקטן וקופצים קדימה עד הגדול — הפעמון אומר "הגענו". כמה שווה כל קפיצה? כמה שוות כל הקפיצות יחד? זה ההפרש — לא המקום שהגענו אליו.',
    twoStep: 'קודם השורות: משפט לכל שורה, ושקט ביניהן. הפעמון הדק אומר: עצרו ואמרו כמה יש עד עכשיו. אחר כך השלב השני.',
    twoStepFrom: 'המספר שמתחילים ממנו כתוב בתרגיל. השורות הן מה שנלקח: משפט לכל שורה. הפעמון הדק אומר: עצרו ואמרו כמה נלקח — ואז כמה נשאר.',
    brackets: 'מה שבתוך הסוגריים הוא הפזמון: הוא חוזר בשלמותו, ומחיאת המוביל פותחת כל חזרה. במתמטיקה סיכמנו שכפל קודם לחיבור — הפזמון מראה למה זה נוח.',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    const how = spec.kind === 'twoStep' && spec.then === 'from' ? HOW.twoStepFrom : HOW[spec.kind];
    const legend = spec.jumps ? (spec.hundreds ? LEGEND.jumps3 : LEGEND.jumps2) : '';
    return '<div class="jump-line">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + (legend ? '<p class="jl-legend">' + esc(legend) + '</p>' : '')
      + '<p class="band-note">' + esc(how) + '</p>'
      + (revealed
        ? '<p class="band-predict jl-silent">עכשיו בלי צליל: אמרו במילים מה עשיתם, ואז כתבו בספרות — על ישר מספרים ריק או בתרגיל.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו וספרו.</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, WORLDS: WORLDS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html };
});
