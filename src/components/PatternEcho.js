// MelodyMath — PatternEcho screen (#591, owner proposal 4/5, grades א׳-ה׳).
//
// The app plays a pattern (ABB ABB, steps 2 4 6, a mirror A B C B A) on
// marimba and the child echoes the missing next note on a touch keyboard.
// One primary method: M6, melodic and rhythmic patterns, from a repeating
// pattern (א׳) to a sequence rule (ה׳). Rounds of 6 mix at least 2 pattern
// types (interleave.js). A right echo plays the whole phrase; a wrong one
// replays the right phrase slowly and marks the note where the rule broke.
// Marimba, gamelan and piano are timbre only, each with its source or TODO.
// Free mode: the child makes up a motif and the app continues it.
// With the music switch off the same pattern is shapes and numbers.
// State functions and renderHtml are pure and tested in Node.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_PATTERN_ECHO = api;
  if (typeof document !== 'undefined' && document.getElementById('peCard')) api.mount(document.getElementById('peCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const P = root.MM_PATTERNS || require('../lib/music/patterns.js');
  const IL = root.MM_INTERLEAVE || require('../lib/music/interleave.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const GAME = 'patternEcho';
  const TIMBRES = ['marimba', 'gamelan', 'piano'];
  const SHAPES = { A: '●', B: '▲', C: '■', D: '◆', E: '★' };
  const MAJ = [0, 2, 4, 5, 7, 9, 11];
  const ITEMS = [
    { type: 'repeat', rule: 'AB', length: 6 }, { type: 'repeat', rule: 'ABB', length: 6 },
    { type: 'repeat', rule: 'AAB', length: 6 }, { type: 'repeat', rule: 'ABC', length: 6 },
    { type: 'grow', rule: '+1', length: 5 }, { type: 'grow', rule: '+2', length: 5 },
    { type: 'grow', rule: '+3', length: 5 }, { type: 'grow', rule: '×2', length: 5 },
    { type: 'mirror', rule: 'ABC', length: 5 }, { type: 'mirror', rule: 'AB', length: 5 },
    { type: 'mirror', rule: 'ABC', length: 6 }, { type: 'mirror', rule: 'ABCD', length: 7 },
  ];
  const ROUNDS = IL.interleave(ITEMS).rounds;

  // Value 1 = C4, up the C major scale.
  function hzOf(v) {
    const i = Math.max(0, Math.min(20, v - 1));
    return Math.round(261.63 * Math.pow(2, (12 * Math.floor(i / 7) + MAJ[i % 7]) / 12) * 100) / 100;
  }

  function createState(round, pos, showMusic, timbre) {
    const r = ((round || 0) % ROUNDS.length + ROUNDS.length) % ROUNDS.length;
    const p = pos || 0;
    return { round: r, pos: p, item: ROUNDS[r][p], pattern: P.generatePattern(ROUNDS[r][p]), status: 'asking', broke: -1, message: '', showMusic: showMusic !== false, timbre: timbre || 'marimba', motif: [], free: null };
  }

  // The keys: letters of the motif plus one more, or four numbers for a rule.
  function keys(state) {
    const vals = state.pattern.values;
    const ans = vals[vals.length - 1];
    if (state.item.type !== 'grow') {
      const n = Math.max.apply(null, vals) + 1;
      const out = [];
      for (let v = 1; v <= n; v++) out.push({ value: v, label: String.fromCharCode(64 + v) });
      return out;
    }
    const d = ans - vals[vals.length - 2];
    return [ans, ans + d, ans - d, vals[vals.length - 2] + 1].filter(function (x, i, a) { return x > 0 && a.indexOf(x) === i; })
      .sort(function (a, b) { return a - b; }).map(function (v) { return { value: v, label: String(v) }; });
  }

  function echo(state, value) {
    if (state.status === 'right') return state;
    const vals = state.pattern.values;
    const broke = P.findRuleBreak(state.pattern, vals.slice(0, -1).concat([Number(value)]));
    if (broke === -1) return Object.assign({}, state, { status: 'right', broke: -1, message: 'נכון! כך נשמעת התבנית המלאה.' });
    const want = state.item.type === 'grow' ? String(vals[broke]) : String.fromCharCode(64 + vals[broke]);
    return Object.assign({}, state, { status: 'wrong', broke: broke, message: 'האיבר ה־' + (broke + 1) + ' שובר את הכלל: צריך ' + want + '. הקשיבו לתבנית לאט ונסו שוב.' });
  }

  function next(state) {
    const last = state.pos + 1 >= ROUNDS[state.round].length;
    return createState(last ? state.round + 1 : state.round, last ? 0 : state.pos + 1, state.showMusic, state.timbre);
  }

  // Free mode: up to 4 taps make a motif, the app continues it to 8 notes.
  function addMotif(state, value) {
    if (state.motif.length >= 4) return state;
    return Object.assign({}, state, { motif: state.motif.concat([Number(value)]), free: null });
  }
  function continueMotif(state) {
    if (state.motif.length < 2) return Object.assign({}, state, { free: null });
    const rule = state.motif.map(function (v) { return String.fromCharCode(64 + v); }).join('');
    return Object.assign({}, state, { free: P.generatePattern({ type: 'repeat', rule: rule, length: 8 }) });
  }

  function phrase(values, voice, gap) {
    return values.map(function (v, i) { return { at: i * (gap || 0.35), voice: voice, hz: hzOf(v), idx: i }; });
  }

  function token(state, v, type) {
    if (type === 'grow') return String(v);
    const ch = String.fromCharCode(64 + v);
    return state.showMusic ? ch : SHAPES[ch] || ch;
  }

  function renderHtml(state) {
    const e = JAM.esc;
    const on = state.showMusic;
    const inst = JAM.instrument(state.timbre, 'woodBar');
    const vals = state.pattern.values;
    const shown = vals.map(function (v, i) {
      const last = i === vals.length - 1;
      const cls = 'pe-note pe-v' + (((v - 1) % 5) + 1) + (i === state.broke ? ' broke' : '');
      return '<span class="' + cls + '" data-idx="' + i + '">' + (last && state.status !== 'right' ? '?' : e(token(state, v, state.item.type))) + '</span>';
    }).join('');
    const keyRow = keys(state).map(function (k) {
      return '<button type="button" class="jam-pad pe-v' + (((k.value - 1) % 5) + 1) + '" data-act="echo" data-value="' + k.value + '"' + (on ? ' data-tap="' + e(inst.voice) + '" data-hz="' + hzOf(k.value) + '"' : '') + '>' + e(state.item.type === 'grow' ? k.label : token(state, k.value, 'repeat')) + '</button>';
    }).join('');
    const timbres = on ? '<div class="jam-free" role="group" aria-label="גוון">' + TIMBRES.map(function (id) {
      const x = JAM.instrument(id);
      return '<button type="button" class="jam-pad" data-act="timbre" data-inst="' + id + '" aria-pressed="' + (id === state.timbre) + '">' + e(x.he) + '</button>';
    }).join('') + '<small>מקור: ' + (inst.source === 'TODO' ? 'TODO (עדיין אין מקור)' : '<a href="' + e(inst.source) + '" target="_blank" rel="noopener">' + e(inst.he) + '</a>') + '</small></div>' : '';
    const free = '<details class="pe-free"><summary>מצב חופשי: המציאו תבנית</summary><div class="jam-row">' + [1, 2, 3, 4].map(function (v) {
      return '<button type="button" class="jam-pad pe-v' + v + '" data-act="motif" data-value="' + v + '"' + (on ? ' data-tap="' + e(inst.voice) + '" data-hz="' + hzOf(v) + '"' : '') + '>' + e(token(state, v, 'repeat')) + '</button>';
    }).join('') + '<button type="button" class="secondary" data-act="continue">המשיכו את התבנית</button></div>' +
      '<p>' + state.motif.map(function (v) { return e(token(state, v, 'repeat')); }).join(' ') + (state.free ? ' → ' + state.free.values.map(function (v) { return e(token(state, v, 'repeat')); }).join(' ') : '') + '</p></details>';
    return '<div class="jam-head"><span class="tag">M6 · תבניות · כיתות א׳–ה׳</span>' + JAM.musicToggleHtml(on) + '</div>' +
      '<h3>' + (on ? '🎶 הד לתבנית' : 'משלימים תבנית') + '</h3>' +
      '<p class="jam-prompt">מה האיבר הבא? <small>פריט ' + (state.pos + 1) + ' מתוך ' + ROUNDS[state.round].length + '</small></p>' +
      '<div class="pe-notes" dir="ltr" role="img" aria-label="תבנית של ' + vals.length + ' איברים, האחרון חסר">' + shown + '</div>' +
      (on ? '<div class="jam-row"><button type="button" class="secondary" data-act="play">▶ נגנו את התבנית</button></div>' : '') +
      '<div class="jam-row" role="group" aria-label="מקלדת">' + keyRow + '</div>' + timbres + free +
      '<div class="jam-row"><button type="button" class="secondary" data-act="next">פריט הבא ←</button></div>' +
      '<p class="jam-msg ' + (state.status === 'right' ? 'good' : state.status === 'wrong' ? 'soft' : '') + '" role="status" aria-live="polite">' + e(state.message) + '</p>';
  }

  function mount(el) {
    let state = createState(0, 0, JAM.loadShowMusic(GAME));
    let playing = null;
    JAM.registerTapVoices();
    function stop() { if (playing) playing.stop(); playing = null; }
    function voice() { return JAM.instrument(state.timbre, 'woodBar').voice; }
    function light(n) {
      const s = el.querySelector('.pe-notes [data-idx="' + n.idx + '"]');
      if (s) { s.classList.remove('jam-lit'); void s.offsetWidth; s.classList.add('jam-lit'); }
    }
    function play(values, gap) { stop(); if (state.showMusic) playing = JAM.playNotes(phrase(values, voice(), gap), light); }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      const vals = state.pattern.values;
      if (act === 'play') { play(vals.slice(0, -1)); return; }
      if (act === 'echo') state = echo(state, b.getAttribute('data-value'));
      else if (act === 'next') state = next(state);
      else if (act === 'timbre') state = Object.assign({}, state, { timbre: b.getAttribute('data-inst') });
      else if (act === 'motif') state = addMotif(state, b.getAttribute('data-value'));
      else if (act === 'continue') state = continueMotif(state);
      else if (act === 'music') { stop(); state = Object.assign({}, state, { showMusic: !state.showMusic }); JAM.saveShowMusic(GAME, state.showMusic); }
      const open = el.querySelector('details.pe-free');
      const wasOpen = !!(open && open.open);
      el.innerHTML = renderHtml(state);
      if (wasOpen && el.querySelector('details.pe-free')) el.querySelector('details.pe-free').open = true;
      const f = el.querySelector('[data-act="' + act + '"]');
      if (f && f.focus && act !== 'echo') f.focus();
      if (act === 'echo' && state.showMusic) { JAM.feedback(state.status === 'right'); setTimeout(function () { play(vals, state.status === 'right' ? 0.3 : 0.6); }, 300); }
      if (act === 'continue' && state.free) play(state.free.values, 0.3);
    });
    JAM.stopWhenHidden(el, stop);
    el.innerHTML = renderHtml(state);
    return { get state() { return state; } };
  }

  return { GAME: GAME, ITEMS: ITEMS, ROUNDS: ROUNDS, TIMBRES: TIMBRES, hzOf: hzOf, createState: createState, keys: keys, echo: echo, next: next, addMotif: addMotif, continueMotif: continueMotif, phrase: phrase, renderHtml: renderHtml, mount: mount };
});
