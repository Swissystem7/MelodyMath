// MelodyMath — SenseSix: estimation and the circle, heard (grade ו׳; tags
// roundToGroup, shortenNote, quarterCount, roundBars, piBarsAround).
// Research: docs/research/sense-six-2026-11-13.md (Perplexity + Meta AI).
//
// Meta AI: a package counted as "one" is worth 100 or 1000 — what one sound is
// worth must be heard first. Perplexity: estimating the size, checking that an
// answer is possible, and verifying it exactly are three different tasks — an
// estimate can rule an answer out, but agreeing with it proves nothing.
//   packages (inspired by the gamelan, each player one tone): a deep gong is a
//     thousand, a middle gong a hundred, a bell ten, a tick one — declared in
//     words before anything is played.
//   a bound — even the rounded-down numbers already pass the limit.
//   a check — the dividend in packages, then the divisor times a round anchor;
//     if the anchor product is already too small (or too big) the answer is
//     ruled out; otherwise the rest is added and checked exactly.
//   a fraction multiplier — a round (canon): the same phrase at the same tempo,
//     only part of it (shorter, never quieter or faster); dividing by a quarter
//     is counting how many quarter-phrases fit.
//   the circle — dabke (a line dance) for the straight diameter, the hora circle
//     for walking around: three diameter strides and a small tick that is less
//     than a stride (π is "a bit more than 3", never 3 and never 4); area in
//     cajón blocks of r × r: three blocks and a bit.
// Never more than 12 sounds in a row; the widget shows only when the sounds
// (with the numbers in the text) give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_SENSE_SIX = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['roundToGroup', 'shortenNote', 'quarterCount', 'roundBars', 'piBarsAround', 'sectorAsNote']);
  const MAX_RUN = 12;
  const MAX_EVENTS = 44;
  const STEP = 0.28, GAP = 0.8;
  const PI = 3.14;
  const r2 = (x) => Math.round(x * 100) / 100;

  const WORLDS = Object.freeze({
    gamelan: { he: 'בהשראת הגמלאן', why: 'אנסמבל מבאלי ומג׳אווה שבו כל נגן מחזיק צליל אחד. כאן כל צליל הוא חבילה: הגונג העמוק ביותר הוא עשרת אלפים, גונג עמוק הוא אלף, גונג אמצעי הוא מאה, פעמון הוא עשר, ונקישה היא אחד' },
    canon: { he: 'שיר סבב (קאנון)', why: 'אותו משפט, באותו קצב — רק החלק שאומרים לנגן. קצר יותר — אבל באותה עוצמה ובאותה מהירות' },
    circle: { he: 'דבקה והורה', why: 'דבקה היא ריקוד שורה — קו ישר, כמו הקוטר. הורה היא ריקוד מעגל — הליכה סביב, כמו ההיקף' },
    cajon: { he: 'קחון', why: 'תוף ארגז: מכה עמוקה מכסה גוש אחד — ריבוע שצלעו הרדיוס' },
    circleParts: { he: 'דבקה והורה', why: 'דבקה היא ריקוד שורה — צעד בקו ישר. הורה היא ריקוד מעגל — צעד לאורך המעגל. גונג הוא המרכז, ומחיאת כף היא נקודה על המעגל' },
  });

  const PKG = [[10000, 'gong', 55, 'עשרת אלפים'], [1000, 'gong', 82, 'אלף'], [100, 'gong', 165, 'מאה'], [10, 'metalBell', 1047, 'עשר'], [1, 'woodClick', 1800, 'אחד']];

  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const p = String(item.prompt || '').trim();
    const raw = String(item.answer).trim();
    const num = (x) => +String(x).replace(/,/g, '');
    let m, s = null;
    if ((m = /^בלי לחשב במדויק: האם (\d+) × (\d+) קטן מ־([\d,]+)\? \(כן\/לא\)$/.exec(p))) {
      const a = +m[1], b = +m[2], lim = num(m[3]);
      const fa = Math.floor(a / 10) * 10, fb = Math.floor(b / 10) * 10, lo = fa * fb;
      if (lo >= lim && lo % 100 === 0 && lim % 100 === 0 && fa / 10 <= 9 && fb / 10 <= 9) s = { kind: 'bound', rows: fa / 10, per: fb / 10, limit: lim / 100, value: 'לא', world: WORLDS.gamelan };
    } else if ((m = /^בלי לחשב במדויק: האם ([\d,]+) : (\d+) = (\d+) נכון\? \(כן\/לא\)$/.exec(p))) {
      const D = num(m[1]), k = +m[2], c = +m[3];
      const r = Math.round(c / 100) * 100, P = k * r;
      let verdict, stage;
      if (c <= r && P < D) { verdict = 'לא'; stage = 'tooSmall'; } else if (c >= r && P > D) { verdict = 'לא'; stage = 'tooBig'; } else { verdict = k * c === D ? 'כן' : 'לא'; stage = 'exact'; }
      s = { kind: 'check', D: D, k: k, c: c, anchor: r, product: P, rest: k * (c - r), how: stage, value: verdict, world: WORLDS.gamelan };
    } else if ((m = /^בלי לחשב במדויק: ([\d,]+) : (\d+) קרוב ביותר ל־([\d,]+), ל־([\d,]+) או ל־([\d,]+)\?/.exec(p))) {
      const D = num(m[1]), k = +m[2], opts = [num(m[3]), num(m[4]), num(m[5])];
      const anchor = Math.round(D / 1000 / k) * k * 1000;        // a dividend k divides nicely
      const share = anchor / k;
      const best = opts.reduce((a, b) => (Math.abs(b - D / k) < Math.abs(a - D / k) ? b : a));
      if (share === best && anchor / 10000 <= 9) s = { kind: 'magnitude', anchor: anchor, k: k, share: share, value: best, world: WORLDS.gamelan };
    } else if ((m = /^בלי לחשב: האם (\d)\/(\d) × (\d)\/(\d) קטן מ־(\d)\/(\d)\? \(כן\/לא\)$/.exec(p))) {
      const part = +m[3], whole = +m[4];
      if (whole <= MAX_RUN) s = { kind: 'partOf', whole: whole, part: part, value: part < whole ? 'כן' : 'לא', world: WORLDS.canon };
    } else if ((m = /^בלי לחשב: האם (\d+) : 1\/(\d) גדול מ־(\d+)\? \(כן\/לא\)$/.exec(p))) {
      const n = +m[1], q = +m[2];
      s = { kind: 'fit', n: n, q: q, value: n * q > +m[3] ? 'כן' : 'לא', world: WORLDS.canon };
    } else if ((m = /^האם כפל תמיד מגדיל\? האם (\d+) × 1\/2 גדול מ־(\d+)\? \(כן\/לא\)$/.exec(p))) {
      const n = +m[1];
      if (n % 2 === 0) s = { kind: 'half', n: n, value: n / 2 > +m[2] ? 'כן' : 'לא', world: WORLDS.canon };
    } else if ((m = /^בלי לחשב במדויק: (\d) ו־(\d)\/(\d) × (\d) קרוב ביותר ל־(\d+), ל־(\d+) או ל־(\d+)\?$/.exec(p))) {
      const w = +m[1], a = +m[2], d = +m[3], k = +m[4], opts = [+m[5], +m[6], +m[7]];
      const exact = (w + a / d) * k, best = opts.reduce((x, y) => (Math.abs(y - exact) < Math.abs(x - exact) ? y : x));
      if (d <= 8 && w <= 3 && k <= 6) s = { kind: 'almost', whole: w, a: a, d: d, k: k, value: best, world: WORLDS.canon };
    } else if ((m = /^אומדן: (\d+)\/(\d+) \+ (\d+)\/(\d+) קרוב יותר ל־(\d) או ל־(\d)\? כתבו את המספר\.$/.exec(p))) {
      // two bars, each with a tick or two missing: together almost two wholes
      const bars = [[+m[1], +m[2]], [+m[3], +m[4]]], sum = bars.reduce((x, [a, d]) => x + a / d, 0), o = [+m[5], +m[6]];
      if (bars.every(([a, d]) => d <= 13 && a < d && a <= MAX_RUN)) s = { kind: 'almostSum', bars: bars, value: Math.abs(sum - o[0]) < Math.abs(sum - o[1]) ? o[0] : o[1], world: WORLDS.canon };
    } else if ((m = /^קוטר המעגל (\d+) ס״מ\. מה (?:היקפו|ההיקף) בס״מ\? \(π ≈ 3\.14\)$/.exec(p))) {
      const d = +m[1];
      if (d % 10 === 0) s = { kind: 'around', d: d, unit: 10, value: r2(PI * d), world: WORLDS.circle };
    } else if ((m = /^רדיוס המעגל (\d+) ס״מ\. מה ההיקף בס״מ\? \(π ≈ 3\.14\)$/.exec(p))) {
      // the diameter is two radii through the centre; then around: three diameters and a bit
      const r = +m[1];
      s = { kind: 'around', d: 2 * r, unit: r, fromRadius: true, value: r2(PI * 2 * r), world: WORLDS.circle };
    } else if ((m = /^היקף המעגל ([\d.]+) ס״מ\. מה (הקוטר|הרדיוס) בס״מ\? \(π ≈ 3\.14\)$/.exec(p))) {
      const C = +m[1], d = r2(C / PI), toRadius = m[2] === 'הרדיוס';
      if (Number.isInteger(d)) s = { kind: 'around', d: d, unit: d, back: true, toRadius: toRadius, value: toRadius ? d / 2 : d, world: WORLDS.circle };
    } else if ((m = /^רדיוס (?:מעגל הקווינטות|המעגל) (\d+) ס״מ\. מה הקוטר בס״מ\?$/.exec(p))) {
      s = { kind: 'diameter', r: +m[1], value: 2 * +m[1], world: WORLDS.circle };
    } else if ((m = /^ארבעה עיגולים חופפים ברדיוס ([\d.]+) ס״מ צמודים זה לזה בתוך ריבוע, שניים בכל שורה\. מה אורך צלע הריבוע בס״מ\?$/.exec(p))) {
      s = { kind: 'circlesRow', r: +m[1], n: 2, value: r2(4 * +m[1]), world: WORLDS.circle };
    } else if ((m = /^איך נקרא (.+)\?$/.exec(p)) && item.music === 'sectorAsNote') {
      // naming the parts of a circle: the centre is a gong, a point on the circle a clap, a straight stride
      // is dabke, a step along the circle is hora — the child hears the path and names it
      const NAMES = [
        [/^קטע שמחבר את מרכז המעגל לנקודה על המעגל$/, ['center', 'straight', 'point'], 'רדיוס'],
        [/^המיתר הארוך ביותר במעגל$/, ['point', 'straight', 'center', 'straight', 'point'], 'קוטר'],
        [/^קטע שמחבר שתי נקודות על המעגל$/, ['point', 'straight', 'point'], 'מיתר'],
        [/^החלק של המעגל שבין שתי נקודות עליו$/, ['point', 'along', 'along', 'along', 'point'], 'קשת'],
        [/^החלק של העיגול שבין שני רדיוסים לקשת שביניהם$/, ['center', 'straight', 'point', 'along', 'along', 'along', 'point', 'straight', 'center'], 'גזרה'],
      ];
      const hit = NAMES.find(([re]) => re.test(m[1]));
      if (hit) s = { kind: 'name', path: hit[1], value: hit[2], world: WORLDS.circleParts };
    } else if ((m = /^רדיוס העיגול (\d+) (ס״מ|מ׳)\. מה (שטחו|שטח חצי העיגול) ב(?:סמ״ר|מ״ר)\? \(π ≈ 3\.14\)$/.exec(p))) {
      const r = +m[1], half = /חצי/.test(m[3]);
      s = { kind: 'blocks', r: r, half: half, value: r2(PI * r * r / (half ? 2 : 1)), world: WORLDS.cajon };
    } else if (/^מגדילים את רדיוס העיגול פי 2\. פי כמה גדל השטח\?$/.test(p)) {
      s = { kind: 'grow', value: 4, world: WORLDS.cajon };
    }
    if (!s || String(s.value) !== raw) return null;   // the sounds give exactly the answer
    s.answer = String(s.value);
    const ev = soundEvents(s);
    if (!ev.length || longestRun(ev) > MAX_RUN || ev.length > MAX_EVENTS) return null;
    return s;
  }
  function specForItem(item) { return plan(item); }

  function longestRun(ev) {
    let best = 0, run = 0, last = -9;
    [...new Set(ev.map((e) => Math.round(e.at * 1000)))].sort((a, b) => a - b).forEach((ms) => {
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
    // a number as packages: thousands, hundreds, tens, ones — a short silence between kinds
    const packages = (n, stage, extra) => {
      let rest = n;
      PKG.forEach(([w, voice, hz]) => {
        const c = Math.floor(rest / w); rest -= c * w;
        for (let i = 0; i < c; i++) { hit(voice, hz, w >= 100 ? 0.5 : 0.12, 0.24, stage, Object.assign({ worth: w }, extra)); t += w >= 100 ? 0.4 : STEP; }
        if (c) t += 0.35;
      });
      t += GAP;
    };
    switch (spec.kind) {
      case 'bound':
        // the limit: one deep gong opens into hundreds; then even the rounded-down numbers, row by row
        hit('gong', 82, 0.6, 0.26, 'limitGong'); t += 0.8;
        for (let i = 0; i < spec.limit; i++) { hit('gong', 165, 0.3, 0.2, 'limit', { worth: 100 }); t += 0.38; if (i % 5 === 4) t += 0.3; }
        t += GAP;
        for (let r = 0; r < spec.rows; r++) { for (let i = 0; i < spec.per; i++) { hit('metalBell', 784, 0.3, 0.22, 'bound', { row: r, worth: 100 }); t += 0.38; } t += 0.45; }
        break;
      case 'check':
        packages(spec.D, 'dividend');
        packages(spec.product, 'anchorProduct');
        if (spec.how === 'exact' && spec.rest) packages(spec.rest, 'restProduct');
        break;
      case 'magnitude':
        packages(spec.anchor, 'dividend', { scale: 'big' });
        hit('shaker', 400, 0.3, 0.1, 'share'); t += 0.5;
        packages(spec.share, 'oneShare');
        break;
      case 'partOf': {
        const phrase = [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319, 1397, 1568];
        for (let i = 0; i < spec.whole; i++) { hit('voiceAh', phrase[i], 0.2, 0.2, 'whole'); t += STEP; } t += GAP;
        for (let i = 0; i < spec.part; i++) { hit('voiceAh', phrase[i], 0.2, 0.2, 'part'); t += STEP; }
        break;
      }
      case 'fit':
        for (let i = 0; i < spec.n; i++) { hit('drumLow', 98, 0.4, 0.24, 'whole'); t += 0.5; } t += GAP;
        for (let w = 0; w < spec.n; w++) { for (let i = 0; i < spec.q; i++) { hit('woodClick', 1500, 0.05, 0.2, 'quarter', { whole: w }); t += STEP; } t += 0.4; }
        break;
      case 'half':
        for (let i = 0; i < spec.n; i++) { hit('drumLow', 98, 0.4, 0.24, 'whole'); t += 0.5; } t += GAP;
        for (let i = 0; i < spec.n / 2; i++) { hit('drumLow', 98, 0.4, 0.24, 'halfOf'); t += 0.5; }
        break;
      case 'almostSum':
        // each bar with its missing ticks silent; a deep stroke closes each bar
        spec.bars.forEach(([a, d], b) => { for (let i = 0; i < d; i++) { if (i < a) hit('woodClick', 1500, 0.05, 0.18, 'tick', { bar: b }); t += 0.2; } hit('drumLow', 110, 0.35, 0.24, 'barEnd', { bar: b }); t += GAP; });
        break;
      case 'almost':
        // whole bars of d ticks, then a bar with one tick missing (silence is silence), then k copy strokes
        for (let b = 0; b < spec.whole; b++) { for (let i = 0; i < spec.d; i++) { hit('woodClick', 1500, 0.05, 0.18, 'tick', { bar: b }); t += 0.2; } t += 0.4; }
        for (let i = 0; i < spec.d; i++) { if (i < spec.a) hit('woodClick', 1500, 0.05, 0.18, 'tick', { bar: spec.whole }); t += 0.2; }
        t += GAP;
        for (let c = 0; c < spec.k; c++) { hit('drumLow', 110, 0.35, 0.24, 'copy'); t += 0.5; }
        break;
      case 'around': {
        const strides = spec.back ? 1 : spec.d / spec.unit;
        for (let i = 0; i < strides; i++) {                                                              // the straight diameter (dabke)
          hit('stomp', 90, 0.3, 0.26, spec.fromRadius ? 'radius' : 'diameter'); t += 0.45;
          if (spec.fromRadius && i === 0) { hit('gong', 196, 0.4, 0.2, 'center'); t += 0.5; }           // two radii meet at the centre
        }
        t += GAP;
        for (let k = 0; k < 3; k++) { for (let i = 0; i < strides; i++) { hit('drumLow', 110, 0.3, 0.24, 'around', { lap: k }); t += 0.45; } t += 0.3; }
        hit('woodClick', 2200, 0.04, 0.16, 'bit');                                                        // a bit more — less than a stride
        if (spec.toRadius) { t += GAP; hit('gong', 196, 0.4, 0.2, 'center'); t += 0.5; hit('stomp', 90, 0.3, 0.26, 'radius'); t += 0.45; }   // half of it, from the centre
        break;
      }
      case 'diameter':
        hit('stomp', 90, 0.3, 0.26, 'radius'); t += 0.45; hit('gong', 196, 0.4, 0.2, 'center'); t += 0.5; hit('stomp', 90, 0.3, 0.26, 'radius');
        break;
      case 'circlesRow':
        // across the square: each circle is a radius, its centre, a radius
        for (let c = 0; c < spec.n; c++) { hit('stomp', 90, 0.3, 0.26, 'radius', { c: c }); t += 0.45; hit('gong', 196, 0.4, 0.2, 'center', { c: c }); t += 0.5; hit('stomp', 90, 0.3, 0.26, 'radius', { c: c }); t += 0.6; }
        break;
      case 'name': {
        const SND = { center: ['gong', 196, 0.4, 0.5], point: ['clap', 1000, 0.1, 0.45], straight: ['stomp', 90, 0.3, 0.45], along: ['drumLow', 110, 0.3, 0.45] };
        spec.path.forEach((step, i) => { const v = SND[step]; hit(v[0], v[1], v[2], 0.22, step, { i: i }); t += v[3]; });
        break;
      }
      case 'blocks':
        hit('drumLow', 82, 0.5, 0.26, 'rBlock'); t += 0.7 + GAP;                                         // one block: r × r
        for (let i = 0; i < 3; i++) { hit('drumLow', 82, 0.5, 0.26, 'circleBlock'); t += 0.6; }
        hit('woodClick', 2200, 0.04, 0.16, 'bit'); t += 0.4;
        if (spec.half) { t += GAP; hit('drumLow', 82, 0.5, 0.26, 'halfBlock'); t += 0.6; hit('drumLow', 82, 0.25, 0.2, 'halfBlockHalf'); t += 0.4; hit('woodClick', 2200, 0.04, 0.12, 'halfBit'); }
        break;
      case 'grow':
        hit('drumLow', 82, 0.5, 0.26, 'small'); t += 0.7 + GAP;
        for (let r = 0; r < 2; r++) { for (let c = 0; c < 2; c++) { hit('drumLow', 82, 0.5, 0.26, 'big', { r: r }); t += 0.6; } t += 0.3; }
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
  const HOW = {
    bound: 'כל צליל כאן הוא מאה. קודם הגבול: גונג עמוק אחד נפתח למאות שלו. אחר כך מעגלים את שני המספרים למטה — ואת המכפלה שורה אחר שורה. גם המעוגלים למטה כבר עוברים את הגבול?',
    check: 'קודם המספר שמחלקים, בחבילות. אחר כך המחלק כפול מספר עגול שקרוב לתשובה. אם כבר זה קטן מדי — או גדול מדי — התשובה נפסלת. אם קרוב, מוסיפים את מה שנשאר ובודקים במדויק. אומדן יכול לפסול, אבל רק בדיקה מוכיחה.',
    magnitude: 'קודם מספר עגול שקרוב למספר שמחלקים, בחבילות. אחר כך — חלק אחד. כמה חבילות גדולות בחלק? מזה יודעים את סדר הגודל.',
    partOf: 'קודם המשפט השלם, ואחריו רק החלק שהשבר אומר — באותו קצב. קצר יותר או ארוך יותר?',
    fit: 'קודם השלמים. אחר כך כל שלם מתפרק לרבעים. כמה רבעים נכנסים — יותר או פחות מהשלמים?',
    half: 'קודם השלמים, ואחר כך חצי מהם. יותר או פחות?',
    almostSum: 'כל שבר הוא תיבה שחסר בה מעט — שקט במקום הנקישות החסרות — ומכה עמוקה סוגרת אותה. כמה תיבות כמעט מלאות שמעתם?',
    almost: 'תיבות מלאות, ואחריהן תיבה שחסרה בה נקישה אחת — כמעט מלאה. אחר כך מכה לכל עותק. בערך כמה שלמים בכל עותק?',
    around: 'צעדי הדבקה הם הקוטר — קו ישר. אחר כך הולכים סביב במעגל ההורה: שלוש פעמים קוטר, ועוד נקישה קטנה — קצת, פחות מצעד. פאי הוא קצת יותר משלוש.',
    aroundRadius: 'צעד דבקה, הגונג של המרכז, ועוד צעד — שני רדיוסים הם קוטר. אחר כך הולכים סביב במעגל ההורה: שלוש פעמים קוטר, ועוד נקישה קטנה. פאי הוא קצת יותר משלוש.',
    aroundToRadius: 'סביב במעגל ההורה: שלוש פעמים קוטר ועוד נקישה קטנה. אחר כך — מהגונג של המרכז, צעד אחד בלבד: חצי מהקוטר.',
    diameter: 'צעד דבקה מהקצה, הגונג של המרכז, ועוד צעד עד הקצה השני.',
    circlesRow: 'חוצים את הריבוע: בכל עיגול צעד, הגונג של המרכז שלו, ועוד צעד.',
    name: 'הקשיבו לדרך: מאיפה מתחילים, איך הולכים — בקו ישר או לאורך המעגל — ואיפה נגמרים.',
    blocks: 'מכה אחת היא גוש: ריבוע שצלעו הרדיוס. העיגול הוא שלושה גושים ועוד קצת.',
    grow: 'גוש אחד; אחריו — כשהרדיוס גדל פי שניים — הגושים בשתי שורות של שניים. כמה גושים?',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    return '<div class="sense-six">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc((spec.fromRadius ? HOW.aroundRadius : spec.toRadius ? HOW.aroundToRadius : HOW[spec.kind]) + (spec.kind === 'blocks' && spec.half ? ' ואז — חצי מזה.' : '')) + '</p>'
      + (revealed
        ? '<p class="band-predict ss-silent">עכשיו בלי צליל: כתבו את האומדן במספרים עגולים, ובדקו אם התשובה בתוך הטווח.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו: כמה שווה צליל אחד?</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, WORLDS: WORLDS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html };
});
