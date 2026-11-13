// MelodyMath — EarlyBeats: early number through steady and accented beats,
// grades א׳–ב׳ (nextBeat, countDownBeats, accentSkip, tenBeatBars,
// callResponse, twoDrums, tenThenMore; mechanisms M1/M2). Research:
// docs/research/early-beats-2026-11-13.md (Perplexity + Meta AI).
//
// One sound for one meaning, one world per exercise, never more than 12
// sounds in a row (Meta AI):
//   next / previous — a counting rhyme in one voice: the start is a long
//     "home" sound, then one step up or down.
//   counting back — a tof: a strong start (not a step), then steps down.
//   skip counting — groups with an accent on each said number; tens are one
//     low tom each.
//   tens and ones — a tombak: tom (low) = a group of ten, bak (high) = one.
//     The child first hears ten baks gather into one tom.
//   counting on — a xylophone: the first addend is ONE long home sound (so it
//     is never counted again), a short silence, then one step per unit.
//   compare — body percussion: stomp and clap side by side, beat by beat;
//     the beats one side plays alone are the difference.
//   three addends — a darbuka: dum, tak and ka, one sound per addend.
// Clapping games are named by what the body does, not by a tradition the app
// cannot cite (Meta AI: bring a real game with credit, or do not name one).
// The widget shows only when the sounds give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_EARLY_BEATS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['nextBeat', 'countDownBeats', 'accentSkip', 'tenBeatBars', 'callResponse', 'twoDrums', 'tenThenMore']);
  const MAX_RUN = 12;
  const STEP = 0.32;
  const HOME = 0.7;
  const SCALE = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784, 880];

  const WORLDS = Object.freeze({
    rhyme: { he: 'חרוז ספירה בקול', a: 'voiceAh', why: 'הקול עצמו הוא הכלי: מה בא אחרי, ומה בא לפני' },
    tof: { he: 'תוף תימני', a: 'frameDrum', why: 'מכה חזקה היא נקודת ההתחלה — לא צעד — ואחריה צעדים קצרים' },
    pairs: { he: 'מחיאות בזוגות', a: 'clap', b: 'stomp', why: 'הגוף סופר בזוגות, ורקיעה סוגרת כל זוג' },
    hands: { he: 'כף יד וכפיים', a: 'clap', b: 'stomp', why: 'כף אחת היא חמש אצבעות, ורקיעה סוגרת כל חמישייה' },
    tombak: { he: 'טומבק פרסי', a: 'drumHigh', b: 'drumLow', why: 'לטומבק שני צלילים אמיתיים: תום נמוך הוא קבוצה של עשר, בק גבוה הוא אחד. כאן נמוך לא אומר קטן — נמוך אומר עשר' },
    xylophone: { he: 'קסילופון', a: 'woodBar', why: 'צליל ארוך אחד הוא המספר הראשון, ואחריו צעד לכל אחד שמוסיפים' },
    body: { he: 'כלי גוף', a: 'stomp', b: 'clap', why: 'רקיעות מול מחיאות, פעימה מול פעימה: מה שנשאר לבד הוא ההפרש' },
    darbuka: { he: 'דרבוקה', a: 'drumLow', b: 'drumHigh', c: 'woodClick', why: 'שלושה צלילים אמיתיים בכלי אחד — דום, טק, קה — צליל לכל מחובר' },
  });

  const nums = (s) => (String(s || '').match(/\d+/g) || []).map(Number);
  function ansOf(v) { const n = Number(v); return Number.isInteger(n) ? n : null; }

  // Reads the item into a listening plan, or null.
  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const p = String(item.prompt || ''), ans = ansOf(item.answer);
    if (ans == null) return null;
    let m, s = null;
    if ((m = /^(\d+), ואז המספר הבא\?/.exec(p))) s = { kind: 'step', from: +m[1], dir: 1, value: +m[1] + 1, world: WORLDS.rhyme };
    else if ((m = /^המספר שלפני (\d+)\?/.exec(p))) s = { kind: 'step', from: +m[1], dir: -1, value: +m[1] - 1, world: WORLDS.rhyme };
    else if ((m = /ספירה אחורה: (\d+), (\d+), (\d+), \?/.exec(p)) && +m[1] - +m[2] === 1 && +m[2] - +m[3] === 1) {
      s = { kind: 'back', from: +m[1], steps: 3, value: +m[3] - 1, world: WORLDS.tof };
    } else if (/דילוג|מקצב דילוגי|ספירה אחורה במקצב|בדילוגי|בעשרות|מקצב עשרות/.test(p) && (m = /(\d+), (\d+), (\d+)(?:, (\d+))?, \?/.exec(p))) {
      const seq = [m[1], m[2], m[3], m[4]].filter(Boolean).map(Number), d = seq[1] - seq[0];
      if (!seq.every((x, i) => i === 0 || x - seq[i - 1] === d) || ![2, -2, 5, 10].includes(d)) return null;
      s = { kind: 'skip', seq: seq, d: d, value: seq[seq.length - 1] + d, world: d === 10 ? WORLDS.tombak : Math.abs(d) === 2 ? WORLDS.pairs : WORLDS.hands };
    } else if ((m = /^(\d+) קבוצות של 10(?: ועוד (\d+))? — כמה זה\?/.exec(p))) {
      s = { kind: 'tens', tens: +m[1], ones: +(m[2] || 0), value: +m[1] * 10 + +(m[2] || 0), world: WORLDS.tombak };
    } else if ((m = /כמה קבוצות של 10 יש ב־(\d+)\?/.exec(p))) {
      s = { kind: 'tens', tens: Math.floor(+m[1] / 10), ones: +m[1] % 10, value: Math.floor(+m[1] / 10), ask: 'tens', world: WORLDS.tombak };
    } else if ((m = /יש (\d+)\. כמה נשאר אחרי קיבוץ לעשרות/.exec(p))) {
      s = { kind: 'tens', tens: Math.floor(+m[1] / 10), ones: +m[1] % 10, value: +m[1] % 10, ask: 'ones', world: WORLDS.tombak };
    } else if ((m = /מ־(\d+), כמה חסר לעשר הבאה/.exec(p))) {
      const n = +m[1]; s = { kind: 'tens', tens: Math.floor(n / 10), ones: n % 10, missing: 10 - (n % 10), value: 10 - (n % 10), ask: 'missing', world: WORLDS.tombak };
    } else if (item.music === 'tenThenMore' && (m = /^([\d\s+]+)=\s*\?/.exec(p))) {
      const parts = nums(m[1]);
      if (parts.length < 3 || parts.length > 4) return null;
      s = { kind: 'parts', parts: parts, value: parts.reduce((a, b) => a + b, 0), world: WORLDS.darbuka };
    } else if (/בכמה .*יותר|כמה .* צריך .* כדי שיהיו לו כמו/.test(p)) {
      const ns = nums(p);
      if (ns.length !== 2) return null;
      s = { kind: 'compare', a: Math.max(ns[0], ns[1]), b: Math.min(ns[0], ns[1]), value: Math.abs(ns[0] - ns[1]), world: WORLDS.body };
    } else if ((m = /^(\d+) \+ (\d+) = \?$/.exec(p)) || (item.music === 'callResponse' && /עוד|ו־\d+|הצטרפו/.test(p) && nums(p).length === 2 && (m = [null].concat(nums(p))))) {
      const x = +m[1], y = +m[2];
      // counting on starts from the bigger number: the order does not change the sum
      s = { kind: 'countOn', a: Math.max(x, y), b: Math.min(x, y), swapped: x < y, value: x + y, world: WORLDS.xylophone };
    } else if ((m = /^10 - (\d+) = \?$/.exec(p))) {
      s = { kind: 'compare', a: 10, b: +m[1], value: 10 - +m[1], world: WORLDS.body, takeFromTen: true };
    }
    if (!s || s.value !== ans) return null;   // the sounds give exactly the answer
    // never more than MAX_RUN sounds in a row (groups are split by a short
    // silence), and a short listen overall
    const run = s.kind === 'countOn' ? s.b : s.kind === 'compare' ? s.a : s.kind === 'parts' ? Math.max.apply(null, s.parts)
      : s.kind === 'tens' ? Math.max(s.tens, s.ones + (s.missing || 0)) : s.kind === 'skip' ? (s.d === 10 ? 1 : Math.abs(s.d)) : 1;
    const total = s.kind === 'parts' ? s.value : s.kind === 'skip' ? (s.d === 10 ? 1 : Math.abs(s.d)) * s.seq.length : 0;
    if (run > MAX_RUN || total > (s.kind === 'parts' ? 15 : 20)) return null;
    s.answer = String(s.value);
    return s;
  }
  function specForItem(item) { return plan(item); }

  // ---------------------------------------------------------------- sound
  function soundEvents(spec) {
    if (!spec) return [];
    const ev = [], w = spec.world;
    let t = 0;
    const hit = (voice, hz, dur, gain, stage, extra) => { ev.push(Object.assign({ at: t, voice: voice, hz: hz, dur: dur, gain: gain, stage: stage }, extra || {})); };
    if (spec.kind === 'step' || spec.kind === 'back') {
      hit(w.a, SCALE[6], HOME, 0.26, 'home');            // the start: a long sound, not a step
      t += HOME + 0.25;
      const n = spec.kind === 'step' ? 1 : spec.steps;
      const dir = spec.kind === 'step' ? spec.dir : -1;
      for (let i = 1; i <= n; i++) { hit(w.a, SCALE[6 + dir * i], 0.18, 0.22, 'step', { step: i }); t += STEP; }
      return ev;
    }
    if (spec.kind === 'skip') {
      // The first number is an anchor, not a group (Perplexity). Then one group
      // per jump: quiet unit beats, and the accent lands ON the number reached.
      const k = Math.abs(spec.d), groups = spec.seq.length;
      hit(w.b, 196, HOME, 0.26, 'home', { accent: true });
      t += HOME + 0.25;
      for (let g = 1; g <= groups; g++) {
        const stage = g === groups ? 'answerGroup' : 'group';
        if (k === 10) { hit(w.b, 98, 0.35, 0.3, stage, { group: g, accent: true }); t += STEP * 1.4; continue; }
        for (let i = 1; i <= k; i++) {
          const acc = i === k;
          hit(acc ? w.b : w.a, acc ? 196 : 523, 0.1, acc ? 0.28 : 0.1, stage, { group: g, accent: acc });
          t += STEP * 0.7;
        }
        t += 0.25;
      }
      return ev;
    }
    if (spec.kind === 'tens') {
      // the grouping first: ten baks gather into one tom
      for (let i = 0; i < 10; i++) { hit(w.a, 523, 0.06, 0.12, 'gather'); t += 0.12; }
      hit(w.b, 98, 0.4, 0.3, 'gatherTom'); t += 0.9;
      for (let i = 0; i < spec.tens; i++) { hit(w.b, 98, 0.35, 0.3, 'tom', { i: i }); t += STEP * 1.3; }
      t += 0.2;
      for (let i = 0; i < spec.ones; i++) { hit(w.a, 523, 0.1, 0.2, 'bak', { i: i }); t += STEP; }
      if (spec.missing) {
        // the missing baks are quiet ghosts, and the next ten closes with a tom
        t += 0.3;
        for (let i = 0; i < spec.missing; i++) { hit(w.a, 523, 0.1, 0.05, 'missing', { i: i }); t += STEP; }
        hit(w.b, 98, 0.4, 0.3, 'closeTen');
      }
      return ev;
    }
    if (spec.kind === 'countOn') {
      hit(w.a, SCALE[0], STEP * 2, 0.26, 'home');   // ONE long sound (two steps long) for the first addend
      t += STEP * 2 + 0.3;                         // a short silence before the steps
      for (let i = 1; i <= spec.b; i++) { hit(w.a, SCALE[Math.min(i, SCALE.length - 1)], 0.16, 0.22, 'step', { step: i }); t += STEP; }
      return ev;
    }
    if (spec.kind === 'compare') {
      for (let i = 0; i < spec.a; i++) {
        hit(w.a, 196, 0.12, 0.24, i < spec.b ? 'pair' : 'alone', { i: i, row: 'a' });
        if (i < spec.b) hit(w.b, 523, 0.1, 0.2, 'pair', { i: i, row: 'b' });
        t += STEP;
      }
      return ev;
    }
    if (spec.kind === 'parts') {
      const voices = [w.a, w.b, w.c, w.a];
      spec.parts.forEach((n, j) => { for (let i = 0; i < n; i++) { hit(voices[j], [196, 392, 1200, 262][j], 0.1, 0.22, 'part', { part: j }); t += STEP; } t += 0.3; });
      return ev;
    }
    return ev;
  }

  // mode 'fade': only the accents stay, in their places — the quiet unit beats
  // are gone and the child keeps them inside (build → fade → silence).
  function eventsFor(spec, mode) {
    const all = soundEvents(spec);
    return mode === 'fade' ? all.filter((n) => n.accent) : all;
  }

  function play(spec, env, mode) {
    const e = env || {};
    const events = eventsFor(spec, mode);
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
    step: 'הצליל הארוך הוא המספר שמתחילים ממנו — הוא לא נספר. אחריו צעד אחד.',
    back: 'המכה החזקה היא נקודת ההתחלה, לא צעד. סופרים את הצעדים אחורה.',
    skip: 'המספר הראשון הוא צליל ארוך — עוגן, לא קבוצה. אומרים מספר רק ברקיעה.',
    tens: 'קודם שומעים עשרה צלילים קטנים מתקבצים לתום אחד. אחר כך: כל תום הוא עשר, כל בק הוא אחד.',
    countOn: 'הצליל הארוך הוא המספר הראשון — שמים אותו בראש ולא סופרים אותו שוב. אחרי שקט קצר: צעד לכל אחד שמוסיפים.',
    compare: 'רקיעה ומחיאה יחד, פעימה מול פעימה. מה שנשמע לבד בסוף — זה ההפרש.',
    parts: 'כל מחובר בצליל משלו: דום, טק, קה. סופרים את כולם יחד.',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    return '<div class="early-beats">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '. ' + HOW[spec.kind]
        + (spec.swapped ? ' כאן מתחילים מהמספר הגדול — הסדר לא משנה את הסכום.' : '')
        + (spec.missing ? ' הצלילים השקטים הם מה שחסר, ותום סוגר את העשר הבאה.' : '')) + '</p>'
      + (revealed
        ? '<p class="band-predict eb-silent">עכשיו בלי צליל: בדקו על ציר המספרים או עם קוביות — כמה צעדים, ואיפה עצרנו?</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו וספרו.</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (spec.kind === 'skip' && Math.abs(spec.d) !== 10 ? '<button type="button" class="snd-play" data-mode="fade">▶ רק הרקיעות</button>' : '')
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, WORLDS: WORLDS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, eventsFor: eventsFor, play: play, html: html };
});
