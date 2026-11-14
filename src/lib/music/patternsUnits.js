// MelodyMath — PatternsUnits: repeating patterns (grade א׳), units of mass and
// volume (ד׳–ו׳) and the calendar (ד׳), heard (tags fixedAccents,
// kiloGroupsTen, litreThousandGroups, weekBars). Research:
// docs/research/patterns-units-2026-11-14.md (Perplexity + Meta AI).
//
// Meta AI, one world for each:
//   patterns — clapping games of children in Ghana: each symbol is a fixed
//     body sound (clap, thigh pat, finger snap), all equally loud and evenly
//     spaced. "High/low", "do re mi" are names, never "more". The unit is never
//     marked (Perplexity: a pause after each AAB already gives the answer away);
//     at the end, real silence is the empty place.
//   units — mariachi from Jalisco: a maraca is a bundle of one hundred, a
//     guitarrón pluck is one bag, a trumpet is heard once equal to ten maracas.
//     Never a thousand sounds; never louder or faster for more.
//   calendar — Swedish polska (secular seasonal songs): a month is a long
//     nyckelharpa tone, a day a pat, and crossing into the next month is silence.
//     Letters as numbers keep the app's one legend (as in PartsNumerals):
//     violin = tens, flute = ones, after the motif "now letters are numbers".
// Never more than 12 sounds in a row; the widget shows only when the sounds
// (with the numbers in the text) give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_PATTERNS_UNITS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['fixedAccents', 'kiloGroupsTen', 'litreThousandGroups', 'weekBars']);
  const MAX_RUN = 12;
  const MAX_EVENTS = 56;
  const BEAT = 0.42, STEP = 0.24, GAP = 0.6;

  const WORLDS = {
    ghana: { he: 'משחקי כפיים מגאנה', why: 'מסורת משחקי הכפיים של ילדים בגאנה שבמערב אפריקה: כל סמל מקבל תנועה קבועה של הגוף — מחיאת כף, טפיחה על הירך או נקישת אצבעות — כולן באותה עוצמה ובאותו קצב' },
    mariachi: { he: 'מריאצ׳י מחליסקו', why: 'מוזיקת הרחוב והחגיגות של מקסיקו: כל כלי הוא חבילה בגודל קבוע. מרקס הוא חבילה של מאה, והחצוצרה נשמעת פעם אחת כשווה לעשרה מרקסים — כולם באותה עוצמה' },
    polska: { he: 'פולסקה שוודית', why: 'ריקוד עם ושירי עונות חילוניים מסקנדינביה: חודש הוא צליל ארוך של ניקלהרפה, יום הוא טפיחה, ומעבר לחודש הבא הוא שקט' },
    klezmer: { he: 'בהשראת הכליזמר', why: 'מוזיקה יהודית כלית לשמחות ולחתונות. אותיות כמספרים משמשות בחיי היומיום — בתאריכים ועל מטבעות' },
  };
  // the three body sounds, by order of first appearance: clap, thigh pat, finger snap
  const BODY = [['clap', 1000, 'מחיאת כף'], ['stomp', 120, 'טפיחה על הירך'], ['woodClick', 1800, 'נקישת אצבעות']];
  const HEB = { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10, 'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50 };

  // the smallest unit that rebuilds the whole sequence (or the one the item names, when it fits)
  function unitOf(seq, letters) {
    if (letters) {
      const P = letters.length, map = {};
      const ok = seq.every((tok, i) => { const L = letters[i % P]; if (map[L] == null) map[L] = tok; return map[L] === tok; })
        && new Set(Object.values(map)).size === new Set(letters.split('')).size;
      return ok ? P : 0;
    }
    for (let P = 1; P < seq.length; P++) if (seq.every((tok, i) => tok === seq[i % P])) return P;
    return 0;
  }

  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const p = String(item.prompt || '').trim();
    const raw = String(item.answer).trim();
    let m, s = null;
    if ((m = /^[^:]*?\b(AB|AAB|ABB|ABC|AABB)?:\s*(.+?)\s+—\s+[^?]+\?\s*\(([^)]*=[^)]*)\)$/.exec(p)) && item.music === 'fixedAccents') {
      const seq = m[2].split(/,\s*|\s+/).filter(Boolean);
      const legend = {}; m[3].split(/,\s*/).forEach((pair) => { const kv = pair.split('='); legend[kv[1]] = kv[0]; });
      const P = unitOf(seq, m[1]);
      if (P && seq.length > P && seq.every((tok) => legend[tok])) {
        const next = seq[seq.length % P];
        s = { kind: 'pattern', seq: seq, P: P, durations: seq.every((x) => /^(קצר|ארוך)$/.test(x)), value: legend[next] };
      }
    } else if ((m = /^בדגם (.+?) — כמה צלילים יש ביחידה שחוזרת\?$/.exec(p)) && item.music === 'fixedAccents') {
      // the repeating unit itself (docs/research/topics/006): heard twice and more, never marked
      const seq = m[1].split(/\s+/).filter(Boolean), P = unitOf(seq);
      if (P && seq.length >= 2 * P) s = { kind: 'patternUnit', seq: seq, P: P, durations: false, value: P };
    } else if ((m = /^(.+?) — איזה צליל משלים את התבנית\?$/.exec(p)) && item.music === 'fixedAccents') {
      const seq = m[1].split(/,\s*/).filter(Boolean), P = unitOf(seq);
      if (P && seq.length > P) s = { kind: 'pattern', seq: seq, P: P, durations: false, value: seq[seq.length % P] };
    } else if ((m = /^כמה (גרם|מ״ל) יש ב(חצי ק״ג|־(\d) (?:ק״ג|ליטר))\?$/.exec(p))) {
      if (m[2] === 'חצי ק״ג') s = { kind: 'half', value: 500 };
      else s = { kind: 'thousands', k: +m[3], value: +m[3] * 1000 };
    } else if ((m = /^שקית \S+ שוקלת (\d+) גרם\. כמה שקיות נכנסות ב־1 ק״ג\?$/.exec(p))) { const g = +m[1]; if (1000 % g === 0 && 1000 / g <= 10) s = { kind: 'bags', g: g, value: 1000 / g }; }
    else if ((m = /^בבקבוק 1 ליטר ועוד (\d)00 מ״ל\. כמה מ״ל בסך הכול\?$/.exec(p))) s = { kind: 'plus', hundreds: +m[1], value: 1000 + +m[1] * 100 };
    else if ((m = /^בקבוק מחזיק (\d) ליטר\. כמה כוסות של חצי ליטר ממלאות אותו\?$/.exec(p)) || (m = /^מזגנו (\d) ליטר מים לכוסות של חצי ליטר\. כמה כוסות מילאנו\?$/.exec(p))) { const L = +m[1]; if (L <= 2) s = { kind: 'cups', L: L, value: 2 * L }; }
    else if ((m = /^שק אחד שוקל (\d+) ק״ג ושק שני (\d+) ק״ג\. בכמה ק״ג השני כבד יותר\?$/.exec(p))) { const a = +m[1], b = +m[2]; if (b > a && b <= 10) s = { kind: 'diff', a: a, b: b, value: b - a }; }
    else if (/^כמה סמ״ק הם מ״ל אחד\?$/.test(p)) s = { kind: 'same', value: 1 };
    else if ((m = /^תיבה של (\d+) ס״מ על (\d+) ס״מ על (\d+) ס״מ מלאה מים\. כמה ליטרים בתוכה\?$/.exec(p))) {
      const a = +m[1], b = +m[2], c = +m[3], base = a * b;
      if (base % 100 === 0 && base / 100 * c === 10) s = { kind: 'box', perLayer: base / 100, layers: c, value: 1 };
    } else if (/^כמה חודשים יש בשנה עברית פשוטה, לא מעוברת\?$/.test(p)) s = { kind: 'months', n: 12, value: 12 };
    else if (/^כמה חודשים יש בשנה עברית מעוברת\?$/.test(p)) s = { kind: 'months', n: 12, leap: true, value: 13 };
    else if ((m = /^בלוח העברי, ([א-ת])׳ ב\S+ — מה מספר היום בחודש\?$/.exec(p)) || (m = /^([א-ת])״([א-ת]) ב\S+ — מה מספר היום בחודש \S+\?$/.exec(p)) || (m = /^([א-ת])״([א-ת]) \S+ — איזה מספר הוא \1״\2\?$/.exec(p))) {
      const letters = [m[1], m[2]].filter(Boolean), vals = letters.map((l) => HEB[l]);
      if (vals.every((v) => v)) s = { kind: 'letters', letters: letters, vals: vals, value: vals.reduce((x, y) => x + y, 0) };
    } else if ((m = /^חנוכה מתחיל בכ״ה בכסלו ונמשך (\d+) ימים\. השנה יש בכסלו (\d+) ימים\. באיזה יום בטבת חל היום ה\S+\?$/.exec(p))) {
      const len = +m[1], monthDays = +m[2], inFirst = monthDays - 25 + 1;
      if (len > inFirst) s = { kind: 'crossing', start: 25, len: len, inFirst: inFirst, value: len - inFirst };
    }
    if (!s || String(s.value) !== raw) return null;   // the sounds give exactly the answer
    s.world = WORLDS[{ pattern: 'ghana', patternUnit: 'ghana', months: 'polska', crossing: 'polska', letters: 'klezmer' }[s.kind] || 'mariachi'];
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
    const maracas = (n, stage, extra) => { for (let i = 0; i < n; i++) { hit('shaker', 1200, 0.12, 0.16, stage, Object.assign({ i: i }, extra)); t += STEP; } };
    const trumpet = (stage, extra) => { hit('horn', 523, 0.4, 0.16, stage, extra); t += 0.55; };
    const demo = () => { maracas(10, 'demoMaraca'); t += 0.2; trumpet('demoTrumpet'); t += GAP; };   // ten bundles of a hundred = one trumpet
    switch (spec.kind) {
      case 'pattern': case 'patternUnit': {
        // first appearance decides the body sound; evenly spaced; the unit is never marked
        const order = [];
        spec.seq.forEach((tok) => { if (order.indexOf(tok) < 0) order.push(tok); });
        spec.seq.forEach((tok, i) => {
          if (spec.durations) { hit('clap', 1000, 0.1, 0.18, 'body', { tok: tok, i: i }); t += tok === 'ארוך' ? 2 * BEAT : BEAT; }
          else { const b = BODY[order.indexOf(tok)]; hit(b[0], b[1], 0.12, 0.18, 'body', { tok: tok, i: i, sound: order.indexOf(tok) }); t += BEAT; }
        });
        t += BEAT;                                             // the empty place: real silence
        break;
      }
      case 'half':
        demo();
        trumpet('kilo');
        maracas(5, 'half', { part: 0 }); t += GAP; maracas(5, 'half', { part: 1 });
        break;
      case 'thousands':
        demo();
        for (let i = 0; i < spec.k; i++) trumpet('trumpet', { i: i });
        break;
      case 'plus':
        demo();
        trumpet('trumpet'); t += 0.2; maracas(spec.hundreds, 'maraca');
        break;
      case 'bags':
        // a kilo, then a guitarrón pluck for every bag — until the trumpet comes back: the kilo is full
        trumpet('kilo'); t += 0.3;
        for (let i = 0; i < spec.value; i++) { hit('pluck', 98, 0.3, 0.18, 'bag', { i: i }); t += 0.45; }
        trumpet('full');
        break;
      case 'cups':
        demo();
        for (let l = 0; l < spec.L; l++) { trumpet('litre', { l: l }); for (let c = 0; c < 2; c++) { maracas(5, 'cup', { cup: 2 * l + c }); t += GAP; } }
        break;
      case 'diff':
        for (let i = 0; i < spec.a; i++) trumpet('first', { i: i });
        t += GAP;
        for (let i = 0; i < spec.a; i++) trumpet('second', { i: i });
        t += GAP;                                              // the same as the first; what follows the silence is the difference
        for (let i = spec.a; i < spec.b; i++) trumpet('extra', { i: i });
        break;
      case 'same':
        hit('woodBar', 784, 0.2, 0.16, 'cube'); hit('tine', 784, 0.2, 0.16, 'ml'); t += 0.5;
        break;
      case 'box':
        for (let l = 0; l < spec.layers; l++) { maracas(spec.perLayer, 'layer', { l: l }); t += 0.35; }
        t += 0.3; trumpet('litre');
        break;
      case 'months':
        for (let i = 0; i < spec.n; i++) { hit('drone', 196, 0.3, 0.14, 'month', { i: i }); t += 0.36; }
        if (spec.leap) { t += GAP; hit('drone', 196, 0.3, 0.14, 'month', { i: spec.n, added: true }); t += 0.36; }
        break;
      case 'letters': {
        [392, 494, 587].forEach((hz) => { hit('reed', hz, 0.12, 0.14, 'frame'); t += 0.18; });
        t += GAP;
        spec.vals.forEach((v) => {
          const place = v >= 10 ? 10 : 1, vc = place === 10 ? ['bowed', 440] : ['breathy', 784];
          for (let i = 0; i < v / place; i++) { hit(vc[0], vc[1], 0.16, 0.2, 'letter', { place: place }); t += STEP; }
          t += GAP;
        });
        break;
      }
      case 'crossing':
        // a pat for every day from the first; crossing into the next month is silence
        for (let i = 0; i < spec.inFirst; i++) { hit('frameDrum', 220, 0.12, 0.18, 'day', { month: 0, i: i }); t += BEAT; }
        t += 2 * GAP;
        for (let i = 0; i < spec.value; i++) { hit('frameDrum', 220, 0.12, 0.18, 'day', { month: 1, i: i }); t += BEAT; }
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
    patternUnit: 'הדגם מתנגן: הסמל הראשון — מחיאת כף, השני — טפיחה על הירך. כל צליל באותו מרחק מקודמו, ואין שום סימן איפה היחידה נגמרת. מהו החלק הקצר שחוזר שוב ושוב, וכמה צלילים יש בו?',
    pattern: 'הדגם מתנגן פעם אחת: הסמל הראשון — מחיאת כף, השני — טפיחה על הירך, השלישי — נקישת אצבעות. כל צליל באותו מרחק מקודמו, ובסוף שקט במקום הריק. איזו תנועה חסרה שם?',
    patternLong: 'הדגם מתנגן פעם אחת: קצר הוא מחיאה אחת, ארוך הוא מחיאה ואחריה פעמה של שקט. בסוף — שקט במקום הריק. מה חסר שם?',
    half: 'קודם עשרה מרקסים ואחריהם החצוצרה: אותה כמות בשם אחר. אחר כך החצוצרה נפתחת לשתי קבוצות שוות, עם שקט ביניהן.',
    thousands: 'קודם עשרה מרקסים ואחריהם החצוצרה: אותה כמות בשם אחר. אחר כך — חצוצרה לכל יחידה גדולה.',
    plus: 'קודם עשרה מרקסים ואחריהם החצוצרה. אחר כך החצוצרה, ואחריה המרקסים שנוספו.',
    bags: 'החצוצרה היא הקילוגרם; אחריה פריטת גיטרון לכל שקית — עד שהחצוצרה חוזרת והקילוגרם מלא.',
    cups: 'קודם עשרה מרקסים ואחריהם החצוצרה. אחר כך כל חצוצרה נפתחת לכוסות: כל כוס היא קבוצת מרקסים, ושקט בין כוס לכוס.',
    diff: 'השק הראשון, ואחריו השני — בהתחלה בדיוק כמו הראשון. מה שנשמע אחרי השקט הוא ההפרש.',
    same: 'קובייה אחת והמיליליטר שלה נשמעים באותו רגע בדיוק.',
    box: 'שכבה אחרי שכבה: בכל שכבה מרקסים, חבילה של מאה לכל מאה סמ״ק. בסוף הם מתחלפים בחצוצרה.',
    months: 'כל צליל ארוך הוא חודש.',
    monthsLeap: 'כל צליל ארוך הוא חודש — ואחרי שקט, עוד חודש שנוסף.',
    letters: 'קודם מוטיב שאומר: עכשיו אותיות הן מספרים. כינור הוא עשרות, חליל — אחדות. כמה פעמים כל כלי מנגן?',
    crossing: 'טפיחה לכל יום, מהיום הראשון. השקט הארוך הוא המעבר לחודש הבא. כמה טפיחות באות אחריו?',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    const how = spec.kind === 'pattern' && spec.durations ? HOW.patternLong : spec.kind === 'months' && spec.leap ? HOW.monthsLeap : HOW[spec.kind];
    return '<div class="patterns-units">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc(how) + '</p>'
      + (revealed
        ? '<p class="band-predict pu-silent">עכשיו בלי צליל: מחאו, טפחו או ציירו בעצמכם, ובדקו שוב.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו.</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html, unitOf: unitOf };
});
