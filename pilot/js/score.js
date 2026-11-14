// MM-610 pilot — the music of every exercise of the new units, planned from a
// small declarative spec in pilot/js/units.js. The spec says WHICH musical
// structure carries the math reasoning; this file turns it into
//   notes  — what is heard (played by pilot/js/music.js with the app's own
//            src/lib/musicEngine.js and src/lib/instrumentVoices.js), and
//   view   — what is seen (the same structure drawn as tokens, groups and an
//            optional SVG), so every exercise works with the sound off.
//
// Kinds (each one is a musical structure that IS the math structure):
//   beats     bars of equal beats, the first beat of each bar accented and a
//             softer secondary accent inside it (4/4 → beat 3, a 10-beat cycle →
//             beat 6 = 5 + 5, 5/4 → beat 4 = 3 + 2), as in real metre:
//             counting, grouping by 10, multiplication, division, remainder,
//             area, volume, money, minutes. A bar can be one long "block" note
//             (a ten, a hundred) when it is too long to play beat by beat.
//             `barEnd` rings a bell WITH the last beat of each bar (one more bar
//             = one more group, not one more sound); `missing` draws the
//             remainder inside a dashed bar that did not fill.
//   steps     one scale step per number: counting on/back, skip counting,
//             number-line jumps, the 12-step clock cycle, counting up change.
//   place     one instrument per place value (gong 1000, organ 100, bass 10,
//             xylophone 1); ten of one instrument = one of the next.
//   pattern   a repeating melodic unit: patterns, pairs (even/odd), tallies;
//             `pan` moves a step left/right in stereo and `path` draws it on a
//             3×3 grid (right/left = where it sounds, up/down = how high).
//   pitch     data: each category plays its count as repeated notes at its
//             own pitch (a pictogram you hear).
//   durations note lengths inside a bar (4 beats, or 10/12/20 ticks): half a
//             bar = half an hour, two half-shekels fill a bar, a coin lasts
//             its value in ticks, a pencil lasts its length on a ticking ruler;
//             `shape` draws the (rotated) triangle whose sides the notes measure.
//   turn      a full turn is one 4/4 bar; a held note of 1 beat is a quarter
//             turn (a right angle), 2 beats a straight angle, 1.5 an obtuse
//             one; `arms` draws long or short arms and `starts` rotates the
//             drawing — the turn does not change.
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
  function note(d, at, dur, voice, role, chip, gain, hz, pan) {
    const p = hz ? { hz: hz, name: '' } : deg(d);
    const o = { note: p.name, hz: p.hz, at: r3(at), dur: r3(dur), voice: voice, role: role, chip: chip == null ? null : chip, gain: gain == null ? 0.2 : gain };
    if (pan) o.pan = Math.max(-1, Math.min(1, pan));
    return o;
  }
  // The secondary accent of a bar (0-based beat), as the metre has it: 4/4 on
  // beat 3, a 10-beat cycle on beat 6 (5 + 5), 5/4 on beat 4 (3 + 2), 8 on 5,
  // 12 on 7. `sub: false` turns it off; `sub: n` sets it.
  function subAccent(spec, size) {
    if (spec.sub === false) return -1;
    if (typeof spec.sub === 'number') return spec.sub;
    return { 4: 2, 5: 3, 8: 4, 10: 5, 12: 6 }[size] == null ? -1 : { 4: 2, 5: 3, 8: 4, 10: 5, 12: 6 }[size];
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
      const sub = subAccent(spec, size);
      for (let j = 0; j < size; j++) {
        const d = TUNE[t++ % TUNE.length];
        const role = j === 0 ? 'accent' : j === sub ? 'accent2' : 'beat';
        const k = b.token(g, '', silent.indexOf(i) >= 0 ? 'rest' : role, d);
        if (silent.indexOf(i) < 0) {
          notes.push(note(d, at, beat * 0.85, voice, role, k.chip, j === 0 ? 0.26 : j === sub ? 0.21 : 0.17));
          if (j === 0) notes.push(note(0, at, 0.12, 'frameDrum', 'drum', null, 0.2, 110));
          // the secondary accent: a lighter drum, so 5 + 5 (or 2 + 2) is heard inside the bar
          if (j === sub) notes.push(note(0, at, 0.1, 'frameDrum', 'drum', null, 0.11, 110));
          // the bell sounds WITH the last beat of a bar: it marks the end of a group and adds nothing
          if (spec.barEnd && j === size - 1) notes.push(note(7, at, beat * 0.9, spec.barEnd, 'bell', null, 0.18));
        }
        at += beat;
      }
      at += beat * 0.6; // a breath between bars: the grouping is heard
    });
    if (spec.extra) {
      const g = b.group(row, spec.extraLabel || 'מחוץ לתיבה', 'is-extra' + (spec.missing ? ' is-missing' : ''));
      for (let j = 0; j < spec.extra; j++) {
        const d = TUNE[t++ % TUNE.length];
        const k = b.token(g, '', 'extra', d);
        notes.push(note(d, at, beat * 0.85, spec.extraVoice || 'pluck', 'extra', k.chip, 0.17));
        at += beat;
      }
      // the remainder sits inside a bar that did not fill: its empty beats are drawn, not heard
      if (spec.missing) for (let j = spec.extra; j < (bars[bars.length - 1] || 4); j++) b.token(g, '', 'rest', 0);
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
      if (key !== '?') notes.push(note(d, at, 0.26 * slow, spec.voice || 'woodBar', asked ? 'asked' : 'pat', k.chip, 0.2, null, spec.pan ? spec.pan[key] : 0));
      at += 0.36 * slow;
    });
    return { board: b, notes: notes, end: at, svg: spec.path ? grid(spec.path, solved) : '' };
  }

  // A grid of cells (columns left→right, rows bottom→top) with the walked path: the
  // start cell is ⌂; the path and the end cell are drawn once the exercise is solved.
  function grid(path, solved) {
    // the grid is as wide and as high as the path needs (at least 3 × 2)
    const cols = Math.max(3, Math.max.apply(null, path.map(function (p) { return p[0]; })));
    const rows = Math.max(2, Math.max.apply(null, path.map(function (p) { return p[1]; })));
    const cell = 24, pad = 6;
    const W = pad * 2 + cols * cell, H = pad * 2 + rows * cell;
    const xy = function (p) { return [pad + (p[0] - 1) * cell + cell / 2, pad + (rows - p[1]) * cell + cell / 2]; };
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true" focusable="false" class="mm-sc-svg">';
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) s += '<rect x="' + (pad + c * cell) + '" y="' + (pad + r * cell) + '" width="' + cell + '" height="' + cell + '" fill="#FFF8E1" stroke="currentColor" stroke-width="2"/>';
    for (let i = 1; solved && i < path.length; i++) {
      const a = xy(path[i - 1]), z = xy(path[i]);
      s += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + z[0] + '" y2="' + z[1] + '" stroke="#1B1446" stroke-width="3" stroke-linecap="round"/>';
      s += '<circle cx="' + z[0] + '" cy="' + z[1] + '" r="4" fill="#1B1446"/>';
    }
    const st = xy(path[0]), en = xy(path[path.length - 1]);
    s += '<text x="' + st[0] + '" y="' + (st[1] + 5) + '" font-size="14" font-weight="700" text-anchor="middle" fill="#1B1446">⌂</text>';
    // before the answer the picture shows only where the sound starts: the child
    // follows the steps by ear (and in the words), the end cell is the answer
    if (solved) {
      s += '<circle cx="' + en[0] + '" cy="' + en[1] + '" r="9" fill="#FFE79A" stroke="#1B1446" stroke-width="2"/>';
      s += '<text x="' + en[0] + '" y="' + (en[1] + 4) + '" font-size="11" font-weight="900" text-anchor="middle" fill="#1B1446">●</text>';
    }
    return s + '</svg>';
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
    const beat = (spec.beat || 0.5) * slow;
    const per = spec.beats || 4;
    const row = b.row('', 'is-bars');
    let at = 0;
    (spec.bars || []).forEach(function (bar, i) {
      const g = b.group(row, (spec.labels || [])[i] || '', 'is-bar per-' + per);
      // the click track: the first click of a bar is stronger, and in a long bar
      // (10, 12, 20 ticks: a ruler, a coin, a note) every fifth one too
      for (let c = 0; c < per; c++) {
        const strong = c === 0 || (per > 4 && c % 5 === 0);
        notes.push(note(7, at + c * beat, 0.05, 'woodClick', 'click', null, strong ? 0.16 : 0.1, strong ? 1500 : 1200));
      }
      let used = 0;
      bar.forEach(function (n, j) {
        const k = b.token(g, n.label == null ? '' : n.label, n.rest ? 'rest' : (n.alt ? 'heldb' : 'held'), j * 2, n.len);
        if (!n.rest) notes.push(note(j * 2, at + used * beat, n.len * beat * 0.92, n.voice || spec.voice || 'keys', 'held', k.chip, 0.22, n.hz));
        used += n.len;
      });
      if (used < per) b.token(g, 'שקט', 'rest', 0, per - used);
      at += per * beat + 0.2 * slow;
    });
    return { board: b, notes: notes, end: at, svg: spec.shape ? triangle(spec.shape.sides, spec.shape.rotate || 0) : '' };
  }

  // A triangle from its three side lengths (a = base, then b, then c back to the
  // start), rotated by `rot` degrees: the lengths are what the notes measure.
  function triangle(sides, rot) {
    const a = sides[0], bb = sides[1], c = sides[2];
    const x = (a * a + c * c - bb * bb) / (2 * a);
    const y = Math.sqrt(Math.max(0, c * c - x * x));
    const raw = [[0, 0], [a, 0], [x, y]];
    const cx = (0 + a + x) / 3, cy = y / 3;
    const s = 56 / Math.max(a, y, 1);
    const th = rot * Math.PI / 180;
    const pts = raw.map(function (p) {
      const dx = (p[0] - cx) * s, dy = (p[1] - cy) * s;
      return [45 + dx * Math.cos(th) - dy * Math.sin(th), 45 - (dx * Math.sin(th) + dy * Math.cos(th))];
    });
    let lab = '';
    for (let i = 0; i < 3; i++) {
      const p = pts[i], q = pts[(i + 1) % 3];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      const ox = mx - 45, oy = my - 45, n = Math.max(1, Math.hypot(ox, oy));
      lab += '<text x="' + r3(mx + ox / n * 9) + '" y="' + r3(my + oy / n * 9 + 4) + '" font-size="11" font-weight="700" text-anchor="middle">' + sides[i] + '</text>';
    }
    return '<svg viewBox="0 0 90 90" width="90" height="90" aria-hidden="true" focusable="false" class="mm-sc-svg">'
      + '<polygon points="' + pts.map(function (p) { return r3(p[0]) + ',' + r3(p[1]); }).join(' ') + '" fill="#FFE79A" stroke="currentColor" stroke-width="3"/>'
      + pts.map(function (p) { return '<circle cx="' + r3(p[0]) + '" cy="' + r3(p[1]) + '" r="4" fill="#1B1446"/>'; }).join('') + lab + '</svg>';
  }

  function wedge(beatsOfFour, arm, start) {
    // The angle drawn as two rays from a corner: 1 beat of 4 = 90°. The arm
    // length (c08) changes the picture only — the turn, and the sound, stay.
    const R = arm || 40;
    const a = beatsOfFour * 90 * Math.PI / 180;
    const x = 50 + R * Math.cos(a);
    const y = 50 - R * Math.sin(a);
    const arcR = 14;
    const ax = 10 + arcR * Math.cos(a);
    const ay = 50 - arcR * Math.sin(a);
    const large = beatsOfFour > 2 ? 1 : 0;
    return '<svg viewBox="0 0 100 60" width="100" height="60" aria-hidden="true" focusable="false" class="mm-sc-svg">'
      + '<g transform="translate(-40 0)' + (start ? ' rotate(' + (-start) + ' 50 50)' : '') + '"><line x1="50" y1="50" x2="' + (50 + R) + '" y2="50" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>'
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
      svg += wedge(len, (spec.arms || [])[i], (spec.starts || [])[i]);
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

  // ---- MM-610 part 2: four more musical structures, so the music fits the
  // topic and the child meets more instruments (body percussion, voice).
  //
  //   contrast  a few sounds that differ in ONE attribute — pitch (high/low),
  //             tempo (fast/slow), loudness (loud/soft) or length (long/short):
  //             comparing numbers (higher = bigger), measurable attributes,
  //             rounding (how far from the round number), estimation.
  //   canon     the same phrases in another order or added and taken away:
  //             a + b = b + a, (a + b) − b = a, × 1 and × 0, order of
  //             operations with brackets, a line and its mirror (symmetry).
  //   body      body percussion counting: a clap on every number, a stomp on
  //             the marked ones — skip counting by 2/5/10/25/50, even and odd,
  //             divisibility by 2, 5 and 10, sequences of products.
  //   solid     a solid as three sounds: taps for its vertices, plucks for its
  //             edges, held organ notes for its faces (and a box net as faces
  //             folded one by one).
  function contrast(spec, stage, slow) {
    const b = Board();
    const notes = [];
    const row = b.row(spec.label || '', 'is-contrast');
    let at = 0;
    (spec.items || []).forEach(function (it, i) {
      const g = b.group(row, it.label || '', 'is-item');
      const n = it.n || 1;
      const len = it.len || 1;
      const rate = it.rate || 2.2; // notes per second: tempo is the attribute
      const role = it.role || 'cmp' + (i % 4);
      for (let j = 0; j < n; j++) {
        const k = b.token(g, it.sym || '', role, it.deg || 0, len);
        notes.push(note(it.deg || 0, at, Math.max(0.12, 0.45 * len) * slow, it.voice || 'keys', role, k.chip, it.gain == null ? 0.2 : it.gain, it.hz));
        at += (1 / rate) * slow;
      }
      at += 0.55 * slow;
    });
    return { board: b, notes: notes, end: at };
  }

  function canon(spec, stage, slow) {
    const b = Board();
    const notes = [];
    const beat = 0.3 * slow;
    let at = 0;
    (spec.rows || [['a', 'b'], ['b', 'a']]).forEach(function (seq, ri) {
      const row = b.row((spec.labels || [])[ri] || '', 'is-canon');
      seq.forEach(function (key) {
        const removed = key.charAt(0) === '-';
        const kk = removed ? key.slice(1) : key;
        const cnt = spec[kk] || 0;
        const g = b.group(row, (spec.names || {})[kk] || '', removed ? 'is-removed' : '');
        if (!cnt) { b.token(g, 'שקט', 'silence', 0); at += 0.3 * slow; return; }
        for (let j = 0; j < cnt; j++) {
          const d = kk === 'a' ? TUNE[j % TUNE.length] : (kk === 'b' ? 4 + (j % 3) : (j % 2 ? 2 : 0));
          const k = b.token(g, '', removed ? 'removed' : 'pat-' + kk, d);
          notes.push(note(d, at, beat * 0.85, removed ? 'pluck' : (spec.voices || {})[kk] || (kk === 'a' ? 'keys' : kk === 'b' ? 'woodBar' : 'voiceAh'), removed ? 'removed' : 'phrase', k.chip, removed ? 0.09 : 0.2));
          at += beat;
        }
        at += beat * 0.5;
      });
      at += beat * 1.2;
    });
    return { board: b, notes: notes, end: at };
  }

  function body(spec, stage, slow) {
    const b = Board();
    const notes = [];
    const solved = solvedStage(stage);
    const row = b.row(spec.label || '', 'is-body');
    const g = b.group(row, '');
    const from = spec.from == null ? 1 : spec.from;
    const step = spec.step || 1;
    const marks = spec.marks || [];
    let at = 0;
    for (let i = 0; i < spec.count; i++) {
      const v = from + i * step;
      const strong = spec.every ? v % spec.every === 0 : marks.indexOf(v) >= 0;
      const last = i === spec.count - 1;
      const asked = !!spec.ask && last;
      const label = asked && !solved ? '?' : (spec.numbers === false ? '' : String(v));
      const k = b.token(g, label, asked ? 'asked' : (strong ? 'stomp' : 'clap'), strong ? 0 : 4);
      notes.push(note(0, at, 0.12, strong ? 'stomp' : 'clap', strong ? 'stomp' : 'clap', k.chip, strong ? 0.26 : 0.15, strong ? 70 : 1600));
      at += (strong ? 0.36 : 0.3) * slow;
    }
    return { board: b, notes: notes, end: at };
  }

  const SOLID_PART = {
    vertex: { voice: 'woodClick', hz: 1800, role: 'vertex', he: 'קודקודים', dur: 0.08, gap: 0.22 },
    edge: { voice: 'pluck', hz: 196, role: 'edge', he: 'מקצועות', dur: 0.2, gap: 0.24 },
    face: { voice: 'organ', hz: 262, role: 'face', he: 'פאות', dur: 0.45, gap: 0.5 }
  };
  function solid(spec, stage, slow) {
    const b = Board();
    const notes = [];
    const row = b.row(spec.label || '', 'is-solid');
    let at = 0;
    (spec.parts || []).forEach(function (p) {
      const P = SOLID_PART[p.kind] || SOLID_PART.face;
      const g = b.group(row, p.label || P.he, 'is-place');
      for (let j = 0; j < p.n; j++) {
        const k = b.token(g, p.sym || '', P.role, p.kind === 'face' ? -7 : p.kind === 'edge' ? 0 : 7);
        notes.push(note(0, at, P.dur * slow, P.voice, P.role, k.chip, 0.2, P.hz * (p.kind === 'face' ? Math.pow(2, (j % 4) / 12) : 1)));
        at += P.gap * slow;
      }
      at += 0.4 * slow;
    });
    // faces as motifs (b09): a face is a short rhythm; congruent faces (a pair
    // of opposite faces, the four triangles of a pyramid) play exactly the same
    // motif, so "the side you cannot see" is heard. Same pitch and voice: only
    // the rhythm tells one class of faces from another.
    (spec.faces || []).forEach(function (f) {
      const labels = f.labels || [];
      for (let i = 0; i < (f.n || labels.length || 1); i++) {
        const g = b.group(row, labels[i] || f.label || SOLID_PART.face.he, 'is-place is-face');
        f.motif.forEach(function (len, j) {
          const k = b.token(g, '', 'face', -7, len);
          notes.push(note(0, at, 0.3 * len * slow * 0.9, 'organ', 'face', k.chip, 0.2, 262));
          at += 0.3 * len * slow;
        });
        at += 0.35 * slow;
      }
    });
    return { board: b, notes: notes, end: at, svg: spec.draw ? solidSvg(spec.draw) : '' };
  }

  // A box (three visible faces named) or a square pyramid: the faces the motifs
  // belong to. The hidden faces are dashed.
  function solidSvg(kind) {
    const head = '<svg viewBox="0 0 120 90" width="120" height="90" aria-hidden="true" focusable="false" class="mm-sc-svg">';
    const t = function (x, y, w) { return '<text x="' + x + '" y="' + y + '" font-size="10" font-weight="700" text-anchor="middle" fill="#1B1446">' + w + '</text>'; };
    if (kind === 'pyramid') {
      return head + '<polygon points="14,66 74,66 104,50 44,50" fill="#FFF8E1" stroke="#1B1446" stroke-width="2" stroke-dasharray="4 3"/>'
        + '<polygon points="14,66 74,66 60,8" fill="#FFE79A" stroke="#1B1446" stroke-width="3" stroke-linejoin="round"/>'
        + '<polygon points="74,66 104,50 60,8" fill="#B9A6FF" stroke="#1B1446" stroke-width="3" stroke-linejoin="round"/>'
        + '<line x1="44" y1="50" x2="60" y2="8" stroke="#1B1446" stroke-width="2" stroke-dasharray="4 3"/>'
        + t(46, 84, 'בסיס ריבוע') + '</svg>';
    }
    return head + '<polygon points="12,30 72,30 72,80 12,80" fill="#FFE79A" stroke="#1B1446" stroke-width="3" stroke-linejoin="round"/>'
      + '<polygon points="12,30 38,10 98,10 72,30" fill="#FFF8E1" stroke="#1B1446" stroke-width="3" stroke-linejoin="round"/>'
      + '<polygon points="72,30 98,10 98,60 72,80" fill="#B9A6FF" stroke="#1B1446" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M12 80 L38 60 L98 60 M38 60 L38 10" fill="none" stroke="#1B1446" stroke-width="1.5" stroke-dasharray="4 3"/>'
      + t(42, 59, 'קדימה') + t(56, 24, 'למעלה') + t(86, 48, 'ימין') + '</svg>';
  }

  const KINDS = { beats: beats, steps: steps, place: place, pattern: pattern, pitch: pitch, durations: durations, turn: turn, shape: shape, tempo: tempo, contrast: contrast, canon: canon, body: body, solid: solid };

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

  // The same picture in words, for screen readers. It never counts the notes of a
  // group (in a division or a remainder exercise that count IS the answer): the
  // listener counts them in the sound, as a sighted child counts them in the picture.
  function describe(spec, stage) {
    const p = plan(spec, stage);
    return p.rows.map(function (r) {
      return (r.label ? r.label + ': ' : '') + r.groups.map(function (g) {
        const ts = g.tokens.filter(function (k) { return k.role !== 'rest' || k.t; });
        const words = ts.length && ts.every(function (k) { return !k.t; }) ? 'צלילים' : ts.map(function (k) { return k.t || '♪'; }).join(' ');
        return (g.label ? g.label + ' — ' : '') + words;
      }).join('; ');
    }).join('. ');
  }

  // ---------------------------------------------------------------- MM-AUTO-752 scientific evaluation & group comparison
  function isControlRow(r) {
    if (!r) return false;
    return !!(r.controlMode === true || r.group === 'control' || (r.post && r.post.group === 'control') || (r.pre && r.pre.group === 'control'));
  }

  function pctScore(check) {
    if (!check || typeof check !== 'object') return null;
    const s = Number(check.score);
    const t = Number(check.total);
    if (!Number.isFinite(s) || !Number.isFinite(t) || t <= 0) return null;
    return (s / t) * 100;
  }

  function computeGroupStats(rows, groupName) {
    const validRows = (Array.isArray(rows) ? rows : []).filter(function (r) {
      return r && (
        (r.pre && pctScore(r.pre) !== null) ||
        (r.post && pctScore(r.post) !== null) ||
        (r.later && pctScore(r.later) !== null)
      );
    });

    const preScores = validRows.filter(function (r) { return r.pre && pctScore(r.pre) !== null; }).map(function (r) { return pctScore(r.pre); });
    const postScores = validRows.filter(function (r) { return r.post && pctScore(r.post) !== null; }).map(function (r) { return pctScore(r.post); });
    const postPairs = validRows.filter(function (r) { return r.pre && pctScore(r.pre) !== null && r.post && pctScore(r.post) !== null; });
    const gains = postPairs.map(function (r) { return pctScore(r.post) - pctScore(r.pre); });

    const laterPairs = postPairs.filter(function (r) { return r.later && pctScore(r.later) !== null; });
    const laterScores = laterPairs.map(function (r) { return pctScore(r.later); });

    const mean = function (arr) {
      if (!arr || !arr.length) return null;
      const sum = arr.reduce(function (a, b) { return a + b; }, 0);
      return Math.round((sum / arr.length) * 10) / 10;
    };

    const preMean = mean(preScores);
    const postMean = mean(postScores);
    const laterMean = mean(laterScores);
    const gainMean = mean(gains);

    const children = validRows.map(function (r) { return r.student; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).length;

    let retentionRate = null;
    if (postMean && postMean > 0 && laterMean !== null) {
      retentionRate = Math.round((laterMean / postMean) * 100) / 100;
    }

    return {
      name: groupName || '',
      totalCount: validRows.length,
      n: postPairs.length,
      children: children,
      laterN: laterPairs.length,
      preMean: preMean,
      postMean: postMean,
      laterMean: laterMean,
      gainMean: gainMean,
      retentionRate: retentionRate,
      preScores: preScores,
      postScores: postScores,
      laterScores: laterScores,
      gains: gains
    };
  }

  function calculatePooledStd(groupA, groupB) {
    if (!Array.isArray(groupA) || !Array.isArray(groupB)) return null;
    const cleanA = groupA.filter(function (x) { return typeof x === 'number' && Number.isFinite(x); });
    const cleanB = groupB.filter(function (x) { return typeof x === 'number' && Number.isFinite(x); });
    if (cleanA.length < 2 || cleanB.length < 2) return null;
    const nA = cleanA.length;
    const nB = cleanB.length;
    const meanA = cleanA.reduce(function (s, x) { return s + x; }, 0) / nA;
    const meanB = cleanB.reduce(function (s, x) { return s + x; }, 0) / nB;
    const ssA = cleanA.reduce(function (s, x) { return s + Math.pow(x - meanA, 2); }, 0);
    const ssB = cleanB.reduce(function (s, x) { return s + Math.pow(x - meanB, 2); }, 0);
    const df = nA + nB - 2;
    if (df <= 0) return null;
    const pooledVar = (ssA + ssB) / df;
    if (pooledVar <= 0) return 0;
    return Math.sqrt(pooledVar);
  }

  function calculateCohenD(meanA, meanB, pooledStd) {
    if (Array.isArray(meanA) && Array.isArray(meanB)) {
      const pStd = (typeof pooledStd === 'number' && pooledStd > 0) ? pooledStd : calculatePooledStd(meanA, meanB);
      if (!pStd || pStd <= 0) return null;
      const mA = meanA.reduce(function (s, x) { return s + x; }, 0) / meanA.length;
      const mB = meanB.reduce(function (s, x) { return s + x; }, 0) / meanB.length;
      return Math.round(((mA - mB) / pStd) * 100) / 100;
    }
    if (typeof meanA !== 'number' || typeof meanB !== 'number' || typeof pooledStd !== 'number' || pooledStd <= 0 || !Number.isFinite(meanA) || !Number.isFinite(meanB) || !Number.isFinite(pooledStd)) {
      return null;
    }
    const d = (meanA - meanB) / pooledStd;
    return Math.round(d * 100) / 100;
  }

  function classifyEffectSize(d) {
    if (typeof d !== 'number' || !Number.isFinite(d)) return null;
    const absD = Math.abs(d);
    if (absD < 0.2) return 'זניח';
    if (absD < 0.5) return 'קטן';
    if (absD < 0.8) return 'בינוני';
    return 'גדול';
  }

  function computeNetImprovement(musicGain, controlGain) {
    if (typeof musicGain !== 'number' || typeof controlGain !== 'number' || !Number.isFinite(musicGain) || !Number.isFinite(controlGain)) {
      return null;
    }
    return Math.round((musicGain - controlGain) * 10) / 10;
  }

  function compareGroups(musicRowsOrAll, controlRows) {
    let musicRows = [];
    let ctrlRows = [];

    if (Array.isArray(musicRowsOrAll) && Array.isArray(controlRows)) {
      musicRows = musicRowsOrAll;
      ctrlRows = controlRows;
    } else if (Array.isArray(musicRowsOrAll)) {
      musicRowsOrAll.forEach(function (r) {
        if (isControlRow(r)) ctrlRows.push(r);
        else musicRows.push(r);
      });
    }

    const musicStats = computeGroupStats(musicRows, 'מוזיקה');
    const controlStats = computeGroupStats(ctrlRows, 'ביקורת');

    let netGain = null;
    if (musicStats.gainMean !== null && controlStats.gainMean !== null) {
      netGain = computeNetImprovement(musicStats.gainMean, controlStats.gainMean);
    }

    let cohenD = null;
    if (musicStats.gains.length >= 2 && controlStats.gains.length >= 2) {
      const pStd = calculatePooledStd(musicStats.gains, controlStats.gains);
      if (pStd && pStd > 0) {
        cohenD = calculateCohenD(musicStats.gainMean, controlStats.gainMean, pStd);
      }
    } else if (musicStats.postScores.length >= 2 && controlStats.postScores.length >= 2) {
      const pStd = calculatePooledStd(musicStats.postScores, controlStats.postScores);
      if (pStd && pStd > 0) {
        cohenD = calculateCohenD(musicStats.postMean, controlStats.postMean, pStd);
      }
    }

    const effectClassification = classifyEffectSize(cohenD);

    const chartSpec = {
      title: 'השוואת ממוצעי הישגים: קבוצת מוזיקה מול קבוצת ביקורת',
      categories: ['לפני', 'אחרי', 'מעקב שבוע'],
      series: [
        {
          key: 'music',
          name: 'קבוצת מוזיקה',
          color: '#1B1446',
          values: [
            musicStats.preMean != null ? musicStats.preMean : 0,
            musicStats.postMean != null ? musicStats.postMean : 0,
            musicStats.laterMean != null ? musicStats.laterMean : 0
          ]
        },
        {
          key: 'control',
          name: 'קבוצת ביקורת',
          color: '#6B6396',
          values: [
            controlStats.preMean != null ? controlStats.preMean : 0,
            controlStats.postMean != null ? controlStats.postMean : 0,
            controlStats.laterMean != null ? controlStats.laterMean : 0
          ]
        }
      ],
      max: 100
    };

    return {
      music: musicStats,
      control: controlStats,
      netGain: netGain,
      cohenD: cohenD,
      effectClassification: effectClassification,
      hasBothGroups: musicStats.n > 0 && controlStats.n > 0,
      chartSpec: chartSpec
    };
  }

  return {
    KINDS: Object.keys(KINDS),
    PLACE: PLACE,
    plan: plan,
    describe: describe,
    deg: deg,
    compareGroups: compareGroups,
    computeGroupStats: computeGroupStats,
    calculateCohenD: calculateCohenD,
    calculatePooledStd: calculatePooledStd,
    classifyEffectSize: classifyEffectSize,
    computeNetImprovement: computeNetImprovement,
    isControlRow: isControlRow
  };
});
