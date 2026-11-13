// MelodyMath — DataWorlds: tables, tallies, the mode, the mean, displays,
// even/odd and primes, heard (grades ב׳–ו׳). Research:
// docs/research/data-worlds-2026-11-13.md (Perplexity + Meta AI).
//
//   tables and tallies — inspired by the Andalusian ensemble, where players sit
//     by instrument family: a timbre is a category, the number of strokes is how
//     many. Categories one after the other, equal loudness, a silence between.
//     Big counts use a scale ("one stroke = twenty-five"), said in words.
//     A tally is five equal strokes, a short silence, the rest — the silence is
//     the border (no accent).
//   the mode is a VALUE, not a count (Meta AI): for values, pitch is the value,
//     played in order, so the longest run of one pitch is the mode.
//   the mean is BUILT, not observed — a hora circle: everyone stands on the
//     floor of the smallest value; what each has above the floor is played,
//     then shared out equally, one round at a time. Nobody had the mean at the
//     start (Mokros & Russell: fair share and balance, not only the algorithm).
//   displays — a pie is the hora circle (part of a whole); a pictogram or a bar
//     square first opens into its units, then each symbol stands for them.
//   even and odd — dabke steps in pairs; a step with no partner is heard alone
//     after a long silence. Every ten is five full pairs, so only the ones are
//     paired out. A prime cannot be split into equal bars (at least two bars of
//     at least two beats); a number that can is played split.
// Never more than 12 sounds in a row; the widget shows only when the sounds
// (with the numbers in the text) give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_DATA_WORLDS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['tableRowGroups', 'cellGroups', 'rowCellGroups', 'listToGroups', 'tallyFives', 'levelNotes', 'showAsBar', 'alternateDrums', 'stickingParity', 'tenExchange']);
  const MAX_RUN = 12;
  const MAX_EVENTS = 40;
  const STEP = 0.26, GAP = 0.7;
  const VOICES = [['pluck', 196], ['bowed', 330], ['frameDrum', 150], ['reed', 523]];
  const NUM_HE = { 1: 'אחד', 2: 'שניים', 5: 'חמישה', 10: 'עשרה', 15: 'חמישה־עשר', 20: 'עשרים', 25: 'עשרים וחמישה', 50: 'חמישים' };

  const WORLDS = Object.freeze({
    andalus: { he: 'בהשראת ההרכב האנדלוסי', why: 'הנגנים יושבים לפי משפחות כלים: כל גוון הוא קטגוריה, ומספר ההקשות הוא כמה יש בה. כל הכלים באותה עוצמה' },
    hora: { he: 'מעגל הורה', why: 'ריקוד עם ישראלי במעגל. היישור כאן הוא דימוי — החשבון הוא סכום חלקי מספר' },
    dabke: { he: 'צעדי דבקה', why: 'ריקוד שורה לבנוני, פלסטיני וסורי: כל צעד הוא יחידה, וכל קיבוץ של צעדים הוא חלוקה' },
  });

  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const nums = (s) => (String(s).match(/\d[\d,]*/g) || []).map((x) => +x.replace(/,/g, ''));
  function scaleFor(values) {
    const g = values.reduce((a, b) => gcd(a, b));
    const unit = [1, 2, 5, 10, 15, 25, 50].filter((u) => g % u === 0 && values.every((v) => v / u <= MAX_RUN)).shift();
    return unit || null;
  }
  // "label — 12" pairs in a table prompt
  function pairsOf(p) {
    const out = [];
    const re = /([^:,.—]+?) — (\d[\d,]*)/g;
    let m;
    while ((m = re.exec(p))) out.push({ label: m[1].trim().replace(/^ו/, ''), n: +m[2].replace(/,/g, '') });
    return out;
  }

  // TakeAwayTen keeps the place-value items it already plays (it comes first in the app)
  function takeAwayTen() {
    if (root && root.MM_TAKEAWAY_TEN) return root.MM_TAKEAWAY_TEN;
    try { return typeof require === 'function' ? require('./takeAwayTen') : null; } catch (e) { return null; }
  }

  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const tt = takeAwayTen();
    if (tt && tt.specForItem && tt.specForItem(item)) return null;
    const p = String(item.prompt || '').trim();
    const raw = String(item.answer).trim();
    let m, s = null;
    // ---- even / odd and divisibility (dabke)
    if ((m = /^(?:האם )?(\d+)(?: פעימות הן מספר| הוא מספר)? זוגי או אי[־-]זוגי\?/.exec(p))) {
      const n = +m[1];
      s = { kind: 'parity', n: n, value: n % 2 === 0 ? 'זוגי' : 'אי-זוגי', world: WORLDS.dabke };
    } else if ((m = /^האם (\d+) הוא מספר ראשוני\? \(כן\/לא\)$/.exec(p))) {
      const n = +m[1];
      const bars = [2, 3, 5, 7].find((k) => n % k === 0 && n / k >= 2 && n / k <= 19);
      if (bars) s = { kind: 'prime', n: n, bars: bars, value: 'לא', world: WORLDS.dabke };
    } else if ((m = /^האם ([\d,]+) מתחלק ב־5\? \(כן\/לא\)$/.exec(p))) {
      const n = +m[1].replace(/,/g, '');
      s = { kind: 'fives', n: n, value: n % 5 === 0 ? 'כן' : 'לא', world: WORLDS.dabke };
    // ---- the mean (hora)
    } else if ((m = /^(?:הקשתם \d+ פעמים|שקלו \d+ \S+): ([\d, ו־]+?) (?:BPM|גרם)\. מה (?:הקצב|המשקל) הממוצע/.exec(p))) {
      const vs = nums(m[1]);
      s = meanPlan(vs);
    } else if ((m = /^הממוצע של ([\d, ו־]+) הוא (\d+)\. מוסיפים לקבוצה את (\d+)\. מה הממוצע החדש\?$/.exec(p))) {
      s = meanPlan(nums(m[1]).concat([+m[3]]));
    } else if ((m = /^ב\S+ \S+ יש ([\d, ו־]+) \S+\. מה מספר ה\S+ הממוצע ל\S+\?$/.exec(p))) {
      s = meanPlan(nums(m[1]));
    } else if ((m = /^בקבוצת מספרים הקטן הוא (\d+) והממוצע הוא (\d+)\. האם הגדול יכול להיות (\d+)\? \(כן\/לא\)$/.exec(p))) {
      // the best case: two numbers, the smallest and the largest — even then the level stays below the mean asked for
      const lo = +m[1], mean = +m[2], hi = +m[3];
      if (hi > lo && hi - lo <= MAX_RUN && mean - lo <= MAX_RUN) s = { kind: 'meanBound', values: [lo, hi], units: [0, hi - lo], target: mean - lo, value: hi >= mean ? 'כן' : 'לא', world: WORLDS.hora };
    } else if ((m = /^הממוצע של (\d+) מספרים הוא (\d+)\. מה סכום המספרים\?$/.exec(p))) {
      const n = +m[1], mean = +m[2], unit = [10, 5, 2, 1].find((u) => mean % u === 0 && mean / u <= MAX_RUN);
      if (unit && n <= 6) s = { kind: 'meanSum', n: n, mean: mean, unit: unit, value: n * mean, world: WORLDS.hora };
    } else if (/^האם הממוצע חייב להיות אחד מהמספרים בקבוצה\? \(כן\/לא\)$/.test(p)) {
      s = meanPlan([60, 70, 80, 90]);
      if (s) { s.kind = 'meanNotValue'; s.value = 'לא'; }
    // ---- displays
    } else if (/^רוצים להראות איזה חלק מ\S+ בחר כל \S+ \S+\. מה מתאים יותר: עוגה או עמודות\?$/.test(p)) {
      // parts of one whole: the hora walks the parts around and closes the circle back where it started
      s = { kind: 'wholeParts', sizes: [3, 2, 4, 3], value: 'עוגה', world: WORLDS.hora };
    } else if ((m = /^מציגים (\d+) בעד ו־(\d+) נגד בדיאגרמת עוגה של (\d+) חלקים שווים\. כמה חלקים יהיו «בעד»\?$/.exec(p))) {
      const a = +m[1], b = +m[2], parts = +m[3], unit = (a + b) / parts;
      if (Number.isInteger(unit) && a % unit === 0) s = { kind: 'pie', parts: parts, yes: a / unit, value: a / unit, world: WORLDS.hora };
    } else if ((m = /^בפיקטוגרם כל סמל הוא (\d+) תלמידים\. כמה סמלים יציגו (\d+) תלמידים\?$/.exec(p)) || (m = /^בדיאגרמת עמודות כל משבצת בציר הוא (\d+) תלמידים\. כמה משבצות גובה תהיה לעמודה של (\d+) תלמידים\?$/.exec(p))) {
      const per = +m[1], total = +m[2];
      if (total % per === 0 && per <= 10) s = { kind: 'symbols', per: per, count: total / per, value: total / per, world: WORLDS.dabke };
    } else if ((m = /^בסקר (\d+)% בחרו בכחול\. כמה מעלות תהיה הגזרה של כחול בדיאגרמת עוגה\?$/.exec(p))) {
      const pct = +m[1];
      if ((pct * 12) % 100 === 0) s = { kind: 'sector', ticks: (pct * 12) / 100, value: pct * 3.6, world: WORLDS.hora };
    } else if ((m = /^בטבלת שכיחויות: (\d+) משפחות עם (\d+) ילדים ו־(\d+) משפחות עם (\d+) ילדים\. כמה ילדים יש בכל המשפחות האלה\?$/.exec(p))) {
      const groups = [[+m[1], +m[2]], [+m[3], +m[4]]];
      s = { kind: 'families', groups: groups, value: groups.reduce((a, g) => a + g[0] * g[1], 0), world: WORLDS.andalus };
    // ---- values: the mode (pitch is the value)
    } else if ((m = /: ((?:\d+, )+\d+)\. (?:מהו השכיח|מה השכיחות של המספר (\d+))\?$/.exec(p))) {
      const vs = nums(m[1]).sort((a, b) => a - b);
      const freq = {};
      vs.forEach((v) => { freq[v] = (freq[v] || 0) + 1; });
      const top = Math.max.apply(null, Object.values(freq));
      const modes = Object.keys(freq).filter((k) => freq[k] === top);
      const value = m[2] != null ? freq[+m[2]] : modes.length === 1 ? +modes[0] : null;
      if (value != null && vs.length <= MAX_RUN) s = { kind: 'values', values: vs, asked: m[2] != null ? +m[2] : null, value: value, world: WORLDS.andalus };
    // ---- lists to a table, and tallies
    } else if ((m = /: ((?:[א-ת]+, )+[א-ת]+)\. (?:בטבלה מסודרת — כמה בחרו ([א-ת]+)|ארגנו בטבלה: בכמה ילדים יותר בחרו ([א-ת]+) מאשר ([א-ת]+))\?$/.exec(p))) {
      const list = m[1].split(', ');
      const cats = [...new Set(list)];
      const count = (c) => list.filter((x) => x === c).length;
      const value = m[2] ? count(m[2]) : count(m[3]) - count(m[4]);
      if (list.length <= MAX_RUN && cats.length <= VOICES.length) s = { kind: 'list', list: list, cats: cats, asked: m[2] ? [m[2]] : [m[3], m[4]], value: value, world: WORLDS.andalus };
    } else if ((m = /^במשאל אחרי ההצגה: (\d+) תלמידים אהבו, (\d+) לא אהבו ו־(\d+) בלי דעה\. כמה תלמידים השתתפו במשאל\?$/.exec(p))) {
      const pairs = [{ label: 'אהבו', n: +m[1] }, { label: 'לא אהבו', n: +m[2] }, { label: 'בלי דעה', n: +m[3] }];
      const unit = scaleFor(pairs.map((x) => x.n));
      if (unit) s = { kind: 'table', pairs: pairs, unit: unit, asked: pairs.map((x) => x.label), op: 'sum', value: pairs.reduce((a, x) => a + x.n, 0), world: WORLDS.andalus };
    } else if ((m = /סימני ספירה: (\S+) — ([| ]+), (\S+) — ([| ]+)\. כמה (?:שירי )?(\S+) נספרו\?$/.exec(p))) {
      const t1 = m[2].replace(/ /g, '').length, t2 = m[4].replace(/ /g, '').length;
      s = { kind: 'tally', cats: [[m[1], t1], [m[3], t2]], value: m[5] === m[1] ? t1 : t2, world: WORLDS.andalus };
    // ---- tables
    } else {
      const pairs = pairsOf(p);
      if (pairs.length >= 2) s = tablePlan(p, pairs);
    }
    if (!s || s.value == null || String(s.value) !== raw) return null;   // the sounds give exactly the answer
    s.answer = String(s.value);
    const ev = soundEvents(s);
    if (!ev.length || longestRun(ev) > MAX_RUN || ev.length > MAX_EVENTS) return null;
    return s;
  }

  function tablePlan(p, pairs) {
    const unit = scaleFor(pairs.map((x) => x.n));
    if (!unit) return null;
    const q = p.slice(p.lastIndexOf('.', p.length - 2) + 1);
    // final letters change inside a longer word (אדום → אדומה), so compare without them
    const plain = (w) => String(w).replace(/ם/g, 'מ').replace(/ן/g, 'נ').replace(/ץ/g, 'צ').replace(/ף/g, 'פ').replace(/ך/g, 'כ');
    const find = (txt) => pairs.find((x) => plain(txt).indexOf(plain(x.label)) >= 0 || (/[א-ת]׳/.test(x.label) && txt.indexOf(x.label.replace(/^\S+ /, '')) >= 0 && /ימים|ביום|קבוצה/.test(txt)));
    let asked = [], value = null, op = 'one';
    if (/בסך הכול|בשלושת/.test(q)) { asked = pairs.slice(); op = 'sum'; value = pairs.reduce((a, x) => a + x.n, 0); }
    else if (/יחד/.test(q)) {
      asked = pairs.filter((x) => { const short = x.label.replace(/^\S+ /, ''); return q.indexOf(' ' + short) >= 0 || q.indexOf('־' + short) >= 0; });
      op = 'sum'; value = asked.reduce((a, x) => a + x.n, 0);
    } else if (/מובילה/.test(q)) {
      return null;     // a lead between big numbers is jumps, not a table to hear
    } else if (/השכיח\?/.test(q)) {
      const top = Math.max.apply(null, pairs.map((x) => x.n));
      const modes = pairs.filter((x) => x.n === top);
      if (modes.length !== 1) return null;
      asked = pairs.slice(); op = 'mode'; value = modes[0].label;    // the mode is the category, not its count
    } else if (/חלק|שבר/.test(q)) {
      const one = find(q), total = pairs.reduce((a, x) => a + x.n, 0);
      if (!one) return null;
      const d = gcd(one.n, total);
      asked = [one]; op = 'part'; value = (one.n / d) + '/' + (total / d);
    } else {
      const one = find(q);
      if (one) { asked = [one]; value = one.n; }
    }
    if (!asked.length || value == null) return null;
    return { kind: 'table', pairs: pairs, unit: unit, asked: asked.map((x) => x.label), op: op, value: value, world: WORLDS.andalus };
  }

  // the mean as a fair share above the floor of the smallest value
  function meanPlan(vs) {
    if (!vs || vs.length < 2 || vs.length > 5) return null;
    const floor = Math.min.apply(null, vs);
    const extra = vs.map((v) => v - floor);
    let unit = [10, 5, 2, 1].find((u) => extra.every((e) => e % u === 0 && e / u <= MAX_RUN) && (extra.reduce((a, b) => a + b, 0) / u) % vs.length === 0);
    let left = 0;
    if (!unit) {
      // the units do not share out evenly: whole rounds first, then each unit that is left breaks into one piece per dancer
      unit = [10, 5, 2, 1].find((u) => extra.every((e) => e % u === 0 && e / u <= MAX_RUN));
      if (!unit) return null;
      left = (extra.reduce((a, b) => a + b, 0) / unit) % vs.length;
      if (left * vs.length > MAX_RUN) return null;
    }
    const units = extra.map((e) => e / unit), total = units.reduce((a, b) => a + b, 0);
    const share = (total - left) / vs.length;
    const mean = Math.round((floor + (share + left / vs.length) * unit) * 1000) / 1000;
    return { kind: 'mean', values: vs, floor: floor, unit: unit, units: units, share: share, left: left, value: mean, world: WORLDS.hora };
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
    const strokes = (k, n, stage, extra) => { const v = VOICES[k % VOICES.length]; for (let i = 0; i < n; i++) { hit(v[0], v[1], 0.14, 0.22, stage, Object.assign({ cat: k }, extra)); t += STEP; } t += GAP; };
    const step = (stage, extra, hz) => { hit('stomp', hz || 90, 0.14, 0.24, stage, extra); t += STEP; };

    switch (spec.kind) {
      case 'table':
        spec.pairs.forEach((x, k) => strokes(k, x.n / spec.unit, 'cat', { label: x.label, worth: spec.unit }));
        break;
      case 'list':
        spec.list.forEach((x) => { const k = spec.cats.indexOf(x), v = VOICES[k]; hit(v[0], v[1], 0.14, 0.2, 'raw', { cat: k }); t += 0.42; });
        t += GAP;
        spec.cats.forEach((c, k) => strokes(k, spec.list.filter((x) => x === c).length, 'sorted', { label: c }));
        break;
      case 'tally':
        spec.cats.forEach(([label, n], k) => {
          const v = VOICES[k];
          for (let i = 0; i < n; i++) { hit(v[0], v[1], 0.14, 0.22, 'tally', { cat: k, label: label }); t += STEP; if (i % 5 === 4 && i < n - 1) t += 0.35; }
          t += GAP;
        });
        break;
      case 'values': {
        // pitch is the value, in order; a short silence where the value changes
        const lo = spec.values[0];
        spec.values.forEach((v, i) => { if (i && v !== spec.values[i - 1]) t += 0.4; hit('woodBar', 392 * Math.pow(2, (v - lo) * 2 / 12), 0.14, 0.22, 'value', { v: v }); t += STEP; });
        break;
      }
      case 'mean': case 'meanNotValue': {
        // each dancer: one floor stroke, then what they have above the floor
        spec.units.forEach((u, d) => { hit('drumLow', 98, 0.3, 0.22, 'floor', { d: d }); t += 0.35; for (let i = 0; i < u; i++) { hit('woodClick', 1300 + 120 * d, 0.05, 0.2, 'above', { d: d }); t += STEP; } t += GAP; });
        // then the extras are shared out: one round gives one to every dancer
        for (let r = 0; r < spec.share; r++) { for (let d = 0; d < spec.values.length; d++) { hit('metalBell', 1047 + 60 * d, 0.1, 0.16, 'share', { d: d, round: r }); t += STEP; } t += 0.45; }
        // what is left breaks into one small piece per dancer, and every dancer gets a piece of each
        for (let u = 0; u < (spec.left || 0); u++) { for (let d = 0; d < spec.values.length; d++) { hit('tine', 2093, 0.05, 0.12, 'piece', { d: d, unit: u }); t += 0.12; } t += 0.45; }
        break;
      }
      case 'meanBound':
        // the best the group can do: everyone but the smallest stands at the largest — and the fair share still stays below
        spec.units.forEach((u, d) => { hit('drumLow', 98, 0.3, 0.22, 'floor', { d: d }); t += 0.35; for (let i = 0; i < u; i++) { hit('woodClick', 1300 + 120 * d, 0.05, 0.2, 'above', { d: d }); t += STEP; } t += GAP; });
        for (let i = 0; i < spec.target; i++) { hit('jingle', 1568, 0.08, 0.12, 'target', { i: i }); t += STEP; }
        break;
      case 'meanSum':
        for (let d = 0; d < spec.n; d++) { for (let i = 0; i < spec.mean / spec.unit; i++) { hit('woodClick', 1300, 0.05, 0.2, 'level', { d: d }); t += STEP; } t += GAP; }
        break;
      case 'pie':
        for (let i = 0; i < spec.parts; i++) { hit(i < spec.yes ? 'pluck' : 'bowed', i < spec.yes ? 196 : 330, 0.2, 0.22, i < spec.yes ? 'yes' : 'no', { part: i }); t += 0.5; }
        break;
      case 'wholeParts': {
        const tim = [['pluck', 196], ['bowed', 330], ['metalBell', 784], ['woodClick', 1500]];
        spec.sizes.forEach((n, k) => { for (let i = 0; i < n; i++) { hit(tim[k][0], tim[k][1], 0.15, 0.2, 'part', { part: k }); t += 0.3; } t += 0.25; });
        hit('gong', 165, 0.6, 0.16, 'closed'); t += 0.8;
        break;
      }
      case 'symbols':
        // the first symbol opens into its units, then each symbol stands for them
        for (let i = 0; i < spec.per; i++) { hit('woodClick', 1500, 0.05, 0.16, 'unit'); t += 0.2; }
        t += 0.3;
        for (let i = 0; i < spec.count; i++) { hit('drumLow', 110, 0.3, 0.26, 'symbol', { i: i }); t += i === 0 ? 0.9 : 0.42; }
        break;
      case 'sector':
        for (let i = 0; i < 12; i++) { hit('woodClick', 1200, 0.04, 0.1, 'whole'); t += 0.2; }
        t += 0.3;
        hit('metalBell', 1047, 0.4, 0.14, 'wholeEnd'); t += 1.0;
        for (let i = 0; i < spec.ticks; i++) { hit('woodClick', 1500, 0.05, 0.2, 'tick'); t += 0.26; }
        break;
      case 'families':
        spec.groups.forEach(([fam, kids], k) => { for (let f = 0; f < fam; f++) { const v = VOICES[k]; for (let i = 0; i < kids; i++) { hit(v[0], v[1], 0.12, 0.22, 'kid', { cat: k, fam: f }); t += 0.22; } t += 0.35; } t += GAP; });
        break;
      case 'parity': {
        // every ten is five full pairs: one deep stroke each; the ones are paired out
        const tens = Math.floor(spec.n / 10), ones = spec.n % 10;
        const ten = spec.n >= 10;
        if (ten) { for (let i = 0; i < tens; i++) { hit('drumLow', 98, 0.3, 0.24, 'ten'); t += 0.42; } t += GAP; }
        const k = ten ? ones : spec.n;
        for (let i = 0; i < Math.floor(k / 2); i++) { step('pair', { i: i }); step('pair', { i: i }, 120); t += 0.3; }
        if (k % 2) { t += GAP; step('alone'); }
        break;
      }
      case 'prime': {
        const per = spec.n / spec.bars, tens = Math.floor(per / 10), ones = per % 10;
        for (let b = 0; b < spec.bars; b++) { for (let i = 0; i < tens; i++) { hit('drumLow', 98, 0.3, 0.24, 'barTen', { bar: b }); t += 0.42; } for (let i = 0; i < ones; i++) step('beat', { bar: b }); t += GAP; }
        break;
      }
      case 'fives': {
        // every ten, hundred and thousand splits into fives with nothing left; only the ones are grouped
        const ones = spec.n % 10;
        hit('drumLow', 98, 0.4, 0.24, 'rest'); t += 0.4 + GAP;
        for (let i = 0; i < ones; i++) { step('one'); if (i === 4 && ones > 5) t += 0.35; }
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
    table: 'כל קטגוריה בתורה, לפי הסדר בשאלה, ושקט ביניהן. אחרי כל קטגוריה — עצרו ואמרו כמה.',
    list: 'קודם הרשימה כמו שנאספה, אחד אחד. אחר כך אותה רשימה מסודרת: כל גוון בתורו. האם יצא אותו מספר בסך הכול?',
    tally: 'סימני ספירה: חמש הקשות שוות, שקט קצר — זו חבילה — ואז השאר. השקט הוא הגבול.',
    values: 'כאן גובה הצליל הוא הערך, מהנמוך לגבוה, ושקט קצר כשהערך משתנה. השכיח הוא ערך — לא מספר ההקשות.',
    mean: 'כל רוקד: מכה עמוקה (כולם עומדים על הקטן ביותר) ואחריה מה שיש לו מעל. אחר כך מחלקים את העודף בסבבים — אחד לכל רוקד בכל סבב. לאף אחד לא היה הערך הזה בהתחלה — בנינו אותו.',
    meanNotValue: 'כל רוקד: מכה עמוקה ואחריה מה שיש לו מעל הקטן ביותר. אחר כך מחלקים את העודף בסבבים. האם למישהו היה בהתחלה בדיוק מה שיצא לכל אחד?',
    meanSum: 'כל אחד בדיוק בגובה הממוצע: אותה קבוצה לכל אחד. כמה קבוצות, וכמה בכל קבוצה?',
    meanBound: 'המקרה הטוב ביותר: הקטן ביותר, ולידו מספר בגובה הגדול ביותר. אחר כך — הגובה שהממוצע צריך להגיע אליו מעל הקטן ביותר. האם חלוקה הוגנת יכולה להגיע עד שם?',
    wholeParts: 'השאלה היא איזה חלק מהשלם. החלקים נשמעים בהליכה סביב המעגל, כל חלק בגוון משלו, וכולם יחד סוגרים אותו בחזרה לנקודת ההתחלה — השלם כולו. איזו דיאגרמה מראה חלקים של שלם אחד?',
    pie: 'העוגה היא מעגל ההורה: כל רוקד הוא חלק שווה. גוון אחד לבעד, גוון אחר לנגד.',
    symbols: 'קודם סמל אחד נפתח ליחידות שלו. אחר כך כל סמל שווה את כולן. כמה סמלים?',
    sector: 'סיבוב שלם בנקישות שוות, כל נקישה שלושים מעלות. אחר כך רק הגזרה.',
    families: 'קבוצה לכל משפחה, גוון לכל סוג משפחה. כמה משפחות, כמה ילדים בכל אחת?',
    parity: 'צעדים בזוגות. כל עשר הוא חמישה זוגות שלמים — מכה עמוקה אחת. נשאר צעד בלי זוג? הוא יישמע לבד אחרי שקט.',
    prime: 'מנסים לחלק לתיבות שוות — לפחות שתי תיבות, ובכל תיבה לפחות שני צעדים. כאן — האם התחלק?',
    fives: 'כל עשר, מאה ואלף מתחלקים לחמישיות בלי שארית — מכה עמוקה אחת. מקבצים רק את האחדות. נשאר משהו?',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    const scale = (spec.kind === 'table' || spec.kind === 'meanSum') && spec.unit > 1 ? ' כל הקשה שווה ' + (NUM_HE[spec.unit] || '') + '.' : '';
    return '<div class="data-worlds">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc(HOW[spec.kind] + scale) + '</p>'
      + (revealed
        ? '<p class="band-predict dw-silent">עכשיו בלי צליל: אמרו במילים מה נספר ומה הערך, ובנו טבלה או ציור קטן.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו וספרו.</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, WORLDS: WORLDS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html };
});
