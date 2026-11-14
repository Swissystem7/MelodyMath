// MelodyMath — DivisorWorlds: remainders, measurement division, primes,
// factors, divisibility and parity, heard (grades ב׳–ו׳; tags leftoverBeats,
// phraseShare, meterGroups, meters, stickingParity). Research:
// docs/research/divisor-worlds-2026-11-14.md (Perplexity + Meta AI).
//
// Meta AI: "you don't hear the whole count, you hear the strategy" — one full
// example once, then only markers; one sound keeps one meaning. One world per
// kind of question, each with its credit:
//   remainders — North Indian tala: one cycle in full (sam and its strokes),
//     then every sam is a whole bar, then the leftover strokes and real silence
//     for the beats the bar is missing.
//   measurement division — bluegrass banjo: one roll of the group in full, then
//     a pinch (two strings together) for every whole roll. Never 56 notes.
//   rectangles — tango: piano opens a row, bandoneon plays a unit; a row left
//     short is real silence; a chord when a rectangle is found.
//   factors — Korean samul nori: every prime factor on its own instrument, all
//     equally loud, heard as that many strokes; ascending order is a convention.
//   divisibility — Cuban son: the tres checks only the ones; the clave plays the
//     digit sum; the güiro marks a group that closed. Never mixed.
//   divisors — Trinidad steelpan: divisors come in pairs; each one found rings.
//   parity — funk, "the One": whole pairs land on the One (a place in time,
//     never loudness).
// Never more than 12 sounds in a row; the widget shows only when the sounds
// (with the numbers in the text) give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_DIVISOR_WORLDS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['leftoverBeats', 'phraseShare', 'meterGroups', 'meters', 'stickingParity']);
  const MAX_RUN = 12;
  const MAX_EVENTS = 56;
  const STEP = 0.24, GAP = 0.6, APART = 0.42;

  const WORLDS = {
    tala: { he: 'טאלה צפון־הודית', why: 'מחזור הקצב של המוזיקה הקלאסית בצפון הודו. הסאם פותח כל מחזור; כאן כל סאם עומד במקום תיבה שלמה, ומה שנשאר אחרי התיבות השלמות הוא השארית' },
    banjo: { he: 'רול בנג׳ו בבלוגראס', why: 'מסורת נגני הבנג׳ו מהרי האפלצ׳ים: רול הוא משפט קבוע של צלילים, ופינץ׳ — שני מיתרים שנצבטים יחד — עומד במקום רול שלם' },
    tango: { he: 'טנגו מבואנוס איירס', why: 'פסנתר פותח שורה ובנדונאון מנגן יחידה: מסדרים את היחידות בשורות שוות. שורה שנשארת חסרה — אין מלבן' },
    samul: { he: 'סאמולנורי קוריאני', why: 'הרכב עממי של ארבעה כלי הקשה. לכל גורם ראשוני כלי משלו, כולם באותה עוצמה, והגורם נשמע כמספר המכות שלו; הסדר מהקטן לגדול הוא מוסכמה' },
    son: { he: 'סון קובני', why: 'הסון נולד בקובה ממפגש של שורשים אפריקאיים וספרדיים. הטרס בודק רק את האחדות, והקלאווה מנגנת את סכום הספרות — שני תפקידים נפרדים' },
    pan: { he: 'סטילפאן מטרינידד', why: 'הכלי שנולד בקרנבל של טרינידד. מחלקים באים בזוגות: כל מחלק שנמצא מצלצל, ועוצרים כשהזוגות מתחילים לחזור' },
    funk: { he: 'פאנק — ה־One', why: 'בפאנק של שנות השישים והשבעים ה־One הוא מקום בזמן ולא עוצמה. זוגות שלמים נוחתים על ה־One' },
  };
  const KIND_WORLD = { twoThrees: 'samul', leftover: 'tala', position: 'tala', measure: 'banjo', share: 'banjo', rect: 'tango', rectGiven: 'tango', factor: 'samul', by5: 'son', digitSum: 'son', walk: 'pan', evenPrime: 'pan', threeNotSix: 'funk' };
  // samul nori: kkwaenggwari (small gong), janggu (hourglass drum), buk (barrel drum), jing (large gong)
  const SAMUL = { 2: ['metalBell', 1400], 3: ['drumHigh', 330], 5: ['drumLow', 98], 7: ['gong', 130] };

  const num = (s) => +String(s).replace(/,/g, '');
  const primeFactors = (n) => { const f = []; let x = n; for (let p = 2; p * p <= x; p++) while (x % p === 0) { f.push(p); x /= p; } if (x > 1) f.push(x); return f; };
  const divisorCount = (n) => { let c = 0; for (let a = 1; a <= n; a++) if (n % a === 0) c++; return c; };

  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const p = String(item.prompt || '').trim(), std = String(item.standard || '');
    const raw = String(item.answer).trim();
    let m, s = null;
    if ((m = /^(\d+) פעימות בתיבות של (\d+) — כמה תיבות שלמות, וכמה פעימות נשארות\?/.exec(p))) {
      const n = +m[1], k = +m[2], q = Math.floor(n / k), r = n % k;
      if (k >= 2 && k <= 10 && q <= 10) s = { kind: 'leftover', n: n, k: k, q: q, r: r, value: q + ' שארית ' + r };
    } else if (item.music === 'phraseShare' && (m = /^במשקל (\d)\/4, פעמה (\d+) היא איזו פעמה בתיבה שלה\?$/.exec(p))) {
      // counted from 1, as musicians count: the place of beat n in a bar of k is
      // ((n − 1) mod k) + 1 — a remainder of 0 is the bar's LAST beat, never "beat 0"
      const k = +m[1], n = +m[2], q = Math.floor((n - 1) / k), pos = ((n - 1) % k) + 1;
      if (k >= 2 && k <= 6 && q <= 10) s = { kind: 'position', n: n, k: k, q: q, pos: pos, value: pos };
    } else if (item.music === 'phraseShare' && (m = /^(\d+) ÷ (\d+) = \?$/.exec(p))) {
      // the bigger ones only: up to 40 notes stay with DivisionBeats
      const n = +m[1], k = +m[2];
      if (n > 40 && k >= 2 && k <= 10 && n % k === 0 && n / k <= 10) s = { kind: 'measure', n: n, k: k, value: n / k };
    } else if (item.music === 'phraseShare' && (m = /^(\d+) \S+ ל־(\d+) ילדים\. כמה לכל אחד\?$/.exec(p))) {
      const n = +m[1], k = +m[2];
      if ((k > 5 || !/לחלקים/.test(std)) && k <= 10 && n % k === 0 && n / k <= 10) s = { kind: 'share', n: n, k: k, value: n / k };
    } else if (/^מהו המספר הראשוני הזוגי היחיד\?$/.test(p)) s = { kind: 'evenPrime', nums: [2, 4, 6], value: 2 };
    else if (/^האם 1 הוא מספר ראשוני\? \(כן\/לא\)$/.test(p)) s = { kind: 'walk', n: 1, value: 'לא' };
    else if ((m = /^כמה מחלקים יש למספר (\d+) \(כולל 1 ו־\1\)\?$/.exec(p))) { const n = +m[1]; if (n <= 40) s = { kind: 'walk', n: n, value: divisorCount(n) }; }
    else if ((m = /^האם ([\d,]+) מתחלק ב־5 בלי שארית\? \(כן\/לא\)$/.exec(p))) { const n = num(m[1]), d = n % 10; s = { kind: 'by5', n: n, d: d, value: d % 5 === 0 ? 'כן' : 'לא' }; }
    else if ((m = /^האם ([\d,]+) מתחלק ב־(3|9) בלי שארית\? \(כן\/לא\)$/.exec(p))) {
      const n = num(m[1]), k = +m[2], ds = String(n).split('').map(Number), sum = ds.reduce((a, b) => a + b, 0);
      if (sum <= 24) s = { kind: 'digitSum', n: n, k: k, digits: ds, value: sum % k === 0 ? 'כן' : 'לא' };
    } else if ((m = /^נתון: (\d+) × (\d+) = ([\d,]+)\. האם \3 הוא מספר ראשוני\? \(כן\/לא\)$/.exec(p))) {
      const a = +m[1], b = +m[2];
      if (a * b === num(m[3]) && a > 1 && b > 1 && b <= 10 && a <= 30) s = { kind: 'rectGiven', rows: a, len: b, value: 'לא' };
    } else if ((m = /^כמה מלבנים שונים, באורכי צלעות שלמים, אפשר לבנות מ־(\d+) יחידות שטח ריבועיות\?/.exec(p))) {
      const n = +m[1];
      if (n <= 12) {
        const tests = []; for (let k = 2; k < n && (k * k <= n || k <= 3); k++) tests.push(k);
        const found = tests.filter((k) => n % k === 0 && k * k <= n).length + 1;
        s = { kind: 'rect', n: n, tests: tests, value: found };
      }
    } else if ((m = /^פרקו לגורמים ראשוניים: (\d+) = ((?:\d+ × )+)☐\. מה הגורם החסר\?$/.exec(p))) {
      const n = +m[1], known = m[2].split('×').map((x) => +x.trim()).filter(Boolean), prod = known.reduce((a, b) => a * b, 1), miss = n / prod;
      if (Number.isInteger(miss) && SAMUL[miss] && known.every((f) => SAMUL[f])) s = { kind: 'factor', n: n, known: known, last: miss, value: miss };
    } else if ((m = /^מהו הגורם הראשוני הגדול ביותר של (\d+)\?$/.exec(p))) {
      const f = primeFactors(+m[1]);
      if (f.every((x) => SAMUL[x])) s = { kind: 'factor', n: +m[1], known: f.slice(0, -1), last: f[f.length - 1], largest: true, value: f[f.length - 1] };
    } else if (/^מספר מתחלק ב־3 אבל לא ב־6\. האם הוא יכול להיות זוגי\? \(כן\/לא\)$/.test(p)) s = { kind: 'threeNotSix', mults: [3, 6, 9, 12], value: 'לא' };
    else if ((m = /^מהו המספר הראשוני הגדול ביותר שקטן מ־(\d+)\?$/.exec(p))) {
      // the first candidate below the bound, walked from one to the middle: only one and itself ring
      let n = +m[1] - 1;
      while (n > 2 && divisorCount(n) !== 2) n--;
      if (n <= 31) s = { kind: 'walk', n: n, prime: true, value: n };
    } else if ((m = /^([\d,]+) ו־([\d,]+) הם כפולות של 3\. האם המכפלה שלהם מתחלקת ב־9\? \(כן\/לא\)$/.exec(p))) {
      s = { kind: 'twoThrees', value: 'כן' };
    }
    if (!s || String(s.value) !== raw) return null;   // the sounds give exactly the answer
    s.world = WORLDS[KIND_WORLD[s.kind]];
    s.answer = String(s.value);
    let ev;
    try { ev = soundEvents(s); } catch (e) { return null; }
    if (!ev.length || longestRun(ev) > MAX_RUN || ev.length > MAX_EVENTS) return null;
    return s;
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
    // a group of steady strokes: a run of at most `n` (n ≤ 12)
    const strokes = (n, voice, hz, stage, extra) => { for (let i = 0; i < n; i++) { hit(voice, hz, 0.12, 0.18, stage, Object.assign({ i: i }, extra)); t += STEP; } };
    const pause = (d) => { t += d == null ? GAP : d; };
    const walk = (n, extra) => {
      // try every divisor from one up to the middle; a fitting one rings for itself and its partner
      for (let a = 1; a * a <= n; a++) {
        strokes(a, 'steelPan', 523, 'try', Object.assign({ a: a }, extra));
        t += 0.2;
        if (n % a === 0) {
          hit('metalBell', 1568, 0.3, 0.14, 'divisor', Object.assign({ a: a }, extra)); t += APART;
          if (a * a !== n) { hit('metalBell', 1568, 0.3, 0.14, 'divisor', Object.assign({ a: n / a }, extra)); t += APART; }
        } else t += APART;                                     // real silence: no divisor here
        pause(0.3);
      }
      hit('woodClick', 900, 0.05, 0.1, 'stop', extra); pause();
    };
    switch (spec.kind) {
      case 'leftover':
        // one cycle in full, then a sam for every whole bar, then what is left — and silence for what is missing
        hit('drumLow', 110, 0.3, 0.2, 'demoSam'); t += STEP;
        strokes(spec.k - 1, 'drumHigh', 520, 'demoStroke');
        pause();
        for (let i = 0; i < spec.q; i++) { hit('drumLow', 110, 0.3, 0.2, 'sam', { bar: i }); t += APART; }
        pause();
        strokes(spec.r, 'drumHigh', 520, 'left');
        if (spec.r) t += (spec.k - spec.r) * STEP;              // the bar's missing beats: real silence
        break;
      case 'position':
        // one cycle in full; a sam for every bar already past; then the beat's
        // own bar from its sam, beat by beat, stopping on the beat asked about
        hit('drumLow', 110, 0.3, 0.2, 'demoSam'); t += STEP;
        strokes(spec.k - 1, 'drumHigh', 520, 'demoStroke');
        pause();
        for (let i = 0; i < spec.q; i++) { hit('drumLow', 110, 0.3, 0.2, 'sam', { bar: i }); t += APART; }
        pause();
        hit('drumLow', 110, 0.3, 0.2, 'barSam', { beat: 1 }); t += STEP;
        for (let b = 2; b <= spec.pos; b++) { hit('drumHigh', 520, 0.12, 0.18, 'beat', { beat: b }); t += STEP; }
        break;
      case 'measure':
      case 'share':
        // one roll of the group in full; then each pinch is a whole roll
        strokes(spec.k, 'pluck', 392, 'demoRoll');
        pause();
        for (let i = 0; i < spec.value; i++) { hit('pluck', 392, 0.2, 0.18, 'pinch', { i: i }); hit('pluck', 587, 0.2, 0.18, 'pinchHigh', { i: i }); t += APART; }
        break;
      case 'walk': walk(spec.n); break;
      case 'evenPrime':
        spec.nums.forEach((n) => { walk(n, { n: n }); pause(0.3); });
        break;
      case 'rect': {
        // rows of k: the piano opens each row; a short row is real silence where units are missing
        const row = (k, units, tag) => { hit('keys', 262, 0.2, 0.16, 'rowStart', { k: tag }); t += STEP; strokes(units, 'reed', 220, 'unit', { k: tag }); t += 0.12; };
        spec.tests.forEach((k) => {
          const full = Math.floor(spec.n / k), rem = spec.n % k;
          for (let r = 0; r < full; r++) row(k, k, k);
          if (rem) { row(k, rem, k); t += (k - rem) * STEP; }
          else { hit('keys', 330, 0.5, 0.16, 'found', { k: k }); hit('keys', 392, 0.5, 0.16, 'foundHigh', { k: k }); t += 0.5; }
          pause();
        });
        row(spec.n, spec.n, spec.n);                            // one long row is always a rectangle
        hit('keys', 330, 0.5, 0.16, 'found', { k: spec.n }); hit('keys', 392, 0.5, 0.16, 'foundHigh', { k: spec.n });
        break;
      }
      case 'rectGiven':
        // one full row, then every piano is another full row like it; all full and more than one: a rectangle
        hit('keys', 262, 0.2, 0.16, 'rowStart', { r: 0 }); t += STEP;
        strokes(spec.len, 'reed', 220, 'unit');
        pause();
        for (let r = 1; r < spec.rows; r++) { hit('keys', 262, 0.2, 0.16, 'rowStart', { r: r }); t += (r % 10 === 0 ? 0.7 : APART); }
        pause(0.3);
        hit('keys', 330, 0.5, 0.16, 'found'); hit('keys', 392, 0.5, 0.16, 'foundHigh');
        break;
      case 'factor': {
        // the whole (when it is short), then each known factor splits it: that many strokes on its own instrument,
        // and one part after the split; what is left at the end is the missing factor, on its own instrument
        let part = spec.n;
        if (part <= 12) { strokes(part, 'clap', 1000, 'whole'); pause(); }
        spec.known.forEach((f, i) => {
          const s = SAMUL[f];
          strokes(f, s[0], s[1], 'split', { f: f, n: i });
          part /= f;
          pause(0.35);
          if (part <= 12 && i < spec.known.length - 1) { strokes(part, 'clap', 1000, 'part', { n: i }); pause(); }
        });
        pause(0.3);
        const s = SAMUL[spec.last];
        strokes(spec.last, s[0], s[1], 'last', { f: spec.last });
        break;
      }
      case 'by5':
        // a ten is two whole fives — so only the ones are played
        strokes(5, 'pluck', 330, 'demoTen', { half: 0 }); hit('shaker', 600, 0.2, 0.12, 'closedDemo'); t += 0.35;
        strokes(5, 'pluck', 330, 'demoTen', { half: 1 }); hit('shaker', 600, 0.2, 0.12, 'closedDemo'); t += 0.35;
        pause(1);                                              // the hundreds and tens: whole fives, silence
        strokes(spec.d, 'pluck', 330, 'ones');
        if (spec.d % 5 === 0 && spec.d) hit('shaker', 600, 0.2, 0.12, 'closed');
        break;
      case 'digitSum': {
        // one ten is groups of k and one more — so each digit leaves exactly itself; the clave plays the digits
        const k = spec.k;
        let c = 0;
        for (let i = 0; i < 10; i++) { hit('woodClick', 1800, 0.08, 0.16, 'demoTen', { i: i }); t += STEP; if (++c % k === 0 && i < 9) { hit('shaker', 600, 0.2, 0.12, 'closedDemo'); t += 0.32; } }
        pause();
        c = 0;
        spec.digits.forEach((d, j) => {
          for (let i = 0; i < d; i++) { hit('woodClick', 1800, 0.08, 0.16, 'digit', { j: j }); t += STEP; if (++c % k === 0) { hit('shaker', 600, 0.2, 0.12, 'closed', { j: j }); t += 0.32; } }
          t += 0.35;
        });
        break;
      }
      case 'twoThrees': {
        // each number brings a factor of three (three janggu strokes); in the product both are there: three times three
        const j = SAMUL[3];
        strokes(3, j[0], j[1], 'factor', { from: 0 }); pause(0.4);
        strokes(3, j[0], j[1], 'factor', { from: 1 }); pause();
        for (let g = 0; g < 3; g++) { strokes(3, 'clap', 1000, 'nine', { g: g }); pause(0.35); }
        break;
      }
      case 'threeNotSix':
        // each multiple of three in triples; then where it lands: the One for whole pairs, the "and" otherwise;
        // landing on the One also rings the bell of six — two and three together
        strokes(3, 'clap', 1000, 'demoTriple');
        pause();
        spec.mults.forEach((mlt) => {
          for (let i = 0; i < mlt / 3; i++) { hit('clap', 1000, 0.15, 0.16, 'triple', { m: mlt }); t += 0.34; }
          t += 0.2;
          if (mlt % 2 === 0) { hit('stomp', 80, 0.3, 0.18, 'one', { m: mlt }); hit('metalBell', 1047, 0.4, 0.14, 'six', { m: mlt }); }
          else hit('shaker', 900, 0.15, 0.16, 'and', { m: mlt });
          t += 0.4;
          pause(0.3);
        });
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
    leftover: 'קודם מחזור אחד שלם: סאם ואחריו שאר הפעמות. אחר כך כל סאם הוא תיבה שלמה, ובסוף — הפעמות שנשארו, ושקט במקום הפעמות שחסרות לתיבה.',
    position: 'קודם מחזור אחד שלם: סאם ואחריו שאר הפעמות. אחר כך כל סאם הוא תיבה שלמה שכבר עברה. בסוף התיבה של הפעמה, מהסאם שלה ופעמה אחרי פעמה — על איזו פעמה עוצרים?',
    measure: 'קודם רול אחד שלם בגודל הקבוצה. אחר כך כל פינץ׳ הוא רול שלם. כמה פינצ׳ים עד שמגיעים לכל הכמות?',
    share: 'סבב חלוקה אחד: צליל לכל ילד, וזה רול אחד. אחר כך כל פינץ׳ הוא סבב שלם. כמה סבבים — כך כמה קיבל כל ילד.',
    walk: 'בודקים מאחת והלאה: מספר המכות הוא המחלק שנבדק. מחלק שמתאים מצלצל — הוא ובן הזוג שלו; ריבוע מצלצל פעם אחת. עוצרים כשהזוגות חוזרים.',
    evenPrime: 'שלושה מספרים זוגיים, כל אחד נבדק מאחת והלאה. כמה מחלקים מצלצלים לכל אחד? למספר ראשוני יש בדיוק שניים.',
    rect: 'מנסים לסדר את היחידות בשורות שוות. שורה שנשארת חסרה — שקט במקום היחידות החסרות. אקורד — נמצא מלבן. סיבוב של מלבן הוא אותו מלבן.',
    rectGiven: 'שורה אחת שלמה, ואחריה כל פתיחת שורה היא עוד שורה מלאה כמוה. כשכל השורות מלאות ויש יותר משורה אחת — זה מלבן.',
    factor: 'כל גורם מחלק לקבוצות: מספר המכות הוא מספר הקבוצות. מה שנשאר בסוף, בכלי שלו — הגורם האחרון.',
    by5: 'כל עשרת היא שתי חמישיות שלמות, ולכן הטרס מנגן רק את האחדות. הגווירו מסמן חמישייה שנסגרה.',
    digitSum: 'עשרת אחת היא קבוצות שלמות ועוד אחת — לכן כל ספרה משאירה בדיוק את עצמה. הקלאווה מנגנת את הספרות זו אחר זו, והגווירו מסמן כל קבוצה שנסגרה. נשאר משהו בסוף?',
    twoThrees: 'כל אחד משני המספרים מביא גורם של שלוש: שלוש מכות בג׳אנגו. במכפלה שני הגורמים יחד — שלוש קבוצות של שלוש. מה זה אומר על תשע?',
    threeNotSix: 'כל כפולה של שלוש, בשלישיות. אחריה הנחיתה: ה־One לזוגי, ה־and לאי־זוגי. כשנוחתים על ה־One מצלצל גם הפעמון של שש, כי שתיים ושלוש יחד הן שש.',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    return '<div class="divisor-worlds">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc(HOW[spec.kind]) + '</p>'
      + (revealed
        ? '<p class="band-predict dw-silent">עכשיו בלי צליל: ציירו את הקבוצות על הדף ובדקו שוב.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו לקבוצות.</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html, SAMUL: SAMUL };
});
