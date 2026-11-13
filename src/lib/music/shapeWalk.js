// MelodyMath — ShapeWalk: shapes and angles, heard (grades א׳–ו׳; tags
// shapeLoop, sideCountMotif, quarterTurnBar, quarterBarCorner, turnAsBar,
// triangleMotif, parallelVoices, quadMotif, sectorAsNote).
// Research: docs/research/shape-walk-2026-11-13.md (Perplexity + Meta AI).
//
// Two listening modes, never mixed in one exercise (Meta AI: the rhythm clock
// teaches the CENTRAL angle, not the angle inside a polygon):
//   walking the shape — a hora circle: a stamp is a corner (a dancer), the
//     silence after it is a side, its length is the side's length. Equal
//     sides are equal silences. Every shape uses the same stamp — no shape has
//     a sound of its own (Perplexity: the child must check properties, not
//     recognise a sound). Parallel sides share the same walking motif;
//     a diagonal is a long crossing voice, never a stamp.
//   a turning hand — for an angle on its own: a dial (or the clock's hands)
//     turns in ticks from one ray to the other. A page corner is always played
//     first as the model, and the child compares: fewer ticks, the same, more,
//     twice as many. Degrees are counted only from grade 3.
//   the circle of fifths (grade 6) — a map from Western music theory, twelve
//     points around a circle: steps between points, folded into one octave.
// Never more than 12 sounds in a row; the widget shows only when the sounds
// give exactly the item's answer; no answer word in the picture before it.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_SHAPE_WALK = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['shapeLoop', 'sideCountMotif', 'quarterTurnBar', 'quarterBarCorner', 'turnAsBar', 'triangleMotif', 'parallelVoices', 'quadMotif', 'sectorAsNote']);
  const MAX_RUN = 12;
  const MAX_EVENTS = 40;
  const GRADE = { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6 };
  const N = { 'משולש': 3, 'ריבוע': 4, 'מלבן': 4, 'מרובע': 4, 'מחומש': 5, 'משושה': 6 };
  const NAME = { 3: 'משולש', 4: 'ריבוע', 5: 'מחומש', 6: 'משושה' };
  const SIDES = { 'מלבן': [0.9, 0.5, 0.9, 0.5] };

  const WORLDS = Object.freeze({
    hora: { he: 'מעגל הורה', why: 'ריקוד עם ישראלי במעגל: כל רוקד הוא פינה, והצעדים בין רוקד לרוקד הם צלע' },
    dial: { he: 'חוגה מסתובבת', why: 'קרן אחת עומדת, והשנייה מסתובבת ממנה בנקישות שוות' },
    clock: { he: 'מחוגי השעון', why: 'שני המחוגים נפגשים במרכז; כמה המחוג הגדול מסתובב מהשתים־עשרה' },
    fifths: { he: 'מעגל הקווינטות', why: 'מפה מתיאוריה מוזיקלית מערבית: שתים־עשרה נקודות סביב מעגל. המרחקים השווים הם בחירה של הציור' },
  });

  const CORNER_LEGEND = 'קודם שומעים את הדגם: פינת דף. אחר כך את הזווית. השוו: פחות נקישות — צרה מפינת דף; אותו מספר — בדיוק פינת דף; יותר — רחבה ממנה; כפליים — קו ישר בלי פינה.';

  const angleClass = (a) => (a < 90 ? 'חדה' : a === 90 ? 'ישרה' : a < 180 ? 'קהה' : a === 180 ? 'שטוחה' : null);
  const triClass = (as) => (as.some((a) => a === 90) ? 'ישר־זווית' : as.some((a) => a > 90) ? 'קהה־זווית' : 'חד־זווית');
  function unitFor(angles) {
    const all = angles.concat([90]);
    return [30, 15, 10, 5].find((u) => all.every((a) => a % u === 0) && Math.max.apply(null, all) / u <= MAX_RUN) || null;
  }

  // Reads the item into a listening plan, or null.
  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const p = String(item.prompt || '').trim(), g = GRADE[item.grade] || 1;
    const raw = String(item.answer).trim();
    let m, s = null;
    // ---- walking the shape
    if ((m = /^ל(משולש|ריבוע|מלבן|מחומש|משושה) יש כמה (צלעות|קודקודים)\?$/.exec(p))) {
      s = { kind: 'walk', shapes: [m[1]], value: N[m[1]], world: WORLDS.hora };
    } else if (/^לריבוע ולמלבן — לשניהם יש כמה צלעות\?$/.test(p)) {
      s = { kind: 'walk', shapes: ['ריבוע', 'מלבן'], value: 4, world: WORLDS.hora };
    } else if ((m = /צורה עם (\d+) צלעות(?: שוות)?(?: ו-\d+ קודקודים)? — איך קוראים לה\?/.exec(p))) {
      s = { kind: 'name', shapes: [NAME[+m[1]]], value: NAME[+m[1]], world: WORLDS.hora };
    } else if ((m = /(הכי מעט|הכי הרבה|יותר|פחות) (צלעות|קודקודים)/.exec(p))) {
      const listed = (p.match(/משולש|ריבוע|מלבן|מחומש|משושה/g) || []);
      if (listed.length >= 2) {
        const ns = listed.map((x) => N[x]), want = /מעט|פחות/.test(m[1]) ? Math.min.apply(null, ns) : Math.max.apply(null, ns);
        s = { kind: 'compareShapes', shapes: listed, value: listed[ns.indexOf(want)], world: WORLDS.hora };
      }
    } else if ((m = /^(\S+), (\S+) ו(\S+) — מיינו לפי מספר הצלעות מהקטן לגדול\. מה השני ברשימה\?$/.exec(p))) {
      const listed = [m[1], m[2], m[3]];
      if (listed.every((x) => N[x])) s = { kind: 'compareShapes', shapes: listed, value: listed.slice().sort((a, b) => N[a] - N[b])[1], world: WORLDS.hora };
    } else if (/^מחברים את 12 הנקודות של מעגל הקווינטות בקווים ישרים\. כמה צלעות למצולע\?$/.test(p)) {
      s = { kind: 'walk', shapes: [12], value: 12, world: WORLDS.hora };
    } else if (/^כמה זוויות ישרות יש במלבן\?$/.test(p)) {
      s = { kind: 'rightCorners', shapes: ['מלבן'], corners: [90, 90, 90, 90], value: 4, world: WORLDS.hora };
    } else if (/משולש שיש בו זווית של 90 מעלות/.test(p)) {
      s = { kind: 'triangle', corners: [90, 45, 45], value: 'ישר־זווית', world: WORLDS.hora };
    } else if (/משולש שכל שלוש זוויותיו חדות/.test(p)) {
      s = { kind: 'triangle', corners: [60, 60, 60], value: 'חד־זווית', world: WORLDS.hora };
    } else if ((m = /זוויות המשולש הן (\d+), (\d+) ו־(\d+) מעלות/.exec(p))) {
      const cs = [+m[1], +m[2], +m[3]];
      if (cs[0] + cs[1] + cs[2] === 180) s = { kind: 'triangle', corners: cs, value: triClass(cs), world: WORLDS.hora };
    } else if (/^כמה זוויות ישרות יכולות להיות לכל היותר במשולש אחד\?$/.test(p)) {
      // two right corners use up the whole half turn: nothing is left for the third corner, the triangle never closes
      s = { kind: 'triangle', corners: [90, 90, 0], maxRight: true, value: 1, world: WORLDS.hora };
    } else if (/למשולש יש בדיוק שתי צלעות שוות/.test(p)) {
      s = { kind: 'triSides', sides: [0.8, 0.8, 0.5], value: 'שווה־שוקיים', world: WORLDS.hora };
    } else if (/שני ישרים שלעולם אינם נפגשים/.test(p)) {
      s = { kind: 'rows', meet: false, value: 'מקבילים', world: WORLDS.hora };
    } else if (/במלבן, שתי צלעות שנפגשות בפינה/.test(p)) {
      s = { kind: 'rows', meet: true, value: 'מאונכות', world: WORLDS.hora };
    } else if ((m = /כמה זוגות של צלעות מקבילות יש ל(ריבוע|טרפז)\?/.exec(p))) {
      const motifs = m[1] === 'ריבוע' ? [0, 1, 0, 1] : [0, 1, 0, 2];
      s = { kind: 'parallelPairs', motifs: motifs, value: m[1] === 'ריבוע' ? 2 : 1, world: WORLDS.hora };
    } else if (/מרובע שכל צלעותיו שוות וכל זוויותיו ישרות/.test(p)) {
      s = { kind: 'quad', corners: [90, 90, 90, 90], sides: [0.7, 0.7, 0.7, 0.7], value: 'ריבוע', world: WORLDS.hora };
    } else if (/מרובע שכל ארבע צלעותיו שוות אבל זוויותיו אינן ישרות/.test(p)) {
      s = { kind: 'quad', corners: [60, 120, 60, 120], sides: [0.7, 0.7, 0.7, 0.7], value: 'מעוין', world: WORLDS.hora };
    } else if (/מרובע עם שני זוגות של צלעות מקבילות ובלי זווית ישרה/.test(p)) {
      s = { kind: 'quad', corners: [60, 120, 60, 120], sides: [0.9, 0.5, 0.9, 0.5], motifs: [0, 1, 0, 1], value: 'מקבילית', world: WORLDS.hora };
    } else if (/^כמה אלכסונים יש למרובע\?$/.test(p)) {
      s = { kind: 'diagonals', value: 2, world: WORLDS.hora };
    // ---- a turning hand
    } else if ((m = /^האם זווית של (\d+) מעלות היא זווית ישרה\? \(כן\/לא\)$/.exec(p))) {
      s = { kind: 'corner', angles: [+m[1]], value: +m[1] === 90 ? 'כן' : 'לא', world: WORLDS.dial };
    } else if (/^פינת (?:דף|שולחן)\S* \S+ — האם הזווית שם ישרה\? \(כן\/לא\)$/.test(p)) {
      s = { kind: 'corner', angles: [90], value: 'כן', world: WORLDS.dial };
    } else if ((m = /^זווית של (\d+) מעלות — חדה, ישרה, קהה או שטוחה\?$/.exec(p))) {
      s = { kind: 'corner', angles: [+m[1]], value: angleClass(+m[1]), world: WORLDS.dial };
    } else if ((m = /^בשעה (\d+):00 מחוגי השעון יוצרים זווית/.exec(p))) {
      const a = (+m[1] % 12) * 30;
      if (a > 0 && a <= 180) s = { kind: 'corner', angles: [a], value: angleClass(a), world: WORLDS.clock };
    } else if (/^שתי זוויות ישרות זו ליד זו יוצרות יחד זווית/.test(p)) {
      s = { kind: 'corner', angles: [90, 90], value: 'שטוחה', world: WORLDS.dial };
    } else if (g >= 3 && /^זווית ישרה שווה לכמה מעלות\?$/.test(p)) {
      s = { kind: 'degrees', angles: [90], value: 90, world: WORLDS.dial };
    // ---- the circle of fifths
    } else if ((m = /^מדו ל\S+ — (\d) צעדים(?:, \d+ מעלות)?\. איזו זווית זו/.exec(p))) {
      const a = +m[1] * 30;
      s = { kind: 'fifthsCorner', steps: +m[1], value: angleClass(a), world: WORLDS.fifths };
    } else if (/^במעגל הקווינטות 12 נקודות במרחקים שווים\. כמה מעלות בין שתי נקודות שכנות\?$/.test(p)) {
      s = { kind: 'fifths', steps: 1, value: 30, world: WORLDS.fifths };
    } else if ((m = /^לגזרה זווית של (\d+)° במרכז\. איזה חלק היא מכל העיגול\? \(כשבר\)$/.exec(p))) {
      const a = +m[1];
      if (a % 30 === 0) {
        const k = a / 30, gcd = (x, y) => (y ? gcd(y, x % y) : x), d = gcd(k, 12);
        s = { kind: 'sector', steps: k, value: (k / d) + '/' + (12 / d), world: WORLDS.dial };
      }
    } else if ((m = /^מדו ל\S+(?: \S+)? — (?:(צעד אחד)|(שני צעדים)|(\d) צעדים)(?:, חצי סיבוב)?(?: במעגל הקווינטות)?\. כמה מעלות\?$/.exec(p))) {
      const k = m[1] ? 1 : m[2] ? 2 : +m[3];
      s = { kind: 'fifths', steps: k, value: k * 30, world: WORLDS.fifths };
    } else if ((m = /^כמה צעדים במעגל הקווינטות הם (\d+) מעלות\?$/.exec(p))) {
      if (+m[1] % 30 === 0) s = { kind: 'fifths', steps: +m[1] / 30, value: +m[1] / 30, world: WORLDS.fifths };
    }
    if (!s || s.value == null) return null;
    if (String(s.value) !== raw) return null;    // the sounds give exactly the answer
    if (s.angles || s.corners) { s.unit = unitFor((s.angles || s.corners).concat(s.angles && s.angles.length > 1 ? [s.angles.reduce((a, b) => a + b, 0)] : [])); if (!s.unit) return null; }
    s.answer = String(s.value);
    const ev = soundEvents(s);
    if (!ev.length || longestRun(ev) > MAX_RUN || ev.length > MAX_EVENTS) return null;
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
  const MOTIF = [[523, 659], [523, 392], [523, 784]];
  const FIFTHS_HZ = [262, 392, 294, 440, 330, 494, 370, 277, 415, 311, 466, 349];
  function soundEvents(spec) {
    if (!spec) return [];
    const ev = [];
    let t = 0;
    const hit = (voice, hz, dur, gain, stage, extra) => { ev.push(Object.assign({ at: t, voice: voice, hz: hz, dur: dur, gain: gain, stage: stage }, extra || {})); };
    const sweep = (deg, stage, extra) => { const k = deg / spec.unit; for (let i = 0; i < k; i++) { hit('woodClick', 1500, 0.04, 0.16, stage, Object.assign({ tick: i }, extra)); t += 0.2; } };
    const model = () => { sweep(90, 'model'); hit('metalBell', 1568, 0.35, 0.16, 'modelEnd'); t += 0.5 + 0.6; };
    // one walk around a shape: a stamp per corner, a silence (or a motif) per side, a soft breath to close
    const walk = (sides, opts) => {
      const o = opts || {};
      sides.forEach((len, i) => {
        hit('stomp', 90, 0.2, 0.3, 'corner', { n: i });
        t += 0.3;
        if (o.corners) { t += 0.1; sweep(o.corners[i], 'cornerTick', { n: i }); }
        if (o.motifs) { const mf = MOTIF[o.motifs[i]]; hit('pluck', mf[0], 0.18, 0.14, 'side', { n: i, motif: o.motifs[i] }); t += len / 2; hit('pluck', mf[1], 0.18, 0.14, 'side', { n: i, motif: o.motifs[i] }); t += len / 2; } else t += len;
      });
      hit('shaker', 300, 0.3, 0.08, 'close'); t += 0.5;
    };
    const regular = (n) => Array.from({ length: n }, () => (n > 6 ? 0.35 : 0.6));
    const shapeSides = (sh) => (typeof sh === 'number' ? regular(sh) : SIDES[sh] || regular(N[sh]));

    switch (spec.kind) {
      case 'walk': case 'name': case 'compareShapes':
        spec.shapes.forEach((sh, i) => { if (i) t += 1.0; walk(shapeSides(sh)); });
        break;
      case 'rightCorners': case 'triangle': case 'quad':
        model();
        walk(spec.sides || (spec.kind === 'rightCorners' ? SIDES['מלבן'] : [0.6, 0.6, 0.6]), { corners: spec.corners, motifs: spec.motifs });
        break;
      case 'triSides':
        walk(spec.sides);
        break;
      case 'parallelPairs':
        walk([1.0, 1.0, 1.0, 1.0], { motifs: spec.motifs });
        break;
      case 'diagonals':
        walk(regular(4));
        t += 0.6;
        for (let d = 0; d < 2; d++) { hit('bowed', 220 + 110 * d, 0.9, 0.18, 'diagonal', { n: d }); t += 1.3; }
        break;
      case 'rows':
        if (!spec.meet) {
          // two rows step together, the same steps, the same distance — they never meet
          for (let i = 0; i < 6; i++) { hit('stomp', 90, 0.15, 0.24, 'rowA', { n: i }); hit('clap', 1600, 0.06, 0.18, 'rowB', { n: i }); t += 0.4; }
        } else {
          spec.unit = 30;
          model();
          for (let i = 0; i < 3; i++) { hit('stomp', 90, 0.15, 0.24, 'rowA', { n: i }); t += 0.4; }
          sweep(90, 'cornerTick');
          hit('metalBell', 1047, 0.3, 0.18, 'meet'); t += 0.5;
          for (let i = 0; i < 3; i++) { hit('clap', 1600, 0.06, 0.18, 'rowB', { n: i }); t += 0.4; }
        }
        break;
      case 'corner':
        model();
        spec.angles.forEach((a, i) => { if (i) t += 0.5; sweep(a, 'tick', { part: i }); });
        hit('shaker', 300, 0.25, 0.08, 'freeze');
        break;
      case 'degrees':
        model();
        break;
      case 'sector':
        // the whole turn in twelve equal ticks, then the sector's own ticks
        for (let i = 0; i < 12; i++) { hit('woodClick', 1200, 0.04, 0.1, 'whole', { tick: i }); t += 0.2; }
        t += 0.3;
        hit('metalBell', 1047, 0.4, 0.14, 'wholeEnd'); t += 1.0;
        for (let i = 0; i < spec.steps; i++) { hit('woodClick', 1500, 0.05, 0.2, 'tick', { tick: i }); t += 0.26; }
        hit('shaker', 300, 0.25, 0.08, 'freeze');
        break;
      case 'fifths': case 'fifthsCorner': {
        if (spec.kind === 'fifthsCorner') { spec.unit = 30; model(); }
        else {
          for (let i = 0; i < 12; i++) { hit('tine', FIFTHS_HZ[i], 0.12, 0.1, 'circle', { n: i }); t += 0.22; }
          t += 0.3;
          hit('tine', FIFTHS_HZ[0] * 2, 0.4, 0.14, 'circleHome'); t += 1.0;
        }
        for (let i = 0; i <= spec.steps; i++) { hit('tine', FIFTHS_HZ[i % 12], 0.16, i ? 0.22 : 0.12, i ? 'step' : 'from', { n: i }); t += 0.38; }
        break;
      }
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
    walk: 'רקיעה היא פינה. השקט שאחריה הוא צלע. כמה רקיעות עד שהמעגל נסגר?',
    name: 'רקיעה היא פינה, השקט שאחריה הוא צלע. ספרו רקיעות — ואז תנו לצורה את שמה.',
    compareShapes: 'כל צורה בתורה, לפי הסדר שבשאלה, עם הפסקה ביניהן. ספרו כמה רקיעות בכל אחת.',
    rightCorners: 'אחרי כל רקיעה — הפינה בנקישות. השוו כל פינה לדגם. כמה פינות זהות לדגם?',
    maxRight: 'קודם דגם של פינה ישרה. אחר כך הולכים סביב משולש עם שתי פינות ישרות: אחרי השתיים לא נשארו נקישות לפינה השלישית, והמשולש לא נסגר. כמה פינות ישרות אפשר?',
    triangle: 'אחרי כל רקיעה — הפינה בנקישות. השוו כל פינה לדגם: צרה יותר, זהה, או רחבה יותר?',
    quad: 'שתי שאלות: האם השתיקות (הצלעות) שוות? האם הפינות זהות לדגם?',
    triSides: 'שתי שאלות: כמה רקיעות שמעתם? וכמה מהשתיקות היו שוות באורכן?',
    parallelPairs: 'כל צלע נשמעת כמנגינה קטנה של כיוון. צלעות באותו כיוון — אותה מנגינה. כמה זוגות של מנגינות זהות?',
    diagonals: 'קודם ההליכה סביב. אחר כך קול ארוך שחוצה מפינה לפינה שאינה שכנה. כמה קולות חוצים?',
    rows: 'שתי שורות רוקדים. האם הן נפגשות? ואם כן — באיזו פינה, בהשוואה לדגם?',
    corner: CORNER_LEGEND,
    degrees: 'זה הדגם: פינת דף. כל נקישה היא שלושים מעלות. כמה מעלות בכל הסיבוב?',
    sector: 'קודם סיבוב שלם בנקישות שוות, עד הפעמון. אחר כך רק הגזרה. איזה חלק מהסיבוב השלם היא?',
    fifths: 'קודם כל המעגל: שתים־עשרה צעדים עד שחוזרים הביתה — סיבוב שלם, שלוש מאות ושישים מעלות. אחר כך הצעדים של השאלה.',
    fifthsCorner: CORNER_LEGEND + ' כאן כל צעד במעגל הוא נקישה.',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    return '<div class="shape-walk">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc(spec.maxRight ? HOW.maxRight : HOW[spec.kind]) + '</p>'
      + (revealed
        ? '<p class="band-predict sw-silent">עכשיו בלי צליל: אמרו במילים מה שמעתם, ואז ציירו — גם מסובב, גם בגודל אחר.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו וספרו.</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, WORLDS: WORLDS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html };
});
