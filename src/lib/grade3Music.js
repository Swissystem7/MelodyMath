// MelodyMath — כיתה ג׳ activities (plan §5, issue #104).
//
// Everything above the "widgets" line is pure and runs in Node:
//
//   לוח 3 במשקל 3/4, לוח 6 במשקל 6/8, הדגשה על כל כפולה
//   14 פעמות בתיבות של 4 = 3 תיבות ו־2 פעמות שנשארו, "3 שארית 2"
//   השוואה כפלית: שני טמפו או שני צלילים במרחק אוקטבה = "פי כמה"
//   שטח מלבן = שורות × תאים ברשת מקצב
//   זמן: דקות ↔ שניות של מנגינה קצרה, ומספרים עד 10,000 כהשוואת Hz
//
// The widgets (bindGrade3) land in the follow-up PR; they need a document.
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

  // ---------- השוואה כפלית ("פי") ----------
  // An octave is 2:1, so 220 Hz against 440 Hz is "פי 2"; the same whole-number
  // ratio describes 60 BPM against 120 BPM.
  function timesMore(big, small) {
    const a = Number(big);
    const b = Number(small);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;
    const q = a / b;
    const r = Math.round(q);
    return r >= 1 && Math.abs(q - r) < 1e-9 ? r : null;
  }

  function pairEvents(spec) {
    const s = spec || {};
    const a = Number(s.a);
    const b = Number(s.b);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return [];
    if (s.unit === 'bpm') {
      // Four clicks at each tempo, the second train starting after the first
      // one has finished — a fixed offset would make a slow pair overlap.
      const out = [];
      let t = 0;
      [a, b].forEach(function (bpm) {
        const step = beatLength(bpm);
        for (let i = 0; i < 4; i++) {
          out.push({ at: t + i * step, dur: 0.12, hz: BEAT_HZ, gain: 0.2, type: 'square' });
        }
        t += 4 * step + 0.6;
      });
      return out;
    }
    return [
      { at: 0, dur: 0.8, hz: a, gain: 0.2, type: 'sine' },
      { at: 1.1, dur: 0.8, hz: b, gain: 0.2, type: 'sine' },
    ];
  }

  function pairNarration(spec) {
    const s = spec || {};
    const unit = s.unit === 'bpm' ? 'פעמות לדקה' : 'הרץ';
    if (!Number.isFinite(Number(s.a)) || !Number.isFinite(Number(s.b))) return '';
    return 'קודם ' + s.a + ' ' + unit + ', ואחר כך ' + s.b + ' ' + unit + '.';
  }

  // ---------- שטח מלבן כרשת מקצב ----------
  function gridCells(rows, steps) {
    const r = whole(rows, 1, 8);
    const s = whole(steps, 1, 16);
    if (r == null || s == null) return null;
    return r * s;
  }

  const MIN_CELL = 44;
  const MAX_CELL = 72;
  const CELL_GAP = 8;

  // Touch targets come first: a 44px cell plus an 8px gap needs 52px per step,
  // so an 8-step row does not fit the ~284px a card leaves on a 360px phone.
  // The row then wraps into two half-rows of the same bar — the grid keeps its
  // rows × steps shape, the cells stay at 44px and nothing scrolls sideways.
  function gridLayout(steps, widthPx, opts) {
    const o = opts || {};
    const s = whole(steps, 1, 16);
    const avail = Number(widthPx);
    const min = whole(o.minCell, 8, 200) || MIN_CELL;
    const gap = o.gap == null ? CELL_GAP : (whole(o.gap, 0, 40) || 0);
    const max = whole(o.maxCell, min, 400) || Math.max(min, MAX_CELL);
    if (s == null || !Number.isFinite(avail) || avail <= 0) return null;
    const fits = function (n) { return n * min + (n - 1) * gap <= avail; };
    let perRow = s;
    let wraps = 1;
    while (perRow > 1 && !fits(perRow)) {
      wraps += 1;
      perRow = Math.ceil(s / wraps);
    }
    const room = Math.floor((avail - (perRow - 1) * gap) / perRow);
    return {
      steps: s, perRow: perRow, wraps: Math.ceil(s / perRow), gap: gap,
      cell: Math.max(min, Math.min(max, room)),
    };
  }

  function gridEvents(rows, steps, bpm) {
    const r = whole(rows, 1, 8);
    const s = whole(steps, 1, 16);
    if (r == null || s == null) return [];
    const step = beatLength(bpm);
    const out = [];
    for (let col = 0; col < s; col++) {
      for (let row = 0; row < r; row++) {
        out.push({
          at: col * step, dur: step * 0.6, gain: 0.12,
          hz: BEAT_HZ * Math.pow(2, (r - 1 - row) / 4), type: 'sine',
        });
      }
    }
    return out;
  }

  function gridNarration(rows, steps) {
    const cells = gridCells(rows, steps);
    if (cells == null) return '';
    return 'רשת של ' + rows + ' שורות ו־' + steps + ' תאים בשורה, ' + cells
      + ' תאים בסך הכול. הרשת מתנגנת עמודה אחר עמודה.';
  }

  // ---------- זמן ומספרים עד 10,000 ----------
  function tuneSeconds(minutes, seconds) {
    const m = whole(minutes, 0, 60);
    const s = whole(seconds == null ? 0 : seconds, 0, 59);
    if (m == null || s == null) return null;
    return m * 60 + s;
  }

  function tuneClock(totalSeconds) {
    const t = whole(totalSeconds, 0, 3600);
    if (t == null) return '';
    const s = t % 60;
    return Math.floor(t / 60) + ':' + (s < 10 ? '0' + s : String(s));
  }

  // Four-digit frequencies, compared by ear. The engine clamps playback to
  // 1,760 Hz for hearing safety (§6.6), so the pair stays inside that range.
  function higherHz(a, b) {
    const x = Number(a);
    const y = Number(b);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x <= 0 || y <= 0) return null;
    return Math.max(x, y);
  }
  return {
    METERS: METERS, MIN_CELL: MIN_CELL, CELL_GAP: CELL_GAP,
    meterForTable: meterForTable, meterBeats: meterBeats, meterEvents: meterEvents,
    meterNarration: meterNarration,
    barsAndRemainder: barsAndRemainder, remainderText: remainderText,
    parseRemainder: parseRemainder, isRemainderAnswer: isRemainderAnswer,
    remainderMiss: remainderMiss, remainderEvents: remainderEvents,
    remainderNarration: remainderNarration,
    timesMore: timesMore, pairEvents: pairEvents, pairNarration: pairNarration,
    gridCells: gridCells, gridLayout: gridLayout, gridEvents: gridEvents,
    gridNarration: gridNarration,
    tuneSeconds: tuneSeconds, tuneClock: tuneClock, higherHz: higherHz,
  };
});
