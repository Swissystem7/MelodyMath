// MelodyMath — כיתה ב׳ activities (plan §5, issue #103).
//
// Everything above the "widgets" line is pure and runs in Node:
//
//   זוגי או אי־זוגי בשמיעה: האם המקצב נגמר בזוג שלם
//   מאונך כשני כלים: יחידות בתוף, עשרות בבס, ופריטה = 10 מכות ↔ צליל בס
//   כפולות: תיבות × פעמות, עם הדגשה על הפעימה הראשונה בכל תיבה
//   חצי שעה = חצי תיבה: חצי חזק וחצי חלש
//   מספרים עד 1,000: בס = מאות, פסנתר = עשרות, פעמון = יחידות
//
// All five share the one `g2` widget spec (docs/ISSUE-103-SLICES.md).
//
// A narration never names the answer: the pads and the sound are the
// scaffold, the child still types the number (§5 R4, R5).
//
// The widgets below need a document; in Node they are never reached. The
// vertical column itself is reused from vertical.js — this module only adds
// the two instruments on top of it.
(function (root, factory) {
  const IN_NODE = typeof module === 'object' && !!module.exports;
  const api = factory(
    IN_NODE ? require('./musicEngine') : root,
    IN_NODE ? require('./vertical') : root
  );
  if (IN_NODE) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, vertical) {
  const DEFAULT_BPM = 92;
  const MAX_BEATS = 24;
  const TEN = 10;

  // Every hz is inside the engine's 110–1,760 Hz safety window (§6.6), so
  // clampHz never has to move a voice and the timbres stay distinguishable.
  const VOICES = {
    drum: { hz: 147, gain: 0.24, type: 'square', he: 'תוף' },
    bass: { hz: 110, gain: 0.26, type: 'triangle', he: 'בס' },
  };
  const PAIR_STRONG_HZ = 165;
  const PAIR_WEAK_HZ = 220;
  const ALONE_HZ = 587;
  const BAR_ACCENT_HZ = 165;
  const BAR_BEAT_HZ = 220;
  const HALF_STRONG_HZ = 330;
  const HALF_WEAK_HZ = 247;
  const PLAY_CAP = 20;

  const REG_VOICES = {
    bass: { hz: 110, gain: 0.26, type: 'triangle', he: 'בס' },
    piano: { hz: 262, gain: 0.22, type: 'sine', he: 'פסנתר' },
    bell: { hz: 523, gain: 0.2, type: 'square', he: 'פעמון' },
  };
  const ONES_TO_TEN_HE = '10 צלילי פעמון מתקבצים לצליל פסנתר אחד';
  const TENS_TO_HUNDRED_HE = '10 צלילי פסנתר מתקבצים לצליל בס אחד';

  // A missing count is a data bug, not a zero, so null and '' are rejected
  // rather than read through Number()'s 0.
  function whole(x, min, max) {
    if (x == null || x === '') return null;
    const n = Math.round(Number(x));
    if (!Number.isFinite(n) || n < min || n > max) return null;
    return n;
  }

  function beatLength(bpm) {
    return engine.bpmToSeconds(whole(bpm, 40, 180) || DEFAULT_BPM);
  }

  function hit(voice, at, dur) {
    const v = VOICES[voice] || REG_VOICES[voice] || VOICES.drum;
    return { at: at, dur: dur, hz: v.hz, gain: v.gain, type: v.type };
  }

  // ---------- זוגי או אי־זוגי בשמיעה ----------
  // A pair is a strong beat and a weak beat. A beat with no partner gets a
  // third timbre, so "does the rhythm end on a full pair" is audible.
  function evenOddBeats(count) {
    const c = whole(count, 1, MAX_BEATS);
    if (c == null) return null;
    const leftover = c % 2;
    return { count: c, pairs: (c - leftover) / 2, leftover: leftover, even: leftover === 0 };
  }

  function evenOddEvents(count, bpm) {
    const s = evenOddBeats(count);
    if (!s) return [];
    const step = beatLength(bpm);
    const out = [];
    for (let i = 0; i < s.count; i++) {
      const paired = i < s.pairs * 2;
      const strong = paired && i % 2 === 0;
      out.push({
        at: i * step, dur: step * 0.6,
        hz: paired ? (strong ? PAIR_STRONG_HZ : PAIR_WEAK_HZ) : ALONE_HZ,
        gain: strong ? 0.26 : 0.16,
        type: paired ? (strong ? 'triangle' : 'sine') : 'square',
      });
    }
    return out;
  }

  function evenOddNarration(count) {
    const s = evenOddBeats(count);
    if (!s) return '';
    return 'שמעתם ' + s.count + ' פעימות. הזוגות מתנגנים חזק־חלש: ' + s.pairs + ' זוגות'
      + (s.leftover ? ', ועוד פעימה אחת שנשארה בלי זוג ובצליל אחר.' : ', ואף פעימה לא נשארה בלי זוג.');
  }

  // ---------- מאונך כשני כלים ----------
  // The ones column is a drum and the tens column is a bass. A carry is 10
  // drum hits collapsing into one bass note; a borrow is the same move
  // backwards — one bass note breaking into 10 drum hits.
  const CARRY_HE = TEN + ' מכות תוף מתקבצות לצליל בס אחד';
  const BORROW_HE = 'צליל בס אחד נפרט ל־' + TEN + ' מכות תוף';

  function verticalVoices(raw) {
    const V = vertical.normalizeVertical(raw);
    if (V.a > 99 || V.b > 99) return null;
    if (V.op === '-' && V.b > V.a) return null;
    const oa = V.a % TEN;
    const ob = V.b % TEN;
    const ta = (V.a - oa) / TEN;
    const tb = (V.b - ob) / TEN;
    let ones;
    let tens;
    let regroup = null;
    if (V.op === '+') {
      const sum = oa + ob;
      if (sum >= TEN) regroup = { kind: 'carry', from: 'drum', to: 'bass', hits: TEN, he: CARRY_HE };
      ones = sum % TEN;
      tens = ta + tb + (regroup ? 1 : 0);
    } else {
      if (oa < ob) regroup = { kind: 'borrow', from: 'bass', to: 'drum', hits: TEN, he: BORROW_HE };
      ones = regroup ? oa + TEN - ob : oa - ob;
      tens = ta - tb - (regroup ? 1 : 0);
    }
    const phases = [
      { voice: 'drum', hits: oa, he: 'היחידות של ' + V.a + ': ' + oa + ' מכות תוף' },
      { voice: 'drum', hits: ob, he: 'היחידות של ' + V.b + ': ' + ob + ' מכות תוף' },
    ];
    if (regroup) phases.push(regroup);
    phases.push(
      { voice: 'bass', hits: ta, he: 'העשרות של ' + V.a + ': ' + ta + ' צלילי בס' },
      { voice: 'bass', hits: tb, he: 'העשרות של ' + V.b + ': ' + tb + ' צלילי בס' }
    );
    // onesDigit/tensDigit/total are the checked arithmetic, not UI copy.
    return {
      a: V.a, b: V.b, op: V.op, regroup: regroup, phases: phases,
      onesDigit: ones, tensDigit: tens, total: tens * TEN + ones,
    };
  }

  // A list of phases, each either n hits of one voice or a regrouping between
  // two voices. The three registers (slice 2) reuse it with their own voices.
  function phaseEvents(phases, bpm) {
    const step = beatLength(bpm);
    const fast = step / 3;
    const out = [];
    let at = 0;
    (Array.isArray(phases) ? phases : []).forEach(function (p) {
      if (p.kind) {
        const back = p.kind === 'borrow';
        if (back) { out.push(hit(p.from, at, step * 1.2)); at += step * 1.5; }
        for (let i = 0; i < p.hits; i++) out.push(hit(back ? p.to : p.from, at + i * fast, fast * 0.8));
        at += p.hits * fast + step * 0.4;
        if (!back) { out.push(hit(p.to, at, step * 1.2)); at += step * 1.5; }
        return;
      }
      for (let i = 0; i < p.hits; i++) out.push(hit(p.voice, at + i * step, step * 0.6));
      at += Math.max(1, p.hits) * step + step * 0.5;
    });
    return out;
  }

  function phaseNarration(phases) {
    const parts = (Array.isArray(phases) ? phases : []).map(function (p) { return p.he; });
    return parts.length ? parts.join('. ') + '.' : '';
  }

  // ---------- תיבות × פעמות ----------
  function barsBeats(bars, perBar) {
    const b = whole(bars, 1, 20);
    const p = whole(perBar, 1, 12);
    if (b == null || p == null) return null;
    const beats = [];
    for (let bar = 1; bar <= b; bar++) {
      for (let i = 0; i < p; i++) beats.push({ bar: bar, indexInBar: i, accent: i === 0 });
    }
    return { bars: b, perBar: p, total: beats.length, beats: beats };
  }

  function barsBeatsEvents(bars, perBar, bpm) {
    const s = barsBeats(bars, perBar);
    if (!s || !s.beats.length) return [];
    const step = beatLength(bpm);
    const sample = s.total > PLAY_CAP;
    const out = [];
    s.beats.forEach(function (b, i) {
      if (sample && !b.accent) return;
      const at = sample ? (b.bar - 1) * step : i * step;
      out.push({
        at: at, dur: step * 0.65,
        hz: b.accent ? BAR_ACCENT_HZ : BAR_BEAT_HZ,
        gain: b.accent ? 0.26 : 0.14,
        type: b.accent ? 'triangle' : 'sine',
      });
    });
    return out;
  }

  function barsBeatsNarration(bars, perBar) {
    const s = barsBeats(bars, perBar);
    if (!s) return '';
    const tail = s.total > PLAY_CAP
      ? ' בשמיעה מוקדמת נשמעת רק הפעימה הראשונה בכל תיבה.'
      : ' הפעימה הראשונה בכל תיבה חזקה.';
    return s.bars + ' תיבות, בכל תיבה ' + s.perBar + ' פעמות.' + tail;
  }

  // ---------- חצי שעה = חצי תיבה ----------
  function halfBarSpec(beatsPerBar) {
    const n = whole(beatsPerBar, 2, 12);
    if (n == null || n % 2 !== 0) return null;
    return { beatsPerBar: n, half: n / 2 };
  }

  function halfBarEvents(beatsPerBar, bpm) {
    const s = halfBarSpec(beatsPerBar);
    if (!s) return [];
    const step = beatLength(bpm);
    const out = [];
    for (let i = 0; i < s.beatsPerBar; i++) {
      const strong = i < s.half;
      out.push({
        at: i * step, dur: step * 0.7,
        hz: strong ? HALF_STRONG_HZ : HALF_WEAK_HZ,
        gain: strong ? 0.24 : 0.14,
        type: strong ? 'triangle' : 'sine',
      });
    }
    return out;
  }

  function halfBarNarration(beatsPerBar) {
    const s = halfBarSpec(beatsPerBar);
    if (!s) return '';
    return 'תיבה של ' + s.beatsPerBar + ' פעמות: החצי הראשון חזק והחצי השני חלש — כמו תו חצי מול חצי שעה.';
  }

  // ---------- שלושה רגיסטרים עד 1,000 ----------
  function regCount(x, max) {
    if (x == null || x === '') return 0;
    const n = Math.round(Number(x));
    if (!Number.isFinite(n) || n < 0 || n > max) return null;
    return n;
  }

  function registerVoices(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    let h = regCount(src.h, 20);
    let t = regCount(src.t, 20);
    let o = regCount(src.o, 20);
    if (h == null || t == null || o == null) return null;
    const phases = [];
    function say(voice, hits) {
      const name = REG_VOICES[voice].he;
      if (!hits) return name + ' שותק';
      return name + ' מנגן ' + hits + (hits === 1 ? ' צליל' : ' צלילים');
    }
    phases.push({ voice: 'bass', hits: h, he: say('bass', h) });
    phases.push({ voice: 'piano', hits: t, he: say('piano', t) });
    phases.push({ voice: 'bell', hits: o, he: say('bell', o) });
    while (o >= TEN) {
      phases.push({ kind: 'carry', from: 'bell', to: 'piano', hits: TEN, he: ONES_TO_TEN_HE });
      o -= TEN;
      t += 1;
    }
    while (t >= TEN) {
      phases.push({ kind: 'carry', from: 'piano', to: 'bass', hits: TEN, he: TENS_TO_HUNDRED_HE });
      t -= TEN;
      h += 1;
    }
    const value = h * 100 + t * 10 + o;
    if (value > 1000) return null;
    return { h: h, t: t, o: o, value: value, phases: phases };
  }

  function registerNarration(raw) {
    const s = registerVoices(raw);
    if (!s) return '';
    return 'בס הוא מאות, פסנתר עשרות, פעמון יחידות. ' + phaseNarration(s.phases);
  }

  // ---------- widgets ----------
  function doc() {
    return typeof document === 'undefined' ? null : document;
  }

  function isQuiet() {
    const load = typeof loadAccess === 'function' ? loadAccess : null;
    if (!load) return false;
    try { return !!load().quiet; } catch (e) { return false; }
  }

  function playEvents(events) {
    if (isQuiet() || typeof engine.playSequence !== 'function') return [];
    return engine.playSequence(events);
  }

  function node(tag, cls, text) {
    const el = doc().createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }

  function addPlay(box, label, makeEvents) {
    const b = node('button', 'g3-play', label);
    b.type = 'button';
    b.addEventListener('click', function () { playEvents(makeEvents()); });
    box.appendChild(b);
    return b;
  }

  function pads(count, cls) {
    const group = node('span', 'g3-bar');
    for (let i = 0; i < Math.max(0, count); i++) group.appendChild(node('i', cls));
    return group;
  }

  function padRow(box) {
    const row = node('div', 'g3-row');
    row.dir = 'ltr';
    box.appendChild(row);
    return row;
  }

  // The regrouping pad group is yellow (.g3-bar i.left), the same colour the
  // grade-ג widget uses for beats outside the bar. A column that contributes
  // nothing (the 0 ones of 70) draws no group; the narration still says
  // "0 מכות תוף", so nothing is lost when the tablet is muted.
  function padClass(voice) {
    if (voice === 'bass') return 'on';
    if (voice === 'bell') return 'left';
    return '';
  }

  function drawPhases(row, phases) {
    phases.forEach(function (p) {
      if (!p.kind && !p.hits) return;
      row.appendChild(p.kind ? pads(p.hits, 'left') : pads(p.hits, padClass(p.voice)));
    });
  }

  function drawEvenOdd(box, spec) {
    const s = evenOddBeats(spec.beats);
    if (!s) return;
    const row = padRow(box);
    for (let i = 0; i < s.pairs; i++) row.appendChild(pads(2, 'on'));
    if (s.leftover) row.appendChild(pads(1, 'left'));
    addPlay(box, '▶ השמע שוב', function () { return evenOddEvents(spec.beats, spec.bpm); });
    box.appendChild(node('p', 'g3-note', evenOddNarration(spec.beats)));
  }

  function drawDuo(box, spec) {
    const s = verticalVoices(spec);
    if (!s) return;
    const col = node('div');
    col.innerHTML = vertical.renderVerticalHtml({ a: s.a, b: s.b, op: s.op });
    box.appendChild(col);
    drawPhases(padRow(box), s.phases);
    addPlay(box, '▶ השמע תוף ובס', function () { return phaseEvents(s.phases, spec.bpm); });
    box.appendChild(node('p', 'g3-note', phaseNarration(s.phases)));
  }

  function drawBeatsBars(box, spec) {
    const s = barsBeats(spec.bars, spec.perBar);
    if (!s) return;
    const row = padRow(box);
    for (let bar = 1; bar <= s.bars; bar++) {
      const group = node('span', 'g3-bar');
      s.beats.filter(function (b) { return b.bar === bar; }).forEach(function (b) {
        group.appendChild(node('i', b.accent ? 'on' : ''));
      });
      row.appendChild(group);
    }
    addPlay(box, '▶ השמע את התיבות', function () { return barsBeatsEvents(spec.bars, spec.perBar, spec.bpm); });
    box.appendChild(node('p', 'g3-note', barsBeatsNarration(spec.bars, spec.perBar)));
  }

  function drawHalfBar(box, spec) {
    const s = halfBarSpec(spec.beatsPerBar);
    if (!s) return;
    const row = padRow(box);
    row.appendChild(pads(s.half, 'on'));
    row.appendChild(pads(s.half, ''));
    addPlay(box, '▶ השמע חצי תיבה', function () { return halfBarEvents(spec.beatsPerBar, spec.bpm); });
    box.appendChild(node('p', 'g3-note', halfBarNarration(spec.beatsPerBar)));
  }

  function drawRegisters(box, spec) {
    const s = registerVoices(spec);
    if (!s) return;
    drawPhases(padRow(box), s.phases);
    addPlay(box, '▶ השמע שלושה רגיסטרים', function () { return phaseEvents(s.phases, spec.bpm); });
    box.appendChild(node('p', 'g3-note', registerNarration(spec)));
  }

  const DRAW = {
    evenOdd: drawEvenOdd, duo: drawDuo,
    beatsBars: drawBeatsBars, halfBar: drawHalfBar, registers: drawRegisters,
  };

  // Every widget ships a screen-reader line and a visible .g3-note, so a muted
  // tablet loses nothing (§4.3, §4.7).
  function bindGrade2(host, spec) {
    if (!doc() || !host || !spec || !DRAW[spec.kind]) return false;
    host.textContent = '';
    const box = node('div', 'g3');
    DRAW[spec.kind](box, spec);
    // A spec the activity refuses (a column past 99, a negative answer) draws
    // nothing, and an empty box must not un-hide the widget host.
    if (!box.children.length) return false;
    host.appendChild(box);
    const row = box.querySelector('.g3-row');
    if (row) row.setAttribute('aria-hidden', 'true');
    const note = box.querySelector('.g3-note');
    if (note) {
      box.insertBefore(node('p', 'sr-only', note.textContent), box.firstChild);
      note.setAttribute('aria-hidden', 'true');
    }
    return true;
  }

  return {
    VOICES: VOICES, REG_VOICES: REG_VOICES,
    CARRY_HE: CARRY_HE, BORROW_HE: BORROW_HE,
    ONES_TO_TEN_HE: ONES_TO_TEN_HE, TENS_TO_HUNDRED_HE: TENS_TO_HUNDRED_HE,
    evenOddBeats: evenOddBeats, evenOddEvents: evenOddEvents, evenOddNarration: evenOddNarration,
    verticalVoices: verticalVoices, phaseEvents: phaseEvents, phaseNarration: phaseNarration,
    barsBeats: barsBeats, barsBeatsEvents: barsBeatsEvents, barsBeatsNarration: barsBeatsNarration,
    halfBarSpec: halfBarSpec, halfBarEvents: halfBarEvents, halfBarNarration: halfBarNarration,
    registerVoices: registerVoices, registerNarration: registerNarration,
    bindGrade2: bindGrade2,
  };
});
