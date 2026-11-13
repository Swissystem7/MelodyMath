// MelodyMath — BigNumbers: large numbers to millions, heard (grades ג׳–ה׳;
// tags thousandAccents, carryAccentUp, millionAccentLevels, carryTenUp,
// periodAccentLevels, regroupAllLevels). Research:
// docs/research/big-numbers-2026-11-14.md (Perplexity + Meta AI).
//
// Meta AI: the trap is hearing 42 sounds instead of hearing 3,456,789, and a
// zero turning into a one. So:
//   an Orff ensemble — the school instruments children know — one instrument
//     per place, all equally loud: glockenspiel = ones, soprano xylophone =
//     tens, alto xylophone = hundreds, metallophone = thousands, hand drum =
//     ten thousands, bass drum = hundred thousands, shaker = millions.
//   always from the ones upward; a turn marker BEFORE every place; inside the
//     place, its strokes — or real silence for a zero (never a soft marker).
//   periods of three places end with the same frame sound and a longer pause.
//   one packing sound everywhere: ten of a place packed into one of the next.
//   a bundle (ten hundreds, ten thousands) is heard once equal to its ten.
//   rounding: the deciding digit's distance down against its distance up.
//   subtraction and missing addends: counting up in jumps, each jump a phrase.
// Never more than 12 sounds in a row; the widget shows only when the sounds
// (with the numbers in the text) give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_BIG_NUMBERS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['thousandAccents', 'carryAccentUp', 'millionAccentLevels', 'carryTenUp', 'periodAccentLevels', 'regroupAllLevels', 'repeatedBars', 'takeAwayBeats', 'tableRowGroups', 'rowCellGroups', 'columnsAsNotes', 'callResponse']);
  // the modules that already own repeatedBars / takeAwayBeats items keep them
  const EXTRA_TAGS = ['repeatedBars', 'takeAwayBeats', 'tableRowGroups', 'rowCellGroups', 'columnsAsNotes', 'callResponse'];   // only the vertical-multiplication and counting-up rules use these
  const OWNERS = ['multiplyWorlds', 'timesTable', 'takeAwayTen', 'dragPlace', 'dataWorlds', 'earlyBeats'];
  const nodeOwners = [];
  if (typeof module === 'object' && module.exports && typeof require === 'function') OWNERS.forEach((f) => { try { nodeOwners.push(require('./' + f + '.js')); } catch (e) { /* absent */ } });
  const otherPlays = (item) => {
    const mods = nodeOwners.length ? nodeOwners : [root && root.MM_MULTIPLY_WORLDS, root && root.MM_TIMES_TABLE, root && root.MM_TAKEAWAY_TEN, root && root.MM_DRAG_PLACE, root && root.MM_DATA_WORLDS, root && root.MM_EARLY_BEATS];
    return mods.some((mod) => { try { return !!(mod && mod.specForItem && mod.specForItem(item)); } catch (e) { return false; } });
  };
  const MAX_RUN = 12;
  const MAX_EVENTS = 60;
  const STEP = 0.24, SLOT = 0.9, GAP = 0.6;
  // place → [voice, hz, Hebrew name]
  const ORFF = [['tine', 2093, 'גלוקנשפיל'], ['woodBar', 880, 'קסילופון סופרן'], ['woodBar', 523, 'קסילופון אלט'], ['metalBell', 660, 'מטלופון'], ['frameDrum', 196, 'תוף יד'], ['drumLow', 98, 'תוף בס'], ['shaker', 1200, 'שייקר']];
  const PLACE_HE = ['האחדות', 'העשרות', 'המאות', 'האלפים', 'עשרות האלפים', 'מאות האלפים', 'המיליונים'];

  const WORLD = { he: 'הרכב אורף', why: 'כלי הנגינה של שיעור המוזיקה, בשיטה שפיתח קרל אורף: לכל מקום במספר כלי משלו, כולם באותה עוצמה, ומנגנים בתורות — מהאחדות כלפי מעלה' };

  const num = (s) => +String(s).replace(/,/g, '');
  const digits = (n) => String(n).split('').reverse().map(Number);

  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const p = String(item.prompt || '').trim();
    const raw = String(item.answer).trim();
    let m, s = null;
    const PL = { 'האחדות': 0, 'העשרות': 1, 'המאות': 2, 'האלפים': 3, 'עשרות האלפים': 4, 'מאות האלפים': 5, 'המיליונים': 6 };
    if (otherPlays(item)) return null;   // DragPlace, MultiplyWorlds, TimesTable and TakeAwayTen keep what they already play
    if (EXTRA_TAGS.indexOf(item.music) >= 0) s = extraPlan(p);
    else if ((m = /^מה הספרה במקום (האחדות|העשרות|המאות|האלפים) במספר ([\d,]+)\?$/.exec(p)) || (m = /^במספר ([\d,]+), מהי ספרת (מאות האלפים|עשרות האלפים|המיליונים|האלפים|המאות)\?$/.exec(p))) {
      const place = PL[m[1]] != null ? PL[m[1]] : PL[m[2]], n = num(PL[m[1]] != null ? m[2] : m[1]);
      s = { kind: 'number', n: n, ask: place, value: digits(n)[place] || 0 };
    } else if ((m = /^צליל של (\d+) הרץ\. (?:כמה אלפים יש במספר|מה ספרת (המאות|העשרות))\?$/.exec(p))) {
      const n = +m[1], place = m[2] ? PL[m[2]] : 3;
      s = { kind: 'number', n: n, ask: place, value: digits(n)[place] || 0 };
    } else if ((m = /^([\d,]+(?: \+ [\d,]+)+) = \?/.exec(p)) && m[1].split(' + ').every((x) => /^[1-9]0*$/.test(x.replace(/,/g, '')))) {
      const n = m[1].split(' + ').reduce((a, x) => a + num(x), 0);
      s = { kind: 'number', n: n, value: n };
    } else if (/^כתבו בספרות: שני מיליון ושלוש מאות אלף/.test(p)) s = { kind: 'number', n: 2300000, value: 2300000 };
    else if (/^מהו המספר הקטן ביותר בן 7 ספרות\?/.test(p)) s = { kind: 'number', n: 1000000, value: 1000000 };
    else if ((m = /^כמה מאות שלמות יש במספר ([\d,]+)\?$/.exec(p))) { const n = num(m[1]); if (n % 100 === 0 && n < 10000) s = { kind: 'hundreds', thousands: Math.floor(n / 1000), hundreds: (n % 1000) / 100, value: n / 100 }; }
    else if (/^כמה אלפים יש במיליון\?/.test(p)) s = { kind: 'levels', value: 1000 };
    else if ((m = /^מה המספר שבא אחרי ([\d,]+)\?/.exec(p))) { const n = num(m[1]); if (/^1?9+$/.test(String(n))) s = { kind: 'cascade', n: n, value: n + 1 }; }
    else if ((m = /^עגלו את ([\d,]+) (לאלפים|לעשרות אלפים|למאות אלפים|למיליונים)\./.exec(p))) {
      const n = num(m[1]), place = { 'לאלפים': 3, 'לעשרות אלפים': 4, 'למאות אלפים': 5, 'למיליונים': 6 }[m[2]];
      const unit = Math.pow(10, place), d = digits(n)[place - 1] || 0, down = Math.floor(n / unit) * unit;
      s = { kind: 'round', n: n, place: place, d: d, value: d >= 5 ? down + unit : down };
    } else if ((m = /^איזה (?:גבוה|גדול|מספר גדול|מספר קטן|קטן) יותר: ([\d,]+)(?: הרץ)? או ([\d,]+)(?: הרץ)?\?/.exec(p)) || (m = /^צליל א׳ (\d+) הרץ, צליל ב׳ (\d+) הרץ\. איזה מספר גדול יותר\?/.exec(p))) {
      const a = num(m[1]), b = num(m[2]), big = !/קטן יותר/.test(p);
      s = { kind: 'compare', a: a, b: b, big: big, value: big ? Math.max(a, b) : Math.min(a, b) };
    } else if ((m = /^(\d) אלפים, (\d) מאות, (\d) עשרות ו־(\d) יחידות/.exec(p))) { const n = +m[1] * 1000 + +m[2] * 100 + +m[3] * 10 + +m[4]; s = { kind: 'number', n: n, value: n }; }
    else if ((m = /^(\d) אלפים ועוד (1\d) מאות שווים/.exec(p))) { const th = +m[1], h = +m[2]; s = { kind: 'regroup', thousands: th, hundreds: h, value: th * 1000 + h * 100 }; }
    else if ((m = /^([\d,]+) × (10|100|1,000) = \?/.exec(p))) { const a = num(m[1]), k = num(m[2]); s = { kind: 'shift', a: a, times: Math.round(Math.log10(k)), value: a * k }; }
    else if ((m = /^בעיר אחת ([\d,]+) תושבים ובעיר אחרת ([\d,]+)\. בכמה גדול/.exec(p))) { const a = num(m[1]), b = num(m[2]); s = upPlan(Math.min(a, b), Math.max(a, b)); }
    else if ((m = /^([\d,]+) × 4 = \?/.exec(p))) { const a = num(m[1]); s = { kind: 'stages', stages: [['×', 2 * a], ['×', 4 * a]], value: 4 * a }; }
    else if ((m = /^([\d,]+) × 1 = \?/.exec(p))) s = { kind: 'timesOne', n: num(m[1]), value: num(m[1]) };
    else if (/^0 × [\d,]+ = \?/.test(p)) s = { kind: 'timesZero', value: 0 };
    else if ((m = /^אומדן: ([\d,]+) × (\d+) קרוב יותר ל־([\d,]+) או ל־([\d,]+)\?/.exec(p))) {
      const a = num(m[1]), b = +m[2], u = Math.pow(10, String(a).length - 1);
      const A = Math.round(a / u) * u, B = Math.round(b / 10) * 10, est = A * B, c1 = num(m[3]), c2 = num(m[4]);
      s = { kind: 'estimate', A: A, B: B, est: est, value: Math.abs(est - c1) < Math.abs(est - c2) ? c1 : c2 };
    } else if ((m = /^([\d,]+) \+ ([\d,]+) = \?/.exec(p)) || (m = /נמכרו ([\d,]+) כרטיסים ולשני ([\d,]+)\./.exec(p)) || (m = /^בספריית התווים ([\d,]+) דפים, והוסיפו עוד ([\d,]+)\./.exec(p))) {
      const a = num(m[1]), b = num(m[2]);
      s = { kind: 'add', a: a, b: b, value: a + b };
    } else if ((m = /^([\d,]+) − ([\d,]+) = \?/.exec(p)) || (m = /^באולם ([\d,]+) מקומות, ו־([\d,]+) כבר תפוסים\./.exec(p)) || (m = /צריכה לאסוף ([\d,]+) ₪ וכבר אספה ([\d,]+) ₪\./.exec(p))) {
      const a = num(m[1]), b = num(m[2]);
      if (a > b) s = upPlan(b, a);
    } else if ((m = /^השלימו: ([\d,]+) \+ ☐ = ([\d,]+)/.exec(p))) s = upPlan(num(m[1]), num(m[2]));
    else if ((m = /^השלימו: ([\d,]+) − ☐ = ([\d,]+)/.exec(p))) s = upPlan(num(m[2]), num(m[1]));
    else if ((m = /^השלימו: ☐ − ([\d,]+) = ([\d,]+)/.exec(p))) { const a = num(m[2]), b = num(m[1]); s = upPlan(a, a + b); if (s) { s.start = a; s.value = a + b; s.addMode = true; } }
    else if ((m = /^השלימו: ([\d,]+) = ([\d,]+) \+ ☐/.exec(p))) s = upPlan(num(m[2]), num(m[1]));
    else if ((m = /^הצליל הגבוה ביותר בפסנתר הוא (\d+) הרץ\. כמה חסר לו עד ([\d,]+)\?/.exec(p))) s = upPlan(+m[1], num(m[2]));
    else if ((m = /^צליל של (\d+) הרץ, ועוד (\d+) צעדים של (\d+) הרץ\./.exec(p))) { const a = +m[1], k = +m[2], w = +m[3]; s = { kind: 'steps', a: a, k: k, w: w, value: a + k * w }; }
    else if ((m = /^([\d,]+) : (\d+) = \?/.exec(p))) { const n = num(m[1]), k = +m[2]; if (n % 1000 === 0 && (n / 1000) % k === 0 && n / 1000 / k <= 10) s = { kind: 'groups', thousands: n / 1000, k: k, value: n / k }; }
    else if ((m = /^(\d+) × 5 = \?$/.exec(p))) { const a = +m[1]; if (a % 2 === 0 && a < 100) s = { kind: 'halfTen', a: a, value: a * 5 }; }
    else if ((m = /^נתון: (\d+) × (\d+) = ([\d,]+)\. כמה זה \1 × (\d+)\?/.exec(p))) { const a = +m[1], b = +m[2], P = num(m[3]), c = +m[4]; if (c === b + 1) s = { kind: 'oneMore', known: P, group: a, value: P + a }; }
    else if ((m = /^נתון: (\d+) × (\d+) = ([\d,]+)\. כמה זה \3 : \2\?/.exec(p))) s = { kind: 'inverse', known: num(m[3]), value: +m[1] };
    else if ((m = /^\(([\d,]+) − ([\d,]+)\) × (\d+) : (\d+) = \?/.exec(p))) { const b = num(m[1]) - num(m[2]), x = b * +m[3]; s = { kind: 'stages', stages: [['(', b], ['×', x], [':', x / +m[4]]], value: x / +m[4] }; }
    else if ((m = /^(\d+) × (\d+) \+ (\d+) = \?/.exec(p))) { const x = +m[1] * +m[2]; s = { kind: 'stages', stages: [['×', x], ['+', x + +m[3]]], value: x + +m[3] }; }
    if (!s && item.music === 'regroupAllLevels') s = extraPlan(p);   // vertical multiplication up to the millions too
    if (!s || String(s.value) !== raw) return null;   // the sounds give exactly the answer
    s.world = WORLD;
    s.answer = String(s.value);
    let ev;
    try { ev = soundEvents(s); } catch (e) { return null; }
    if (!ev.length || longestRun(ev) > MAX_RUN || ev.length > MAX_EVENTS) return null;
    return s;
  }

  // repeatedBars / takeAwayBeats: vertical multiplication as partial products, and taking away by counting up
  function extraPlan(p) {
    let m;
    if ((m = /^חשבו במאונך: ([\d,]+) × (\d+)(?: \(כתבו בלי פסיק\))?$/.exec(p)) || (m = /^(\d\d) × (\d\d) = \?$/.exec(p))) {
      // every digit times the multiplier is one whole number of the ensemble
      const a = num(m[1]), b = +m[2], parts = [];
      if (b < 10) digits(a).forEach((d, place) => { if (d) parts.push(d * b * Math.pow(10, place)); });
      else digits(b).forEach((d, place) => { if (d) parts.push(a * d * Math.pow(10, place)); });
      if (parts.length >= 2 && parts.length <= 3) return { kind: 'partials', parts: parts.reverse(), value: parts.reduce((x, y) => x + y, 0) };
    } else if ((m = /^היו (\d+) [^.]+\. (?:נמכרו|הוציאו|חולקו) (\d+)[^.]*\. כמה \S+ נשארו\?$/.exec(p))) {
      return upPlan(+m[2], +m[1]);
    } else if ((m = /^בטבלת נקודות: קבוצה א׳ — (\d+), קבוצה ב׳ — (\d+)\. בכמה נקודות מובילה קבוצה א׳\?$/.exec(p))) {
      return upPlan(+m[2], +m[1]);
    } else if ((m = /^בטבלת \S+ \S+: \d+ — ([\d,]+) \S+, \d+ — ([\d,]+) \S+\. בכמה \S+ יותר היו ב־\d+\?/.exec(p))) {
      return upPlan(num(m[1]), num(m[2]));
    } else if ((m = /^בטבלה: בעיר א׳ ([\d,]+) תושבים, בעיר ב׳ ([\d,]+) ובעיר ג׳ ([\d,]+)\. בכמה תושבים עיר ג׳ גדולה מעיר ב׳\?/.exec(p))) {
      return upPlan(num(m[2]), num(m[3]));
    } else if ((m = /^בהצגה הראשונה נכחו (\d+) צופים, ובשנייה (\d+)\. כמה צופים נכחו בסך הכול בשתי ההצגות\?$/.exec(p))) {
      return { kind: 'add', a: +m[1], b: +m[2], value: +m[1] + +m[2] };
    }
    return null;
  }

  // counting up from a to b: first up to the next round number, place by place, then the big jumps
  function upPlan(a, b) {
    if (!(b > a)) return null;
    let x = a;
    const jumps = [];
    for (let p = 0; p < 7; p++) {
      const unit = Math.pow(10, p), next = Math.pow(10, p + 1);
      let c = 0;
      while (x % next !== 0 && x + unit <= b && (b - x) % next !== 0) { x += unit; c++; }
      if (c) jumps.push([p, c]);
    }
    for (let p = 6; p >= 0; p--) { const unit = Math.pow(10, p); let c = 0; while (x + unit <= b) { x += unit; c++; } if (c) jumps.push([p, c]); }
    if (x !== b || jumps.some(([, c]) => c > 9)) return null;
    return { kind: 'up', start: a, jumps: jumps, value: b - a };
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
    const marker = (place) => { hit('woodClick', 400, 0.04, 0.08, 'turn', { place: place }); t += 0.3; };
    const stroke = (place, stage, extra) => { const o = ORFF[place]; hit(o[0], o[1], 0.12, 0.2, stage, Object.assign({ place: place, worth: Math.pow(10, place) }, extra)); t += STEP; };
    const frame = () => { hit('shaker', 300, 0.3, 0.1, 'periodFrame'); t += 0.6; };
    const pack = () => { hit('jingle', 784, 0.3, 0.14, 'pack'); t += 0.45; };
    // a whole number, from the ones upward: a marker before each place, strokes or real silence
    const number = (n, stage, onlyPlace) => {
      const ds = digits(n);
      ds.forEach((d, place) => {
        marker(place);
        const t0 = t;
        if (onlyPlace == null || onlyPlace === place) for (let i = 0; i < d; i++) stroke(place, stage);
        t = Math.max(t, t0 + SLOT * 0.6) + 0.2;               // a zero is the slot's own real silence
        if (place % 3 === 2 && place < ds.length - 1) frame();
      });
      t += GAP;
    };
    switch (spec.kind) {
      case 'number': number(spec.n, 'digit'); break;
      case 'hundreds':
        // a bundle of ten hundreds is first heard equal to its ten
        for (let i = 0; i < 10; i++) { stroke(2, 'demo'); t += 0.04; }
        t += 0.3; hit(ORFF[3][0], ORFF[3][1], 0.5, 0.2, 'bundle', { worth: 1000 }); t += 0.8 + GAP;
        for (let i = 0; i < spec.thousands; i++) { hit(ORFF[3][0], ORFF[3][1], 0.4, 0.2, 'bundle', { worth: 1000 }); t += 0.5; }
        t += 0.3;
        for (let i = 0; i < spec.hundreds; i++) stroke(2, 'hundred');
        break;
      case 'levels':
        // a million opens into ten, each of those into ten, each into ten thousands: three levels of ten
        [6, 5, 4].forEach((pl) => { hit(ORFF[pl][0], ORFF[pl][1], 0.4, 0.2, 'opens', { place: pl }); t += 0.5; for (let i = 0; i < 10; i++) { stroke(pl - 1, 'into', { level: pl }); } t += GAP; });
        break;
      case 'cascade': {
        const ds = digits(spec.n);
        // first step in full: nine ones and one more, packed
        marker(0); for (let i = 0; i < 9; i++) stroke(0, 'nine'); stroke(0, 'plusOne'); pack(); t += 0.3;
        let place = 1;
        for (; place < ds.length && ds[place] === 9; place++) {
          marker(place); stroke(place, 'carried'); pack();     // the nine already there and the one carried in: packed again
          if (place % 3 === 2) frame();
        }
        // the first place that is not a nine keeps its strokes and takes the carried one; or a new place opens
        marker(place);
        const top = place < ds.length ? ds[place] + 1 : 1;
        for (let i = 0; i < top; i++) stroke(place, 'newPlace');
        break;
      }
      case 'regroup':
        // the thousands, then the hundreds: ten of them packed into one more thousand, and the rest
        for (let i = 0; i < spec.thousands; i++) stroke(3, 'thousand');
        t += GAP;
        for (let i = 0; i < 10; i++) stroke(2, 'hundred');
        pack(); stroke(3, 'packedThousand'); t += GAP;
        for (let i = 0; i < spec.hundreds - 10; i++) stroke(2, 'hundred');
        break;
      case 'shift':
        // ×10 moves every stroke to the next instrument up: the same pattern, one place higher
        for (let k = 0; k <= spec.times; k++) {
          if (k) { hit('metalBell', 1047, 0.3, 0.14, 'timesTen', { k: k }); t += 0.6; }
          if (k === 0 || k === spec.times) number(spec.a * Math.pow(10, k), k ? 'shifted' : 'start');
        }
        break;
      case 'partials':
        // one partial product after another, each a whole number of the ensemble; together they are the product
        spec.parts.forEach((v, i) => { hit('metalBell', 784, 0.25, 0.14, 'partialSign', { n: i }); t += 0.5; number(v, 'partial'); });
        break;
      case 'timesOne':
        frame(); number(spec.n, 'once'); frame();
        break;
      case 'timesZero':
        // zero groups: a framed bar of real silence, the same length as a bar with sound
        frame(); t += 2.4; frame();
        break;
      case 'estimate':
        // round first, then multiply what is easy; listen for how many places the result opens
        number(spec.A, 'rounded');
        hit('shaker', 300, 0.25, 0.14, 'sign', { op: '×' }); t += 0.5;
        number(spec.est, 'estimate');
        break;
      case 'round': {
        number(spec.n, 'digit');
        const dp = spec.place - 1;
        for (let i = 0; i < spec.d; i++) stroke(dp, 'down');
        hit('metalBell', 784, 0.25, 0.14, 'roundDown'); t += GAP;
        for (let i = 0; i < 10 - spec.d; i++) stroke(dp, 'up');
        hit('metalBell', 1047, 0.25, 0.14, 'roundUp');
        break;
      }
      case 'compare': {
        // the one exception to "from the ones up": a comparison is decided at the largest place, so it starts
        // there — both numbers, the same markers, place by place, until the first place where they differ
        const da = digits(spec.a), db = digits(spec.b);
        for (let place = Math.max(da.length, db.length) - 1; place >= 0; place--) {
          marker(place);
          for (let i = 0; i < (da[place] || 0); i++) stroke(place, 'a');
          t += 0.3;
          for (let i = 0; i < (db[place] || 0); i++) stroke(place, 'b');
          t += 0.4;
          if ((da[place] || 0) !== (db[place] || 0)) { hit('metalBell', 1568, 0.3, 0.14, 'decided', { place: place }); break; }
        }
        break;
      }
      case 'add': {
        const da = digits(spec.a), db = digits(spec.b);
        let carry = 0;
        for (let place = 0; place < Math.max(da.length, db.length) || carry; place++) {
          marker(place);
          for (let i = 0; i < carry; i++) stroke(place, 'carried');
          for (let i = 0; i < (da[place] || 0); i++) stroke(place, 'layerA');
          t += 0.15;
          for (let i = 0; i < (db[place] || 0); i++) stroke(place, 'layerB');
          let total = (da[place] || 0) + (db[place] || 0) + carry;
          carry = 0;
          if (total >= 10) { t += 0.2; pack(); carry = 1; total -= 10; }
          t += 0.4;
          if (place > 6) break;
        }
        break;
      }
      case 'up':
        hit('bowed', 196, 0.6, 0.16, 'start'); t += 0.9;
        spec.jumps.forEach(([place, c], j) => { for (let i = 0; i < c; i++) stroke(place, 'jump', { j: j }); t += 0.45; });
        hit('metalBell', 1568, 0.4, 0.16, 'arrived');
        break;
      case 'steps':
        number(spec.a, 'start');
        for (let i = 0; i < spec.k; i++) stroke(Math.round(Math.log10(spec.w)), 'step');
        if (spec.k * spec.w % (spec.w * 10) === 0) { t += 0.2; pack(); }
        break;
      case 'groups':
        // the thousands in bundles of the divisor: how many groups?
        for (let g = 0; g < spec.thousands / spec.k; g++) { hit(ORFF[3][0], ORFF[3][1], 0.45, 0.2, 'groupBundle', { g: g, worth: spec.k * 1000 }); t += 0.55; }
        break;
      case 'halfTen':
        number(spec.a * 10, 'timesTen');
        hit('shaker', 520, 0.3, 0.12, 'halve'); t += 0.5;
        number(spec.a * 5, 'half');
        break;
      case 'oneMore':
        number(spec.known, 'known');
        hit('metalBell', 784, 0.3, 0.14, 'plusGroup'); t += 0.5;
        number(spec.group, 'group');
        break;
      case 'inverse':
        number(spec.known, 'known');
        hit('bowed', 330, 0.4, 0.14, 'undo'); t += 0.6;
        break;
      case 'stages':
        spec.stages.forEach(([op, v], i) => { hit(op === '(' ? 'clap' : op === '×' ? 'shaker' : op === ':' ? 'shaker' : 'metalBell', op === ':' ? 620 : op === '×' ? 300 : 1600, 0.25, 0.14, 'sign', { op: op, n: i }); t += 0.5; number(v, 'result'); });
        break;
      default: break;
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
  const LEGEND = ORFF.map((o, i) => o[2] + ' — ' + PLACE_HE[i]).join(', ') + '.';
  const HOW = {
    number: 'מהאחדות כלפי מעלה: סימן תור לפני כל מקום, ואחריו הנגינות של המקום — או שקט אמיתי כשהספרה אפס. כל שלושה מקומות נסגרים במסגרת.',
    hundreds: 'קודם שומעים שחבילה אחת שווה עשר מאות. אחר כך החבילות, ואחריהן המאות הבודדות.',
    levels: 'מיליון נפתח לעשר, כל אחד מהם לעשר, וכל אחד מהם לעשר אלפים. שלוש רמות של עשר.',
    cascade: 'מוסיפים אחד: עשר אחדות נארזות לעשרת אחת, והאריזה עוברת מקום אחרי מקום עד מקום חדש.',
    round: 'קודם המספר. אחר כך הספרה שמכריעה: כמה צעדים למטה, וכמה למעלה עד העשר. הקצר מנצח.',
    compare: 'בהשוואה מתחילים מהמקום הגדול: שני המספרים באותם סימנים, מקום אחרי מקום, עד המקום הראשון שבו הם נבדלים — שם זה מוכרע.',
    regroup: 'האלפים, ואחריהם המאות: עשר מאות נארזות לעוד אלף, ומה שנשאר נשאר מאות.',
    shift: 'כפל בעשר מעביר כל נגינה לכלי של המקום הבא: אותה תבנית, מקום אחד למעלה.',
    timesOne: 'קבוצה אחת בלבד, בתוך מסגרת: המספר עצמו.',
    partials: 'כפל במאונך בחלקים: כל ספרה כפול הכופל היא מספר שלם של ההרכב, מהאחדות כלפי מעלה. פעמון לפני כל חלק. כמה הם יחד?',
    timesZero: 'אפס קבוצות: תיבה של שקט אמיתי בין שתי מסגרות.',
    estimate: 'קודם מעגלים למספר נוח, ואחר כך כופלים. כמה מקומות נפתחים בתוצאה?',
    add: 'עמודה אחרי עמודה מהאחדות: שכבה ראשונה, שכבה שנייה, וכשמגיעים לעשר — צליל אריזה, ואחד עובר למקום הבא.',
    up: 'סופרים קדימה מהמספר הקטן: קודם עד מספר עגול, ואחר כך בקפיצות גדולות. כל קפיצה היא משפט. כמה הוספנו בסך הכול?',
    steps: 'מהמספר שמתחילים בו, צעד אחרי צעד; עשרה צעדים נארזים לאחד מהמקום הבא.',
    groups: 'האלפים בקבוצות בגודל המחלק — כל קבוצה חבילה אחת. כמה קבוצות?',
    halfTen: 'קודם פי עשרה, ואחר כך חצי ממנו.',
    oneMore: 'מה שידוע, ואחריו עוד קבוצה אחת.',
    inverse: 'מה שידוע, ואחריו הביטול: החילוק מחזיר בדיוק את מה שהכפל עשה.',
    stages: 'כל פעולה היא שלב, לפי הסדר, וכל שלב נגמר בתוצאה שלו.',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    return '<div class="big-numbers">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc(LEGEND) + '</p>'
      + '<p class="band-note">' + esc(HOW[spec.kind]) + '</p>'
      + (revealed
        ? '<p class="band-predict bn-silent">עכשיו בלי צליל: כתבו בטבלת מקומות, עם אפס בכל מקום ריק, ובדקו שוב.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו: איזה כלי, וכמה פעמים?</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html, ORFF: ORFF };
});
