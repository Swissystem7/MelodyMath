// MelodyMath — כיתה ב׳ activities (plan §5, issue #103).
//
// Everything above the "widgets" line is pure and runs in Node:
//
//   זוגי או אי־זוגי בשמיעה: האם המקצב נגמר בזוג שלם
//   מאונך כשני כלים: יחידות בתוף, עשרות בבס, ופריטה = 10 מכות ↔ צליל בס
//
// «תיבות × פעמות», «חצי שעה = חצי תיבה» and the three registers are the next
// slice of #103 (docs/ISSUE-103-SLICES.md); they join this module and the same
// `g2` widget spec.
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
    const v = VOICES[voice] || VOICES.drum;
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
  function drawPhases(row, phases) {
    phases.forEach(function (p) {
      if (!p.kind && !p.hits) return;
      row.appendChild(p.kind ? pads(p.hits, 'left') : pads(p.hits, p.voice === 'bass' ? 'on' : ''));
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

  const DRAW = { evenOdd: drawEvenOdd, duo: drawDuo };

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
    VOICES: VOICES, CARRY_HE: CARRY_HE, BORROW_HE: BORROW_HE,
    evenOddBeats: evenOddBeats, evenOddEvents: evenOddEvents, evenOddNarration: evenOddNarration,
    verticalVoices: verticalVoices, phaseEvents: phaseEvents, phaseNarration: phaseNarration,
    bindGrade2: bindGrade2,
  };
});
