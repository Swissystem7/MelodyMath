// MelodyMath — PercentMixPad: the grade ו׳ percent bar (50/25/10 tiles, no-music check last). Refs #682 #665.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_PERCENT_MIX_PAD = api;
  if (typeof document !== 'undefined' && document.getElementById('pmCard')) api.mount(document.getElementById('pmCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const PM = root.MM_PERCENT_MIX || require('../lib/music/percentMix.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const GAME = 'percentMixPad', BPM = 90;

  function createState(index, showMusic, split) {
    const n = PM.TARGETS.length, i = Number(index) || 0;
    return { index: i, ex: i < n ? PM.TARGETS[i] : null, split: PM.SPLITS.indexOf(split) >= 0 ? split : PM.DEFAULT_SPLIT,
      fill: [], status: i < n ? 'empty' : 'plain', message: '', showMusic: showMusic !== false, sound: null };
  }

  function tapTile(state, id) {
    if (!state.ex || state.ex.allowed.indexOf(id) === -1 || state.status === 'exact') return Object.assign({}, state, { sound: null });
    const r = PM.addTile(state.fill, id, state.ex.percent);
    if (!r.accepted) return Object.assign({}, state, { status: 'over', message: 'עברת ב־' + r.over + '%. נסו אריח קטן יותר.', sound: 'wrong' });
    const done = r.status === 'exact';
    return Object.assign({}, state, { fill: r.fill, status: done ? 'exact' : 'filling', sound: done ? 'cadence' : null,
      message: done ? r.fill.map(function (f) { return PM.tile(f).n + '%'; }).join(' + ') + ' = ' + state.ex.percent + '% — בדיוק!' : '' });
  }

  function check(state) {
    const c = PM.checkFill(state.fill, state.ex.percent);
    return Object.assign({}, state, c.status === 'under' ? { status: 'under', message: 'חסרים ' + c.missing + '%. הוסיפו אריח.', sound: 'wrong' } : { sound: null });
  }

  // answers: item id → typed text. Counts the right ones of the no-music check.
  function checkPlain(state, answers) {
    const right = PM.NO_MUSIC_CHECK_ITEMS.filter(function (it) {
      const a = String(answers[it.id] || '').trim();
      return a === String(it.answer) || it.altAnswers.indexOf(a) >= 0;
    }).length;
    return Object.assign({}, state, { message: right + ' מתוך ' + PM.NO_MUSIC_CHECK_ITEMS.length + ' נכונות.', sound: null });
  }

  function renderHtml(state, voice) {
    const e = JAM.esc, on = state.showMusic, head ='<div class="jam-head"><span class="tag">M3 · אחוזים כתיבה · כיתה ו׳</span>' + JAM.musicToggleHtml(on) + '</div>';
    if (!state.ex) {
      return head + '<h3>בדיקה בלי מוזיקה</h3>' + PM.NO_MUSIC_CHECK_ITEMS.map(function (it) {
        return '<p class="jam-prompt"><label>' + e(it.prompt) + ' <input data-plain="' + e(it.id) + '" inputmode="text"></label></p>';
      }).join('') + '<div class="jam-row"><button type="button" class="primary" data-act="plainCheck">בדיקה</button>' +
        '<button type="button" class="secondary" data-act="restart">מתחילים מחדש</button></div><p class="jam-msg" role="status" aria-live="polite">' + e(state.message) + '</p>';
    }
    const splits = PM.SPLITS.map(function (s) {
      return '<button type="button" class="secondary" data-act="split" data-split="' + s + '" aria-pressed="' + (s === state.split) + '">' + s + ' פעמות</button>';
    }).join('');
    const segs = state.fill.map(function (f, i) { return '<span class="fbp-seg" data-seg="' + i + '" style="width:' + PM.tile(f).n + '%">' + PM.tile(f).n + '%</span>'; }).join('');
    const tiles = state.ex.allowed.map(function (id) {
      return '<button type="button" class="fbp-tile" data-act="tile" data-tile="' + id + '"' + (on ? ' data-tap="' + e(voice) + '"' : '') + '><b>' +
        e(PM.tile(id).he) + '</b>' + (on ? '<span>' + e(PM.tileLabel(id, state.split)) + '</span>' : '') + '</button>';
    }).join('');
    return head + '<h3>' + (on ? '🪘 תיבה אחת = 100%' : 'רצועה אחת = 100%') + '</h3><p class="jam-prompt">' + e(state.ex.he) + '</p>' +
      (on ? '<div class="jam-row" role="group" aria-label="חלוקת התיבה">' + splits + '</div>' : '') +
      '<div class="fbp-bar' + (state.status === 'exact' ? ' done' : '') + '" role="img" aria-label="מלא ' + PM.filled(state.fill) + '% מתוך 100%">' + segs + '</div>' +
      '<div class="jam-row" role="group" aria-label="אריחים">' + tiles + '</div><div class="jam-row">' +
      (on ? '<button type="button" class="secondary" data-act="play">▶ נגן תיבה</button>' : '') + '<button type="button" class="secondary" data-act="undo">↩ הסרת אריח</button>' +
      '<button type="button" class="primary" data-act="check">בדיקה</button><button type="button" class="secondary" data-act="next">תרגיל הבא ←</button></div>' +
      '<p class="jam-msg ' + (state.status === 'exact' ? 'good' : state.sound === 'wrong' ? 'soft' : '') + '" role="status" aria-live="polite">' + e(state.message) + '</p>';
  }

  function mount(el) {
    const inst = JAM.instrument('darbuka', 'drumLow');
    JAM.registerTapVoices();
    let state = createState(0, JAM.loadShowMusic(GAME)), playing = null;
    function stop() { if (playing) playing.stop(); playing = null; }
    function draw() { el.innerHTML = renderHtml(state, inst.voice); }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'tile') {
        const t = PM.tile(b.getAttribute('data-tile'));
        if (state.showMusic && t && t.voices) JAM.playNotes([{ at: 0, voice: t.voices[1], hz: 1800 }]); // the merged tile's second sound
        state = tapTile(state, b.getAttribute('data-tile'));
      } else if (act === 'split') state = Object.assign({}, state, { split: Number(b.getAttribute('data-split')), sound: null });
      else if (act === 'check') state = check(state);
      else if (act === 'undo') state = Object.assign({}, state, { fill: state.fill.slice(0, -1), status: 'filling', message: '', sound: null });
      else if (act === 'plainCheck') {
        const answers = {};
        el.querySelectorAll('[data-plain]').forEach(function (i) { answers[i.getAttribute('data-plain')] = i.value; });
        state = checkPlain(state, answers);
      } else if (act === 'next' || act === 'restart') { stop(); state = createState(act === 'next' ? state.index + 1 : 0, state.showMusic, state.split); }
      else if (act === 'music') { stop(); state = Object.assign({}, state, { showMusic: !state.showMusic, sound: null }); JAM.saveShowMusic(GAME, state.showMusic); }
      else if (act === 'play') { stop(); playing = JAM.playNotes(PM.barPlan(state.fill, BPM, inst.voice, state.split)); return; }
      draw();
      if (state.showMusic && state.sound) JAM.feedback(state.sound === 'cadence');
    });
    JAM.stopWhenHidden(el, stop);
    draw();
    return { get state() { return state; } };
  }

  return { GAME: GAME, BPM: BPM, createState: createState, tapTile: tapTile, check: check, checkPlain: checkPlain, renderHtml: renderHtml, mount: mount };
});
