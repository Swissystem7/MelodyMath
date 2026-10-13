// MelodyMath — כיתה ג׳ activities (plan §5, issue #104), part 1 of the pure core.
//
// Two of the five grade-3 goals, both pure and both running in Node:
//
//   לוח 3 במשקל 3/4, לוח 6 במשקל 6/8, הדגשה על כל כפולה
//   14 פעמות בתיבות של 4 = 3 תיבות ו־2 פעמות שנשארו, "3 שארית 2"
//
// The other three §5 goals — השוואה כפלית ("פי כמה") between two tempi or two
// frequencies, שטח מלבן as a rhythm grid, and זמן with four-digit Hz — are the
// next PR for #104, and the widgets (bindGrade3) the one after, since they need
// a document — plus the engine change those widgets play through, which lets a
// page hand its own AudioContext to musicEngine instead of a second one being
// opened (plan §3: "רק אחד"). Each `*Events` function returns a plain event
// list for `musicEngine.planSequence`, so the audible half is testable here
// without any audio.
(function (root, factory) {
  const IN_NODE = typeof module === 'object' && !!module.exports;
  const engine = IN_NODE ? require('./musicEngine') : root;
  const api = factory(engine);
  if (IN_NODE) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine) {
  function whole(x, min, max) {
    const n = Math.round(Number(x));
    if (!Number.isFinite(n) || n < min || n > max) return null;
    return n;
  }

  // ---------- לוח הכפל כמשקל ----------
  // Table 3 counts in 3/4 and table 6 in 6/8: the bar is exactly as long as
  // the table step, so every multiple of the table lands on an accent and
  // "3 × 4" is literally four accented beats.
  const METERS = { 3: '3/4', 6: '6/8' };

  function meterForTable(table) {
    const t = whole(table, 1, 10);
    if (t == null || !Object.prototype.hasOwnProperty.call(METERS, t)) return null;
    return { table: t, timeSig: METERS[t], beatsPerBar: t };
  }

  // One entry per beat, in counting order. `accent` marks the multiples.
  function meterBeats(table, bars) {
    const m = meterForTable(table);
    const n = whole(bars, 1, 10);
    if (!m || n == null) return [];
    const out = [];
    for (let i = 1; i <= n * m.beatsPerBar; i++) {
      const accent = i % m.beatsPerBar === 0;
      out.push({ count: i, accent: accent, multiple: accent ? i : null, bar: Math.ceil(i / m.beatsPerBar) });
    }
    return out;
  }

  const ACCENT_HZ = 660;
  const BEAT_HZ = 330;
  const LEFTOVER_HZ = 494;
  const DEFAULT_BPM = 96;

  function beatLength(bpm) {
    return engine.bpmToSeconds(whole(bpm, 40, 180) || DEFAULT_BPM);
  }

  function meterEvents(table, bars, bpm) {
    const step = beatLength(bpm);
    return meterBeats(table, bars).map(function (b, i) {
      return {
        at: i * step, dur: step * 0.7,
        hz: b.accent ? ACCENT_HZ : BEAT_HZ,
        gain: b.accent ? 0.26 : 0.14,
        type: b.accent ? 'triangle' : 'sine',
      };
    });
  }

  function meterNarration(table, bars) {
    const m = meterForTable(table);
    const beats = meterBeats(table, bars);
    if (!m || !beats.length) return '';
    const hits = beats.filter(function (b) { return b.accent; }).map(function (b) { return b.count; });
    return 'משקל ' + m.timeSig + '. ' + beats.length + ' פעמות ב־' + hits.length
      + ' תיבות, והדגשה על ' + hits.join(', ') + '.';
  }

  // ---------- חילוק עם שארית ----------
  function barsAndRemainder(beats, perBar) {
    const b = whole(beats, 0, 200);
    const p = whole(perBar, 1, 12);
    if (b == null || p == null) return null;
    return { beats: b, perBar: p, bars: Math.floor(b / p), remainder: b % p };
  }

  function remainderText(spec) {
    if (!spec) return '';
    const b = whole(spec.bars, 0, 200);
    const r = whole(spec.remainder, 0, 11);
    if (b == null || r == null) return '';
    return b + ' שארית ' + r;
  }

  // Accepts "3 שארית 2", "3שארית2", "3 ושארית 2", "3 ש 2", "3 r 2", "3, 2"
  // and "3 (2)" — the ways a child actually types the pair.
  const REMAINDER_RE = /^(\d{1,4})\s*(?:(?:ו[־-]?)?(?:שארית|שאר|ש[׳'".]?)|rem\.?|r|[,;|(])\s*(\d{1,4})\)?$/i;

  function parseRemainder(raw) {
    if (raw == null) return null;
    const m = REMAINDER_RE.exec(String(raw).trim().replace(/\s+/g, ' '));
    return m ? { bars: Number(m[1]), remainder: Number(m[2]) } : null;
  }

  // The pure validator the UI checks a remainder answer with. `expected` is a
  // barsAndRemainder spec or the text form. A zero remainder may be written as
  // the quotient on its own, because "12 שארית 0" is not how anyone answers.
  function isRemainderAnswer(given, expected) {
    const want = expected && typeof expected === 'object'
      ? { bars: whole(expected.bars, 0, 200), remainder: whole(expected.remainder, 0, 11) }
      : parseRemainder(expected);
    if (!want || want.bars == null || want.remainder == null) return false;
    const got = parseRemainder(given);
    if (got) return got.bars === want.bars && got.remainder === want.remainder;
    if (want.remainder !== 0) return false;
    const bare = /^\d{1,4}$/.exec(String(given == null ? '' : given).trim());
    return !!bare && Number(bare[0]) === want.bars;
  }

  // R5: name the mistake instead of saying "wrong".
  function remainderMiss(given, spec) {
    const s = barsAndRemainder(spec && spec.beats, spec && spec.perBar);
    if (!s) return '';
    const bare = /^\d{1,4}$/.test(String(given == null ? '' : given).trim())
      ? Number(String(given).trim()) : null;
    const got = parseRemainder(given);
    if (bare === s.bars && s.remainder) {
      return 'התיבות נכונות, אבל ' + s.remainder + ' פעמות עוד לא נכנסו לתיבה. כתבו ' + remainderText(s) + '.';
    }
    if (bare === s.beats) {
      return 'זה מספר כל הפעמות. השאלה היא כמה תיבות שלמות יוצאות וכמה פעמות נשארות.';
    }
    if (got && got.remainder >= s.perBar) {
      return 'שארית תמיד קטנה מ־' + s.perBar + ', אחרת אפשר למלא עוד תיבה שלמה.';
    }
    return s.bars + ' × ' + s.perBar + ' = ' + (s.bars * s.perBar) + ', ומ־' + s.beats
      + ' נשארות ' + s.remainder + ' פעמות: ' + remainderText(s) + '.';
  }

  // Full bars keep the meter voice; the leftover beats sound in a different
  // timbre, so the remainder is heard and not only counted.
  function remainderEvents(beats, perBar, bpm) {
    const s = barsAndRemainder(beats, perBar);
    if (!s) return [];
    const step = beatLength(bpm);
    const out = [];
    for (let i = 0; i < s.bars * s.perBar; i++) {
      const down = i % s.perBar === 0;
      out.push({
        at: i * step, dur: step * 0.7, hz: down ? ACCENT_HZ : BEAT_HZ,
        gain: down ? 0.24 : 0.14, type: down ? 'triangle' : 'sine',
      });
    }
    for (let j = 0; j < s.remainder; j++) {
      out.push({
        at: (s.bars * s.perBar + j) * step + step * 0.5, dur: step * 0.7,
        hz: LEFTOVER_HZ, gain: 0.2, type: 'square',
      });
    }
    return out;
  }

  function remainderNarration(spec) {
    const s = barsAndRemainder(spec && spec.beats, spec && spec.perBar);
    if (!s) return '';
    return s.beats + ' פעמות בתיבות של ' + s.perBar + ': ' + s.bars
      + ' תיבות שלמות, ואחריהן ' + s.remainder + ' פעמות שנשארו בצליל אחר.';
  }

  return {
    METERS: METERS,
    meterForTable: meterForTable, meterBeats: meterBeats, meterEvents: meterEvents,
    meterNarration: meterNarration,
    barsAndRemainder: barsAndRemainder, remainderText: remainderText,
    parseRemainder: parseRemainder, isRemainderAnswer: isRemainderAnswer,
    remainderMiss: remainderMiss, remainderEvents: remainderEvents,
    remainderNarration: remainderNarration,
  };
});
