// MelodyMath — כיתה א׳ activities (plan §5, issue #102):
//
//   ספור את הפעמות: המטרונום מדגיש כל פעמה n, והילד חוזה את המספר המודגש הבא
//   ישר המספרים כסולם: כל קפיצה היא צעד בסולם, וקפיצה של 10 היא אוקטבה
//   לוח 100 נוגע: העשרות נשמעות כצליל נמוך והיחידות כנקישות
//   המשך את המנגינה: דגמי AB / AAB / ABC בצליל ובצורה
//
// Pure and DOM-free: beat tracks, event lists and the Hebrew narration that
// goes with every sound (§4.7 — a sound is never the only channel). Sound
// itself goes to musicEngine.js, the one shared AudioContext; in Node that
// returns null and nothing plays. The scale math is delegated to
// numberLine.js, not copied — the line is extended, not forked.
//
// A narration never names the answer — the child still types the number.
(function (root, factory) {
  const IN_NODE = typeof module === 'object' && !!module.exports;
  const api = factory(
    IN_NODE ? require('./musicEngine') : root,
    IN_NODE ? require('./numberLine') : root
  );
  if (IN_NODE) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, nline) {
  'use strict';

  const DEFAULT_BPM = 96;
  const MAX_BEATS = 120;
  const MAX_ACCENTS = 12;

  // Each shape carries a form, a colour and a Hebrew name, so the pattern is
  // readable without colour vision and speakable by a screen reader.
  const PATTERN_SHAPES = {
    A: { id: 'A', name: 'עיגול', icon: '🔴', note: 'דו', freq: 261.63 },
    B: { id: 'B', name: 'משולש', icon: '🔺', note: 'מי', freq: 329.63 },
    C: { id: 'C', name: 'ריבוע', icon: '🟦', note: 'סול', freq: 392.00 }
  };

  const PATTERN_TYPES = {
    AB: ['A', 'B'],
    AAB: ['A', 'A', 'B'],
    ABC: ['A', 'B', 'C']
  };

  function whole(x, min, max) {
    if (x == null || x === '') return null;
    const n = Math.round(Number(x));
    if (!Number.isFinite(n) || n < min || n > max) return null;
    return n;
  }

  function beatLength(bpm) {
    return engine.bpmToSeconds(whole(bpm, 40, 180) || DEFAULT_BPM);
  }

  function hit(at, dur, hz, gain, type) {
    return { at: at, dur: dur, hz: hz, gain: gain, type: type };
  }

  // Hands a plain event list to the shared engine. In Node there is no
  // AudioContext, so this returns null and the activity stays silent.
  function playEvents(events) {
    if (!Array.isArray(events) || !events.length) return null;
    if (!engine || typeof engine.playSequence !== 'function') return null;
    return engine.playSequence(events);
  }

  function countBeats(start, step, max) {
    const s0 = Math.max(0, Math.round(Number(start)) || 0);
    const st = Math.max(1, Math.round(Number(step)) || 1);
    const mx = Math.max(s0, Math.round(Number(max)) || 20);
    const beats = [];
    for (let v = s0; v <= mx; v += st) {
      beats.push({
        value: v,
        accented: v % st === 0 && v !== 0,
        label: String(v)
      });
    }
    return beats;
  }

  function predictNextAccented(current, step) {
    const c = Math.round(Number(current)) || 0;
    const s = Math.round(Number(step)) || 1;
    return c + s;
  }

  // ---------- 1. ספור את הפעמות ----------
  // countBeats is the ladder of accents only. The metronome itself ticks on
  // every single beat and accents each n-th one — that contrast is the whole
  // activity, so the track has to hold the unaccented beats too.
  function metronomeBeats(from, step, accents) {
    const f = whole(from, 0, 1000);
    const st = whole(step, 1, 10);
    const k = whole(accents, 1, MAX_ACCENTS);
    if (f == null || st == null || k == null) return null;
    const beats = [];
    const accented = [];
    let v = f;
    while (accented.length < k && beats.length < MAX_BEATS) {
      const on = v % st === 0 && v !== 0;
      beats.push({ value: v, accented: on, index: beats.length });
      if (on) accented.push(v);
      v += 1;
    }
    if (accented.length < k) return null;
    return {
      from: f,
      step: st,
      beats: beats,
      accented: accented,
      // The number the child predicts. Deliberately absent from the narration.
      next: accented[accented.length - 1] + st,
    };
  }

  function metronomeEvents(from, step, accents, bpm) {
    const track = metronomeBeats(from, step, accents);
    if (!track) return [];
    const beat = beatLength(bpm);
    return track.beats.map(function (b, i) {
      return b.accented
        ? hit(i * beat, beat * 0.5, 660, 0.26, 'triangle')
        : hit(i * beat, beat * 0.3, 330, 0.12, 'sine');
    });
  }

  function metronomeNarration(from, step, accents) {
    const track = metronomeBeats(from, step, accents);
    if (!track) return '';
    return 'המטרונום מתחיל ב־' + track.from + ' ומדגיש כל פעמה ' + track.step
      + '. שמעתם ' + track.accented.length + ' הדגשות: '
      + track.accented.join(', ') + '.';
  }

  // ---------- 2. ישר המספרים כסולם ----------
  // numberLine.js owns the scale: ten steps are an octave, so a +10 jump
  // doubles the frequency. Nothing here may re-export a name numberLine.js
  // exports — in the browser both Object.assign onto the same globalThis, so
  // a shared name overwrites the original and the delegation calls itself.
  // Use numberLine's `scaleStepFreq`; this module adds sound and narration.
  function numberLineScaleJump(fromTick, toTick, baseFreq) {
    return nline.scaleJumpSound(Number(fromTick) || 0, Number(toTick) || 0, baseFreq || 220);
  }

  // A jump is the step tone landed on; an octave jump sounds the tick it left
  // from first, so "the same note, higher" is audible rather than asserted.
  function scaleJumpEvents(fromTick, toTick, baseFreq, bpm) {
    const jump = numberLineScaleJump(fromTick, toTick, baseFreq);
    if (!jump || !Number.isFinite(jump.frequency)) return [];
    const beat = beatLength(bpm);
    const base = Number(baseFreq) || 220;
    if (!jump.isOctave) return [hit(0, beat * 0.8, jump.frequency, 0.22, 'sine')];
    return [
      hit(0, beat * 0.7, base, 0.22, 'sine'),
      hit(beat * 0.8, beat * 1.1, jump.frequency, 0.22, 'sine'),
    ];
  }

  function scaleJumpNarration(fromTick, toTick, baseFreq) {
    const jump = numberLineScaleJump(fromTick, toTick, baseFreq);
    if (!jump) return '';
    const size = Math.abs(jump.jump);
    const dir = jump.jump < 0 ? 'אחורה' : 'קדימה';
    if (jump.jump === 0) return 'נשארתם על אותו מספר, ולכן הצליל לא זז.';
    if (jump.isOctave) {
      return 'קפיצה של ' + size + ' ' + dir + ' היא אוקטבה שלמה: אותו צליל, '
        + (jump.jump < 0 ? 'נמוך פי 2' : 'גבוה פי 2') + '.';
    }
    return 'קפיצה של ' + size + ' ' + dir + ' היא ' + size + ' צעדים בסולם, '
      + (jump.jump < 0 ? 'והצליל יורד' : 'והצליל עולה') + '.';
  }

  function chart100Sound(number, baseTensFreq) {
    const n = Math.max(1, Math.min(100, Math.round(Number(number)) || 1));
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    // Default 200 Hz: one ten = 220 Hz, the same held ten as #843's takeAwayTen (#831).
    const base = Number(baseTensFreq) || 200;
    const tensFreq = tens === 0 ? null : engine.clampHz(Math.round(base * (1 + tens * 0.1) * 10) / 10);
    const clickCount = ones;
    const tensHe = tens === 1 ? 'עשרת אחת' : tens + ' עשרות';
    const onesHe = ones === 1 ? 'יחידה אחת' : ones + ' יחידות';
    // 'ו־' joins a numeral ('ו־8 יחידות'), plain 'ו' joins a word ('ויחידה אחת').
    const vav = ones === 1 ? ' ו' : ' ו־';
    let label = '';
    if (tens > 0 && ones > 0) label = tensHe + vav + onesHe;
    else if (tens > 0) label = tensHe;
    else label = onesHe;

    return {
      number: n,
      tens: tens,
      ones: ones,
      tensFreq: tensFreq,
      clickCount: clickCount,
      label: label,
      // The sounds alone, without the number they make: the note shown while
      // the question is still open (#457).
      cue: chart100Cue(tens, ones),
      // What a screen reader says for the sound the tap just made.
      speech: n + ': ' + label + '. ' + chart100Cue(tens, ones),
    };
  }

  function chart100Cue(tens, ones) {
    const parts = [];
    if (tens > 0) parts.push(tens === 1 ? 'צליל נמוך אחד לעשרת' : tens + ' צלילים נמוכים לעשרות');
    if (ones > 0) parts.push(ones === 1 ? 'נקישה אחת ליחידה' : ones + ' נקישות ליחידות');
    if (!parts.length) parts.push('בלי צליל');
    return parts.join(', ') + '.';
  }

  // The tens are a low tone per ten; the ones are short clicks after them, so
  // the place value is heard as two different things, not one long run.
  function chart100Events(number, baseTensFreq, bpm) {
    const s = chart100Sound(number, baseTensFreq);
    const beat = beatLength(bpm);
    const out = [];
    for (let i = 0; i < s.tens; i++) {
      out.push(hit(i * beat, beat * 0.7, s.tensFreq, 0.24, 'triangle'));
    }
    const after = s.tens * beat + (s.tens ? beat * 0.5 : 0);
    for (let j = 0; j < s.clickCount; j++) {
      out.push(hit(after + j * beat * 0.4, beat * 0.18, 880, 0.16, 'square'));
    }
    return out;
  }

  function melodyPattern(type, length) {
    const p = PATTERN_TYPES[type] || PATTERN_TYPES.AB;
    const len = Math.max(1, Math.round(Number(length)) || p.length);
    const seq = [];
    for (let i = 0; i < len; i++) {
      const sym = p[i % p.length];
      seq.push(PATTERN_SHAPES[sym]);
    }
    return seq;
  }

  function createPatternChallenge(type, length) {
    const full = melodyPattern(type, length || 5);
    const expected = full[full.length - 1];
    const promptSequence = full.slice(0, full.length - 1);
    const choices = [PATTERN_SHAPES.A, PATTERN_SHAPES.B, PATTERN_SHAPES.C];
    return {
      type: type,
      sequence: promptSequence,
      expected: expected,
      choices: choices
    };
  }

  // Only the prompt is played. Sounding the expected shape would hand over
  // the answer, so patternEvents stops where the question starts.
  function patternEvents(type, length, bpm) {
    const challenge = createPatternChallenge(type, length);
    const beat = beatLength(bpm);
    return challenge.sequence.map(function (shape, i) {
      return hit(i * beat, beat * 0.6, shape.freq, 0.22, 'sine');
    });
  }

  function patternNarration(type, length) {
    const challenge = createPatternChallenge(type, length);
    if (!challenge.sequence.length) return '';
    const heard = challenge.sequence.map(function (s) {
      return s.name + ' (' + s.note + ')';
    }).join(', ');
    return 'הדגם הוא ' + challenge.type + '. שמעתם: ' + heard + '. מה בא אחר כך?';
  }

  // ---------- 5. ספירה הלאה ----------
  // Start in the middle and count on with the beat (#462). The last beat is
  // accented: it lands on the answer, which is never written or spoken.
  function countOnBeats(from, steps) {
    const f = whole(from, 0, 1000);
    const s = whole(steps, 1, 10);
    if (f == null || s == null) return [];
    const beats = [];
    for (let i = 0; i < s; i++) beats.push({ count: f + i + 1, accent: i === s - 1 });
    return beats;
  }

  function countOnEvents(from, steps, bpm) {
    const beats = countOnBeats(from, steps);
    if (!beats.length) return [];
    const beat = beatLength(bpm);
    return beats.map(function (b, i) {
      return b.accent
        ? hit(i * beat, beat * 0.5, 660, 0.26, 'triangle')
        : hit(i * beat, beat * 0.3, 330, 0.12, 'sine');
    });
  }

  function countOnNarration(from, steps) {
    const beats = countOnBeats(from, steps);
    if (!beats.length) return '';
    return 'מתחילים ב־' + whole(from, 0, 1000) + ', ' + beats.length + ' פעימות קדימה.';
  }

  // ---------- widgets (slice 2 of #102 / #328) ----------
  function doc() {
    return typeof document === 'undefined' ? null : document;
  }

  function isQuiet() {
    const load = typeof loadAccess === 'function' ? loadAccess : null;
    if (!load) return false;
    try { return !!load().quiet; } catch (e) { return false; }
  }

  function playIfAllowed(events) {
    if (isQuiet()) return null;
    return playEvents(events);
  }

  function node(tag, cls, text) {
    const el = doc().createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }

  function padRow(box) {
    const row = node('div', 'g3-row');
    row.dir = 'ltr';
    box.appendChild(row);
    return row;
  }

  function pads(count, cls) {
    const group = node('span', 'g3-bar');
    for (let i = 0; i < Math.max(0, count); i++) group.appendChild(node('i', cls));
    return group;
  }

  function addPlay(box, label, makeEvents) {
    const b = node('button', 'g3-play', label);
    b.type = 'button';
    b.addEventListener('click', function () { playIfAllowed(makeEvents()); });
    box.appendChild(b);
    return b;
  }

  // `pending` is on screen while the question is open; `full` may name the
  // answer, so it waits in data-reveal until revealWidget (index.html) runs
  // after the child answers.
  function addNote(box, pending, full) {
    const p = node('p', 'g3-note', pending);
    if (full && full !== pending) p.setAttribute('data-reveal', full);
    box.appendChild(p);
  }

  function drawBeats(box, spec) {
    const track = metronomeBeats(spec.from, spec.step, spec.accents);
    if (!track) return;
    const row = padRow(box);
    const group = node('span', 'g3-bar');
    track.beats.forEach(function (b) {
      group.appendChild(node('i', b.accented ? 'on' : ''));
    });
    row.appendChild(group);
    addPlay(box, '▶ השמע שוב', function () {
      return metronomeEvents(spec.from, spec.step, spec.accents, spec.bpm);
    });
    box.appendChild(node('p', 'g3-note', metronomeNarration(spec.from, spec.step, spec.accents)));
  }

  function drawScale(box, spec) {
    if (spec.from == null || spec.to == null) return;
    const jump = numberLineScaleJump(spec.from, spec.to, spec.baseFreq);
    if (!jump || !Number.isFinite(jump.frequency) || jump.jump === 0) return;
    const row = padRow(box);
    row.appendChild(pads(Math.min(20, Math.abs(jump.jump)), jump.isOctave ? 'on' : 'left'));
    addPlay(box, '▶ השמע שוב', function () {
      return scaleJumpEvents(spec.from, spec.to, spec.baseFreq, spec.bpm);
    });
    box.appendChild(node('p', 'g3-note', scaleJumpNarration(spec.from, spec.to, spec.baseFreq)));
  }

  function drawChart100(box, spec) {
    const num = whole(spec.number, 1, 100);
    if (num == null) return;
    const s = chart100Sound(num, spec.baseTensFreq);
    const row = padRow(box);
    if (s.tens > 0) row.appendChild(pads(s.tens, 'on'));
    if (s.ones > 0) row.appendChild(pads(s.ones, 'left'));
    addPlay(box, '▶ השמע שוב', function () {
      return chart100Events(num, spec.baseTensFreq, spec.bpm);
    });
    addNote(box, s.cue, s.speech);
  }

  function drawPattern(box, spec) {
    if (!spec.type || !PATTERN_TYPES[spec.type]) return;
    const challenge = createPatternChallenge(spec.type, spec.length);
    if (!challenge.sequence.length) return;
    const row = padRow(box);
    const group = node('span', 'g3-bar');
    challenge.sequence.forEach(function (sh) {
      group.appendChild(node('span', 'g1-shape', sh.icon + ' ' + sh.name));
    });
    row.appendChild(group);
    addPlay(box, '▶ השמע שוב', function () {
      return patternEvents(spec.type, spec.length, spec.bpm);
    });
    box.appendChild(node('p', 'g3-note', patternNarration(spec.type, spec.length)));
  }

  // One pad per beat, no numbers on them: the last count is the answer.
  function drawCountOn(box, spec) {
    const beats = countOnBeats(spec.from, spec.steps);
    if (!beats.length) return;
    const row = padRow(box);
    const group = node('span', 'g3-bar');
    beats.forEach(function (b) {
      group.appendChild(node('i', b.accent ? 'on' : 'left'));
    });
    row.appendChild(group);
    addPlay(box, '▶ השמע שוב', function () {
      return countOnEvents(spec.from, spec.steps, spec.bpm);
    });
    box.appendChild(node('p', 'g3-note', countOnNarration(spec.from, spec.steps)));
  }

  const DRAW = {
    beats: drawBeats,
    scale: drawScale,
    chart100: drawChart100,
    pattern: drawPattern,
    countOn: drawCountOn,
  };

  function bindGrade1(host, spec) {
    if (!doc() || !host || !spec || !DRAW[spec.kind]) return false;
    host.textContent = '';
    const box = node('div', 'g3');
    DRAW[spec.kind](box, spec);
    if (!box.children.length) return false;
    host.appendChild(box);
    const row = box.querySelector('.g3-row');
    if (row) row.setAttribute('aria-hidden', 'true');
    const note = box.querySelector('.g3-note');
    if (note) {
      const sr = box.insertBefore(node('p', 'sr-only', note.textContent), box.firstChild);
      const full = note.getAttribute && note.getAttribute('data-reveal');
      if (full) sr.setAttribute('data-reveal', full);
      note.setAttribute('aria-hidden', 'true');
    }
    return true;
  }

  return {
    PATTERN_SHAPES: PATTERN_SHAPES,
    PATTERN_TYPES: PATTERN_TYPES,
    DEFAULT_BPM: DEFAULT_BPM,
    countBeats: countBeats,
    predictNextAccented: predictNextAccented,
    metronomeBeats: metronomeBeats,
    metronomeEvents: metronomeEvents,
    metronomeNarration: metronomeNarration,
    numberLineScaleJump: numberLineScaleJump,
    scaleJumpEvents: scaleJumpEvents,
    scaleJumpNarration: scaleJumpNarration,
    chart100Sound: chart100Sound,
    chart100Events: chart100Events,
    melodyPattern: melodyPattern,
    createPatternChallenge: createPatternChallenge,
    patternEvents: patternEvents,
    patternNarration: patternNarration,
    countOnBeats: countOnBeats,
    countOnEvents: countOnEvents,
    countOnNarration: countOnNarration,
    playEvents: playEvents,
    bindGrade1: bindGrade1
  };
});
