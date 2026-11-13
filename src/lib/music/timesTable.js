// MelodyMath — TimesTable: the multiplication table by strategies, heard
// (grades ב׳–ג׳; tags repeatedBars, meters in the times-table standards).
// Research: docs/research/times-table-2026-11-13.md (Perplexity + Meta AI).
//
// Meta AI: playing 9 × 9 as 81 beats teaches counting, not the table. So the
// STRATEGY is what sounds, never the whole count:
//   a × b is always a groups of b (one direction, kept in every exercise).
//   a bundle — one sound worth a whole group — is first heard equal to its b
//     single beats in the same time; then the bundles are counted (at most 10).
//   ×10: ten bundles. ×5: the ten-phrase, then its half. ×9: ten slots with one
//   slot real silence. ×6 and ×7: five bundles, a short silence, then one or
//   two more. ×2, ×4, ×8: doubling as voices entering a round (one, then two
//   together, then four). ×3: a double and one more. ×0: a framed bar of
//   silence. ×1: one group framed.
//   bars: a Viennese waltz for 3/4 (strong, weak, weak) and an Irish jig for
//   6/8 (two groups of three) — bars as phrases with a breath between them.
// Inspired by the times-table chant children learned by heart in ancient China
// (the "nine-nine song"), here every group opens with an accent — a chant
// without groups is only counting. Never more than 12 sounds in a row.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TIMES_TABLE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['repeatedBars', 'meters']);
  const STANDARDS = /כפולות 2, 4, 5 ו־10|לוח כפל 10×10/;
  const MAX_RUN = 12;
  const MAX_EVENTS = 52;
  const BEAT = 0.22, GAP = 0.7;

  const WORLDS = Object.freeze({
    chant: { he: 'בהשראת מזמור לוח הכפל', why: 'ילדים בסין העתיקה שיננו את לוח הכפל בקצב קבוע. כאן כל קבוצה נשמעת כחבילה אחת' },
    canon: { he: 'שיר סבב (קאנון)', why: 'קול נכנס, ואחריו עוד קול באותו משפט: הכפלה היא כניסה של קולות, לא נגינה ארוכה יותר' },
    waltz: { he: 'ואלס וינאי', why: 'ריקוד זוגות מאוסטריה של המאה ה־19, במשקל שלושה רבעים: חזק, חלש, חלש' },
    jig: { he: 'גיג אירי', why: 'ריקוד מסורתי מאירלנד במשקל שש שמיניות, בכינור ובחליל: שתי קבוצות של שלוש בכל תיבה' },
  });

  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    if (!STANDARDS.test(String(item.standard || ''))) return null;
    if (item.widget || (item.hear && item.hear.length)) return null;
    const p = String(item.prompt || '').trim();
    const raw = String(item.answer).trim();
    let m, s = null;
    if ((m = /^(\d+) × (\d+) = \?$/.exec(p))) s = fact(+m[1], +m[2]);
    else if ((m = /^(\d+) תיבות, בכל אחת (\d+) פעימות\. כמה בסך הכול\?$/.exec(p)) || (m = /^(\d+) קבוצות של (\d+)\. כמה\?$/.exec(p)) || (m = /^יש (\d+) קבוצות של (\d+) פעימות\. כמה פעימות בסך הכל\?$/.exec(p)) || (m = /^(\d+) שורות של (\d+) תווים\?$/.exec(p))) s = fact(+m[1], +m[2]);
    else if ((m = /^(\d+) × (\d+) = (\d+) × ☐$/.exec(p))) { const a = +m[1], b = +m[2]; if (+m[3] === b) s = { kind: 'swap', a: a, b: b, value: a, world: WORLDS.chant }; }
    else if ((m = /^(\d+) × (\d+) = \1 × (\d+) \+ \1 × ☐$/.exec(p))) { const a = +m[1], b = +m[2], c = +m[3]; s = { kind: 'split', a: a, big: c, small: b - c, value: b - c, world: WORLDS.chant }; }
    else if ((m = /^☐ × (\d+) = (\d+)$/.exec(p))) { const b = +m[1], total = +m[2]; if (total % b === 0) s = { kind: 'missing', b: b, value: total / b, world: WORLDS.chant }; }
    else if ((m = /^בתיבה של (3\/4|6\/8) יש \d+ (?:פעימות|שמיניות)[^?]*\. כמה (?:פעימות|שמיניות) ב־(\d+) תיבות\?$/.exec(p))) {
      const bars = +m[2], meter = m[1];
      s = { kind: 'bars', bars: bars, meter: meter, value: bars * (meter === '3/4' ? 3 : 6), world: meter === '3/4' ? WORLDS.waltz : WORLDS.jig };
    } else if ((m = /(\d+) תיבות (?:במשקל|של) (3\/4|6\/8)/.exec(p)) || (m = /ב־(\d+) תיבות של (3\/4|6\/8)/.exec(p)) || (m = /^ואלס של (\d+) תיבות (3\/4)/.exec(p))) {
      const bars = +m[1], meter = m[2];
      s = { kind: 'bars', bars: bars, meter: meter, value: bars * (meter === '3/4' ? 3 : 6), world: meter === '3/4' ? WORLDS.waltz : WORLDS.jig };
    } else if ((m = /^במשקל 3\/4(?: סופרים את כל הפעימות מההתחלה\.|,) פעימה (\d+) — היא מודגשת\? \(כתבו כן או לא\)$/.exec(p))) {
      // counting from 1, as musicians count: the strong beat opens every bar of three (1, 4, 7, ...)
      const n = +m[1];
      if (n <= 36) s = { kind: 'accent', n: n, value: (n - 1) % 3 === 0 ? 'כן' : 'לא', world: WORLDS.waltz };
    } else if ((m = /^במשקל 6\/8, שמינית (\d+) — היא סוגרת תיבה\? \(כתבו כן או לא\)$/.exec(p))) {
      const n = +m[1];
      s = { kind: 'closes', n: n, value: n % 6 === 0 ? 'כן' : 'לא', world: WORLDS.jig };
    }
    if (!s || String(s.value) !== raw) return null;   // the sounds give exactly the answer
    s.answer = String(s.value);
    let ev;
    try { ev = soundEvents(s); } catch (e) { return null; }
    if (!ev.length || longestRun(ev) > MAX_RUN || ev.length > MAX_EVENTS) return null;
    return s;
  }

  // a groups of b, by strategy
  function fact(a, b) {
    if (a > 10 || b > 10) return null;
    let strategy;
    if (a === 0 || b === 0) strategy = 'zero';
    else if (a === 1) strategy = 'one';
    else if (b === 1) strategy = 'ones';
    else if (a === 10) strategy = 'ten';
    else if (a === 5) strategy = 'five';
    else if (a === 9) strategy = 'nine';
    else if (a === 6 || a === 7) strategy = 'fivePlus';
    else if (a === 2 || a === 4 || a === 8) strategy = 'double';
    else if (a === 3) strategy = 'doublePlus';
    return { kind: 'fact', a: a, b: b, strategy: strategy, value: a * b, world: strategy === 'double' || strategy === 'doublePlus' ? WORLDS.canon : WORLDS.chant };
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
  const VOICES = [['drumLow', 110], ['frameDrum', 165], ['pluck', 262], ['woodBar', 392], ['bowed', 196], ['reed', 330], ['voiceAh', 440], ['keys', 523]];
  function soundEvents(spec) {
    if (!spec) return [];
    const ev = [];
    let t = 0;
    const hit = (voice, hz, dur, gain, stage, extra) => { ev.push(Object.assign({ at: t, voice: voice, hz: hz, dur: dur, gain: gain, stage: stage }, extra || {})); };
    const beats = (n, stage, extra) => { for (let i = 0; i < n; i++) { hit('woodClick', i === 0 ? 1100 : 1500, 0.05, i === 0 ? 0.22 : 0.16, stage, Object.assign({ accent: i === 0 }, extra)); t += BEAT; } };
    const bundle = (b, stage, extra, v) => { const vv = v || VOICES[0]; hit(vv[0], vv[1], Math.max(0.2, b * BEAT * 0.9), 0.24, stage, Object.assign({ worth: b }, extra)); t += Math.max(0.36, b * BEAT * 0.5); };
    // the bundle is first heard equal to its single beats, in the same time
    const demo = (b) => { beats(b, 'demoBeats'); t += 0.3; const t0 = t; hit('drumLow', 110, b * BEAT, 0.24, 'demoBundle', { worth: b }); t = t0 + b * BEAT + GAP; };
    const frame = (stage) => { hit('shaker', 300, 0.15, 0.1, stage); t += 0.35; };
    if (spec.kind === 'fact') {
      const a = spec.a, b = spec.b;
      switch (spec.strategy) {
        case 'zero': {
          const n = a === 0 ? b : a;
          frame('barStart'); beats(n, 'frameBeats'); t += 0.3;
          frame('barStart'); t += n * BEAT; t += 0.3;                // a bar of real silence, the same length
          frame('barStart'); beats(n, 'frameBeats');
          break;
        }
        case 'one': frame('barStart'); beats(b, 'group', { g: 0 }); t += 0.3; frame('barEnd'); break;
        case 'ones': for (let g = 0; g < a; g++) { beats(1, 'group', { g: g }); t += 0.3; } break;
        case 'ten': demo(b); for (let g = 0; g < 10; g++) { bundle(b, 'bundle', { g: g }); if (g === 4) t += 0.3; } break;
        case 'five':
          demo(b);
          for (let g = 0; g < 10; g++) { bundle(b, 'tenPhrase', { g: g }); if (g === 4) t += 0.3; }
          t += GAP;
          for (let g = 0; g < 5; g++) bundle(b, 'bundle', { g: g });
          break;
        case 'nine':
          demo(b);
          frame('barStart');
          for (let g = 0; g < 10; g++) { if (g === 9) { t += Math.max(0.36, b * BEAT * 0.5); } else bundle(b, 'bundle', { g: g }); if (g === 4) t += 0.3; }   // the tenth slot is real silence
          frame('barEnd');
          break;
        case 'fivePlus':
          demo(b);
          for (let g = 0; g < 5; g++) bundle(b, 'bundle', { g: g, part: 'five' });
          t += GAP;
          for (let g = 5; g < a; g++) bundle(b, 'bundle', { g: g, part: 'more' });
          break;
        case 'double': case 'doublePlus': {
          demo(b);
          const top = spec.strategy === 'double' ? a : 2;
          for (let v = 1; v <= top; v *= 2) {
            const t0 = t;
            for (let k = 0; k < v; k++) { const vv = VOICES[k % VOICES.length]; ev.push({ at: t0, voice: vv[0], hz: vv[1], dur: Math.max(0.3, b * BEAT * 0.9), gain: 0.2, stage: 'voices', voices: v, worth: b }); }
            t = t0 + Math.max(0.6, b * BEAT) + GAP;
          }
          if (spec.strategy === 'doublePlus') bundle(b, 'onemore');
          break;
        }
        default: break;
      }
      return ev;
    }
    switch (spec.kind) {
      case 'swap': {
        // the same total time: a groups of b, then b groups of a — only the accents move
        const total = spec.a * spec.b * BEAT * 0.5;
        for (let g = 0; g < spec.a; g++) { hit('drumLow', 110, 0.25, 0.22, 'rowsAccent', { g: g }); t += total / spec.a; }
        t += GAP;
        for (let g = 0; g < spec.b; g++) { hit('drumLow', 110, 0.25, 0.22, 'colsAccent', { g: g }); t += total / spec.b; }
        break;
      }
      case 'split':
        demo(spec.big + spec.small);
        for (let g = 0; g < spec.a; g++) { hit('drumLow', 110, 0.3, 0.22, 'bigPart', { g: g, worth: spec.big }); t += 0.4; for (let i = 0; i < spec.small; i++) { hit('woodClick', 1500, 0.05, 0.16, 'smallPart', { g: g }); t += BEAT; } t += 0.35; }
        break;
      case 'missing':
        demo(spec.b);
        for (let g = 0; g < spec.value; g++) { bundle(spec.b, 'bundle', { g: g }); if (g === 4) t += 0.3; }
        break;
      case 'bars': {
        const per = spec.meter === '3/4' ? 3 : 6;
        for (let bar = 0; bar < spec.bars; bar++) {
          for (let i = 0; i < per; i++) {
            const strong = i === 0 || (per === 6 && i === 3);
            hit(spec.meter === '3/4' ? 'pluck' : 'bowed', strong ? 196 : 294, 0.12, strong ? 0.24 : 0.14, 'beat', { bar: bar, strong: strong });
            t += BEAT * (per === 6 && i === 2 ? 1.6 : 1);
          }
          t += 0.3;
        }
        break;
      }
      case 'accent': {
        // the whole bars before it as bundles (a bundle is one bar of three), then its own bar beat by beat
        const before = Math.floor((spec.n - 1) / 3);
        for (let bar = 0; bar < before; bar++) { hit('drumLow', 110, 0.3, 0.22, 'barBundle', { bar: bar, worth: 3 }); t += 0.45; }
        t += 0.3;
        for (let i = 0; i <= (spec.n - 1) % 3; i++) { const strong = i === 0; hit('pluck', strong ? 196 : 294, 0.12, strong ? 0.24 : 0.14, 'beat', { strong: strong, last: i === (spec.n - 1) % 3 }); t += 0.3; }
        break;
      }
      case 'closes': {
        const bars = Math.ceil(spec.n / 6);
        for (let bar = 0; bar < bars; bar++) { hit('drumLow', 110, 0.3, 0.22, 'barBundle', { bar: bar, worth: 6 }); t += 0.45; }
        t += 0.3;
        hit('metalBell', 1047, 0.3, 0.16, 'nextDownbeat');
        break;
      }
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
    zero: 'תיבה עם פעמות, אחריה תיבה באותו אורך בלי אף פעמה — שקט אמיתי — ושוב תיבה עם פעמות. כמה יש בתיבה השקטה?',
    one: 'קבוצה אחת בלבד, עם מסגרת לפניה ואחריה.',
    ones: 'קבוצות של פעמה אחת. כמה קבוצות?',
    ten: 'קודם שומעים שחבילה אחת שווה לפעמות של קבוצה אחת. אחר כך עשר חבילות — סופרים חבילות, לא פעמות.',
    five: 'קודם חבילה אחת שווה לפעמות שלה. אחר כך משפט של עשר חבילות, שקט, ואחריו חצי ממנו.',
    nine: 'עשר משבצות — ואחת מהן שקט אמיתי. כמה חבילות נשמעו?',
    fivePlus: 'חמש חבילות, שקט קצר, ועוד. חמש קבוצות ועוד כמה קבוצות?',
    double: 'קול אחד מנגן קבוצה. אחר כך שני קולות יחד, ואחר כך פי שניים שוב. כמה קולות בסוף, ובכל אחד קבוצה אחת.',
    doublePlus: 'קול אחד, אחר כך שני קולות יחד — ואחריהם עוד קבוצה אחת.',
    swap: 'אותו זמן בדיוק, פעמיים: פעם בקבוצות קטנות ורבות, פעם בקבוצות גדולות ומעטות. רק ההדגשות זזות — הסך הכול לא משתנה.',
    split: 'כל קבוצה נשמעת בשני חלקים: חבילה גדולה ואחריה כמה פעמות קטנות. כמה פעמות קטנות בכל קבוצה?',
    missing: 'החבילה שווה לקבוצה אחת. כמה חבילות צריך כדי להגיע לכל הסכום?',
    bars: 'כל תיבה היא ביטוי, ובין התיבות נשימה. סופרים תיבות, וכופלים בגודל התיבה.',
    accent: 'כל חבילה היא תיבה שלמה של ואלס: חזק, חלש, חלש. אחר כך התיבה של הפעימה ששואלים עליה, פעמה אחרי פעמה. הפעמה האחרונה ששומעים — חזקה או חלשה?',
    closes: 'כל חבילה היא תיבה שלמה של שש שמיניות. הפעמון הוא הפעמה החזקה של התיבה הבאה. השמינית שעליה שואלים — האחרונה בתיבה?',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    const how = spec.kind === 'fact' ? HOW[spec.strategy] : HOW[spec.kind];
    return '<div class="times-table">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc(how) + '</p>'
      + (revealed
        ? '<p class="band-predict tt-silent">עכשיו בלי צליל: אמרו את העובדה ואת הדרך — "עשר קבוצות פחות אחת", "פי שניים ועוד פי שניים".</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו: כמה קבוצות, וכמה בכל קבוצה?</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, WORLDS: WORLDS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html };
});
