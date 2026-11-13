// MelodyMath — DecimalWorlds: decimal fractions, heard (grades ה׳–ו׳; tags
// tenthNotes, tenthsTogether, decimalNoteScale, nearlyWholeNote).
// Research: docs/research/decimal-worlds-2026-11-13.md (Perplexity + Meta AI).
// A new file only: none of the files MM-AUTO-750 works on is touched.
//
// The misconceptions this answers (Steinle & Stacey; Resnick et al.): "longer
// is larger" (0.45 > 0.5), "shorter is larger", and whole-number habits to the
// right of the point. So the size of a decimal is heard as TIME and PLACE,
// never as a number of sounds:
//   tenths — inspired by jhaptal, the ten-beat cycle of North Indian classical
//     music: seven beats sound, three are real silence.
//   places — three phrases, one timbre per place: wholes on a low drum, tenths
//     on a woodblock, hundredths on a shaker (a turn marker even for a zero).
//   comparing — the numbers start TOGETHER and each stops where it ends: the
//     one that stops later is larger. 0.09 is nine tiny hundredths that end
//     before one tenth.
//   1/4 — a 4/4 pop bar, one beat sounding; then the same moment in tenths.
//   beat length — a studio metronome inside a reference second cut in tenths.
//   × and : by 10, 100, 1000 — a hip-hop sequencer swap: the same number of
//     sounds, each one a place bigger or smaller (never an octave: that is ×2).
//   adding and taking away — a drum kit: a layer is added; a whole is broken
//     into ten tenths before tenths are taken.
//   change and differences — counting up, place by place.
//   rounding — the number, then the distance down and the distance up.
//   loops, parts of parts, sharing and fitting; the mean built in a circle;
//   musical intervals (a fifth is ×1.5, a major third ×1.25) as the number
//   plus its half (or quarter) — and then the two real tones together.
// Never more than 12 sounds in a row; the widget shows only when the sounds
// (with the numbers in the text) give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_DECIMAL_WORLDS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['tenthNotes', 'tenthsTogether', 'decimalNoteScale', 'nearlyWholeNote']);
  const MAX_RUN = 12;
  const MAX_EVENTS = 48;
  const TICK = 0.36;              // one tenth of a whole, in seconds
  const FINE = TICK / 10;         // one hundredth
  const GAP = 0.7;

  const WORLDS = Object.freeze({
    jhaptal: { he: 'בהשראת הג׳אפ טאל', why: 'מחזור של עשר פעמות במוזיקה הקלאסית של צפון הודו, על טבלה: כל פעמה היא עשירית מהמחזור' },
    places: { he: 'שלושה כלים, שלושה מקומות', why: 'שלמים בתוף נמוך, עשיריות בוודבלוק, מאיות בשייקר. הגוון אומר את המקום' },
    race: { he: 'מרוץ של שני קולות', why: 'הקולות מתחילים יחד, וכל אחד עוצר במקום שבו המספר שלו נגמר. מי שעוצר מאוחר יותר — גדול יותר' },
    pop: { he: 'תיבת פופ בארבעה רבעים', why: 'כמו בשירי פופ, גם בפופ מזרחי ישראלי: ארבע פעמות בתיבה' },
    studio: { he: 'מטרונום באולפן', why: 'מתופפים ומפיקים עובדים עם שניות אמיתיות: שנייה אחת מחולקת לעשר עשיריות' },
    sequencer: { he: 'סיקוונסר בהשראת הפקת היפ־הופ', why: 'סגנון שנולד בקהילות השחורות בארצות הברית: מחליפים צליל בצליל — אותו מספר צלילים, גוון של מקום אחר' },
    kit: { he: 'ערכת תופים', why: 'שכבות של צלילים: מוסיפים שכבה, או שוברים שלם לעשר עשיריות לפני שמוציאים' },
    loop: { he: 'לופ', why: 'אותו משפט חוזר, ושקט בין החזרות' },
    hora: { he: 'מעגל הורה', why: 'ריקוד עם ישראלי במעגל; היישור הוא דימוי, החשבון הוא סכום חלקי מספר' },
    strings: { he: 'מיתר ומרווחים', why: 'קווינטה היא פי אחד וחצי בתדר, טרצה גדולה פי אחד ורבע — ואז שומעים את שני הצלילים האמיתיים יחד' },
  });

  // places, from tens down to ten-thousandths
  const PLACE = { 3: ['gong', 55, 'thousands'], 2: ['gong', 82, 'hundreds'], 1: ['drumLow', 70, 'tens'], 0: ['drumLow', 110, 'ones'], '-1': ['woodClick', 1300, 'tenths'], '-2': ['shaker', 2000, 'hundredths'], '-3': ['tine', 2600, 'thousandths'], '-4': ['jingle', 3200, 'tenThousandths'] };
  const fmt = (x) => String(Math.round(x * 10000) / 10000);
  const num = (s) => +String(s).replace(/,/g, '');
  // a decimal string into its place digits { place: digit }
  function digitsOf(str) {
    const [ip, fp = ''] = String(str).replace(/,/g, '').split('.');
    const out = {};
    ip.split('').reverse().forEach((d, i) => { if (+d) out[i] = +d; });
    fp.split('').forEach((d, i) => { if (+d) out[-(i + 1)] = +d; });
    return out;
  }
  const lowestPlace = (str) => { const fp = (String(str).split('.')[1] || ''); return -fp.length; };

  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const p = String(item.prompt || '').trim();
    const raw = String(item.answer).trim();
    let m, s = null;
    // ---- tenths of a cycle
    if ((m = /^כתבו כשבר עשרוני: (\d)\/10$/.exec(p))) s = { kind: 'cycle', n: +m[1], value: fmt(+m[1] / 10), world: WORLDS.jhaptal };
    else if ((m = /^כתבו כשבר עשרוני: (\d) אלפיות$/.exec(p))) s = { kind: 'places', str: fmt(+m[1] / 1000), lowest: -3, value: fmt(+m[1] / 1000), world: WORLDS.places };
    else if ((m = /^במספר ([\d.]+), איזו ספרה במקום (העשיריות|המאיות)\?$/.exec(p))) { const d = digitsOf(m[1]); s = { kind: 'places', str: m[1], lowest: lowestPlace(m[1]), ask: m[2], value: String(d[m[2] === 'העשיריות' ? -1 : -2] || 0), world: WORLDS.places }; }
    else if ((m = /^כתבו במטרים כשבר עשרוני: (\d+) מטר ו־(\d+) ס״מ$/.exec(p))) { const v = fmt(+m[1] + +m[2] / 100); s = { kind: 'places', str: v, lowest: -2, value: v, world: WORLDS.places }; }
    // ---- comparing and ordering: a race in time
    else if ((m = /^מה גדול יותר, ([\d.]+) או ([\d.]+)\? כתבו את הגדול\.$/.exec(p))) { const a = +m[1], b = +m[2]; s = { kind: 'race', nums: [m[1], m[2]], value: a > b ? m[1] : m[2], world: WORLDS.race }; }
    else if ((m = /^סדרו מהקטן לגדול: ([\d., ]+)\. מהו המספר (השני|הראשון|השלישי) בסדר\?$/.exec(p))) { const list = m[1].split(', '); const k = { 'הראשון': 0, 'השני': 1, 'השלישי': 2 }[m[2]]; s = { kind: 'race', nums: list, value: list.slice().sort((x, y) => +x - +y)[k], world: WORLDS.race }; }
    // ---- quarters and the 4/4 bar
    else if (/^כתבו כשבר עשרוני: 1\/4$/.test(p)) s = { kind: 'quarter', beats: 1, value: '0.25', world: WORLDS.pop };
    else if (/^כתבו כשבר פשוט: 0\.75$/.test(p)) s = { kind: 'quarter', beats: 3, fromDecimal: true, value: '3/4', world: WORLDS.pop };
    // ---- beat length in seconds
    else if ((m = /(?:ב־|פעימה ב־)(\d+) BPM (?:פעימה )?נמשכת 60\/(\d+) שנייה\. כמה שניות זה כשבר עשרוני\?$/.exec(p))) { const bpm = +m[1]; s = { kind: 'beat', bpm: bpm, value: fmt(60 / bpm), world: WORLDS.studio }; }
    else if ((m = /^פעימה נמשכת ([\d.]+) שנייה\. כמה פעימות בדקה \(BPM\)\?$/.exec(p))) { const sec = +m[1]; s = { kind: 'beat', bpm: Math.round(60 / sec), back: true, value: String(Math.round(60 / sec)), world: WORLDS.studio }; }
    // ---- × and : by powers of ten
    else if ((m = /^([\d.,]+) ([×:]) (10|100|1,000) = \?$/.exec(p))) {
      const n = num(m[1]), f = num(m[3]), shift = { 10: 1, 100: 2, 1000: 3 }[f] * (m[2] === '×' ? 1 : -1);
      s = { kind: 'shift', from: m[1].replace(/,/g, ''), shift: shift, value: fmt(m[2] === '×' ? n * f : n / f), world: WORLDS.sequencer };
    }
    // ---- adding, taking away
    else if ((m = /^([\d.]+) \+ ([\d.]+) = \?$/.exec(p))) s = { kind: 'add', a: m[1], b: m[2], value: fmt(+m[1] + +m[2]), world: WORLDS.kit };
    else if (/^0\.5 \+ 1\/4 = \? \(כתבו כשבר עשרוני\)$/.test(p)) s = { kind: 'add', a: '0.5', b: '0.25', quarter: true, value: '0.75', world: WORLDS.kit };
    else if ((m = /^(\d+) − ([\d.]+) = \?$/.exec(p))) s = { kind: 'sub', a: +m[1], b: m[2], value: fmt(+m[1] - +m[2]), world: WORLDS.kit };
    // ---- counting up: change and differences
    else if ((m = /^מחברת עולה ([\d.]+) ₪ ועט ([\d.]+) ₪\. כמה עודף מ־(\d+) ₪\?$/.exec(p))) s = upPlan(+m[1] + +m[2], +m[3]);
    else if ((m = /^בכרטיס יש (\d+) ₪\. קניתי מוצר שמחירו ([\d.]+) ₪\. כמה ₪ נשארו בכרטיס\?$/.exec(p))) s = upPlan(+m[2], +m[1]);
    else if ((m = /^שחיין א׳ סיים ב־([\d.]+) שניות ושחיין ב׳ ב־([\d.]+) שניות\. בכמה שניות היה שחיין ב׳ מהיר יותר\?$/.exec(p))) s = upPlan(Math.min(+m[1], +m[2]), Math.max(+m[1], +m[2]));
    // ---- rounding
    else if ((m = /^עגלו את ([\d.]+) (לעשיריות|למספר שלם)\.$/.exec(p))) {
      const x = +m[1], unit = m[2] === 'לעשיריות' ? 0.1 : 1, down = Math.floor(x / unit + 1e-9) * unit, up = down + unit;
      const dDown = Math.round((x - down) / (unit / 10)), dUp = Math.round((up - x) / (unit / 10));
      s = { kind: 'round', x: m[1], unit: unit, dDown: dDown, dUp: dUp, value: fmt(dUp < dDown ? up : down), world: WORLDS.race };
    }
    // ---- crossing a whole
    else if ((m = /^בלי לחשב במדויק: האם ([\d.]+) \+ ([\d.]+) גדול מ־(\d+)\? \(כן\/לא\)$/.exec(p)) && item.music === 'tenthsTogether') {
      const a = +m[1], b = +m[2], lim = +m[3];
      if (Math.floor(a) === lim - 1 && b < 1) s = { kind: 'cross', a: m[1], tenthsB: Math.round(b * 10), lim: lim, value: a + b > lim ? 'כן' : 'לא', world: WORLDS.kit };
    }
    // ---- multiplying and dividing decimals
    else if ((m = /^([\d.]+) × (\d+) = \?$/.exec(p)) && /\./.test(m[1])) { const a = m[1], k = +m[2]; if (k <= 4 && +a < 2) s = { kind: 'loop', a: a, k: k, value: fmt(+a * k), world: WORLDS.loop }; }
    else if (/^0\.3 × 0\.2 = \?$/.test(p)) s = { kind: 'partOfPart', of: 2, take: 3, value: '0.06', world: WORLDS.loop };
    else if ((m = /^([\d.]+) : (\d) = \?$/.exec(p)) && /\./.test(m[1])) { const a = +m[1], k = +m[2]; const tenths = Math.round(a * 10); if (Number.isInteger(a * 10) && tenths % k === 0) s = { kind: 'deal', wholes: Math.floor(a), tenths: tenths % 10, k: k, value: fmt(a / k), world: WORLDS.loop }; }
    else if ((m = /^([\d.]+) : 0\.(\d+) = \?$/.exec(p))) {
      const a = +m[1], d = +('0.' + m[2]);
      if (d === 0.4 && a < 3) s = { kind: 'fit', total: Math.round(a * 10), group: 4, value: fmt(a / d), world: WORLDS.loop };
      else if (d === 0.25) s = { kind: 'fitQuarter', a: a, value: fmt(a / d), world: WORLDS.loop };
    } else if ((m = /^שלושה שירים: ([\d.]+), ([\d.]+) ו־([\d.]+) דקות\. מה האורך הממוצע בדקות\?$/.exec(p))) {
      const vs = [+m[1], +m[2], +m[3]], floor = Math.min.apply(null, vs), extra = vs.map((v) => Math.round((v - floor) * 10));
      const total = extra.reduce((a, b) => a + b, 0);
      if (total % 3 === 0 && Math.max.apply(null, extra) <= MAX_RUN) s = { kind: 'mean', extra: extra, share: total / 3, value: fmt(floor + total / 30), world: WORLDS.hora };
    }
    // ---- musical intervals
    else if ((m = /(\d+) × 1\.(5|25) = \?$/.exec(p))) { const n = +m[1], f = m[2] === '5' ? 1.5 : 1.25; s = { kind: 'interval', n: n, part: f === 1.5 ? 2 : 4, value: fmt(n * f), world: WORLDS.strings }; }
    else if ((m = /^צליל של (\d+) הרץ הוא קווינטה מעל איזה תדר\? \d+ : 1\.5 = \?$/.exec(p))) { const n = +m[1]; s = { kind: 'intervalBack', n: n, value: fmt(n / 1.5), world: WORLDS.strings }; }
    // ---- nearly whole: estimation
    else if (item.music === 'nearlyWholeNote') s = nearlyPlan(p);
    if (!s || s.value == null || String(s.value) !== raw) return null;   // the sounds give exactly the answer
    s.answer = String(s.value);
    let ev;
    try { ev = soundEvents(s); } catch (e) { return null; }
    if (!ev.length || longestRun(ev) > MAX_RUN || ev.length > MAX_EVENTS) return null;
    return s;
  }

  // counting up from a to b: hundredths to the next tenth, tenths to the next whole, wholes to the next ten, tens
  function upPlan(a, b) {
    let x = Math.round(a * 100); const end = Math.round(b * 100);
    const steps = [];
    const take = (unit) => { while (x + unit <= end && (x % (unit * 10) !== 0 || unit * 10 > end - x) && steps.filter((s) => s === unit).length < 9) { x += unit; steps.push(unit); if (x % (unit * 10) === 0) break; } };
    if (x % 10) take(1);
    if (x % 100) take(10);
    if (x % 1000) take(100);
    while (x + 1000 <= end) { x += 1000; steps.push(1000); }
    while (x + 100 <= end) { x += 100; steps.push(100); }
    while (x + 10 <= end) { x += 10; steps.push(10); }
    while (x + 1 <= end) { x += 1; steps.push(1); }
    if (x !== end || steps.length > 24) return null;
    return { kind: 'up', steps: steps, value: fmt((end - Math.round(a * 100)) / 100), world: WORLDS.kit };
  }

  // a number heard as its nearest whole and a small sign: a bit more or a bit less
  function nearlyPlan(p) {
    let m;
    const near = (x) => ({ whole: Math.round(x), sign: x > Math.round(x) ? 1 : x < Math.round(x) ? -1 : 0 });
    if ((m = /האם ([\d.]+) \+ ([\d.]+) גדול מ־(\d+)\?/.exec(p))) { const a = near(+m[1]), b = near(+m[2]); return { kind: 'nearly', op: '+', parts: [a, b], lim: +m[3], value: +m[1] + +m[2] > +m[3] ? 'כן' : 'לא', world: WORLDS.kit }; }
    if ((m = /האם ([\d.]+) − ([\d.]+) גדול מ־(\d+)\?/.exec(p))) { const a = near(+m[1]), b = near(+m[2]); return { kind: 'nearly', op: '−', parts: [a, b], lim: +m[3], value: +m[1] - +m[2] > +m[3] ? 'כן' : 'לא', world: WORLDS.kit }; }
    if ((m = /האם ([\d.]+) × ([\d.]+) גדול מ־(\d+)\?/.exec(p))) { const a = near(+m[1]), b = near(+m[2]); return { kind: 'nearly', op: '×', parts: [a, b], lim: +m[3], value: +m[1] * +m[2] > +m[3] ? 'כן' : 'לא', world: WORLDS.kit }; }
    if ((m = /האם (\d+) : ([\d.]+) גדול מ־(\d+)\?/.exec(p))) { const a = near(+m[1]), b = near(+m[2]); return { kind: 'nearly', op: ':', parts: [a, b], lim: +m[3], value: +m[1] / +m[2] > +m[3] ? 'כן' : 'לא', world: WORLDS.kit }; }
    if ((m = /^רק אחד נכון: (\d+) × ([\d.]+) = ([\d.]+) או (\d+) × ([\d.]+) = ([\d.]+)\./.exec(p))) {
      const ok1 = +m[3] > +m[1], ok2 = +m[6] > +m[4];         // × (1 and a bit) must give MORE than the number
      if (ok1 !== ok2) return { kind: 'nearlyPick', cands: [[+m[1], +m[3]], [+m[4], +m[6]]], value: ok1 ? m[3] : m[6], world: WORLDS.kit };
    }
    return null;
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
    const placeHit = (pl, stage, extra) => { const v = PLACE[pl]; hit(v[0], v[1], pl >= 0 ? 0.25 : 0.06, 0.22, stage, Object.assign({ place: pl, worth: Math.pow(10, pl) }, extra)); };
    // a number as place phrases: a soft turn marker for every place (even a zero), then its strokes
    const phrase = (str, stage, lowest, extra) => {
      const d = digitsOf(str), high = Math.max(0, ...Object.keys(d).map(Number));
      for (let pl = high; pl >= Math.min(lowest, ...Object.keys(d).map(Number)); pl--) {
        hit('shaker', 300, 0.1, 0.06, 'turn', Object.assign({ place: pl }, extra)); t += 0.3;
        for (let i = 0; i < (d[pl] || 0); i++) { placeHit(pl, stage, extra); t += 0.3; }
        t += 0.35;
      }
      t += GAP;
    };
    // a value in time: tenth ticks, then hundredth flutter; returns the stop time
    const inTime = (val, t0, voiceHz, stage, extra) => {
      const v = Math.round(val * 100), tenths = Math.floor(v / 10), hund = v % 10;
      for (let i = 0; i < tenths; i++) ev.push(Object.assign({ at: t0 + i * TICK, voice: 'woodClick', hz: voiceHz, dur: 0.05, gain: 0.2, stage: stage, worth: 0.1 }, extra));
      for (let i = 0; i < hund; i++) ev.push(Object.assign({ at: t0 + tenths * TICK + i * FINE * 2.5, voice: 'shaker', hz: voiceHz * 1.5, dur: 0.02, gain: 0.16, stage: stage + 'Fine', worth: 0.01 }, extra));
      const stop = t0 + v * FINE;
      ev.push(Object.assign({ at: stop + 0.02, voice: 'metalBell', hz: voiceHz * 2, dur: 0.3, gain: 0.18, stage: 'stop' }, extra));
      return stop;
    };
    switch (spec.kind) {
      case 'cycle':
        for (let i = 0; i < 10; i++) { if (i < spec.n) hit('drumHigh', 660, 0.08, 0.22, 'beat', { i: i }); t += TICK; }   // the rest of the cycle is real silence
        hit('drumLow', 98, 0.3, 0.22, 'sam');                                                                           // the cycle comes home
        break;
      case 'places':
        phrase(spec.str, 'digit', spec.lowest);
        break;
      case 'race': {
        const hz = [900, 1200, 1500, 1800];
        let end = 0;
        spec.nums.forEach((n, i) => { end = Math.max(end, inTime(+n, 0, hz[i % 4], 'run', { voice: i })); });
        break;
      }
      case 'quarter': {
        // the 4/4 bar: the sounding beats, the rest real silence; then the same bar in tenths and hundredths
        const bar = 10 * TICK;
        for (let b = 0; b < 4; b++) { if (b < spec.beats) ev.push({ at: b * bar / 4, voice: 'drumLow', hz: 110, dur: 0.3, gain: 0.24, stage: 'popBeat' }); }
        const t0 = bar + GAP;
        inTime(spec.beats / 4, t0, 1300, 'decimal');
        break;
      }
      case 'beat': {
        // a reference second (or two) cut into tenths, and the metronome inside it
        const secs = 60 / spec.bpm < 1 && Number.isInteger(60 / spec.bpm * 10) ? 1 : 2;
        const tick = 1.0 / 10;
        for (let i = 0; i <= secs * 10; i++) ev.push({ at: i * tick * 3, voice: 'woodClick', hz: i % 10 === 0 ? 900 : 1500, dur: 0.03, gain: i % 10 === 0 ? 0.2 : 0.1, stage: i % 10 === 0 ? 'second' : 'tenth' });
        const beat = 60 / spec.bpm;
        for (let b = 0; b * beat <= secs + 1e-9; b++) ev.push({ at: b * beat * 3, voice: 'drumLow', hz: 98, dur: 0.25, gain: 0.26, stage: 'metronome' });
        break;
      }
      case 'shift': {
        phrase(spec.from, 'before', lowestPlace(spec.from));
        for (let i = 0; i < Math.abs(spec.shift); i++) { hit('shaker', spec.shift > 0 ? 260 : 620, 0.35, 0.12, 'swap'); t += 0.5; }
        t += GAP;
        phrase(spec.value, 'after', lowestPlace(spec.value));
        break;
      }
      case 'add': {
        const da = digitsOf(spec.a), db = digitsOf(spec.b), sum = digitsOf(spec.value);
        const pls = [...new Set(Object.keys(da).concat(Object.keys(db), Object.keys(sum)).map(Number))].sort((x, y) => y - x);
        pls.forEach((pl) => {
          hit('shaker', 300, 0.1, 0.06, 'turn', { place: pl }); t += 0.3;
          for (let i = 0; i < (da[pl] || 0); i++) { placeHit(pl, 'layerA'); t += 0.3; }
          t += 0.15;
          for (let i = 0; i < (db[pl] || 0); i++) { placeHit(pl, 'layerB'); t += 0.3; }
          t += 0.45;
        });
        break;
      }
      case 'sub': {
        const db = digitsOf(spec.b);
        for (let i = 0; i < spec.a; i++) { placeHit(0, 'whole'); t += 0.4; }
        t += 0.4;
        hit('shaker', 520, 0.3, 0.12, 'break'); t += 0.45;                                                // one whole breaks into ten tenths
        for (let i = 0; i < 10; i++) { placeHit(-1, 'broken'); t += 0.22; }
        t += GAP;
        for (let i = 0; i < (db[0] || 0); i++) { hit('bowed', 196, 0.25, 0.14, 'takeWhole'); t += 0.4; }
        for (let i = 0; i < (db[-1] || 0); i++) { hit('bowed', 330, 0.12, 0.12, 'takeTenth'); t += 0.3; }
        t += GAP;
        phrase(spec.value, 'left', -1);
        break;
      }
      case 'up':
        hit('bowed', 196, 0.6, 0.18, 'start'); t += 0.9;
        spec.steps.forEach((w, i) => { const pl = Math.round(Math.log10(w)) - 2; placeHit(pl, 'step', { worth: w / 100 }); t += 0.3 + (spec.steps[i + 1] && spec.steps[i + 1] !== w ? 0.35 : 0); });
        hit('metalBell', 1568, 0.4, 0.16, 'arrived');
        break;
      case 'round': {
        const u = spec.unit, finePl = u === 1 ? -1 : -2;
        phrase(spec.x, 'number', lowestPlace(spec.x));
        for (let i = 0; i < spec.dDown; i++) { placeHit(finePl, 'down'); t += 0.26; }
        hit('metalBell', 784, 0.25, 0.14, 'candidateDown'); t += GAP;
        for (let i = 0; i < spec.dUp; i++) { placeHit(finePl, 'up'); t += 0.26; }
        hit('metalBell', 1047, 0.25, 0.14, 'candidateUp');
        break;
      }
      case 'cross': {
        phrase(spec.a, 'start', lowestPlace(spec.a));
        const d = digitsOf(spec.a);
        let tenths = d[-1] || 0;
        for (let i = 0; i < spec.tenthsB; i++) {
          placeHit(-1, 'add'); t += 0.3;
          tenths++;
          if (tenths === 10) { hit('metalBell', 1568, 0.4, 0.18, 'crossWhole'); t += 0.45; }
        }
        break;
      }
      case 'loop': {
        const d = digitsOf(spec.a);
        for (let k = 0; k < spec.k; k++) { for (let i = 0; i < (d[0] || 0); i++) { placeHit(0, 'copyWhole', { copy: k }); t += 0.36; } for (let i = 0; i < (d[-1] || 0); i++) { placeHit(-1, 'copyTenth', { copy: k }); t += 0.26; } t += GAP; }
        const packs = Math.floor((d[-1] || 0) * spec.k / 10);
        for (let i = 0; i < packs; i++) { hit('shaker', 260, 0.3, 0.12, 'pack'); t += 0.4; placeHit(0, 'packedWhole'); t += 0.45; }
        break;
      }
      case 'partOfPart':
        for (let i = 0; i < spec.of; i++) { placeHit(-1, 'tenth'); t += 0.4; }
        t += GAP;
        for (let j = 0; j < spec.of; j++) {
          for (let i = 0; i < 10; i++) { if (j === 0) { placeHit(-2, 'split', { tenth: j }); } t += 0.12; }   // the first tenth splits in full
          t += 0.35;
          for (let i = 0; i < spec.take; i++) { placeHit(-2, 'taken', { tenth: j }); t += 0.28; }
          t += GAP;
        }
        break;
      case 'deal': {
        const hz = [262, 330, 392, 494];
        for (let r = 0; r < Math.floor(spec.wholes / spec.k); r++) { for (let c = 0; c < spec.k; c++) { hit('drumLow', 110 * (1 + c * 0.12), 0.25, 0.22, 'dealWhole', { kid: c }); t += 0.3; } t += 0.4; }
        const left = spec.wholes % spec.k;
        for (let i = 0; i < left; i++) { hit('shaker', 520, 0.3, 0.12, 'break'); t += 0.4; }
        t += 0.3;
        const tenths = left * 10 + spec.tenths;
        for (let r = 0; r < tenths / spec.k; r++) { for (let c = 0; c < spec.k; c++) { hit('woodClick', hz[c] * 4, 0.05, 0.2, 'dealTenth', { kid: c }); t += 0.26; } t += 0.35; }
        break;
      }
      case 'fit':
        for (let g = 0; g < spec.total / spec.group; g++) { for (let i = 0; i < spec.group; i++) { placeHit(-1, 'tenth', { group: g }); t += 0.26; } t += 0.45; }
        break;
      case 'fitQuarter':
        hit('drumLow', 110, 0.4, 0.24, 'whole'); t += 0.6;
        for (let q = 0; q < 4; q++) { hit('drumHigh', 660, 0.08, 0.2, 'quarter'); t += 0.4; }
        t += GAP;
        phrase(String(spec.a), 'wholes', 0);
        break;
      case 'mean':
        spec.extra.forEach((x, d) => { hit('drumLow', 98, 0.3, 0.22, 'floor', { d: d }); t += 0.35; for (let i = 0; i < x; i++) { placeHit(-1, 'above', { d: d }); t += 0.24; } t += GAP; });
        for (let r = 0; r < spec.share; r++) { for (let d = 0; d < spec.extra.length; d++) { hit('metalBell', 1047 + 60 * d, 0.1, 0.14, 'share', { d: d }); t += 0.26; } t += 0.35; }
        break;
      case 'interval': {
        phrase(String(spec.n), 'base', 0);
        phrase(String(spec.n / spec.part), 'extra', 0);                                                      // half (or a quarter) of it
        hit('bowed', 220, 0.8, 0.14, 'toneLow'); hit('bowed', 220 * (1 + 1 / spec.part), 0.8, 0.14, 'toneHigh');   // the real interval
        break;
      }
      case 'intervalBack':
        phrase(String(spec.n), 'whole', 0);
        for (let i = 0; i < 3; i++) { hit('drumLow', 110, 0.3, 0.2, 'third', { i: i }); t += 0.45; }        // three equal halves of the lower tone
        t += GAP;
        phrase(String(spec.n / 3), 'oneHalf', 0);
        break;
      case 'nearly':
        spec.parts.forEach((pt, i) => {
          const tens = Math.floor(pt.whole / 10), ones = pt.whole % 10;                       // the nearest whole, in tens and ones
          for (let k = 0; k < tens; k++) { placeHit(1, 'near', { part: i }); t += 0.36; }
          if (tens && ones) t += 0.3;
          for (let k = 0; k < ones; k++) { placeHit(0, 'near', { part: i }); t += 0.3; }
          if (pt.sign) { hit('bowed', 440, 0.25, 0.12, pt.sign > 0 ? 'bitMore' : 'bitLess', { part: i, hz2: pt.sign }); t += 0.4; }
          t += GAP;
        });
        hit('metalBell', 1568, 0.4, 0.16, 'limit');
        break;
      case 'nearlyPick':
        spec.cands.forEach(([n, r], i) => {
          phrase(String(n), 'number', 0, { cand: i });
          hit('bowed', 440, 0.25, 0.12, 'bitMore', { cand: i }); t += 0.5;
          phrase(String(Math.floor(r)), 'claimed', 0, { cand: i });
        });
        break;
      default:
        break;
    }
    ev.sort((a, b) => a.at - b.at);
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
    cycle: 'המחזור הוא שלם אחד של עשר פעמות. כמה פעמות נשמעות, וכמה הן שקט אמיתי?',
    places: 'כל כלי הוא מקום: תוף נמוך — שלמים, וודבלוק — עשיריות, שייקר — מאיות. סימן תור רך נשמע גם כשהמקום ריק. כמה פעמים מנגן כל כלי?',
    race: 'הקולות מתחילים יחד. נקישה היא עשירית, רפרוף קטן הוא מאיות. כל קול עוצר בפעמון כשהמספר שלו נגמר. ספרות רבות יותר אינן אומרות גדול יותר — מי עוצר מאוחר יותר?',
    quarter: 'קודם תיבת פופ של ארבע פעמות — רק חלק מהן נשמע, והשאר שקט. אחר כך אותו רגע בעשיריות ובמאיות. איפה עוצרים?',
    beat: 'נקישות דקות מחלקות כל שנייה לעשר עשיריות, ונקישה חזקה פותחת כל שנייה. התוף הוא המטרונום. כמה עשיריות בין שתי מכות תוף?',
    shift: 'אותו מספר צלילים לפני ואחרי — כל צליל עובר לגוון של מקום אחר. סימן התור נשמע גם במקום ריק.',
    add: 'לכל מקום — שכבה ראשונה ואחריה השכבה השנייה, באותו גוון. כמה בכל מקום יחד?',
    sub: 'קודם השלמים. שלם אחד נשבר לעשר עשיריות, ואז מוציאים. מה נשאר?',
    up: 'סופרים קדימה מהמספר הקטן: קודם מאיות עד העשירית הבאה, אחר כך עשיריות עד השלם, ואז שלמים ועשרות. כמה הוספנו בסך הכול?',
    round: 'קודם המספר. אחר כך כמה צעדים קטנים אחורה עד המועמד הקטן, וכמה קדימה עד הגדול. מי קרוב יותר?',
    cross: 'מהמספר מוסיפים עשיריות. פעמון — עברנו שלם. האם נשמע פעמון?',
    loop: 'אותו משפט חוזר, ושקט בין החזרות. כל עשר עשיריות נארזות לשלם אחד.',
    partOfPart: 'קודם העשיריות. עשירית אחת נפתחת לעשר מאיות, ומכל עשירית לוקחים רק חלק. כמה מאיות בסך הכול?',
    deal: 'מחלקים בסבבים, אחד לכל קול. שלם שלא מספיק לכולם נשבר לעשיריות. מה קיבל הקול הראשון?',
    fit: 'כמה קבוצות כאלה נכנסות בכל העשיריות?',
    fitQuarter: 'שלם אחד נפתח לרבעים. אחר כך כל השלמים. כמה רבעים בכולם?',
    mean: 'כל רוקד: מכה עמוקה, ואחריה מה שיש לו מעל הקטן ביותר. אחר כך מחלקים את העודף בסבבים. את הערך הזה בנינו — לאף אחד הוא לא היה בהתחלה.',
    interval: 'המספר, ואחריו החלק שמוסיפים לו. ובסוף — שני צלילים אמיתיים יחד: זה המרווח.',
    intervalBack: 'המספר מתחלק לשלושה חצאים שווים של הצליל הנמוך. כמה הם שני חצאים?',
    nearly: 'כל מספר נשמע כמספר השלם הקרוב, ועוד סימן קטן: מעט יותר או מעט פחות. אחר כך הגבול.',
    nearlyPick: 'לכל תרגיל: המספר, סימן "פי אחד ועוד קצת", והתוצאה שהוצעה. כפל בקצת יותר מאחד חייב לתת קצת יותר.',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    return '<div class="decimal-worlds">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc(HOW[spec.kind]) + '</p>'
      + (revealed
        ? '<p class="band-predict dcw-silent">עכשיו בלי צליל: כתבו בטבלת מקומות (שלמים, עשיריות, מאיות) ובדקו שוב.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו: כמה שווה צליל אחד?</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, WORLDS: WORLDS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html, digitsOf: digitsOf };
});
