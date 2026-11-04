// MM-610 pilot — the music of every exercise of the new units, planned from a
// small declarative spec in pilot/js/units.js. The spec says WHICH musical
// structure carries the math reasoning; this file turns it into
//   notes  — what is heard (played by pilot/js/music.js with the app's own
//            src/lib/musicEngine.js and src/lib/instrumentVoices.js), and
//   view   — what is seen (the same structure drawn as tokens, groups and an
//            optional SVG), so every exercise works with the sound off.
//
// Kinds (each one is a musical structure that IS the math structure):
//   beats     bars of equal beats, the first beat of each bar accented:
//             counting, grouping by 10, multiplication, division, remainder,
//             area, volume, money, minutes. A bar can be one long "block" note
//             (a ten, a hundred) when it is too long to play beat by beat.
//   steps     one scale step per number: counting on/back, skip counting,
//             number-line jumps, the 12-step clock cycle, counting up change.
//   place     one instrument per place value (gong 1000, organ 100, bass 10,
//             xylophone 1); ten of one instrument = one of the next.
//   pattern   a repeating melodic unit: patterns, pairs (even/odd), tallies.
//   pitch     data: each category plays its count as repeated notes at its
//             own pitch (a pictogram you hear).
//   durations note lengths inside a 4/4 bar: half a bar = half an hour,
//             two half-shekels fill a bar.
//   turn      a full turn is one 4/4 bar; a held note of 1 beat is a quarter
//             turn (a right angle), 2 beats a straight angle.
//   shape     a polygon is a loop: one accented beat per corner; a side of n cm
//             plays n notes (perimeter = all the notes of one loop).
//   tempo     two drums in the same time span: "how many times faster".
//
// Answer-leak rule (test/pilotUnits.test.js): before the answer the view never
// prints the result; an asked value is drawn as "?" until the exercise is solved.
// Pure: runs in Node (tests) and in the browser (window.MMPilotScore).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MMPilotScore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Major scale degrees from C4. Degree 0 = C4 (261.63 Hz), 7 = C5, -7 = C3.
  const SEMI = [0, 2, 4, 5, 7, 9, 11];
  const NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  function deg(d) {
    const o = Math.floor(d / 7);
    const i = ((d % 7) + 7) % 7;
    return { hz: Math.round(261.63 * Math.pow(2, (SEMI[i] + 12 * o) / 12) * 100) / 100, name: NAMES[i] + (4 + o) };
  }
  // "Twinkle, Twinkle" (public domain, as js/music.js): beats sing the tune, so
  // a rhythm is always inside a melody (MusiMath, E5 in MM-503).
  const TUNE = [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0, 4, 4, 3, 3, 2, 2, 1, 4, 4, 3, 3, 2, 2, 1];
  const PLACE = {
    1000: { voice: 'gong', hz: 98, he: 'גונג', glyph: '1000', role: 'p1000' },
    100: { voice: 'organ', hz: 130.81, he: 'עוגב', glyph: '100', role: 'p100' },
    10: { voice: 'pluck', hz: 196, he: 'בס', glyph: '10', role: 'p10' },
    1: { voice: 'woodBar', hz: 523.25, he: 'קסילופון', glyph: '1', role: 'p1' }
  };
  const PLAYER_VOICES = ['keys', 'woodBar', 'steelPan', 'tine', 'reed', 'bowed'];

  function r3(x) { return Math.round(x * 1000) / 1000; }
  function note(d, at, dur, voice, role, chip, gain, hz) {
    const p = hz ? { hz: hz, name: '' } : deg(d);
    return { note: p.name, hz: p.hz, at: r3(at), dur: r3(dur), voice: voice, role: role, chip: chip == null ? null : chip, gain: gain == null ? 0.2 : gain };
  }
  function home(at) {
    return [0, 2, 4].map(function (d) { return note(d, at, 0.9, 'keys', 'home', null, 0.12); });
  }
  function solvedStage(stage) { return stage === 'right' || stage === 'reveal'; }

  // A small builder: rows of groups of tokens; every token gets a global index
  // (its "chip"), which the notes point at so a token lights up as it sounds.
  function Board() {
    const rows = [];
    let n = 0;
    return {
      rows: rows,
      row: function (label, cls) { const r = { label: label || '', cls: cls || '', groups: [] }; rows.push(r); return r; },
      group: function (row, label, cls) { const g = { label: label || '', cls: cls || '', tokens: [] }; row.groups.push(g); return g; },
      token: function (group, t, role, step, w) { const k = { t: String(t), role: role, step: step || 0, w: w || 1, chip: n++ }; group.tokens.push(k); return k; }
    };
  }

  // ------------------------------------------------------------------ kinds
  function beats(spec, stage, slow) {
    const b = Board();
    const notes = [];
    const bars = spec.bars || [];
    const total = bars.reduce(function (s, x) { return s + (spec.block ? 1 : x); }, 0) + (spec.extra || 0);
    const beat = Math.max(0.16, Math.min(0.32, 7 / Math.max(1, total))) * slow;
    const row = b.row('', spec.grid ? 'is-grid' : '');
    let at = 0;
    let t = 0;
    const silent = spec.silent || [];
    bars.forEach(function (size, i) {
      const g = b.group(row, (spec.labels || [])[i] || '', silent.indexOf(i) >= 0 ? 'is-silent' : '');
      const voice = (spec.voices || [])[i] || (spec.players ? PLAYER_VOICES[i % PLAYER_VOICES.length] : 'keys');
      if (spec.block) {
        const k = b.token(g, spec.blockGlyph || size, silent.indexOf(i) >= 0 ? 'rest' : 'block', -7, 2);
        if (silent.indexOf(i) < 0) notes.push(note(-7, at, 0.55 * slow, 'organ', 'block', k.chip, 0.24));
        at += 0.75 * slow;
        return;
      }
      for (let j = 0; j < size; j++) {
        const d = TUNE[t++ % TUNE.length];
        const k = b.token(g, '', silent.indexOf(i) >= 0 ? 'rest' : (j === 0 ? 'accent' : 'beat'), d);
        if (silent.indexOf(i) < 0) {
          notes.push(note(d, at, beat * 0.85, voice, j === 0 ? 'accent' : 'beat', k.chip, j === 0 ? 0.26 : 0.17));
          if (j === 0) notes.push(note(0, at, 0.12, 'frameDrum', 'drum', null, 0.2, 110));
        }
        at += beat;
      }
      at += beat * 0.6; // a breath between bars: the grouping is heard
    });
    if (spec.extra) {
      const g = b.group(row, spec.extraLabel || 'מחוץ לתיבה', 'is-extra');
      for (let j = 0; j < spec.extra; j++) {
        const d = TUNE[t++ % TUNE.length];
        const k = b.token(g, '', 'extra', d);
        notes.push(note(d, at, beat * 0.85, 'pluck', 'extra', k.chip, 0.17));
        at += beat;
      }
    }
    return { board: b, notes: notes, end: at };
  }

  function stepValue(spec, i) {
    let v = spec.from + i * spec.step;
    if (spec.mod) v = ((v - 1) % spec.mod + spec.mod) % spec.mod + 1;
    return v;
  }

  function steps(spec, stage, slow) {
    const b = Board();
    const notes = [];
    const solved = solvedStage(stage);
    const row = b.row(spec.label || '', 'is-steps');
    const g = b.group(row, '');
    const ask = spec.ask !== false;
    const dir = spec.step < 0 ? -1 : 1;
    let at = 0;
    for (let i = 0; i < spec.count; i++) {
      const last = i === spec.count - 1;
      const v = stepValue(spec, i);
      let label;
      if (last && ask && !solved) label = '?';
      else if (spec.show === 'start' && i > 0 && !(last && solved)) label = (spec.step > 0 ? '+' : '−') + Math.abs(spec.step);
      else label = (spec.prefix || '') + v;
      const d = dir > 0 ? i : (spec.count - 1 - i);
      const k = b.token(g, label, last && ask ? 'asked' : (i === 0 ? 'from' : 'step'), d);
      notes.push(note(d, at, 0.28 * slow, i === 0 ? 'keys' : 'woodBar', last && ask ? 'asked' : 'step', k.chip, 0.2));
      at += 0.42 * slow;
    }
    return { board: b, notes: notes, end: at };
  }

  function place(spec, stage, slow) {
    const b = Board();
    const notes = [];
    const solved = solvedStage(stage);
    let at = 0;
    (spec.rows || []).forEach(function (r) {
      const hidden = r.hide && !solved;
      const row = b.row(hidden ? (r.label || '') + ' ?' : r.label, r.removed ? 'is-removed' : '');
      if (hidden) return;
      [1000, 100, 10, 1].forEach(function (pv) {
        if (!(pv in (r.parts || {}))) return;
        const n = r.parts[pv];
        const P = PLACE[pv];
        const g = b.group(row, P.he, 'is-place');
        if (!n) { b.token(g, 'שקט', 'silence', 0); at += 0.3 * slow; return; }
        for (let j = 0; j < n; j++) {
          const k = b.token(g, P.glyph, r.removed ? 'removed' : P.role, 0);
          notes.push(note(0, at, (pv >= 100 ? 0.5 : 0.25) * slow, r.removed ? 'pluck' : P.voice, r.removed ? 'removed' : P.role, k.chip, r.removed ? 0.09 : 0.22, P.hz));
          at += (pv >= 100 ? 0.55 : 0.3) * slow;
        }
        at += 0.2 * slow;
      });
      at += 0.4 * slow;
    });
    return { board: b, notes: notes, end: at };
  }

  function pattern(spec, stage, slow) {
    const b = Board();
    const notes = [];
    const solved = solvedStage(stage);
    const row = b.row('', 'is-pattern');
    const by = spec.groupBy || spec.seq.length + 1;
    let g = null;
    let at = 0;
    const seq = spec.seq.slice();
    if (spec.ask) seq.push(solved ? spec.answerKey : '?');
    seq.forEach(function (key, i) {
      if (i % by === 0) g = b.group(row, '', spec.groupBy ? 'is-pair' : '');
      const asked = spec.ask && i === seq.length - 1;
      const d = key === '?' ? 0 : (spec.deg[key] || 0);
      const k = b.token(g, key === '?' ? '?' : spec.sym[key], asked ? 'asked' : 'pat-' + key, d);
      if (key !== '?') notes.push(note(d, at, 0.26 * slow, spec.voice || 'woodBar', asked ? 'asked' : 'pat', k.chip, 0.2));
      at += 0.36 * slow;
    });
    return { board: b, notes: notes, end: at };
  }

  function pitch(spec, stage, slow) {
    const b = Board();
    const notes = [];
    const row = b.row('', 'is-chart');
    let at = 0;
    spec.items.forEach(function (it, i) {
      const g = b.group(row, it.label + (spec.showN === false ? '' : ' · ' + it.n), 'is-col');
      const d = i * 2;
      for (let j = 0; j < it.n; j++) {
        const k = b.token(g, it.sym || '●', 'col' + (i % 4), d);
        notes.push(note(d, at, 0.18 * slow, PLAYER_VOICES[i % PLAYER_VOICES.length], 'item', k.chip, 0.18));
        at += 0.22 * slow;
      }
      at += 0.35 * slow;
    });
    return { board: b, notes: notes, end: at };
  }

  function durations(spec, stage, slow) {
    const b = Board();
    const notes = [];
    const beat = 0.5 * slow;
    const per = spec.beats || 4;
    const row = b.row('', 'is-bars');
    let at = 0;
    (spec.bars || []).forEach(function (bar, i) {
      const g = b.group(row, (spec.labels || [])[i] || '', 'is-bar');
      for (let c = 0; c < per; c++) notes.push(note(7, at + c * beat, 0.05, 'woodClick', 'click', null, c === 0 ? 0.16 : 0.1, c === 0 ? 1500 : 1200));
      let used = 0;
      bar.forEach(function (n, j) {
        const k = b.token(g, n.label, n.rest ? 'rest' : 'held', j * 2, n.len);
        if (!n.rest) notes.push(note(j * 2, at + used * beat, n.len * beat * 0.92, 'keys', 'held', k.chip, 0.22));
        used += n.len;
      });
      if (used < per) b.token(g, 'שקט', 'rest', 0, per - used);
      at += per * beat + 0.2 * slow;
    });
    return { board: b, notes: notes, end: at };
  }

  function wedge(beatsOfFour) {
    // The angle drawn as two rays from a corner: 1 beat of 4 = 90°.
    const a = beatsOfFour * 90 * Math.PI / 180;
    const x = 50 + 40 * Math.cos(a);
    const y = 50 - 40 * Math.sin(a);
    const arcR = 14;
    const ax = 10 + arcR * Math.cos(a);
    const ay = 50 - arcR * Math.sin(a);
    const large = beatsOfFour > 2 ? 1 : 0;
    return '<svg viewBox="0 0 100 60" width="100" height="60" aria-hidden="true" focusable="false" class="mm-sc-svg">'
      + '<g transform="translate(-40 0)"><line x1="50" y1="50" x2="90" y2="50" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>'
      + '<line x1="50" y1="50" x2="' + r3(x) + '" y2="' + r3(y) + '" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>'
      + '<path d="M ' + (50 + arcR) + ' 50 A ' + arcR + ' ' + arcR + ' 0 ' + large + ' 0 ' + r3(ax + 40) + ' ' + r3(ay) + '" fill="none" stroke="#FF8A3D" stroke-width="3"/></g></svg>';
  }

  function turn(spec, stage, slow) {
    const b = Board();
    const notes = [];
    const beat = 0.5 * slow;
    const row = b.row('', 'is-bars');
    let at = 0;
    let svg = '';
    spec.turns.forEach(function (len, i) {
      const g = b.group(row, (spec.labels || [])[i] || '', 'is-bar');
      for (let c = 0; c < 4; c++) notes.push(note(7, at + c * beat, 0.05, 'woodClick', 'click', null, c === 0 ? 0.16 : 0.1, c === 0 ? 1500 : 1200));
      const k = b.token(g, '↻', 'held', i * 2, len);
      notes.push(note(i * 2, at, len * beat * 0.95, 'bowed', 'held', k.chip, 0.22));
      if (len < 4) b.token(g, '', 'rest', 0, 4 - len);
      svg += wedge(len);
      at += 4 * beat + 0.25 * slow;
    });
    return { board: b, notes: notes, end: at, svg: svg };
  }

  function polygon(n, sides, w) {
    // A regular polygon (or a rectangle from its side lengths), corner dots on top.
    let pts = [];
    if (sides) {
      const s = 72 / Math.max(sides[0], sides[1]);
      const W = sides[0] * s, H = sides[1] * s;
      pts = [[10, 10], [10 + W, 10], [10 + W, 10 + H], [10, 10 + H]];
    } else {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + i * 2 * Math.PI / n;
        pts.push([45 + 34 * Math.cos(a), 45 + 34 * Math.sin(a)]);
      }
    }
    const vb = sides ? '0 0 ' + (Math.round(Math.max(...pts.map(function (p) { return p[0]; }))) + 30) + ' ' + (Math.round(Math.max(...pts.map(function (p) { return p[1]; }))) + 22) : '0 0 90 90';
    let lab = '';
    if (sides) {
      for (let i = 0; i < 4; i++) {
        const p = pts[i], q = pts[(i + 1) % 4];
        lab += '<text x="' + r3((p[0] + q[0]) / 2 + (i === 1 ? 12 : i === 3 ? -6 : 0)) + '" y="' + r3((p[1] + q[1]) / 2 + (i === 0 ? -2 : i === 2 ? 14 : 4)) + '" font-size="11" font-weight="700" text-anchor="middle">' + sides[i] + '</text>';
      }
    }
    return '<svg viewBox="' + vb + '" width="' + (w || 90) + '" height="90" aria-hidden="true" focusable="false" class="mm-sc-svg">'
      + '<polygon points="' + pts.map(function (p) { return r3(p[0]) + ',' + r3(p[1]); }).join(' ') + '" fill="#FFE79A" stroke="currentColor" stroke-width="3"/>'
      + pts.map(function (p) { return '<circle cx="' + r3(p[0]) + '" cy="' + r3(p[1]) + '" r="5" fill="#1B1446"/>'; }).join('') + lab + '</svg>';
  }

  function shape(spec, stage, slow) {
    const b = Board();
    const notes = [];
    const row = b.row('', 'is-pattern');
    let at = 0;
    let svg = '';
    spec.shapes.forEach(function (s, i) {
      const g = b.group(row, (spec.labels || [])[i] || '', 'is-loop');
      if (s.sides) {
        svg += polygon(4, s.sides, 120);
        s.sides.forEach(function (len, side) {
          for (let j = 0; j < len; j++) {
            const k = b.token(g, '', j === 0 ? 'accent' : 'side' + (side % 2), side * 2);
            notes.push(note(side * 2, at, 0.2 * slow, side % 2 ? 'woodBar' : 'keys', j === 0 ? 'corner' : 'side', k.chip, j === 0 ? 0.26 : 0.17));
            if (j === 0) notes.push(note(0, at, 0.12, 'frameDrum', 'drum', null, 0.2, 110));
            at += 0.26 * slow;
          }
        });
      } else {
        if (!spec.noDraw) svg += polygon(s.n);
        for (let j = 0; j < s.n; j++) {
          const k = b.token(g, '', 'accent', j);
          notes.push(note(j + i * 2, at, 0.22 * slow, i % 2 ? 'woodBar' : 'keys', 'corner', k.chip, 0.24));
          notes.push(note(0, at, 0.12, 'frameDrum', 'drum', null, 0.2, 110));
          at += 0.34 * slow;
        }
      }
      at += 0.45 * slow;
    });
    return { board: b, notes: notes, end: at, svg: svg };
  }

  function tempo(spec, stage, slow) {
    const b = Board();
    const notes = [];
    const span = 2.4 * slow;
    let at = 0;
    spec.rows.forEach(function (r, i) {
      const row = b.row(r.label, 'is-tempo');
      const g = b.group(row, '');
      for (let j = 0; j < r.n; j++) {
        const k = b.token(g, '', 'accent', 0);
        notes.push(note(0, at + j * span / r.n, 0.15, i ? 'drumHigh' : 'drumLow', 'hit', k.chip, 0.24, i ? 330 : 110));
      }
      at += span + 0.4 * slow;
    });
    return { board: b, notes: notes, end: at };
  }

  const KINDS = { beats: beats, steps: steps, place: place, pattern: pattern, pitch: pitch, durations: durations, turn: turn, shape: shape, tempo: tempo };

  // stage: 'question' | 'hint' (slower, never resolves) | 'right' | 'reveal'
  function plan(spec, stage) {
    const fn = spec && KINDS[spec.kind];
    if (!fn) return { rows: [], notes: [], svg: '' };
    const slow = stage === 'hint' ? 1.4 : 1;
    const out = fn(spec, stage || 'question', slow);
    const notes = out.notes.slice();
    if (solvedStage(stage)) home(out.end + 0.1).forEach(function (n) { notes.push(n); });
    return { rows: out.board.rows, notes: notes, svg: out.svg || '' };
  }

  // The same picture in words, for screen readers (never the result).
  function describe(spec, stage) {
    const p = plan(spec, stage);
    return p.rows.map(function (r) {
      return (r.label ? r.label + ': ' : '') + r.groups.map(function (g) {
        const ts = g.tokens.filter(function (k) { return k.role !== 'rest' || k.t; });
        const words = ts.length && ts.every(function (k) { return !k.t; }) ? ts.length + ' צלילים' : ts.map(function (k) { return k.t || '♪'; }).join(' ');
        return (g.label ? g.label + ' — ' : '') + words;
      }).join('; ');
    }).join('. ');
  }

  return { KINDS: Object.keys(KINDS), PLACE: PLACE, plan: plan, describe: describe, deg: deg };
});
