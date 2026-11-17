// MelodyMath — PartsNumerals: fractions in models, on the number line and as a
// quotient, the whole from a part, and number systems (Roman, Hebrew letters,
// place value), heard (grades ה׳–ו׳; tags noteValues, romanGroupSymbols).
// Research: docs/research/parts-numerals-2026-11-13.md (Perplexity + Meta AI).
//
// Meta AI: the trap is "counting without a unit" — three sounds are heard as
// 3, not 3/8, not 123, not 7000. So every exercise makes ONE sound's worth
// audible before anything is counted:
//   a fraction model — inspired by the batucada of Brazilian samba schools:
//     the whole on the surdo, the shaded part on the tamborim, the rest on the
//     agogô — three phrases, never accents, never silence for "not shaded".
//   the number line — dabke, a line dance: a deep stamp lands on a whole
//     number, a light step is one equal part between them.
//   a fraction as a quotient — a round (canon): every voice is a child, every
//     pizza is one round giving each voice one slice.
//   the whole from a part — layers, inspired by the gamelan: a part is copied
//     until the whole is built; for 2/3 the part is first SPLIT, then built.
//   Roman numerals — inspired by the tarantella of southern Italy (a secular
//     echo, not a claim about ancient Rome): a timbre per symbol, and an
//     explicit "minus" sound before a symbol that is taken away.
//   Hebrew letter numerals — inspired by klezmer (secular celebration music):
//     an opening motif says "now letters are numbers"; hundreds on a clarinet,
//     tens on a violin, ones on a flute. Everyday use only (dates, coins) —
//     never cantillation, liturgy or mystical gematria.
//   place value — orchestra sections: each place is a section, the digit is how
//     many times it plays, and a zero is a section's turn with no notes.
// Never more than 12 sounds in a row; the widget shows only when the sounds
// (with the numbers in the text) give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_PARTS_NUMERALS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['noteValues', 'romanGroupSymbols']);
  const MAX_RUN = 12;
  const MAX_EVENTS = 44;
  const STEP = 0.26, GAP = 0.7;

  const WORLDS = Object.freeze({
    batucada: { he: 'בהשראת הבטוקדה', why: 'אנסמבל התופים של בתי הספר לסמבה בברזיל: כל תוף אחראי על תפקיד אחר' },
    dabke: { he: 'דבקה', why: 'ריקוד שורה לבנטיני: הרוקדים הולכים בקו. דריכה עמוקה נוחתת על מספר שלם, וצעד קל הוא חלק שווה ביניהם' },
    canon: { he: 'שיר סבב (קאנון)', why: 'קולות נכנסים בזה אחר זה ושרים אותו דבר: כל קול הוא ילד, וכל סבב מחלק פריט אחד שווה בשווה' },
    gamelan: { he: 'בהשראת הגמלאן', why: 'אנסמבל מבאלי ומג׳אווה שבו כלים נכנסים שכבה אחר שכבה עד שנבנה השלם' },
    tarantella: { he: 'בהשראת הטרנטלה', why: 'ריקוד עם מדרום איטליה — הד חילוני לעיר רומא, לא טענה שהרומאים רקדו אותו. לכל סימן גוון משלו' },
    klezmer: { he: 'בהשראת הכליזמר', why: 'מוזיקה יהודית כלית לשמחות ולחתונות. אותיות כמספרים משמשות בחיי היומיום — בתאריכים ועל מטבעות' },
    orchestra: { he: 'תזמורת', why: 'כל סקציה היא מקום במספר; הספרה היא כמה פעמים הסקציה מנגנת, ואפס הוא תור בלי צלילים' },
  });

  const ROMAN = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
  const ROMAN_VOICE = { M: ['drumLow', 70], D: ['drumLow', 90], C: ['drumLow', 110], L: ['frameDrum', 130], X: ['frameDrum', 160], V: ['jingle', 2000], I: ['woodClick', 2400] };
  const HEB = { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10, 'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'צ': 90, 'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400 };
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const frac = (a, b) => { const d = gcd(a, b); return (a / d) + '/' + (b / d); };

  function romanValue(s) {
    let total = 0;
    const parts = [];
    for (let i = 0; i < s.length; i++) {
      const v = ROMAN[s[i]], next = ROMAN[s[i + 1]] || 0;
      if (v == null) return null;
      if (v < next) { total -= v; parts.push({ sym: s[i], minus: true }); } else { total += v; parts.push({ sym: s[i], minus: false }); }
    }
    return { total: total, parts: parts };
  }

  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const p = String(item.prompt || '').trim();
    const raw = String(item.answer).trim();
    let m, s = null;
    if ((m = /^מלבן מחולק ל־(\d+) חלקים שווים, ו־(\d+) מהם צבועים\. איזה חלק מהמלבן צבוע\? כתבו שבר\.$/.exec(p))) {
      const n = +m[1], k = +m[2];
      if (n <= MAX_RUN && k < n) s = { kind: 'model', n: n, k: k, value: frac(k, n), world: WORLDS.batucada };
    } else if ((m = /^הקטע מ־0 עד 1 בישר המספרים מחולק ל־(\d+) קטעים שווים\. איזה שבר מתאים לשנתה (השנייה|השלישית|הראשונה) אחרי 0\?$/.exec(p))) {
      const d = +m[1], mark = { 'הראשונה': 1, 'השנייה': 2, 'השלישית': 3 }[m[2]];
      s = { kind: 'line', d: d, steps: d, mark: mark, value: frac(mark, d), world: WORLDS.dabke };
    } else if ((m = /^בישר המספרים, בין אילו שני מספרים שלמים נמצא (\d+)\/(\d+)\? כתבו את הקטן מביניהם\.$/.exec(p))) {
      const a = +m[1], d = +m[2];
      if (a % d !== 0 && a <= MAX_RUN) s = { kind: 'line', d: d, steps: a, mark: a, value: Math.floor(a / d), world: WORLDS.dabke };
    } else if ((m = /^מחלקים (\d+) פיצות שווה בשווה בין (\d+) ילדים\. איזה חלק מפיצה מקבל כל ילד\? כתבו שבר\.$/.exec(p)) || (m = /^מחלקים את הצבע של (\d+) דליים שווה בשווה ל־(\d+) מכלים\. איזה חלק מדלי יש בכל מכל\? כתבו שבר\.$/.exec(p))) {
      const items = +m[1], kids = +m[2];
      if (kids <= MAX_RUN && items * kids <= 40) s = { kind: 'share', items: items, kids: kids, value: frac(items, kids), world: WORLDS.canon };
    } else if ((m = /^תופרת גוזרת סרט של (\d+) מטרים ל־(\d+) חלקים שווים\. מה אורך כל חלק במטרים\? \(שלם ושבר\)$/.exec(p))) {
      const len = +m[1], k = +m[2], whole = Math.floor(len / k), rest = len % k;
      if (rest && whole <= MAX_RUN) s = { kind: 'ribbon', k: k, whole: whole, rest: rest, value: whole + ' ו־' + frac(rest, k), world: WORLDS.canon };
    } else if ((m = /^הקטע הצבוע הוא 1\/(\d+) מרצועה, ואורכו (\d+) ס״מ\. מה אורך הרצועה כולה בס״מ\?$/.exec(p))) {
      const d = +m[1], part = +m[2];
      if (part <= MAX_RUN && d * part <= 40) s = { kind: 'whole', num: 1, d: d, part: part, value: d * part, world: WORLDS.gamelan };
    } else if ((m = /^השטח הצבוע הוא (\d+)\/(\d+) משטח מלבן, והוא (\d+) משבצות\. מכמה משבצות בנוי המלבן כולו\?$/.exec(p))) {
      const a = +m[1], d = +m[2], part = +m[3];
      if (part % a === 0 && part <= MAX_RUN) s = { kind: 'whole', num: a, d: d, part: part, unit: part / a, value: (part / a) * d, world: WORLDS.gamelan };
    } else if ((m = /^בשיטה הרומית: איזה מספר הוא ([MDCLXVI]+)\?/.exec(p))) {
      const r = romanValue(m[1]);
      if (r && m[1].length <= 8) s = { kind: 'roman', symbols: m[1], parts: r.parts, value: r.total, world: WORLDS.tarantella };
    } else if ((m = /^בשיטת הא״ב: איזה מספר הוא ([א-ת]+)״([א-ת])\?$/.exec(p))) {
      const letters = (m[1] + m[2]).split('');
      const vals = letters.map((l) => HEB[l]);
      if (vals.every((v) => v)) s = { kind: 'hebrew', letters: letters, vals: vals, value: vals.reduce((a, b) => a + b, 0), world: WORLDS.klezmer };
    } else if ((m = /^במספר ([\d,]+), מה ערך הספרה (\d)\? \(כתבו בלי פסיק\)$/.exec(p))) {
      const digits = m[1].replace(/,/g, '').split('').map(Number), dg = +m[2];
      const idx = digits.indexOf(dg);
      if (idx >= 0 && digits.filter((x) => x === dg).length === 1 && digits.length <= 6) s = { kind: 'place', digits: digits, asked: dg, value: dg * Math.pow(10, digits.length - 1 - idx), world: WORLDS.orchestra };
    }
    if (!s || String(s.value) !== raw) return null;    // the sounds give exactly the answer
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
  const SECTIONS = [['horn', 196], ['reed', 330], ['bowed', 440], ['frameDrum', 150], ['pluck', 392], ['woodClick', 1600]];
  function soundEvents(spec) {
    if (!spec) return [];
    const ev = [];
    let t = 0;
    const hit = (voice, hz, dur, gain, stage, extra) => { ev.push(Object.assign({ at: t, voice: voice, hz: hz, dur: dur, gain: gain, stage: stage }, extra || {})); };
    switch (spec.kind) {
      case 'model':
        for (let i = 0; i < spec.n; i++) { hit('drumLow', 98, 0.2, 0.22, 'whole'); t += STEP; } t += GAP;
        for (let i = 0; i < spec.k; i++) { hit('drumHigh', 660, 0.08, 0.22, 'shaded'); t += STEP; } t += GAP;
        for (let i = 0; i < spec.n - spec.k; i++) { hit('metalBell', 1047, 0.12, 0.22, 'rest'); t += STEP; }
        break;
      case 'line': {
        hit('stomp', 80, 0.25, 0.26, 'wholeNumber', { n: 0 }); t += 0.45;
        for (let i = 1; i <= spec.steps; i++) {
          if (i % spec.d === 0) hit('stomp', 80, 0.25, 0.26, 'wholeNumber', { n: i / spec.d });
          else hit('woodClick', 1300, 0.05, 0.2, 'step', { i: i });
          if (i === spec.mark) hit('metalBell', 2093, 0.25, 0.12, 'flag', { i: i });
          t += 0.45;
        }
        break;
      }
      case 'share': {
        const hz = [262, 330, 392, 494, 523, 587, 659, 784, 880, 988, 1047, 1175];
        for (let r = 0; r < spec.items; r++) { for (let k = 0; k < spec.kids; k++) { hit('voiceAh', hz[k], 0.14, 0.18, 'slice', { kid: k, round: r }); t += STEP; } t += GAP; }
        break;
      }
      case 'ribbon': {
        // the leftover metre is split first: one deep metre, then one quarter for each child
        hit('drumLow', 98, 0.35, 0.24, 'leftMetre'); t += 0.5;
        for (let k = 0; k < spec.k; k++) { hit('woodClick', 1500 + 100 * k, 0.05, 0.18, 'quarter', { kid: k }); t += STEP; }
        t += GAP;
        // one child's share: whole metres, then the quarter
        for (let i = 0; i < spec.whole; i++) { hit('drumLow', 98, 0.25, 0.24, 'metre', { kid: 0 }); t += 0.34; }
        for (let i = 0; i < spec.rest; i++) { hit('woodClick', 1500, 0.05, 0.18, 'shareQuarter', { kid: 0 }); t += STEP; }
        break;
      }
      case 'whole': {
        const copy = (n, stage, extra) => { for (let i = 0; i < n; i++) { hit('tine', 1568, 0.08, 0.2, stage, extra); t += STEP; } t += GAP; };
        if (spec.num === 1) { for (let c = 0; c < spec.d; c++) copy(spec.part, 'copy', { c: c }); }
        else {
          copy(spec.part, 'part');
          hit('shaker', 520, 0.3, 0.12, 'split'); t += 0.5;                                   // split into equal groups
          for (let g = 0; g < spec.num; g++) copy(spec.unit, 'splitGroup', { g: g });
          hit('metalBell', 784, 0.3, 0.14, 'build'); t += 0.5;                                 // then build the whole
          for (let g = 0; g < spec.d; g++) copy(spec.unit, 'buildGroup', { g: g });
        }
        break;
      }
      case 'roman':
        spec.parts.forEach((pt, i) => {
          if (pt.minus) { hit('shaker', 220, 0.2, 0.14, 'minus', { i: i }); t += 0.3; }
          const v = ROMAN_VOICE[pt.sym];
          hit(v[0], v[1], 0.2, 0.24, 'symbol', { sym: pt.sym, minus: pt.minus });
          t += 0.4 + (spec.parts[i + 1] && pt.sym !== spec.parts[i + 1].sym && !pt.minus ? 0.35 : 0);
        });
        break;
      case 'hebrew': {
        // the opening motif: "now letters are numbers"
        [392, 494, 587].forEach((hz) => { hit('reed', hz, 0.12, 0.14, 'frame'); t += 0.18; });
        t += GAP;
        const voices = { 100: ['reed', 262], 10: ['bowed', 440], 1: ['breathy', 784] };
        spec.vals.forEach((v) => {
          const place = v >= 100 ? 100 : v >= 10 ? 10 : 1, n = v / place, vc = voices[place];
          for (let i = 0; i < n; i++) { hit(vc[0], vc[1], 0.16, 0.2, 'letter', { place: place }); t += STEP; }
          t += GAP;
        });
        break;
      }
      case 'place': {
        const L = spec.digits.length;
        spec.digits.forEach((dg, i) => {
          const sec = SECTIONS[(6 - L) + i];
          hit('shaker', 300, 0.12, 0.08, 'turn', { place: L - 1 - i }); t += 0.3;          // every place takes its turn, even a zero
          for (let k = 0; k < dg; k++) { hit(sec[0], sec[1], 0.12, 0.2, 'beat', { place: L - 1 - i }); t += STEP; }
          t += 0.45;
        });
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
    model: 'שלושה משפטים: הסורדו מנגן את השלם, הטמבורין את החלק הצבוע, והאגוגו את מה שלא צבוע. כמה בשלם, וכמה מהם צבועים?',
    line: 'דריכה עמוקה נוחתת על מספר שלם; צעד קל הוא חלק שווה אחד. הצליל הדק מסמן את המקום שעליו שואלים. כמה צעדים בכל שלם?',
    share: 'כל קול הוא ילד. כל סבב מחלק פריט אחד: פרוסה לכל קול. הקשיבו לקול הראשון — כמה פרוסות קיבל, ואיזה חלק מפריט שלם היא כל פרוסה?',
    ribbon: 'קודם המטר שנשאר מתחלק — נקישה קטנה לכל ילד. אחר כך החלק של ילד אחד: מטרים שלמים ואחריהם הנקישה הקטנה שלו.',
    whole: 'החלק הצבוע, ואחריו עותקים שווים שלו עד שנבנה השלם. כמה עותקים, וכמה בכל אחד?',
    wholeSplit: 'קודם החלק הצבוע. אחר כך הוא מתפצל לקבוצות שוות — כל קבוצה היא חלק אחד. ואז בונים את השלם מקבוצות כאלה.',
    roman: 'לכל סימן גוון משלו, מהגדול לקטן, ומחברים. צליל "מינוס" לפני סימן אומר: את זה מחסירים.',
    hebrew: 'קודם מוטיב שאומר: עכשיו אותיות הן מספרים. קלרינט הוא מאות, כינור — עשרות, חליל — אחדות. כמה פעמים כל כלי מנגן?',
    place: 'כל מקום במספר הוא סקציה, מהגדולה לקטנה. סימן התור נשמע תמיד — גם כשהסקציה שותקת, כי שם יש אפס. באיזו סקציה מנגנת הספרה שעליה שואלים?',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    const how = spec.kind === 'whole' && spec.num > 1 ? HOW.wholeSplit : HOW[spec.kind];
    return '<div class="parts-numerals">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc(how) + '</p>'
      + (revealed
        ? '<p class="band-predict pn-silent">עכשיו בלי צליל: אמרו קודם כמה שווה צליל אחד, ואז ציירו או כתבו את התשובה.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו: כמה שווה צליל אחד?</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, WORLDS: WORLDS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html, romanValue: romanValue };
});
