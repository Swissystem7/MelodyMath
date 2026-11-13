// MelodyMath — AreaWorlds: perimeter, area of rectangles, triangles and
// parallelograms, composite shapes, prisms and pyramids, heard (grades ב׳–ו׳).
// Research: docs/research/area-worlds-2026-11-13.md (Perplexity + Meta AI).
//
// Meta AI: "the sound does not only count, it BUILDS the shape" — where the
// corner is, where a row ends, where two parts are equal. One sound, one
// meaning; a silence is only a breath, never a unit.
//   perimeter — a hora circle: a short step is one centimetre, a stamp is a
//     corner (not a length), a closing sound when the walk is back home.
//   area of a rectangle — the cajón: a bright tap covers one unit square, a deep
//     stroke ends a row (not counted). Hands cover; feet walk.
//   a triangle — call-and-response singing (piyyut, Yemenite, Ethiopian,
//     Hasidic): one voice is the triangle, a second voice is the triangle that
//     completes it; together they are the rectangle, so one is half. Never a
//     rectangle "with holes" (Meta AI).
//   a parallelogram — a darbuka: dum is a step along the base, tak is a step up
//     the height, the slanted side is a glide that is not counted. The cut
//     triangle is heard moving from the left to the right, then the rows.
//   composite shapes — two players, then together; big yards in blocks of 5×5.
//   prisms and pyramids — inspired by the gamelan of Bali and Java, where each
//     player holds one tone: a face is a held metal tone, an edge a short click,
//     a corner a deep stroke. One question per exercise.
// Never more than 12 sounds in a row; the widget shows only when the sounds
// (with the numbers in the text) give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_AREA_WORLDS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['sideNotes', 'sidesFillBar', 'areaScore', 'splitRowGroups', 'partsRowGroups', 'solidFaceMotif']);
  const MAX_RUN = 12;
  const MAX_EVENTS = 56;
  const STEP = 0.24, BREATH = 0.5, GAP = 0.8;

  const WORLDS = Object.freeze({
    hora: { he: 'מעגל הורה', why: 'ריקוד עם ישראלי במעגל: הולכים סביב וחוזרים לנקודת ההתחלה. צעד קצר הוא סנטימטר אחד, ודריכה חזקה היא פינה' },
    cajon: { he: 'קחון', why: 'תוף ארגז מפרו, שהגיע דרך הפלמנקו גם למוזיקה הישראלית: טפיחה בהירה מכסה משבצת אחת, ומכה עמוקה מסיימת שורה' },
    call: { he: 'שירת מענה', why: 'קבוצה אחת שרה וקבוצה שנייה עונה — בפיוט, בשירה תימנית, אתיופית וחסידית. שני קולות משלימים משפט אחד' },
    darbuka: { he: 'דרבוקה', why: 'תוף גביע במוזיקה מזרחית, ערבית, טורקית וצפון־אפריקאית: דום — צעד לאורך הבסיס, טק — צעד בגובה, והחלקה — הצלע המשופעת, שאינה נספרת' },
    gamelan: { he: 'בהשראת הגמלאן', why: 'אנסמבל כלי מתכת מבאלי ומג׳אווה שבאינדונזיה, שבו כל נגן מחזיק צליל אחד, והמוזיקה נוצרת מהשילוב' },
  });
  const BLOCK_HE = 'כל מכה עמוקה היא גוש של חמישה על חמישה.';

  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const p = String(item.prompt || '').trim();
    const raw = String(item.answer).trim();
    let m, s = null;
    const n = (x) => +x;
    // ---- perimeter (hora)
    if ((m = /^לריבוע צלע של (\d+) ס״מ\. מה ההיקף בס״מ\?$/.exec(p))) s = walk([m[1], m[1], m[1], m[1]].map(n));
    else if ((m = /^למשולש צלעות של (\d+), (\d+) ו־(\d+) ס״מ\. מה ההיקף בס״מ\?$/.exec(p))) s = walk([m[1], m[2], m[3]].map(n));
    else if ((m = /^למלבן צלעות של (\d+) ס״מ ו־(\d+) ס״מ\. מה ההיקף בס״מ\?$/.exec(p)) || (m = /^למקבילית צלעות של (\d+) ס״מ ו־(\d+) ס״מ\. מה ההיקף בס״מ\?$/.exec(p))) s = walk([m[1], m[2], m[1], m[2]].map(n));
    else if ((m = /^למחומש 5 צלעות של (\d+) ס״מ כל אחת\. מה ההיקף בס״מ\?$/.exec(p))) s = walk(Array(5).fill(+m[1]));
    else if ((m = /^למשושה שכל צלעותיו שוות יש צלע של (\d+) ס״מ\. מה ההיקף בס״מ\?$/.exec(p))) s = walk(Array(6).fill(+m[1]));
    else if ((m = /^היקף ריבוע הוא (\d+) ס״מ\. כמה ס״מ אורך כל צלע\?$/.exec(p))) { const a = +m[1] / 4; if (Number.isInteger(a)) { s = walk([a, a, a, a]); s.value = a; } }
    else if ((m = /^היקף מלבן (?:הוא )?(\d+) ס״מ, ואחת מצלעותיו (\d+) ס״מ\. כמה ס״מ הצלע הסמוכה לה\?$/.exec(p)) || (m = /^היקף מלבן (\d+) ס״מ ואורכו (\d+) ס״מ\. מה רוחבו בס״מ\?$/.exec(p))) {
      const b = +m[1] / 2 - +m[2];
      if (b > 0 && Number.isInteger(b)) { s = walk([+m[2], b, +m[2], b]); s.value = b; }
    } else if ((m = /^למלבן ולריבוע אותו היקף\. צלעות המלבן (\d+) ס״מ ו־(\d+) ס״מ\. מה אורך צלע הריבוע/.exec(p))) {
      s = walk([+m[1], +m[2], +m[1], +m[2]]); s.value = (2 * (+m[1] + +m[2])) / 4; s.then = 'square';
    } else if ((m = /^ממלבן של (\d+) ס״מ על (\d+) ס״מ מורידים ריבוע של (\d+) ס״מ בפינה\. מה היקף הצורה שנשארה בס״מ\?$/.exec(p))) {
      const a = +m[1], b = +m[2], c = +m[3];
      s = walk([a, b, a - c, c, c, b - c]);
    } else if ((m = /^על כל צלע של מחומש משוכלל שצלעו (\d+) ס״מ בנו משולש שווה־צלעות כלפי חוץ\. מה היקף/.exec(p))) {
      s = walk(Array(10).fill(+m[1]));
    } else if ((m = /^על צלע קצרה של מלבן של (\d+) ס״מ על (\d+) ס״מ בנו משולש שווה־צלעות כלפי חוץ\. מה היקף/.exec(p))) {
      const a = +m[1], b = +m[2];
      s = walk([a, b, a, b, b]);
    } else if ((m = /^מניחים חמישה מלבנים של (\d+) ס״מ על (\d+) ס״מ זה על זה, צלע של \d+ ס״מ על צלע של \d+ ס״מ\. מה היקף המלבן הגדול/.exec(p))) {
      const a = +m[1], b = +m[2] * 5;
      if (b <= MAX_RUN) s = walk([a, b, a, b]);
    // ---- area of rectangles (cajón)
    } else if ((m = /^מלבן בנוי מ־(\d+) שורות של (\d+) משבצות\. כמה משבצות יש בו\?$/.exec(p))) s = cover([[+m[2], +m[1]]]);
    else if ((m = /^מלבן שאורכו (\d+) ס״מ ורוחבו (\d+) ס״מ\. מה שטחו בסמ״ר\?$/.exec(p))) s = cover([[+m[1], +m[2]]]);
    else if ((m = /^ריבוע שצלעו (\d+) ס״מ\. מה שטחו בסמ״ר\?$/.exec(p))) s = cover([[+m[1], +m[1]]]);
    else if ((m = /^שטח מלבן הוא (\d+) סמ״ר ואורכו (\d+) ס״מ\. כמה ס״מ רוחבו\?$/.exec(p))) { const w = +m[1] / +m[2]; if (Number.isInteger(w)) { s = cover([[+m[2], w]]); s.value = w; s.find = 'rows'; } }
    else if ((m = /^מלבן שאורכו (\d+) ס״מ ורוחבו (\d+) ס״מ, וריבוע שצלעו (\d+) ס״מ\. כמה סמ״ר שטחם יחד\?$/.exec(p))) s = cover([[+m[1], +m[2]], [+m[3], +m[3]]]);
    else if ((m = /^מצולע בצורת L מורכב ממלבן של (\d+) ס״מ על (\d+) ס״מ וממלבן של (\d+) ס״מ על (\d+) ס״מ\. מה שטחו/.exec(p))) s = cover([[+m[1], +m[2]], [+m[3], +m[4]]]);
    else if ((m = /^חמישה מלבנים של (\d+) ס״מ על (\d+) ס״מ יוצרים מלבן גדול\. מה שטח המלבן הגדול/.exec(p))) { s = cover([[+m[1], +m[2]]]); s.copies = 5; s.value = 5 * +m[1] * +m[2]; }
    else if ((m = /^מחצר מלבנית של (\d+) מ׳ על (\d+) מ׳ מורידים פינה ריבועית של 5 מ׳ על 5 מ׳\. מה שטח מה שנשאר/.exec(p))) {
      const w = +m[1] / 5, h = +m[2] / 5;
      if (Number.isInteger(w) && Number.isInteger(h) && w * h <= MAX_RUN) s = { kind: 'blocks', w: w, h: h, value: (w * h - 1) * 25, world: WORLDS.cajon };
    } else if ((m = /^מגדילים פי 2 כל צלע של מלבן של (\d+) ס״מ על (\d+) ס״מ\. פי כמה גדל השטח\?$/.exec(p))) {
      s = { kind: 'grow', value: 4, world: WORLDS.cajon };
    } else if ((m = /^מצולע מורכב מריבוע שצלעו (\d+) ס״מ וממשולש שבסיסו צלע הריבוע וגובהו (\d+) ס״מ\. מה שטחו/.exec(p))) {
      const a = +m[1], h = +m[2];
      s = { kind: 'squareTriangle', a: a, tri: a * h / 2, value: a * a + a * h / 2, world: WORLDS.call };
    // ---- triangles (call and response)
    } else if ((m = /^במשולש, הבסיס (\d+) ס״מ והגובה אליו (\d+) ס״מ\. מה שטח המשולש/.exec(p)) || (m = /^במשולש ישר־זווית הניצבים (\d+) ס״מ ו־(\d+) ס״מ\. מה שטח המשולש/.exec(p)) || (m = /^מלבן של (\d+) ס״מ על (\d+) ס״מ חולק באלכסון לשני משולשים\. מה שטח כל משולש/.exec(p))) {
      const half = +m[1] * +m[2] / 2;
      if (Number.isInteger(half) && half <= MAX_RUN) s = { kind: 'triangle', half: half, value: half, world: WORLDS.call };
    } else if (/^מלבן חולק באלכסון לשני משולשים\. איזה חלק משטח המלבן הוא שטח משולש אחד\? כתבו שבר\.$/.test(p)) {
      s = { kind: 'triangle', half: 6, value: '1/2', world: WORLDS.call };
    } else if (/^למקבילית ולמשולש אותו בסיס ואותו גובה\. פי כמה גדול שטח המקבילית משטח המשולש\?$/.test(p)) {
      s = { kind: 'twoTriangles', half: 6, value: 2, world: WORLDS.call };
    // ---- parallelograms (darbuka)
    } else if ((m = /^במקבילית, אורך צלע (\d+) ס״מ והגובה אליה (\d+) ס״מ\. מה שטח המקבילית/.exec(p))) {
      s = { kind: 'parallelogram', base: +m[1], height: +m[2], value: +m[1] * +m[2], world: WORLDS.darbuka };
    } else if ((m = /^שטח מקבילית (\d+) סמ״ר והגובה (\d+) ס״מ\. מה אורך הצלע שאליה הגובה/.exec(p))) {
      const b = +m[1] / +m[2];
      if (Number.isInteger(b)) s = { kind: 'parallelogram', base: b, height: +m[2], value: b, world: WORLDS.darbuka };
    // ---- prisms and pyramids (gamelan)
    } else if ((m = /^כמה (פאות|קודקודים|מקצועות) יש ל(מנסרה משולשת|פירמידה שבסיסה ריבוע|מנסרה שבסיסה מחומש)\?$/.exec(p))) {
      const k = /משולשת/.test(m[2]) ? 3 : /ריבוע/.test(m[2]) ? 4 : 5, pyr = /פירמידה/.test(m[2]);
      s = solid(m[1], k, pyr);
    } else if ((m = /^בפריסה של (מנסרה משולשת ישרה|פירמידה שבסיסה משושה), כמה (מלבנים|משולשים) יש\?$/.exec(p))) {
      const pyr = /פירמידה/.test(m[1]), k = pyr ? 6 : 3;
      s = { kind: 'net', k: k, pyr: pyr, value: k, world: WORLDS.gamelan };
    } else if ((m = /^למנסרה יש (\d+) פאות\. כמה צלעות יש למצולע שבבסיס שלה\?$/.exec(p))) {
      const k = +m[1] - 2;
      s = { kind: 'faces', k: k, pyr: false, value: k, world: WORLDS.gamelan, askBase: true };
    }
    if (!s || s.value == null || String(s.value) !== raw) return null;   // the sounds give exactly the answer
    s.answer = String(s.value);
    const ev = soundEvents(s);
    if (!ev.length || longestRun(ev) > MAX_RUN || ev.length > MAX_EVENTS) return null;
    return s;
  }

  function walk(sides) {
    if (sides.some((x) => !(x > 0) || x > MAX_RUN)) return null;
    return { kind: 'walk', sides: sides, value: sides.reduce((a, b) => a + b, 0), world: WORLDS.hora };
  }
  function cover(rects) {
    if (rects.some(([w, h]) => w > MAX_RUN || h > MAX_RUN)) return null;
    return { kind: 'cover', rects: rects, value: rects.reduce((a, [w, h]) => a + w * h, 0), world: WORLDS.cajon };
  }
  function solid(what, k, pyr) {
    const value = what === 'פאות' ? (pyr ? k + 1 : k + 2) : what === 'קודקודים' ? (pyr ? k + 1 : 2 * k) : (pyr ? 2 * k : 3 * k);
    return { kind: what === 'פאות' ? 'faces' : what === 'קודקודים' ? 'vertices' : 'edges', k: k, pyr: pyr, value: value, world: WORLDS.gamelan };
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
    const tapRow = (w, stage, extra, voice, hz) => { for (let i = 0; i < w; i++) { hit(voice || 'woodBar', hz || 880, 0.07, 0.18, stage, extra); t += STEP; } hit('drumLow', 90, 0.25, 0.22, 'rowEnd', extra); t += BREATH; };

    switch (spec.kind) {
      case 'walk':
        spec.sides.forEach((len, i) => {
          for (let s = 0; s < len; s++) { hit('woodClick', 1300, 0.05, 0.18, 'step', { side: i }); t += STEP; }
          hit('stomp', 80, 0.2, 0.28, 'corner', { side: i }); t += BREATH;
        });
        hit('shaker', 300, 0.35, 0.1, 'home');
        break;
      case 'cover':
        spec.rects.forEach(([w, h], r) => {
          for (let row = 0; row < h; row++) tapRow(w, 'tap', { rect: r, row: row }, r ? 'frameDrum' : 'woodBar', r ? 330 : 880);
          t += GAP;
        });
        for (let c = 1; c < (spec.copies || 1); c++) { hit('drumLow', 110, 0.35, 0.26, 'copy', { c: c }); t += 0.5; }
        break;
      case 'blocks':
        for (let r = 0; r < spec.h; r++) { for (let c = 0; c < spec.w; c++) { hit('drumLow', 82, 0.3, 0.26, 'block', { r: r, c: c, full: true }); t += 0.36; } t += BREATH; }
        t += GAP;
        for (let r = 0; r < spec.h; r++) { for (let c = 0; c < spec.w; c++) { if (!(r === 0 && c === 0)) hit('drumLow', 82, 0.3, 0.26, 'left', { r: r, c: c }); t += 0.36; } t += BREATH; }
        break;
      case 'grow':
        tapRow(1, 'small');
        t += GAP;
        tapRow(2, 'big', { row: 0 }); tapRow(2, 'big', { row: 1 });
        break;
      case 'triangle': case 'twoTriangles': case 'squareTriangle': {
        if (spec.kind === 'squareTriangle') { for (let row = 0; row < spec.a; row++) tapRow(spec.a, 'square', { row: row }); t += GAP; }
        // voice A is the triangle; voice B the triangle that completes the rectangle
        const voice = (stage, hz, n) => { for (let i = 0; i < n; i++) { hit('voiceAh', hz, 0.16, 0.18, stage); t += STEP; } t += GAP; };
        const n = spec.kind === 'squareTriangle' ? spec.tri : spec.half;
        if (spec.kind !== 'twoTriangles') hit('shaker', 520, 0.25, 0.1, 'cut'), t += 0.5;
        voice('voiceA', 440, n);
        if (spec.kind !== 'squareTriangle') voice('voiceB', 330, n);
        break;
      }
      case 'parallelogram': {
        hit('bowed', 220, 0.6, 0.12, 'slant'); t += 0.9;                                  // the slanted side: a glide, not counted
        [523, 659, 784].forEach((hz) => { hit('pluck', hz, 0.1, 0.16, 'cutLeft'); t += 0.18; }); t += 0.4;
        [523, 659, 784].forEach((hz) => { hit('pluck', hz * 1.06, 0.1, 0.16, 'cutRight'); t += 0.18; }); t += GAP;
        for (let r = 0; r < spec.height; r++) {
          for (let i = 0; i < spec.base; i++) { hit('drumLow', 110, 0.16, 0.24, 'dum', { row: r }); t += STEP; }
          hit('drumHigh', 660, 0.08, 0.2, 'tak', { row: r }); t += BREATH;
        }
        break;
      }
      case 'faces': {
        const bases = spec.pyr ? 1 : 2;
        for (let b = 0; b < bases; b++) { hit('metalBell', 392, 0.6, 0.18, 'base', { b: b }); t += 0.8; }
        t += BREATH;
        for (let i = 0; i < spec.k; i++) { hit('metalBell', 784, 0.4, 0.16, 'side', { i: i }); t += 0.5; }
        break;
      }
      case 'vertices':
        for (let i = 0; i < spec.k; i++) { hit('drumLow', 98, 0.25, 0.26, 'vertex', { level: 0 }); t += 0.36; }
        t += GAP;
        for (let i = 0; i < (spec.pyr ? 1 : spec.k); i++) { hit('drumLow', 98, 0.25, 0.26, 'vertex', { level: 1 }); t += 0.36; }
        break;
      case 'edges': {
        const groups = spec.pyr ? [spec.k, spec.k] : [spec.k, spec.k, spec.k];
        groups.forEach((g, gi) => { for (let i = 0; i < g; i++) { hit('woodClick', 1600, 0.05, 0.2, 'edge', { group: gi }); t += STEP; } t += GAP; });
        break;
      }
      case 'net':
        // unfolding: the base(s), then the side faces one after the other
        hit('metalBell', 392, 0.6, 0.16, 'base'); t += 0.8;
        for (let i = 0; i < spec.k; i++) { hit('metalBell', spec.pyr ? 988 : 784, 0.35, 0.16, 'sideFace', { i: i }); t += 0.45; }
        if (!spec.pyr) { t += BREATH; hit('metalBell', 392, 0.6, 0.16, 'base'); }
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
    walk: 'צעד קצר הוא סנטימטר. דריכה חזקה היא פינה — היא לא נספרת באורך. השקט הוא רק נשימה. ספרו צעדים עד שחוזרים הביתה.',
    cover: 'טפיחה בהירה מכסה משבצת אחת; מכה עמוקה מסיימת שורה ואינה נספרת. כמה שורות, כמה בכל שורה?',
    blocks: 'כאן כל צליל הוא גוש שלם. קודם כל החצר, אחר כך החצר בלי הפינה. מה השתנה?',
    grow: 'משבצת אחת, ואחריה אותה משבצת כשכל צלע גדלה פי שניים. כמה משבצות נכנסות בה?',
    triangle: 'אחרי החיתוך: קול אחד הוא המשולש, וקול שני הוא המשולש שמשלים אותו. יחד הם המלבן. האם שני הקולות שווים?',
    twoTriangles: 'קול אחד הוא המשולש, וקול שני — המשולש שמשלים אותו למקבילית. כמה קולות כאלה במקבילית?',
    squareTriangle: 'קודם הריבוע בטפיחות ובשורות, אחר כך קול שהוא המשולש שמעליו. כמה בסך הכול?',
    parallelogram: 'ההחלקה היא הצלע המשופעת — לא סופרים אותה. מוטיב קצר עובר משמאל לימין: המשולש שנחתך עבר צד. אחר כך שורות: דום לכל צעד בבסיס, טק לכל צעד בגובה.',
    faces: 'כל פאה היא צליל מתכת מתמשך: קודם הבסיס, אחר כך הפאות שבצד.',
    vertices: 'כל פינה היא מכה עמוקה: קודם הפינות שלמטה, אחר כך שלמעלה.',
    edges: 'כל מקצוע הוא נקישה קצרה, בקבוצות: למטה, למעלה, ומה שמחבר ביניהם.',
    net: 'פותחים את הגוף לפריסה: הבסיס, ואחריו הפאות שבצד, אחת אחרי השנייה.',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    const extra = spec.kind === 'blocks' ? ' ' + BLOCK_HE : spec.kind === 'walk' && spec.then === 'square' ? ' זה המלבן; לריבוע אותו מספר צעדים — בארבע צלעות שוות.' : spec.kind === 'cover' && spec.find === 'rows' ? ' כאן ידוע כמה בכל שורה — כמה שורות?' : spec.kind === 'faces' && spec.askBase ? ' כמה פאות בצד — כך גם כמה צלעות לבסיס.' : '';
    return '<div class="area-worlds">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc(HOW[spec.kind] + extra) + '</p>'
      + (revealed
        ? '<p class="band-predict aw-silent">עכשיו בלי צליל: ציירו את הצורה, סמנו פינות וסופי שורות, ואמרו את התשובה עם היחידה.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו וספרו.</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, WORLDS: WORLDS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html };
});
