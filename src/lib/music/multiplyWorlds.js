// MelodyMath — MultiplyWorlds: multiplicative thinking, heard (grades ג׳–ד׳;
// tags phraseFits, tenfoldGroups, repeatedBars). Research:
// docs/research/multiply-worlds-2026-11-13.md (Perplexity + Meta AI).
//
// One world per exercise, and the ear counts GROUPS, not a total (Meta AI: a
// child who cannot say how many groups and how many in each has learned to
// sing a total, not to multiply):
//   times as fast — gnawa-inspired: the slow guembri plays one phrase; in the
//     SAME span the fast qraqeb plays it k times. Count the phrases.
//   times as high — one string's overtones: the base tone, then a ladder of
//     equal rungs (1×, 2×, 3×…) up to the high tone. Count the rungs (the
//     octave is the second rung). Pitch stays pitch — no slowed-down clicks.
//   times as long / as many — the short group once, then the same group again
//     and again. Count the groups.
//   × and : by 10, 100, 1000 — a packing line: pencils, boxes of ten, cartons
//     of a hundred, pallets of a thousand. ×10 turns every object into the next
//     package: the same NUMBER of sounds, heavier objects. Not "add a zero".
//   vertical × — the packing line again, column by column from the ones: each
//     copy is a row; ten objects are packed into one of the next kind (the
//     carry) and travel to the next column.
//   division — a hora circle: objects are dealt round by round, one to each
//     dancer; what cannot go round is unpacked into ten smaller objects; what
//     is left outside the circle at the end is the remainder.
//   buses — full buses, then the students still waiting.
//   divisible by 9 or 3 — a yard counting game: every ten, hundred and
//     thousand leaves one click; a bell closes each circle of nine (or three).
// Never more than 12 sounds in a row; the widget shows only when the sounds
// give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_MULTIPLY_WORLDS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['phraseFits', 'tenfoldGroups', 'repeatedBars']);
  const STANDARDS = /פי כמה|כפל וחילוק ב־10|כפל וחילוק במספר חד/;
  const MAX_RUN = 12;
  const MAX_EVENTS = 40;
  const STEP = 0.26;
  const GAP = 0.6;

  const WORLDS = Object.freeze({
    gnawa: { he: 'בהשראת הגנאווה המרוקאית', why: 'הגימברי (כלי מיתר נמוך) מנגן לאט, והקרקבים (מצלתיים מברזל) מהר — באותו זמן ממש' },
    string: { he: 'מיתר אחד וצליליו העיליים', why: 'מיתר רוטט גם בחצאים, בשלישים וברבעים: כל שלב בסולם הוא עוד פעם הצליל הנמוך' },
    chorus: { he: 'פזמון שחוזר, כמו בריקוד הורה', why: 'השיר הארוך הוא אותו פזמון שחוזר שוב ושוב — סופרים פזמונים, לא תיבות' },
    repeat: { he: 'אותה קבוצה, שוב ושוב', why: 'קודם שומעים קבוצה אחת, ואחר כך את אותה קבוצה כמה פעמים' },
    packing: { he: 'פס אריזה במפעל', why: 'עשרה עפרונות בקופסה, עשר קופסאות בארגז, עשרה ארגזים במשטח' },
    hora: { he: 'מעגל הורה', why: 'בכל סבב כל רוקד במעגל מקבל אחד. מה שלא מספיק לכולם נפתח לחלקים קטנים' },
    buses: { he: 'תחנת אוטובוסים', why: 'צופר לכל אוטובוס מלא, ונקישה לכל תלמיד שעוד מחכה' },
    yard: { he: 'משחק ספירה בחצר', why: 'כל עשר, מאה ואלף משאירים נקישה אחת מחוץ למעגלים של תשע' },
  });

  const OBJ = [
    { he: 'עיפרון', voice: 'woodClick', hz: 1800, dur: 0.05, gain: 0.2 },
    { he: 'קופסה', voice: 'woodBar', hz: 660, dur: 0.18, gain: 0.24 },
    { he: 'ארגז', voice: 'drumLow', hz: 130, dur: 0.3, gain: 0.3 },
    { he: 'משטח', voice: 'gong', hz: 82, dur: 0.6, gain: 0.3 },
  ];
  const PACK_LEGEND = 'נקישה = עיפרון. דפיקת עץ = קופסה של עשרה. חבטה = ארגז של מאה. גונג = משטח של אלף.';

  const num = (s) => +String(s).replace(/,/g, '');
  const WORDS = { 'שני': 2, 'שתי': 2, 'שלוש': 3, 'שלושה': 3, 'ארבע': 4, 'ארבעה': 4, 'חמש': 5, 'חמישה': 5, 'שש': 6, 'שישה': 6 };
  const digitsOf = (n) => String(n).split('').reverse().map(Number);   // [ones, tens, hundreds, …]
  const sumDigits = (n) => digitsOf(n).reduce((a, b) => a + b, 0);
  const POW = { 10: 1, 100: 2, 1000: 3 };

  // Reads the item into a listening plan, or null.
  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    // the times-table standards of grades 2–3 share these tags but have their own ways
    if (!STANDARDS.test(String(item.standard || ''))) return null;
    const p = String(item.prompt || '');
    const raw = item.answer;
    let m, s = null;
    if ((m = /(\d+) פעימות בדקה, ותוף שני (\d+)/.exec(p)) || (m = /מטרונום על (\d+), ואז על (\d+)/.exec(p))) {
      const a = +m[1], b = +m[2];
      if (b % a === 0) s = { kind: 'tempo', a: a, b: b, k: b / a, value: b / a, world: WORLDS.gnawa };
    } else if ((m = /(\d+) הרץ ו(?:צליל|תווה) של (\d+) הרץ/.exec(p))) {
      const a = +m[1], b = +m[2];
      if (b % a === 0) s = { kind: 'ladder', a: a, b: b, k: b / a, value: b / a, world: WORLDS.string };
    } else if ((m = /(\d+) תיבות,? ו(?:שיר שני|בשנייה|השנייה) (\d+) תיבות/.exec(p))) {
      const a = +m[1], b = +m[2];
      if (b % a === 0) s = { kind: 'chorus', a: a, k: b / a, value: b / a, world: WORLDS.chorus };
    } else if ((m = /(\d+) (?:תווים|מכות|מתופפים),? ו\S+ (?:\S+ )?פי (\d+)/.exec(p))) {
      const a = +m[1], k = +m[2];
      const voices = /גיטרה/.test(p) ? ['pluck', 'keys'] : /מקהלה/.test(p) ? ['drumLow', 'voiceAh'] : ['drumHigh', 'drumLow'];
      s = { kind: 'groups', a: a, k: k, value: a * k, voices: voices, world: WORLDS.repeat };
    } else if ((m = /^([\d,]+) ([×:]) (10|100|1,000) = \?/.exec(p)) && POW[num(m[3])]) {
      const n = num(m[1]), f = num(m[3]), shift = POW[f] * (m[2] === '×' ? 1 : -1);
      const ds = digitsOf(n), top = ds.length - 1 + shift, low = ds.findIndex((d) => d > 0) + shift;
      const fits = top <= 3 && low >= 0 && sumDigits(n) <= MAX_RUN;
      if (fits) s = { kind: 'pack', n: n, op: m[2], f: f, shift: shift, value: m[2] === '×' ? n * f : n / f, world: WORLDS.packing };
    } else if ((m = /^(?:חשבו במאונך: )?(\d+) × (\d) (?:=|\(|$)/.exec(p + ' ')) || (m = /^חשבו במאונך: (\d+) × (\d)\s*(?:\(|$)/.exec(p))) {
      const n = +m[1], k = +m[2];
      const ds = digitsOf(n);
      if (ds.every((d) => d * k <= MAX_RUN) && ds.length <= 3) s = { kind: 'columns', n: n, k: k, value: n * k, world: WORLDS.packing };
    } else if ((m = /^(?:חשבו במאונך: )?([\d,]+) : (\d)(?: = \?)?$/.exec(p.trim()))) {
      const n = num(m[1]), k = +m[2];
      if (n % k === 0) s = { kind: 'deal', n: n, k: k, value: n / k, world: WORLDS.hora };
    } else if ((m = /מהי השארית כשמחלקים (\d+) ב־(\d)\?/.exec(p))) {
      const n = +m[1], k = +m[2];
      s = { kind: 'deal', n: n, k: k, ask: 'remainder', value: n % k, world: WORLDS.hora };
    } else if ((m = /(\d+) תלמידים .*באוטובוסים של (\d+) מקומות/.exec(p))) {
      const n = +m[1], cap = +m[2], full = Math.floor(n / cap), left = n % cap;
      if (full <= MAX_RUN && left <= MAX_RUN) s = { kind: 'buses', n: n, cap: cap, full: full, left: left, value: full + (left > 0 ? 1 : 0), world: WORLDS.buses };
    } else if ((m = /האם ([\d,]+) מתחלק ב־(9|3) בלי שארית/.exec(p))) {
      const n = num(m[1]), d = +m[2];
      s = { kind: 'circles', n: n, d: d, value: sumDigits(n) % d === 0 ? 'כן' : 'לא', world: WORLDS.yard };
    }
    if (!s) return null;
    const ans = typeof s.value === 'string' ? String(raw).trim() : num(raw);
    if (s.value !== ans) return null;      // the sounds give exactly the answer
    s.answer = String(s.value);
    const ev = soundEvents(s);
    if (!ev.length || longestRun(ev) > MAX_RUN || ev.length > MAX_EVENTS) return null;
    return s;
  }
  function specForItem(item) { return plan(item); }

  // beats closer than 0.4 s are one run (two voices together are one beat)
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
    const obj = (level, stage, extra, hz) => { const o = OBJ[level]; hit(o.voice, hz || o.hz, o.dur, o.gain, stage, Object.assign({ level: level, worth: Math.pow(10, level) }, extra)); t += STEP + 0.04 * level; };
    const pack = (level) => { hit('shaker', 300, 0.35, 0.14, 'pack', { level: level }); t += 0.45; obj(level, 'packed', { carry: true }); };

    switch (spec.kind) {
      case 'tempo': {
        const T = 2.4;
        hit('pluck', 98, 0.5, 0.3, 'slow', { group: 0 }); t += T / 2;      // guembri: one phrase of two notes over T
        hit('pluck', 131, 0.5, 0.26, 'slow', { group: 0 }); t += T / 2 + GAP;
        const t0 = t;
        hit('pluck', 98, T, 0.08, 'span');                                  // the same span, very quiet underneath
        for (let g = 0; g < spec.k; g++) {
          t = t0 + (g * T) / spec.k;
          hit('jingle', 3000, 0.05, 0.24, 'fast', { group: g, accent: true });
          t = t0 + (g * T) / spec.k + T / spec.k / 2;
          hit('jingle', 2400, 0.05, 0.14, 'fast', { group: g });
        }
        break;
      }
      case 'ladder':
        hit('bowed', spec.a, 0.9, 0.24, 'low'); t += 0.9 + GAP;
        for (let r = 1; r <= spec.k; r++) { hit('bowed', spec.a * r, 0.35, 0.2, 'rung', { rung: r }); t += 0.5; }
        t += GAP - 0.2;
        hit('bowed', spec.b, 0.9, 0.24, 'high');
        break;
      case 'chorus': {
        const motif = [523, 659, 587, 784];
        const phrase = (g, stage) => { motif.forEach((hz, i) => { hit('woodBar', hz, 0.15, i === 0 ? 0.26 : 0.18, stage, { group: g, accent: i === 0 }); t += STEP; }); t += GAP; };
        phrase(0, 'short');
        t += GAP;
        for (let g = 0; g < spec.k; g++) phrase(g, 'long');
        break;
      }
      case 'groups': {
        const group = (voice, g, stage) => { for (let i = 0; i < spec.a; i++) { hit(voice, voice === 'voiceAh' ? 392 : voice === 'keys' ? 523 + 30 * i : 196, 0.14, i === 0 ? 0.26 : 0.18, stage, { group: g, accent: i === 0 }); t += STEP * 0.8; } t += GAP; };
        group(spec.voices[0], 0, 'base');
        t += GAP;
        for (let g = 0; g < spec.k; g++) group(spec.voices[1], g, 'times');
        break;
      }
      case 'pack': {
        const play = (n, stage) => { const ds = digitsOf(n); for (let lv = ds.length - 1; lv >= 0; lv--) { for (let i = 0; i < ds[lv]; i++) obj(lv, stage); if (ds[lv]) t += 0.25; } };
        play(spec.n, 'before');
        t += GAP;
        for (let i = 0; i < Math.abs(spec.shift); i++) { hit('shaker', spec.shift > 0 ? 260 : 520, 0.4, 0.14, 'machine'); t += 0.5; }
        t += GAP;
        play(spec.value, 'after');
        break;
      }
      case 'columns': {
        // ones column first; each copy is a row; ten objects are packed into one of the next kind
        const ds = digitsOf(spec.n);
        let carry = 0;
        for (let lv = 0; lv < ds.length || carry; lv++) {
          const d = ds[lv] || 0;
          for (let i = 0; i < carry; i++) obj(lv, 'carried');
          if (carry) t += 0.3;
          for (let r = 0; r < spec.k && d; r++) { for (let i = 0; i < d; i++) obj(lv, 'row', { row: r }); t += 0.3; }
          let total = d * spec.k + carry;
          carry = 0;
          while (total >= 10) { pack(lv + 1); total -= 10; carry++; }
          if (carry) { t += 0.2; for (let i = 0; i < total; i++) obj(lv, 'left'); }
          t += GAP;
          if (lv > 3) break;
        }
        break;
      }
      case 'deal': {
        // a hora circle of k dancers; each round gives one object to every dancer
        const ds = digitsOf(spec.n);
        const hzOf = (lv, kid) => OBJ[lv].hz * Math.pow(2, kid / 12 * 3);
        let carryIn = 0, unpackedOnce = false;
        for (let lv = ds.length - 1; lv >= 0; lv--) {
          const c = ds[lv] + carryIn * 10;
          const rounds = Math.floor(c / spec.k), left = c % spec.k;
          for (let r = 0; r < rounds; r++) { for (let kid = 0; kid < spec.k; kid++) obj(lv, 'deal', { kid: kid, round: r }, hzOf(lv, kid)); t += 0.3; }
          if (left && lv > 0) {
            for (let i = 0; i < left; i++) {
              obj(lv, 'unpack'); hit('shaker', 520, 0.3, 0.12, 'open'); t += 0.4;
              if (!unpackedOnce) { for (let j = 0; j < 10; j++) { hit(OBJ[lv - 1].voice, OBJ[lv - 1].hz, 0.04, 0.12, 'unpacked'); t += 0.12; } unpackedOnce = true; }
              t += 0.3;
            }
          } else if (left) {
            t += GAP;
            for (let i = 0; i < left; i++) obj(lv, 'outside');
          }
          carryIn = lv > 0 ? left : 0;
          t += GAP;
        }
        break;
      }
      case 'buses':
        for (let i = 0; i < spec.full; i++) { hit('horn', 220, 0.3, 0.26, 'bus', { worth: spec.cap }); t += 0.45; }
        t += GAP * 1.5;
        for (let i = 0; i < spec.left; i++) { hit('woodClick', 1500, 0.05, 0.18, 'waiting'); t += STEP; }
        break;
      case 'circles': {
        let run = 0;
        const ds = digitsOf(spec.n);
        for (let lv = ds.length - 1; lv >= 0; lv--) {
          for (let i = 0; i < ds[lv]; i++) {
            hit('clap', 1600, 0.06, 0.2, 'click', { digit: lv });
            t += STEP;
            run++;
            if (run % spec.d === 0) { hit('metalBell', 1568, 0.3, 0.18, 'bell'); t += 0.35; }
          }
          t += 0.4;
        }
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
    tempo: 'קודם הגימברי מנגן משפט אחד לאט. אחר כך, באותו זמן בדיוק, הקרקבים מנגנים את המשפט שוב ושוב. כמה פעמים הוא נכנס? "פי כמה" זה לא "בכמה יותר".',
    ladder: 'הצליל הנמוך, ואז סולם של שלבים שווים — כל שלב הוא עוד פעם הצליל הנמוך — עד הצליל הגבוה. סופרים שלבים. האוקטבה היא השלב השני.',
    chorus: 'השיר הקצר הוא פזמון אחד. השיר הארוך הוא אותו פזמון שוב ושוב. כמה פזמונים?',
    groups: 'קודם קבוצה אחת. אחר כך אותה קבוצה כמה פעמים. שתי שאלות: כמה קבוצות? כמה בכל קבוצה? רק אז — כמה בסך הכול.',
    pack: 'אותו מספר צלילים לפני ואחרי — אבל כל חפץ הפך לאריזה הבאה (או חזר לקודמת). לא "מוסיפים אפס": כל ספרה שווה עכשיו פי עשרה.',
    columns: 'מתחילים מהעפרונות. כל שורה היא עוד עותק של המספר. כשמצטברים עשרה — הם נארזים לקופסה אחת שעוברת לעמודה הבאה.',
    deal: 'בכל סבב כל רוקד במעגל מקבל אחד. מה שלא מספיק לכולם נפתח לעשרה קטנים יותר. הקשיבו לרוקד הראשון — הצליל הנמוך בכל סבב.',
    dealRemainder: 'בכל סבב כל רוקד במעגל מקבל אחד. מה שלא מספיק לכולם נפתח לעשרה קטנים. מה שנשאר בחוץ בסוף — זו השארית.',
    buses: 'צופר לכל אוטובוס מלא. אחר כך — התלמידים שעוד מחכים. מה שאלו: אוטובוסים מלאים, או מספיק אוטובוסים לכולם?',
    circles: 'כל ספרה משאירה נקישות כמספרה. פעמון סוגר כל מעגל. אם הנקישה האחרונה נופלת בדיוק על פעמון — אין שארית.',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    const how = spec.kind === 'deal' && spec.ask === 'remainder' ? HOW.dealRemainder : HOW[spec.kind];
    const legend = (spec.kind === 'pack' || spec.kind === 'columns' || spec.kind === 'deal') ? PACK_LEGEND : '';
    return '<div class="multiply-worlds">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + (legend ? '<p class="mw-legend">' + esc(legend) + '</p>' : '')
      + '<p class="band-note">' + esc(how) + '</p>'
      + (revealed
        ? '<p class="band-predict mw-silent">עכשיו בלי צליל: כתבו את התרגיל במאונך או בטבלת ערך המקום, ובדקו בפעולה ההפוכה.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו וספרו קבוצות.</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, WORLDS: WORLDS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html };
});
