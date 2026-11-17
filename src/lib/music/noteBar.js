// MelodyMath — NoteBar: the fraction items of grades ד׳–ו׳ heard as counted
// clicks in a bar (mechanism M3; Courey et al. 2012; Azaryahu et al. 2020).
// Research: docs/research/fractions-note-bar-2026-11-13.md (Perplexity + Meta AI).
//
// Many grade 4-6 fraction items had a note-duration way written as words
// only. NoteBar makes it heard, with the rules of the Meta AI review:
//   - The bar is the whole and is locked at BAR_SEC in every world and every
//     exercise. Only the division inside it changes, never the tempo.
//   - The ear counts, it does not measure length: each fraction is a run of
//     clicks on one common grid (the least common denominator). 1/2 + 1/3 is
//     3 clicks then 2 on a grid of 6; one empty slot is left.
//   - One click sound per exercise; pitch and colour only mark, size is the
//     number of clicks. One musical world per exercise.
//   - A fraction of a quantity is a set, not a length: N equal hits, the
//     part accented (up to 24 hits; beyond that the ear cannot count).
//   - Mixed numbers: a gong marks the start of every whole bar (gamelan).
//   - Not played (the item keeps its text): grids that are not 2-6, 8, 10,
//     12 or 16 clicks, more than 3 bars, a fraction times a fraction (needs a
//     2D grid), and "how much is missing" in a bar that is not one whole.
//   - The widget shows only when the clicks give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_NOTE_BAR = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const MECHANISM = 'M3';
  const PLAYABLE = Object.freeze([1, 2, 3, 4, 5, 6, 8, 10, 12, 16]);
  const MAX_BARS = 3;
  const MAX_SET = 24;
  const BAR_SEC = 3;
  const GAP = 0.8;
  const GONG = { voice: 'gong', hz: 196 };

  const TAGS = Object.freeze(['fillBar', 'noteValues', 'bars', 'mixedBar', 'barFill', 'dottedBeats', 'barsAndHalf', 'splitNotes',
    'durationDiv', 'dotted', 'partsOfWholeBar', 'quantityAsBar', 'reciprocalNotes', 'barFraction', 'wholeFromPartBar', 'silenceQuarter']);

  // One world per exercise, chosen so that its grid is native to it.
  const WORLDS = Object.freeze({
    maqsum: { he: 'מקסום, מקצב ערבי של 4', click: 'drumLow', why: 'דום הוא חצי תיבה ותק הוא רבע: חלוקה לחצאים, רבעים ושמיניות היא שפת הבית שלו' },
    tabla: { he: 'טין־טאל של טאבלה, הודו', click: 'drumHigh', why: 'מחזור ארוך שמתחלק לארבע קבוצות שוות: שמיניות ושש־עשריות נשמעות בו טבעי' },
    afroCuban: { he: 'פעמון אפרו־קובני', click: 'metalBell', why: 'המחזור מתחלק גם לשניים וגם לשלושה: נגנים שומעים בו חצאים ושלישים בבת אחת' },
    gamelan: { he: 'מחזור גמלן עם גונג, באלי', click: 'metalBell', why: 'הגונג מסמן סוף של שלם, וכך שומעים כמה שלמים ומה נשאר' },
    bell: { he: 'פעמון של מערב אפריקה', click: 'metalBell', why: 'כאן השלם הוא קבוצה של מכות שוות, לא משך' },
    sequencer: { he: 'סקוונסר אלקטרוני', click: 'woodClick', why: 'צעדים שווים לגמרי: חמישיות ועשיריות בלי מבטא שמטעה' },
  });
  function worldFor(kind, pulse) {
    if (kind === 'mixed') return WORLDS.gamelan;
    if (kind === 'of' || kind === 'ofWhole') return WORLDS.bell;
    if (pulse === 8 || pulse === 16) return WORLDS.tabla;
    if (pulse % 5 === 0) return WORLDS.sequencer;
    if ((kind === 'split' || kind === 'compare') && (pulse === 2 || pulse === 4)) return WORLDS.maqsum;
    return WORLDS.afroCuban;
  }

  function gcd(a, b) { let x = Math.abs(a), y = Math.abs(b); while (y) { const t = y; y = x % y; x = t; } return x || 1; }
  function lcm(a, b) { return (a / gcd(a, b)) * b; }
  function F(n, d) { if (!Number.isInteger(n) || !Number.isInteger(d) || d <= 0) return null; const g = gcd(n, d); return { n: n / g, d: d / g }; }
  const add = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
  const sub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
  const div = (a, b) => F(a.n * b.d, a.d * b.n);
  const fmt = (f) => (f.d === 1 ? String(f.n) : f.n + '/' + f.d);

  // Reads the item's answer: '3/4', '1 ו־3/8', '6'.
  function answerOf(v) {
    if (typeof v === 'number') return Number.isInteger(v) ? F(v, 1) : null;
    const s = String(v == null ? '' : v).trim();
    let m = /^(\d+)\s*ו[־-]?\s*(\d+)\/(\d+)$/.exec(s);
    if (m) return F(Number(m[1]) * Number(m[3]) + Number(m[2]), Number(m[3]));
    m = /^(\d+)\/(\d+)$/.exec(s);
    if (m) return F(Number(m[1]), Number(m[2]));
    if (/^\d+$/.test(s)) return F(Number(s), 1);
    return null;
  }

  // Fractions in the prompt, in order: mixed numbers first, then a/b. `raw`
  // keeps the written numbers (6/8 before it is reduced to 3/4).
  function fractionsIn(prompt) {
    const out = [];
    const s = String(prompt || '');
    const re = /(\d+)\s*ו[־-]\s*(\d+)\/(\d+)|(\d+)\/(\d+)/g;
    let m;
    while ((m = re.exec(s))) {
      if (m[1]) out.push({ f: F(Number(m[1]) * Number(m[3]) + Number(m[2]), Number(m[3])), at: m.index, end: re.lastIndex, mixed: true });
      else out.push({ f: F(Number(m[4]), Number(m[5])), raw: { n: Number(m[4]), d: Number(m[5]) }, at: m.index, end: re.lastIndex, mixed: false });
    }
    return out.filter((x) => x.f);
  }

  function opBetween(prompt, a, b) {
    const mid = String(prompt).slice(a.end, b.at);
    if (/\+|ועוד/.test(mid)) return '+';
    if (/[−-]|פחות/.test(mid)) return '-';
    if (/×/.test(mid)) return '×';
    if (/:/.test(mid)) return ':';
    return null;
  }

  // Note names in a 4/4 bar ("רבע, שמינית ושמינית", "רבע מנוקד ושמינית").
  const NOTE_WORDS = [['חצי מנוקד', 3, 4], ['רבע מנוקד', 3, 8], ['שמינית מנוקדת', 3, 16], ['שש־עשריות', 1, 16], ['שש־עשרית', 1, 16],
    ['שמיניות', 1, 8], ['שמינית', 1, 8], ['רבעים', 1, 4], ['רבע', 1, 4], ['חצאים', 1, 2], ['חצי', 1, 2]];
  const COUNT_WORDS = { 'שתי': 2, 'שני': 2, 'שלוש': 3, 'שלושה': 3, 'ארבע': 4 };
  function notesInWords(text) {
    const out = [];
    let s = String(text || '');
    for (;;) {
      let best = null;
      NOTE_WORDS.forEach((w) => { const i = s.indexOf(w[0]); if (i >= 0 && (!best || i < best.i || (i === best.i && w[0].length > best.w[0].length))) best = { i: i, w: w }; });
      if (!best) break;
      const before = s.slice(0, best.i).trim().split(/\s+/).pop().replace(/^ו/, '');
      const count = COUNT_WORDS[before] || 1;
      for (let k = 0; k < count; k++) out.push(F(best.w[1], best.w[2]));
      s = s.slice(best.i + best.w[0].length);
    }
    return out;
  }

  const UNIT_WORDS = { 'שמיניות': 8, 'רבעים': 4, 'שש־עשריות': 16, 'שש-עשריות': 16, 'שלישים': 3, 'שישיות': 6, 'חצאים': 2 };

  // The listening plan. kinds:
  //   join    a ± b (± c), or a repeated k times: runs of clicks in a row
  //   compare one run per bar, the longer run is the larger fraction
  //   split   a/b heard again in clicks of 1/k (equivalent fractions, simplify)
  //   mixed   whole bars (a gong each) plus a part (improper ↔ mixed)
  //   share   one run split into k equal groups (a/b : k)
  //   fit     how many runs of b fit into a (division)
  //   missing named notes in a 4/4 bar, then the silent rest of the bar
  //   of      a set of N hits, the part accented (a/b of N)
  //   ofWhole a/b of a set is N: one share is N/a, the set is d shares
  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const p = String(item.prompt || '');
    if (/%|\d\.\d|π/.test(p)) return null;
    const fr = fractionsIn(p);
    const ans = answerOf(item.answer);
    if (!ans) return null;
    const fs = fr.map((x) => x.f);
    let kind = null, result = null, notes = null, set = null;
    let m;
    if ((m = /(\d+)\/(\d+)\s*=\s*\?\/(\d+)/.exec(p))) {
      const f = F(Number(m[1]), Number(m[2])), d = Number(m[3]);
      if (!f || !Number.isInteger((f.n * d) / f.d)) return null;
      kind = 'split'; result = F((f.n * d) / f.d, 1); notes = [{ f: f, unit: F(1, d) }];
    } else if (/צמצמו/.test(p) && fr.length === 1 && fr[0].raw) {
      kind = 'split'; result = fs[0]; notes = [{ f: fs[0], unit: F(1, fr[0].raw.d), simplify: true }];
    } else if ((m = /(\d+)\/(\d+)\s+מ\S+(?:\s+\S+)?\s+הם\s+(\d+)/.exec(p))) {
      const a = Number(m[1]), d = Number(m[2]), part = Number(m[3]);
      if (!(a > 0 && a <= d && part % a === 0 && part <= MAX_SET)) return null;
      kind = 'ofWhole'; result = F((part / a) * d, 1); set = { a: a, d: d, each: part / a, total: (part / a) * d };
    } else if ((m = /(\d+)\/(\d+)\s*מ[־-]\s*(\d+)/.exec(p)) || (m = /(\d+)\s+[^\s,]+,\s*(?:ו[־-])?(\d+)\/(\d+)\s+מהם/.exec(p))) {
      const parts = m[0].indexOf('מהם') >= 0 ? [Number(m[2]), Number(m[3]), Number(m[1])] : [Number(m[1]), Number(m[2]), Number(m[3])];
      const [a, d, q] = parts;
      if (!(a > 0 && a <= d && q % d === 0 && q <= MAX_SET)) return null;
      kind = 'of'; result = F((a * q) / d, 1); set = { a: a, d: d, each: q / d, total: q };
    } else if ((m = /(?:^|[^\d/])(\d+)\s*:\s*(\d+)\/(\d+)\s*=\s*\?/.exec(p))) {
      kind = 'fit'; result = div(F(Number(m[1]), 1), F(Number(m[2]), Number(m[3]))); notes = [{ f: F(Number(m[1]), 1) }, { f: F(Number(m[2]), Number(m[3])) }];
    } else if (fr.length === 1 && (m = /^\s*([×:])\s*(\d+)\s*=\s*\?/.exec(p.slice(fr[0].end)))) {
      const f = fs[0], k = Number(m[2]);
      if (!(k >= 1 && k <= 4)) return null;
      if (m[1] === '×') { kind = 'join'; result = F(f.n * k, f.d); notes = Array.from({ length: k }, () => ({ f: f })); }
      else { kind = 'share'; result = F(f.n, f.d * k); notes = [{ f: f, groups: k }]; }
    } else if (/כמה חסר עד תיבה מלאה/.test(p) && (m = /תיבה של (\d+)\/(\d+)/.exec(p))) {
      // Only a 4/4 bar: in 3/4 a "quarter" is a third of the bar (Meta AI).
      if (Number(m[1]) !== Number(m[2])) return null;
      const named = notesInWords(p.slice(m.index + m[0].length).split(/[.?]/)[0]);
      if (!named.length) return null;
      kind = 'missing'; result = sub(F(1, 1), named.reduce((s, f) => add(s, f), F(0, 1))); notes = named.map((f) => ({ f: f }));
      if (!result || result.n <= 0) return null;
    }
    if (!kind && !fr.length) return null;
    if (!kind && fr.length >= 2 && fr.length <= 3 && /=\s*\?|\?\s*$|\?\s*\(/.test(p)) {
      const ops = [];
      for (let i = 1; i < fr.length; i++) ops.push(opBetween(p, fr[i - 1], fr[i]));
      if (ops.every((o) => o === '+' || o === '-')) {
        kind = 'join'; result = fs[0];
        for (let i = 1; i < fs.length; i++) result = ops[i - 1] === '+' ? add(result, fs[i]) : sub(result, fs[i]);
        notes = fs.map((f, i) => ({ f: f, take: i > 0 && ops[i - 1] === '-' }));
      } else if (fr.length === 2 && ops[0] === ':' && fs[1].n > 0) {
        kind = 'fit'; result = div(fs[0], fs[1]); notes = [{ f: fs[0] }, { f: fs[1] }];
      }
    }
    if (!kind && fr.length === 2 && /גדול|קטן/.test(p) && !/=/.test(p)) {
      kind = 'compare';
      const bigger = fs[0].n * fs[1].d >= fs[1].n * fs[0].d ? fs[0] : fs[1];
      result = /קטן יותר/.test(p) && !/גדול/.test(p) ? (bigger === fs[0] ? fs[1] : fs[0]) : bigger;
      notes = fs.map((f) => ({ f: f }));
    }
    if (!kind && fr.length === 1) {
      const f = fs[0];
      const nk = /כמה (שמיניות|רבעים|שש[־-]?עשריות|שלישים|שישיות|חצאים)/.exec(p);
      if (nk && UNIT_WORDS[nk[1]]) {
        const k = UNIT_WORDS[nk[1]], count = (f.n * k) / f.d;
        if (!Number.isInteger(count)) return null;
        kind = 'split'; notes = [{ f: f, unit: F(1, k) }];
        result = ans.d === k && ans.n === count ? { n: count, d: k } : F(count, 1);
      } else if (/מספר מעורב|כשבר לא אמיתי|כמה שלמים/.test(p)) {
        kind = 'mixed'; result = /כמה שלמים/.test(p) ? F(Math.floor(f.n / f.d), 1) : f; notes = [{ f: f }];
      }
    }
    if (!kind || !result) return null;
    if (!(result.n === ans.n && result.d === ans.d)) return null;   // the clicks give exactly the answer
    if (set) return { kind: kind, set: set, result: result, pulse: set.total, bars: 1, world: worldFor(kind, 0), answer: fmt(result) };
    let pulse = 1;
    notes.forEach((x) => { pulse = lcm(pulse, x.f.d); if (x.unit) pulse = lcm(pulse, x.unit.d); if (x.groups) pulse = lcm(pulse, x.f.d * x.groups / gcd(x.f.n, x.groups)); });
    if (kind === 'join' || kind === 'missing' || kind === 'compare') pulse = lcm(pulse, result.d);
    if (PLAYABLE.indexOf(pulse) < 0) return null;
    const ends = kind === 'join' ? [notes.reduce((s, x) => (x.take ? s : add(s, x.f)), F(0, 1))] : notes.map((x) => x.f);
    const bars = Math.max(1, Math.ceil(Math.max.apply(null, ends.map((f) => f.n / f.d)) - 1e-9));
    if (bars > MAX_BARS) return null;
    return { kind: kind, notes: notes, result: result, pulse: pulse, bars: bars, world: worldFor(kind, pulse), answer: fmt(result) };
  }

  function specForItem(item) { return plan(item); }

  // ---------------------------------------------------------------- sound
  const SCALE = [262, 294, 330, 392, 440, 523];
  const clicks = (f, pulse) => (f.n * pulse) / f.d;

  function soundEvents(spec) {
    if (!spec) return [];
    const ev = [], voice = spec.world.click;
    if (spec.set) {
      // a set of equal hits; the shares are grouped by a soft accent, the part rings.
      const s = spec.set, step = BAR_SEC / s.total;
      const known = spec.kind === 'of' ? s.total : s.a * s.each;
      for (let i = 0; i < known; i++) {
        const inPart = Math.floor(i / s.each) < s.a;
        ev.push({ at: i * step, voice: voice, hz: inPart ? SCALE[4] : SCALE[0], dur: 0.08, gain: inPart ? 0.26 : 0.08, stage: inPart ? 'part' : 'rest', hit: i, accent: i % s.each === 0 });
      }
      return ev;
    }
    const step = BAR_SEC / spec.pulse;
    // A run of clicks for a fraction, starting at slot `from` (one hit per slot).
    const run = (t0, from, n, hz, stage, gain, tag) => { for (let i = 0; i < n; i++) ev.push({ at: t0 + (from + i) * step, voice: voice, hz: hz, dur: 0.08, gain: gain, stage: stage, slot: from + i, note: tag }); };
    const gongs = (t0, bars) => { for (let b = 0; b < bars; b++) ev.push({ at: t0 + b * BAR_SEC, voice: GONG.voice, hz: GONG.hz, dur: 0.6, gain: 0.12, stage: 'gong', bar: b }); };
    if (spec.kind === 'compare') {
      spec.notes.forEach((x, i) => run(i * (BAR_SEC + GAP), 0, clicks(x.f, spec.pulse), SCALE[i * 2], 'note', 0.25, i));
      return ev;
    }
    if (spec.kind === 'split') {
      const x = spec.notes[0], len = clicks(x.f, spec.pulse), u = clicks(x.unit, spec.pulse);
      run(0, 0, len, SCALE[0], 'note', 0.22, 0);
      let t = BAR_SEC * Math.max(1, Math.ceil(len / spec.pulse)) + GAP;
      for (let i = 0; i < len / u; i++) ev.push({ at: t + i * u * step, voice: voice, hz: SCALE[3], dur: 0.12, gain: 0.26, stage: 'unit', note: i });
      if (x.simplify) {
        t += BAR_SEC + GAP;
        const big = clicks(F(1, spec.result.d), spec.pulse);
        for (let i = 0; i < spec.result.n; i++) ev.push({ at: t + i * big * step, voice: voice, hz: SCALE[5], dur: 0.12, gain: 0.26, stage: 'simple', note: i });
      }
      return ev;
    }
    if (spec.kind === 'share') {
      const x = spec.notes[0], len = clicks(x.f, spec.pulse), g = len / x.groups;
      for (let i = 0; i < len; i++) ev.push({ at: i * step, voice: voice, hz: SCALE[Math.floor(i / g) % 2 ? 2 : 4], dur: 0.08, gain: 0.24, stage: 'note', slot: i, accent: i % g === 0, group: Math.floor(i / g) });
      return ev;
    }
    if (spec.kind === 'fit') {
      const whole = clicks(spec.notes[0].f, spec.pulse), u = clicks(spec.notes[1].f, spec.pulse);
      run(0, 0, whole, SCALE[0], 'note', 0.18, 0);
      const t = BAR_SEC * Math.max(1, Math.ceil(whole / spec.pulse)) + GAP;
      for (let i = 0; i < whole; i++) ev.push({ at: t + i * step, voice: voice, hz: Math.floor(i / u) % 2 ? SCALE[2] : SCALE[4], dur: 0.08, gain: 0.24, stage: 'unit', slot: i, accent: i % u === 0, group: Math.floor(i / u) });
      return ev;
    }
    if (spec.kind === 'missing') {
      let pos = 0;
      spec.notes.forEach((x, i) => { const n = clicks(x.f, spec.pulse); run(0, pos, n, SCALE[(i * 2) % SCALE.length], 'note', 0.25, i); pos += n; });
      for (let s = pos; s < spec.pulse; s++) ev.push({ at: s * step, voice: 'woodClick', hz: 1800, dur: 0.04, gain: 0.04, stage: 'silentSlot', slot: s });
      return ev;
    }
    // join and mixed: runs one after another over locked bars; a gong at every whole.
    if (spec.kind === 'mixed') gongs(0, spec.bars);
    let pos = 0;
    spec.notes.forEach((x, i) => {
      const n = clicks(x.f, spec.pulse);
      if (x.take) { pos -= n; run(0, pos, n, SCALE[i * 2], 'take', 0.06, i); return; }
      run(0, pos, n, SCALE[(i * 2) % SCALE.length], 'note', 0.25, i);
      pos += n;
    });
    return ev.sort((a, b) => a.at - b.at);
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
  const cell = (cls, txt) => '<span class="nb-cell ' + (cls || '') + '">' + (txt == null ? '' : esc(txt)) + '</span>';
  const row = (cells, cols, label) => '<div class="nb-bar" dir="ltr" style="grid-template-columns:repeat(' + cols + ',1fr)" aria-label="' + esc(label) + '">' + cells.join('') + '</div>';

  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    const rows = [];
    if (spec.set && spec.kind === 'of') {
      // every hit is a cell; shares alternate in shade, the part is dark.
      const s = spec.set, cols = s.total > 12 ? Math.ceil(s.total / 2) : s.total;
      const cells = Array.from({ length: s.total }, (_, i) => { const share = Math.floor(i / s.each); return cell(share < s.a ? 'nb-n0' : share % 2 ? 'nb-n2' : ''); });
      rows.push(row(cells, cols, 'השלם ' + s.total));
    } else if (spec.set) {
      // the whole is unknown: the known shares are shown with their size, the rest as blocks.
      const s = spec.set;
      const cells = Array.from({ length: s.d }, (_, i) => cell(i < s.a ? 'nb-n0' : '', i < s.a || revealed ? s.each : '?'));
      rows.push(row(cells, s.d, revealed ? 'השלם ' + s.total : 'השלם ?'));
    } else {
      const P = spec.pulse;
      const paint = (cells, from, n, cls) => { for (let k = from; k < from + n; k++) if (k >= 0 && k < cells.length) cells[k] = cell(cls); };
      if (spec.kind === 'compare') {
        spec.notes.forEach((x, i) => { const c = Array.from({ length: P }, () => cell('')); paint(c, 0, clicks(x.f, P), 'nb-n' + i); rows.push(row(c, P, fmt(x.f))); });
      } else if (spec.kind === 'split' || spec.kind === 'share' || spec.kind === 'fit') {
        const x = spec.notes[0], len = clicks(x.f, P), cols = Math.max(P, len);
        // a bar line at every whole, so the locked bar stays visible
        const line = (k) => (k > 0 && k % P === 0 ? ' nb-barline' : '');
        const c = Array.from({ length: cols }, (_, k) => cell((k < len ? 'nb-n0' : '') + line(k))); rows.push(row(c, cols, fmt(x.f)));
        const u = spec.kind === 'split' ? clicks(x.unit, P) : spec.kind === 'fit' ? clicks(spec.notes[1].f, P) : len / x.groups;
        const c2 = Array.from({ length: cols }, (_, k) => cell((k < len ? (Math.floor(k / u) % 2 ? 'nb-n1' : 'nb-n2') : '') + line(k)));
        rows.push(row(c2, cols, revealed ? spec.answer : '?'));
      } else {
        const slots = spec.bars * P, all = Array.from({ length: slots }, () => cell(spec.kind === 'missing' ? 'nb-gap' : ''));
        let pos = 0;
        spec.notes.forEach((x, i) => { const n = clicks(x.f, P); if (x.take) { pos -= n; paint(all, pos, n, 'nb-take'); return; } paint(all, pos, n, 'nb-n' + (i % 3)); pos += n; });
        for (let b = 0; b < spec.bars; b++) rows.push(row(all.slice(b * P, (b + 1) * P), P, 'תיבה ' + (b + 1)));
      }
    }
    return '<div class="note-bar">' + rows.join('')
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '. ' + (spec.set ? 'כל מכה היא פריט אחד.' : 'כל תיבה היא שלם אחד ונמשכת תמיד אותו זמן; סופרים מכות.')) + '</p>'
      + (revealed ? '' : '<p class="band-predict">לפני שלוחצים — נחשו, ואז ספרו את המכות.</p>')
      + '<button type="button" class="snd-play">▶ שמעו וספרו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '<span class="snd-answer" data-reveal="' + esc(spec.answer) + '">?</span>')
      + '</div>';
  }

  return { MECHANISM: MECHANISM, TAGS: TAGS, WORLDS: WORLDS, PLAYABLE: PLAYABLE, MAX_BARS: MAX_BARS, MAX_SET: MAX_SET, BAR_SEC: BAR_SEC,
    answerOf: answerOf, fractionsIn: fractionsIn, notesInWords: notesInWords, plan: plan, specForItem: specForItem, soundEvents: soundEvents, play: play, html: html, worldFor: worldFor };
});
