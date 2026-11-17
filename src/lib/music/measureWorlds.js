// MelodyMath — MeasureWorlds: units, box parts, surface area and volume, heard
// (grades ד׳–ו׳; tags metreHundredGroups, litreThousandGroups, faceEdgeGroups,
// faceAreaGroups, cubeLayerGroups). Research:
// docs/research/measure-worlds-2026-11-13.md (Perplexity + Meta AI).
//
// Meta AI: if length, area and volume are all "count the beats", they become
// one thing to the ear. So each has its own sound and its own shape in time:
//   converting units — inspired by the iqa', the rhythmic cycle of Arabic
//     music: a big unit is one deep stroke that SPLITS into ten strokes of the
//     next unit (×), or small strokes GATHER into one (:) — two directions,
//     two different sounds. Ten to a unit is a school convention, not a law of
//     music, and the text says so. The first unit is split in full; after that
//     each big stroke stands for its ten (a duration is never a number).
//   a box — a cajón, the Afro-Peruvian box drum, is itself a box: a stroke on a
//     face is deep, on an edge sharp, on a corner short and high.
//   surface area is COVERING: bright taps in rows with short silences between
//     rows (a row of beats alone would be a length, not an area).
//   volume is FILLING: deep strokes in rows, a long silence between layers.
// Never more than 12 sounds in a row; the widget shows only when the sounds
// (with the numbers in the text) give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_MEASURE_WORLDS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['metreHundredGroups', 'litreThousandGroups', 'faceEdgeGroups', 'faceAreaGroups', 'cubeLayerGroups']);
  const MAX_RUN = 12;
  const MAX_EVENTS = 40;
  const ROW = 0.24, SHORT = 0.45, LONG = 0.9;

  const WORLDS = Object.freeze({
    iqaa: { he: 'בהשראת האיקאע', why: 'מחזור קצבי במוזיקה ערבית שמחלקים אותו שוב ושוב, כמו שמחלקים יחידת מידה. החלוקה לעשרה היא מוסכמה של בית הספר — במוזיקה מחלקים בדרך כלל לשניים, שלושה או ארבעה' },
    cajon: { he: 'קחון', why: 'תוף קופסה מהמסורת האפרו־פרואנית, שהגיע דרך הפלמנקו. הקחון הוא בעצמו תיבה: הקשה על פאה, על מקצוע או על פינה נשמעת אחרת' },
  });

  const CONV = [
    // [regex, how many of the asked unit are in one of the given unit]
    [/^כמה ס״מ יש ב־(\d+) מטרים\?$/, 100],
    [/^כמה גרם יש ב־(\d+) ק״ג\?$/, 1000],
    [/^כמה מ״מ יש ב־(\d+) ס״מ\?$/, 10],
    [/^כמה מטרים יש ב־(\d+) ק״מ\?$/, 1000],
    [/^כמה ס״מ יש ב־(\d+) דצ״מ\?$/, 10],
    [/^כמה דצ״מ יש במטר (אחד)\?$/, 10],
    [/^כמה מ״ל יש בליטר (אחד)\? \(כתבו בלי פסיק\)$/, 1000],
    [/^כמה ליטרים יש במ״ק (אחד)\? \(כתבו בלי פסיק\)$/, 1000],
  ];

  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const p = String(item.prompt || '').trim();
    const raw = String(item.answer).trim();
    let m, s = null;
    for (const [re, f] of CONV) {
      if ((m = re.exec(p))) { const n = m[1] === 'אחד' ? 1 : +m[1]; s = { kind: 'split', n: n, factor: f, unit: /^כמה (\S+)/.exec(p)[1], value: n * f, world: WORLDS.iqaa }; break; }
    }
    if (!s && /^כמה מ״ל יש בחצי ליטר\?$/.test(p)) s = { kind: 'split', n: 1, half: true, factor: 1000, unit: 'מ״ל', value: 500, world: WORLDS.iqaa };
    else if (!s && (m = /^חבל באורך (\d+) מטרים נחתך לחתיכות של (\d+) ס״מ\. כמה חתיכות יש\?$/.exec(p))) {
      const per = 100 / +m[2];
      if (Number.isInteger(per)) s = { kind: 'pieces', n: +m[1], per: per, value: +m[1] * per, world: WORLDS.iqaa };
    } else if (!s && (m = /^כמה כוסות של (\d+) מ״ל אפשר למזוג מבקבוק של ליטר וחצי\?$/.exec(p))) {
      const per = 1000 / +m[1];
      if (Number.isInteger(per)) s = { kind: 'glasses', per: per, value: per * 1.5, world: WORLDS.iqaa };
    } else if (!s && (m = /^כמה (פאות|מקצועות|קודקודים) יש ל(תיבה|קובייה)\?$/.exec(p))) {
      const n = { 'פאות': 6, 'מקצועות': 12, 'קודקודים': 8 }[m[1]];
      s = { kind: 'boxParts', part: m[1], value: n, world: WORLDS.cajon };
    } else if (!s && /^כל פאות הקובייה הן אותה צורה\. איזו\?$/.test(p)) {
      s = { kind: 'faceShape', value: 'ריבוע', world: WORLDS.cajon };
    } else if (!s && (m = /^פאה של תיבה היא מלבן של (\d+) ס״מ על (\d+) ס״מ\. מה שטח הפאה בסמ״ר\?$/.exec(p))) {
      s = { kind: 'cover', faces: [[+m[1], +m[2]]], value: +m[1] * +m[2], world: WORLDS.cajon };
    } else if (!s && (m = /^לקובייה 6 פאות, ושטח כל פאה (\d+) סמ״ר\. מה שטח הפנים של הקובייה בסמ״ר\?$/.exec(p))) {
      const a = +m[1], side = Math.round(Math.sqrt(a));
      if (side * side === a) s = { kind: 'coverAll', face: [side, side], times: 6, value: 6 * a, world: WORLDS.cajon };
    } else if (!s && (m = /^המקצוע של קובייה הוא (\d+) ס״מ\. מה שטח הפנים שלה בסמ״ר\?$/.exec(p))) {
      const e = +m[1];
      s = { kind: 'coverAll', face: [e, e], times: 6, value: 6 * e * e, world: WORLDS.cajon };
    } else if (!s && (m = /^לתיבה מידות של (\d+), (\d+) ו־(\d+) ס״מ\. מה שטח הפנים שלה בסמ״ר\?$/.exec(p))) {
      const a = +m[1], b = +m[2], c = +m[3];
      s = { kind: 'coverPairs', faces: [[a, b], [a, c], [b, c]], value: 2 * (a * b + a * c + b * c), world: WORLDS.cajon };
    } else if (!s && (m = /^המקצוע של קובייה גדל מ־(\d+) ס״מ ל־(\d+) ס״מ\. פי כמה גדל שטח הפנים\?$/.exec(p))) {
      const a = +m[1], b = +m[2];
      s = { kind: 'coverGrow', faces: [[a, a], [b, b]], value: (b * b) / (a * a), world: WORLDS.cajon };
    } else if (!s && (m = /^בתיבה (\d+) קוביות\. הוצאנו (\d+)\. כמה קוביות נשארו\?$/.exec(p))) {
      // the box full, then the same places again: the cubes taken out are silent
      const n = +m[1], out = +m[2];
      if (n <= MAX_RUN && out < n) s = { kind: 'takeOut', n: n, out: out, value: n - out, world: WORLDS.cajon };
    } else if (!s && (m = /^תיבה אחת בנויה מ־(\d+) שכבות של (\d+) קוביות, ותיבה שנייה מ־(\d+) שכבות של (\d+) קוביות\. בכמה קוביות יש בראשונה יותר\?$/.exec(p))) {
      const a = [+m[1], +m[2]], b = [+m[3], +m[4]], va = a[0] * a[1], vb = b[0] * b[1];
      if (va > vb && va <= 16 && vb <= 16) s = { kind: 'layersCompare', a: a, b: b, value: va - vb, world: WORLDS.cajon };
    } else if (!s && (m = /^תיבה בנויה מ־(\d+) קוביות של 1 סמ״ק\. מה נפחה בסמ״ק\?$/.exec(p))) {
      const n = +m[1];
      if (n === 12) s = { kind: 'fill', dims: [3, 2, 2], value: n, world: WORLDS.cajon };
    } else if (!s && (m = /^מידות תיבה (\d+) ס״מ, (\d+) ס״מ ו־(\d+) ס״מ\. מה נפחה בסמ״ק\?$/.exec(p))) {
      s = { kind: 'fill', dims: [+m[2], +m[1], +m[3]], value: +m[1] * +m[2] * +m[3], world: WORLDS.cajon };
    } else if (!s && (m = /^נפח תיבה (\d+) סמ״ק, אורכה (\d+) ס״מ ורוחבה (\d+) ס״מ\. מה גובהה בס״מ\?$/.exec(p))) {
      const v = +m[1], l = +m[2], w = +m[3];
      if (v % (l * w) === 0) s = { kind: 'height', row: l, rows: w, value: v / (l * w), world: WORLDS.cajon };
    } else if (!s && (m = /^נפח מנסרה (\d+) סמ״ק ושטח הבסיס שלה (\d+) סמ״ר\. מה גובהה בס״מ\?$/.exec(p))) {
      const v = +m[1], base = +m[2];
      const rows = [2, 3, 4].find((r) => base % r === 0 && base / r <= MAX_RUN);
      if (rows && v % base === 0) s = { kind: 'height', row: base / rows, rows: rows, value: v / base, world: WORLDS.cajon };
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
    const big = (extra) => { hit('drumLow', 62, 0.55, 0.32, 'big', extra); t += 0.75; };
    const part = (extra) => { hit('drumLow', 120, 0.22, 0.24, 'part', extra); t += ROW; };
    // covering (area): bright taps, a short silence after every row
    const cover = (w, h, extra) => { for (let r = 0; r < h; r++) { for (let c = 0; c < w; c++) { hit('woodBar', 880, 0.08, 0.18, 'cover', Object.assign({ row: r }, extra)); t += ROW; } t += SHORT - ROW + 0.05; } };
    // filling (volume): deep strokes in rows, a long silence after every layer
    const fillLayer = (w, h, extra) => { for (let r = 0; r < h; r++) { for (let c = 0; c < w; c++) { hit('drumLow', 82, 0.18, 0.26, 'fill', Object.assign({ row: r }, extra)); t += ROW; } t += SHORT - ROW + 0.05; } t += LONG; };

    switch (spec.kind) {
      case 'split': {
        // the first big unit splits in full into ten strokes; each next big stroke stands for its ten
        big({ n: 0, split: true });
        const shown = spec.half ? 5 : 10;
        for (let i = 0; i < 10; i++) { if (i < shown) part({ i: i, worth: spec.factor / 10 }); else t += ROW; }
        t += LONG;
        for (let k = 1; k < spec.n; k++) big({ n: k });
        break;
      }
      case 'pieces':
        // a sound is a piece, a silence is a cut: pieces = cuts + 1
        for (let k = 0; k < spec.n * spec.per; k++) { hit('pluck', 196, 0.35, 0.24, 'piece', { k: k }); t += 0.4 + (k % spec.per === spec.per - 1 ? 0.3 : 0); t += 0.25; }
        break;
      case 'glasses':
        for (let k = 0; k < spec.value; k++) { hit('jingle', 660, 0.3, 0.2, 'pour', { k: k, litre: Math.floor(k / spec.per) }); t += 0.45; if (k % spec.per === spec.per - 1) t += LONG; }
        break;
      case 'boxParts': {
        const v = spec.part === 'פאות' ? ['drumLow', 100, 0.35] : spec.part === 'מקצועות' ? ['woodClick', 1400, 0.06] : ['woodClick', 2200, 0.04];
        const groups = spec.part === 'פאות' ? [2, 2, 2] : spec.part === 'מקצועות' ? [4, 4, 4] : [4, 4];
        groups.forEach((g, gi) => { for (let i = 0; i < g; i++) { hit(v[0], v[1], v[2], 0.24, 'part', { group: gi }); t += 0.35; } t += LONG; });
        break;
      }
      case 'faceShape':
        // walking around one face: four corner strokes, four equal silences
        for (let i = 0; i < 4; i++) { hit('woodClick', 2200, 0.04, 0.22, 'corner'); t += 0.7; }
        hit('shaker', 300, 0.3, 0.08, 'close');
        break;
      case 'cover':
        cover(spec.faces[0][0], spec.faces[0][1]);
        break;
      case 'coverAll':
        // one face covered in full, then a deep face stroke for every face of the cube
        cover(spec.face[0], spec.face[1], { face: 0 });
        t += LONG;
        for (let f = 0; f < spec.times; f++) { hit('drumLow', 100, 0.35, 0.26, 'face', { f: f }); t += 0.5; }
        break;
      case 'coverPairs':
        // each kind of face is covered once, then its twin on the other side is a single deep stroke
        spec.faces.forEach((fc, i) => { cover(fc[0], fc[1], { pair: i }); hit('drumLow', 100, 0.35, 0.26, 'twin', { pair: i }); t += 0.5 + LONG; });
        break;
      case 'coverGrow':
        spec.faces.forEach((fc, i) => { cover(fc[0], fc[1], { size: i }); t += LONG; });
        break;
      case 'fill':
        for (let l = 0; l < spec.dims[2]; l++) fillLayer(spec.dims[0], spec.dims[1], { layer: l });
        break;
      case 'takeOut':
        for (let i = 0; i < spec.n; i++) { hit('drumLow', 82, 0.18, 0.26, 'fill', { i: i }); t += ROW; }
        t += LONG;
        for (let i = 0; i < spec.n; i++) { if (i < spec.value) hit('drumLow', 82, 0.18, 0.26, 'left', { i: i }); t += ROW; }
        break;
      case 'layersCompare': {
        // each box layer by layer (a deep stroke closes every layer); then counting on from the smaller box to the bigger one
        const box = (dims, tag) => { for (let l = 0; l < dims[0]; l++) { for (let c = 0; c < dims[1]; c++) { hit('drumLow', 82, 0.18, 0.26, 'cube', { box: tag, layer: l }); t += ROW; } hit('drumLow', 55, 0.4, 0.26, 'layer', { box: tag, layer: l }); t += SHORT; } t += LONG; };
        box(spec.a, 0); box(spec.b, 1);
        for (let i = 0; i < spec.value; i++) { hit('drumHigh', 523, 0.12, 0.2, 'more', { i: i }); t += ROW; }
        break;
      }
      case 'height':
        // one row of unit cubes, then a stroke for every row of a layer, then a deep stroke for every layer
        for (let c = 0; c < spec.row; c++) { hit('drumLow', 82, 0.16, 0.22, 'fill', { row: 0 }); t += ROW; }
        t += LONG;
        for (let r = 0; r < spec.rows; r++) { hit('drumLow', 110, 0.3, 0.26, 'rowStroke', { r: r }); t += 0.45; }
        t += LONG;
        for (let l = 0; l < spec.value; l++) { hit('gong', 70, 0.5, 0.28, 'layer', { l: l }); t += 0.7; }
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
    split: 'מכה עמוקה היא היחידה הגדולה. קודם שומעים אותה מתפרקת לעשר מכות קטנות יותר. אחר כך כל מכה עמוקה שווה את כל העשר שלה. מפרקים — המספר גדל; אוספים — הוא קטן.',
    pieces: 'כל צליל הוא חתיכה, וכל שקט ביניהם הוא חתך. ספרו חתיכות — לא חתכים.',
    glasses: 'כל צליל הוא כוס שנמזגת. שקט ארוך — נגמר ליטר. ספרו כוסות.',
    boxParts: 'הקחון הוא תיבה: על פאה ההקשה עמוקה, על מקצוע חדה, על פינה קצרה וגבוהה. ספרו לפי הקבוצות.',
    faceShape: 'הולכים סביב פאה אחת: ארבע פינות, ושקט שווה בין כל שתיים. איזו צורה זו?',
    cover: 'שטח הוא כיסוי: הקשה בהירה לכל משבצת, ושקט קצר בסוף כל שורה. כמה שורות, כמה בכל שורה — ואז כמה משבצות.',
    coverAll: 'קודם מכסים פאה אחת: משבצות בשורות. אחר כך מכה עמוקה לכל פאה של הקובייה.',
    coverPairs: 'לכל סוג פאה: מכסים אותה, ומכה עמוקה אחת היא התאומה שלה בצד השני. אחרי כל זוג — עצרו ואמרו כמה עד עכשיו.',
    coverGrow: 'פאה קטנה, ואחריה פאה שהמקצוע שלה גדל. האם רק השורה התארכה — או שגם מספר השורות גדל?',
    fill: 'נפח הוא מילוי: מכה עמוקה לכל קובייה, שקט קצר בסוף שורה, שקט ארוך בסוף שכבה. כמה בשכבה, וכמה שכבות?',
    takeOut: 'מכה לכל קובייה בתיבה. אחר כך אותם מקומות שוב — הקוביות שהוצאו נשמעות כשקט. כמה מכות נשארו?',
    layersCompare: 'כל תיבה שכבה אחרי שכבה: מכה לכל קובייה, ומכה עמוקה סוגרת כל שכבה. אחר כך סופרים קדימה מהתיבה הקטנה עד הגדולה. כמה מכות נוספו?',
    height: 'קודם שורה אחת של קוביות. אחר כך מכה לכל שורה בשכבה, ואחר כך גונג לכל שכבה. כמה שכבות — זה הגובה.',
  };
  const WORTH_HE = { 1: 'אחד', 10: 'עשרה', 100: 'מאה' };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    const legend = spec.kind === 'split' ? ' כאן כל מכה בפירוק שווה ' + WORTH_HE[spec.factor / 10] + ' ' + spec.unit + '.' : '';
    return '<div class="measure-worlds">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc(HOW[spec.kind] + legend) + '</p>'
      + (revealed
        ? '<p class="band-predict mw2-silent">עכשיו בלי צליל: אמרו את התשובה עם היחידה — ס״מ, סמ״ר או סמ״ק — ובדקו בכיוון ההפוך.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו וספרו.</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, WORLDS: WORLDS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html };
});
