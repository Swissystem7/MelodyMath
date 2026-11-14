// MelodyMath — FractionTime: the fraction items NoteBar leaves out — grids of
// 15 and 24, a fraction of a fraction, dotted notes and triplets, measuring
// with dotted notes, mixed numbers, a fraction of a set, and parts of a day or
// a week (grades ד׳–ו׳). Research: docs/research/fraction-time-2026-11-14.md
// (Perplexity + Meta AI).
//
// Meta AI: two worlds, so that time and quantity are never mixed.
//   durations — Colombian cumbia (secular dance music of the Caribbean coast):
//     the guacharaca counts beats on one fixed grid — "the tempo is the ruler,
//     never the thing measured" — and the drum marks where a note starts. A
//     longer note is never louder, higher or faster: it covers more beats. The
//     whole bar is heard first as the ruler. Fractions are added or taken only
//     on the common grid; taking away is silence. A dot is "half of itself
//     again"; a triplet puts three notes in the time of two.
//   quantity — Louisiana Creole zydeco: the washboard is one unit, the
//     accordion one equal group. First the equal groups, only then taking some.
// As in NoteBar: the size is the number of beats. Never more than 12 sounds in
// a row (a long run is split by a short silence); the widget shows only when
// the sounds (with the numbers in the text) give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_FRACTION_TIME = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['splitNotes', 'lcm', 'fillBar', 'noteLength', 'dotted', 'barFill', 'triplet', 'durationDiv', 'mixedBar', 'noteValues', 'silenceQuarter', 'roundBars', 'barsAndHalf', 'wholeFromPartBar', 'barFraction', 'dayAsSong']);
  const MAX_RUN = 12;
  const MAX_EVENTS = 64;
  const STEP = 0.22, BREAK = 0.5, GAP = 0.7;

  const WORLDS = {
    cumbia: { he: 'קומביה קולומביאנית', why: 'מוזיקת ריקוד חילונית מהחוף הקריבי של קולומביה. הגואצ׳ארקה סופרת פעמות בקצב קבוע — הקצב הוא הסרגל — והתוף מסמן איפה תו מתחיל. תו ארוך אינו חזק יותר, גבוה יותר או מהיר יותר: הוא פשוט מכסה יותר פעמות' },
    zydeco: { he: 'זיידקו מלואיזיאנה', why: 'מוזיקת ריקוד קריאולית מלואיזיאנה. הוושבורד הוא יחידה אחת, והאקורדיון הוא קבוצה אחת שווה: קודם מחלקים לקבוצות שוות, ורק אחר כך לוקחים קבוצות' },
  };

  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const lcm = (a, b) => a / gcd(a, b) * b;
  const frac = (n, d) => { const g = gcd(n, d); return d / g === 1 ? String(n / g) : (n / g) + '/' + (d / g); };
  const mixed = (n, d) => { const w = Math.floor(n / d), r = n % d; return w && r ? w + ' ו־' + frac(r, d) : w ? String(w) : frac(r, d); };
  const OTHER_SOUND = ['widget', 'g1', 'g2', 'g3', 'bar', 'line', 'ruler', 'clock', 'vert', 'chart', 'grid'];
  // NoteBar keeps every item it already plays (same rules, its own worlds)
  let nodeNoteBar = null;
  if (typeof module === 'object' && module.exports && typeof require === 'function') { try { nodeNoteBar = require('./noteBar.js'); } catch (e) { nodeNoteBar = null; } }
  const noteBarPlays = (item) => { const nb = nodeNoteBar || (root && root.MM_NOTE_BAR); try { return !!(nb && nb.specForItem && nb.specForItem(item)); } catch (e) { return false; } };

  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    if (OTHER_SOUND.some((k) => item[k]) || (item.hear && item.hear.length)) return null;
    if (noteBarPlays(item)) return null;
    const p = String(item.prompt || '').trim();
    const raw = String(item.answer).trim();
    let m, s = null;
    // ---- cumbia: durations on one grid
    if ((m = /^(?:מה גדול יותר, |איזה שבר גדול יותר: )(\d+)\/(\d+) או (\d+)\/(\d+)\?/.exec(p))) {
      const a = +m[1], b = +m[2], c = +m[3], d = +m[4], L = lcm(b, d);
      if (L <= 15) s = { kind: 'compare', L: L, notes: [a * L / b, c * L / d], labels: [m[1] + '/' + m[2], m[3] + '/' + m[4]], value: a * d > c * b ? m[1] + '/' + m[2] : m[3] + '/' + m[4] };
    } else if ((m = /^\S+ אומרת ש־1\/(\d) מעוגה קטן מ־1\/(\d) מאותה עוגה, כי \1 קטן מ־\2\. האם היא צודקת\? \(כן\/לא\)$/.exec(p))) {
      const b = +m[1], d = +m[2], L = lcm(b, d);
      if (L <= 15) s = { kind: 'compare', L: L, notes: [L / b, L / d], value: (1 / b < 1 / d) ? 'כן' : 'לא' };
    } else if ((m = /^(\d+)\/(\d+) ([+−]) (\d+)\/(\d+) = \?$/.exec(p)) || (m = /^\S+ צריכה (\d+)\/(\d+) מ\S+ \S+, (ו)\S+ צריכה (\d+)\/(\d+) ממנו\. איזה חלק מה\S+ הן צריכות יחד\?$/.exec(p))) {
      const a = +m[1], b = +m[2], c = +m[4], d = +m[5], L = lcm(b, d), x = a * L / b, y = c * L / d, minus = m[3] === '−';
      if (L <= 24 && (!minus || x > y) && (minus ? x : x + y) <= L) s = { kind: minus ? 'sub' : 'add', L: L, x: x, y: y, value: frac(minus ? x - y : x + y, L) };
    } else if ((m = /^\S+ אומר ש־1\/(\d) \+ 1\/(\d) = 2\/(\d+)\. האם הוא צודק\? \(כן\/לא\)$/.exec(p))) {
      // adding tops and bottoms (docs/research/topics/088): the claim is shorter than the first part alone — a sum never is
      const b = +m[1], d = +m[2], L = lcm(b, d);
      if (+m[3] === b + d && L <= 12 && 2 / (b + d) < 1 / b) s = { kind: 'claim', L: L, first: L / b, claim: 2 / (b + d) * L, value: 'לא' };
    } else if (/^בתיבה של 3\/4 יש רבע ושתי שמיניות\. כמה חסר עד תיבה מלאה\? \(כשבר\)$/.test(p)) {
      s = { kind: 'missing', L: 6, notes: [2, 1, 1], value: frac(2, 8) };
    } else if ((m = /^שיר אחד נמשך (\d) ו־(\d)\/(\d) דקות ושיר שני (\d) ו־(\d)\/(\d) דקות\. מה האורך הכולל\?/.exec(p)) || (m = /^כמה זה (\d) ו־(\d)\/(\d) ועוד (\d) ו־(\d)\/(\d)\?/.exec(p))) {
      s = mixedPlan(m, false);
    } else if ((m = /^מתוך הקלטה של (\d) ו־(\d)\/(\d) דקות נמחקו (\d) ו־(\d)\/(\d) דקות\. כמה נשאר\?/.exec(p))) {
      s = mixedPlan(m, true);
    } else if ((m = /^(\d+)\/(\d+) × (\d+)\/(\d+) = \?$/.exec(p))) {
      // a fraction of a fraction: the inner note in equal groups, then some of the groups
      const a = +m[1], b = +m[2], c = +m[3], d = +m[4], L = b * d;
      if (L <= 12) s = { kind: 'ofNote', L: L, groups: b, per: c, take: a, value: frac(a * c, L) };
    } else if ((m = /^(\d) × (\d+)\/(\d+) = \?$/.exec(p))) {
      const k = +m[1], c = +m[2], d = +m[3];
      if (d <= 12 && k * c <= d) s = { kind: 'repeat', L: d, k: k, len: c, value: frac(k * c, d) };
    } else if ((m = /^(?:חצי|רבע|שמינית) (?:מנוקד|מנוקדת)(?: הוא|:) 1\/(\d+) × 3\/2(?:\. איזה חלק מתיבה שלמה\?| = \?) \(כשבר\)$/.exec(p))) {
      const d = +m[1], L = 2 * d;
      if (L <= 16) s = { kind: 'dotted', L: L, base: 2, value: frac(3, L) };
    } else if (/^תו מנוקד ארוך פי 3\/2 מהתו\. כמה פעימות נמשך חצי מנוקד\? \(חצי = 2 פעימות\)$/.test(p)) {
      s = { kind: 'dotted', L: 0, base: 2, value: 3 };
    } else if (/^1 ו־1\/2 × 1 ו־1\/3 = \?$/.test(p)) {
      s = { kind: 'dottedMixed', per: 3, base: 4, value: 2 };          // 1⅓ is four thirds; × 1½ adds half of itself
    } else if (/^בשלישייה כל שמינית מתנגנת 2\/3 מאורכה\. 1\/8 × 2\/3 = \? \(כשבר\)$/.test(p)) {
      s = { kind: 'triplet', L: 24, value: frac(2, 24) };
    } else if ((m = /^כמה (?:רבעים מנוקדים|שמיניות מנוקדות) \((\d+)\/(\d+)\) נכנס(?:ים|ות) בתיבה של (\d+)\/(\d+)\? \3\/\4 : \1\/\2 = \?$/.exec(p))) {
      const a = +m[1], b = +m[2], c = +m[3], d = +m[4], L = lcm(b, d), bar = c * L / d, len = a * L / b;
      if (bar % len === 0 && bar <= 12) s = { kind: 'measure', bar: bar, len: len, value: bar / len };
    } else if ((m = /^(\d) ו־(\d)\/(\d) : (\d) = \? \(שלם ושבר\)$/.exec(p))) {
      const w = +m[1], a = +m[2], d = +m[3], k = +m[4], total = w * d + a;
      if (total % k === 0 && total <= 24 && d <= 4) s = { kind: 'share', per: d, total: total, k: k, value: mixed(total / k, d) };
    }
    // ---- zydeco: parts of a set
    else if ((m = /^בכיתה (\d+) ילדים, (\d)\/(\d) מהם מנגנים\. כמה ילדים מנגנים\?$/.exec(p))) s = ofPlan(+m[2], +m[3], +m[1]);
    else if ((m = /^כמה ילדים הם (\d)\/(\d) מ־(\d+) ילדים\?$/.exec(p)) || (m = /^כמה זה (\d)\/(\d) מ־(\d+)\?$/.exec(p))) s = ofPlan(+m[1], +m[2], +m[3]);
    else if ((m = /^מתוך (\d+) תלמידים, (\d+) מנגנים\. איזה חלק מהתלמידים מנגנים\? כתבו שבר\.$/.exec(p))) {
      const whole = +m[1], part = +m[2];
      if (whole % part === 0 && whole / part <= 10 && part <= 12) s = { kind: 'whatPart', size: part, groups: whole / part, value: frac(1, whole / part) };
    } else if ((m = /^(\d)\/(\d) מה\S+ הם (\d+) \S+\. כמה \S+ ב\S+\?$/.exec(p))) {
      const a = +m[1], b = +m[2], v = +m[3];
      if (v % a === 0 && v / a <= 12) s = { kind: 'wholeFromPart', a: a, b: b, size: v / a, value: (v / a) * b };
    } else if ((m = /^חצי מ־(\d+) (\S+) וחצי מ־(\d+) \2 — בכמה \S+ הראשון גדול יותר\?$/.exec(p))) {
      const x = +m[1] / 2, y = +m[3] / 2;
      if (Number.isInteger(x) && Number.isInteger(y) && x > y && x <= 12) s = { kind: 'halves', x: x, y: y, value: x - y };
    } else if ((m = /^איזה חלק של יממה הם (\d+) שעות\? \(כשבר\)$/.exec(p))) {
      const h = +m[1]; if (24 % h === 0 && 24 / h <= 12 && h <= 12) s = { kind: 'dayPart', size: h, groups: 24 / h, value: frac(1, 24 / h) };
    } else if (/^איזה חלק של שבוע הם יממה אחת ו־12 שעות\? \(כשבר\)$/.test(p)) s = { kind: 'weekPart', value: frac(3, 14) };
    else if ((m = /^בכל יום החתול אוכל (\d)\/(\d) פחית\. מה מספר הפחיות הקטן ביותר שיש לקנות לשבוע\?$/.exec(p))) {
      const a = +m[1], b = +m[2]; if (b <= 4) s = { kind: 'cans', a: a, b: b, days: 7, value: Math.ceil(7 * a / b) };
    } else if ((m = /^איזה שבר נמצא (באמצע הדרך|ברבע הדרך) על ישר המספרים\?$/.exec(p))) {
      const at = m[1] === 'באמצע הדרך' ? 2 : 1; s = { kind: 'line', at: at, value: frac(at, 4) };
    }
    if (!s || String(s.value) !== raw) return null;   // the sounds give exactly the answer
    s.world = WORLDS[/^(of|whatPart|wholeFromPart|halves|dayPart|weekPart|cans|line)$/.test(s.kind) ? 'zydeco' : 'cumbia'];
    s.answer = String(s.value);
    let ev;
    try { ev = soundEvents(s); } catch (e) { return null; }
    if (!ev.length || longestRun(ev) > MAX_RUN || ev.length > MAX_EVENTS) return null;
    return s;
  }

  function mixedPlan(m, minus) {
    const d = lcm(+m[3], +m[6]);
    if (d !== 2 && d !== 4) return null;
    const x = +m[1] * 4 + +m[2] * 4 / +m[3], y = +m[4] * 4 + +m[5] * 4 / +m[6];
    const total = minus ? x - y : x + y;
    if (total <= 0 || Math.max(x, x + (minus ? 0 : y)) > 20) return null;
    return { kind: minus ? 'mixedSub' : 'mixedAdd', x: x, y: y, value: mixed(total, 4) };
  }
  function ofPlan(a, b, N) {
    if (N % b !== 0 || N / b > 12 || b > 10) return null;
    return { kind: 'of', a: a, b: b, size: N / b, value: a * N / b };
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
    let t = 0, streak = 0;
    const hit = (voice, hz, dur, gain, stage, extra) => { ev.push(Object.assign({ at: t, voice: voice, hz: hz, dur: dur, gain: gain, stage: stage }, extra || {})); };
    const rest = (d) => { t += d == null ? GAP : d; streak = 0; };
    // cumbia: a guacharaca beat on the fixed grid (a long run gets a short breath after twelve)
    const beat = (stage, extra) => { if (streak === MAX_RUN - 1) rest(BREAK); hit('shaker', 2400, 0.05, 0.14, stage, extra); t += STEP; streak++; };
    const start = (stage, extra) => { if (streak === MAX_RUN - 1) rest(BREAK); hit('drumLow', 130, 0.2, 0.18, stage, extra); };
    const note = (len, stage, extra) => { start(stage + 'Start', extra); for (let i = 0; i < len; i++) beat(stage, extra); };
    const silent = (n) => { t += n * STEP; streak = 0; };
    const ruler = (L) => { for (let i = 0; i < L; i++) beat('ruler'); rest(); };
    // zydeco: a washboard unit, an accordion group
    const unit = (stage, extra) => { if (streak === MAX_RUN - 1) rest(BREAK); hit('clap', 2000, 0.06, 0.16, stage, extra); t += STEP; streak++; };
    const group = (stage, extra) => { hit('reed', 330, 0.35, 0.16, stage, extra); t += 0.45; streak = 0; };
    switch (spec.kind) {
      case 'compare':
        ruler(spec.L);
        spec.notes.forEach((len, i) => { note(len, 'note', { n: i }); rest(); });
        break;
      case 'add':
        ruler(spec.L);
        note(spec.x, 'first'); note(spec.y, 'second');
        silent(spec.L - spec.x - spec.y);                                   // what the bar still has: silence
        break;
      case 'claim':
        ruler(spec.L);
        note(spec.first, 'first'); rest();                                  // the first part alone
        hit('reed', 330, spec.claim * STEP, 0.16, 'claim'); t += spec.claim * STEP; rest();   // the claimed sum, held: shorter
        break;
      case 'sub':
        ruler(spec.L);
        note(spec.x, 'first'); rest();
        note(spec.x - spec.y, 'left'); silent(spec.y);                      // the same note again: what is taken away is silent
        break;
      case 'missing':
        ruler(spec.L);
        spec.notes.forEach((len, i) => note(len, 'note', { n: i }));
        for (let i = 0; i < spec.L - 4; i++) beat('empty');                // beats with no note starting on them
        break;
      case 'mixedAdd':
      case 'mixedSub': {
        // a whole is a bar of four quarter beats; a short silence closes every bar
        let pos = 0;
        const play = (n, stage, mute) => {
          for (let i = 0; i < n; i++) {
            if (!mute) { if (i === 0) start(stage + 'Start'); beat(stage, { bar: Math.floor(pos / 4) }); } else silent(1);
            pos++; if (pos % 4 === 0) rest(0.45);
          }
        };
        if (spec.kind === 'mixedAdd') { play(spec.x, 'first'); play(spec.y, 'second'); }
        else { play(spec.x - spec.y, 'left'); play(spec.y, 'cut', true); }
        break;
      }
      case 'ofNote':
        ruler(spec.L);
        for (let g = 0; g < spec.groups; g++) note(spec.per, 'inner', { g: g });        // the inner note in equal groups
        rest();
        for (let g = 0; g < spec.take; g++) note(spec.per, 'part', { g: g });           // some of the groups
        break;
      case 'repeat':
        ruler(spec.L);
        for (let i = 0; i < spec.k; i++) note(spec.len, 'note', { n: i });
        break;
      case 'dotted':
        if (spec.L) ruler(spec.L);
        note(spec.base, 'base'); beat('dot');                               // the dot: half of the note again
        break;
      case 'dottedMixed':
        for (let w = 0; w < 2; w++) { for (let i = 0; i < spec.per; i++) beat('ruler', { bar: w }); rest(0.45); }
        rest();
        note(spec.base, 'base'); for (let i = 0; i < spec.base / 2; i++) beat('dot');   // and half of itself again
        break;
      case 'triplet':
        ruler(spec.L);
        for (let i = 0; i < 2; i++) note(3, 'straight', { n: i });                       // two plain eighths: six beats
        rest();
        for (let i = 0; i < 3; i++) note(2, 'tripletNote', { n: i });                    // three triplet eighths in the same six beats
        break;
      case 'measure':
        for (let i = 0; i < spec.bar / spec.len; i++) note(spec.len, 'dotted', { n: i });
        break;
      case 'share':
        for (let g = 0; g < spec.k; g++) { note(spec.total / spec.k, 'share', { g: g }); rest(0.45); }
        break;
      // ---- zydeco
      case 'of':
        for (let i = 0; i < spec.size; i++) unit('demoUnit');
        group('demoGroup'); rest();
        for (let g = 0; g < spec.b; g++) group('whole', { g: g });
        rest();
        for (let g = 0; g < spec.a; g++) group('take', { g: g });
        break;
      case 'whatPart':
      case 'dayPart':
        for (let i = 0; i < spec.size; i++) unit('demoUnit');
        group('demoGroup'); rest();
        for (let g = 0; g < spec.groups; g++) group('whole', { g: g, part: g === 0 });
        break;
      case 'wholeFromPart':
        for (let g = 0; g < spec.a; g++) group('given', { g: g });
        rest();
        for (let i = 0; i < spec.size; i++) unit('oneGroup');
        group('demoGroup'); rest();
        for (let g = 0; g < spec.b; g++) group('whole', { g: g });
        break;
      case 'halves':
        // one to one: the two halves side by side; what the first has alone is the difference
        for (let i = 0; i < spec.x; i++) { if (i < spec.y) hit('reed', 330, 0.2, 0.14, 'pair', { i: i }); unit(i < spec.y ? 'matched' : 'more', { i: i }); }
        break;
      case 'weekPart':
        unit('half'); unit('half'); group('day'); rest();                   // a day is two halves
        for (let d = 0; d < 7; d++) group('week', { d: d });
        rest();
        for (let i = 0; i < 3; i++) unit('part');
        break;
      case 'cans': {
        // the thirds eaten day by day; the accordion closes every can that was emptied
        let eaten = 0;
        for (let d = 0; d < spec.days; d++) {
          for (let i = 0; i < spec.a; i++) { unit('eaten', { day: d }); eaten++; if (eaten % spec.b === 0) group('can'); }
          rest(0.35);
        }
        break;
      }
      case 'line':
        for (let i = 0; i < 4; i++) { unit('step', { i: i }); if (i + 1 === spec.at) group('here'); }
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
  const HOW = {
    claim: 'קודם התיבה כולה, ואחריה החלק הראשון לבדו. ואז הצליל של דני, צליל אחד ארוך. הסכום של שני חלקים — איך הוא יכול להיות קצר מאחד מהם?',
    compare: 'קודם התיבה השלמה — הסרגל. אחר כך כל שבר על אותו סרגל: התוף מתחיל את התו, והגואצ׳ארקה סופרת כמה פעמות הוא מכסה. יותר חלוקות פירושן חתיכות קצרות יותר.',
    add: 'קודם התיבה השלמה. אחר כך שני התווים על אותו סרגל, זה אחרי זה. כמה פעמות מתוך התיבה?',
    sub: 'קודם התיבה השלמה, ואז התו הראשון. אחר כך אותו תו שוב — ומה שמורידים נשמע כשקט. כמה פעמות נשארו?',
    missing: 'קודם התיבה. אחר כך התווים שיש בה, והפעמות האחרונות בלי תו שמתחיל עליהן. כמה חסר?',
    mixedAdd: 'שלם הוא תיבה של ארבע פעמות, ושקט קצר סוגר כל תיבה. התוף מתחיל כל מספר. כמה תיבות מלאות, וכמה פעמות נוספות?',
    mixedSub: 'שלם הוא תיבה של ארבע פעמות, ושקט קצר סוגר כל תיבה. מה שנמחק בסוף נשמע כשקט. כמה תיבות מלאות נשארו, וכמה פעמות?',
    ofNote: 'קודם התיבה השלמה. אחר כך התו הפנימי בקבוצות שוות, ואחריו רק חלק מהקבוצות. איזה חלק מהתיבה?',
    repeat: 'קודם התיבה השלמה. אחר כך אותו תו שוב ושוב — פעם אחרי פעם. איזה חלק מהתיבה?',
    dotted: 'התו, ואחריו הנקודה — חצי מהתו עצמו עוד פעם. כמה פעמות בסך הכול?',
    dottedMixed: 'קודם שני שלמים. אחר כך התו, ואחריו — כמו נקודה — עוד חצי ממנו. כמה שלמים?',
    triplet: 'קודם התיבה השלמה. אחר כך שתי שמיניות רגילות, ובאותו זמן בדיוק — שלוש שמיניות של שלישייה. הקצב לא משתנה: רק החלוקה צפופה יותר.',
    measure: 'התיבה מתמלאת בתווים מנוקדים: התוף מתחיל כל אחד, והגואצ׳ארקה סופרת את הפעמות שלו. כמה תווים נכנסים?',
    share: 'הכול מחולק לקבוצות שוות: התוף מתחיל כל קבוצה. כמה תיבות ופעמות יש בקבוצה אחת?',
    of: 'קודם קבוצה אחת: יחידות של וושבורד, ואחריהן האקורדיון. אחר כך השלם בקבוצות שוות, ואז רק הקבוצות שלוקחים.',
    whatPart: 'קודם קבוצה אחת: יחידות של וושבורד, ואחריהן האקורדיון. אחר כך השלם כולו בקבוצות כאלה. החלק הוא קבוצה אחת — מתוך כמה?',
    dayPart: 'קודם קבוצה אחת של שעות: וושבורד לכל שעה, ואחריהן האקורדיון. אחר כך היממה כולה בקבוצות כאלה. מתוך כמה?',
    wholeFromPart: 'קודם הקבוצות שנתונות. אחר כך קבוצה אחת ביחידות שלה. ובסוף כל הקבוצות של השלם.',
    halves: 'שני החצאים זה ליד זה, יחידה מול יחידה. מה שנשמע לבד — זה ההפרש.',
    weekPart: 'יממה היא שני חצאים. אחר כך השבוע — אקורדיון לכל יממה. ובסוף החלק — בחצאי יממות. מתוך כמה חצאים?',
    cans: 'כל יום — החלקים שהחתול אוכל. האקורדיון סוגר כל פחית שהתרוקנה. ומה שנשאר בסוף — גם הוא צריך פחית.',
    line: 'הדרך מאפס עד אחת היא ארבעה צעדים שווים. האקורדיון מסמן איפה עומדים.',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    return '<div class="fraction-time">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc(HOW[spec.kind]) + '</p>'
      + (revealed
        ? '<p class="band-predict ft-silent">עכשיו בלי צליל: ציירו את התיבה או את הקבוצות, ובדקו שוב.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו וספרו פעמות.</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html, frac: frac, mixed: mixed };
});
