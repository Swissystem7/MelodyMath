// MelodyMath — GrooveGridScreen: areaScore grid, perimeter EXTRA, no-music check last. Refs #591 #665.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_GROOVE_GRID_SCREEN = api;
  if (typeof document !== 'undefined' && document.getElementById('ggCard')) api.mount(document.getElementById('ggCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const GG = root.MM_GROOVE_GRID || require('../lib/music/grooveGrid.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const GAME = 'grooveGrid', FALLBACK = 'djembe';

  function myInstrument() { return root.MM_MY_INSTRUMENT || require('../lib/myInstrument.js'); }
  function instData() { return typeof root.instrumentById === 'function' ? root : require('../lib/instruments.js'); }

  function tracks(storage) {
    const d = instData(), kid = d.instrumentById(myInstrument().instrumentFor(FALLBACK, null, storage)) || d.instrumentById(FALLBACK);
    const partner = d.instrumentById(GG.partnerFor(kid.family));
    return { kid: kid, partner: partner, families: [kid.family, partner.family],
      trackVoice: function (row) { return row === 0 ? kid.voice : partner.voice; } };
  }

  function createState(index, showMusic) {
    const i = Number(index) || 0, ex = i < GG.TARGETS.length ? GG.TARGETS[i] : null;
    return { index: i, ex: ex, status: ex ? 'ask' : 'plain', message: '', showMusic: showMusic !== false, sound: null };
  }
  function answerOf(ex) { return ex.ask === 'area' ? GG.gridArea(ex.rows, ex.cols) : GG.perimeterPath(ex.rows, ex.cols).length; }

  function answer(state, typed) {
    if (!state.ex || state.status === 'right') return state;
    const want = answerOf(state.ex), n = Number(String(typed).trim());
    if (n === want) {
      const how = state.ex.ask === 'area' ? state.ex.rows + ' שורות של ' + state.ex.cols + ' = ' + want + ' משבצות' : 'סיבוב של ' + want + ' צעדים';
      return Object.assign({}, state, { status: 'right', message: 'נכון! ' + how + '.', sound: 'right' });
    }
    return Object.assign({}, state, { status: 'retry', sound: 'wrong',
      message: 'עוד לא. ' + (state.ex.ask === 'area' ? 'נגנו שורה אחרי שורה: כמה קבוצות, וכמה בכל קבוצה?' : 'נגנו את הסיבוב: צעד לכל צלע של משבצת בשפה.') });
  }

  function checkPlain(state, answers) {
    const right = GG.NO_MUSIC_CHECK_ITEMS.filter(function (it) { return Number(String(answers[it.id] || '').trim()) === it.answer; }).length;
    return Object.assign({}, state, { message: right + ' מתוך ' + GG.NO_MUSIC_CHECK_ITEMS.length + ' נכונות.', done: right === GG.NO_MUSIC_CHECK_ITEMS.length });
  }

  function gridHtml(ex, tr, on) {
    let out = '<div class="gg-grid" role="img" aria-label="מלבן ' + ex.rows + ' על ' + ex.cols + '" style="display:grid;gap:4px;grid-template-columns:repeat(' + ex.cols + ',minmax(28px,48px))">';
    for (let y = 0; y < ex.rows; y++) {
      for (let x = 0; x < ex.cols; x++) {
        out += '<button type="button" class="gg-cell" data-cell="' + (y * ex.cols + x) + '" style="min-height:48px"' +
          (on ? ' data-tap="' + JAM.esc(tr.trackVoice(y)) + '"' : '') + ' aria-label="שורה ' + (y + 1) + ', עמודה ' + (x + 1) + '"></button>';
      }
    }
    return out + '</div>';
  }

  function renderHtml(state, tr) {
    const e = JAM.esc, on = state.showMusic;
    const head = '<div class="jam-head"><span class="tag">M2 · שטח והיקף · כיתה ה׳</span>' + JAM.musicToggleHtml(on) + '</div>';
    if (!state.ex) {
      return head + '<h3>בדיקה בלי מוזיקה</h3>' + GG.NO_MUSIC_CHECK_ITEMS.map(function (it) {
        return '<p class="jam-prompt"><label>' + e(it.prompt) + ' <input data-plain="' + e(it.id) + '" inputmode="numeric"></label></p>';
      }).join('') + '<div class="jam-row"><button type="button" class="primary" data-act="plainCheck">בדיקה</button>' +
        '<button type="button" class="secondary" data-act="restart">מתחילים מחדש</button></div><p class="jam-msg" role="status" aria-live="polite">' + e(state.message) + '</p>';
    }
    const ex = state.ex, q = ex.ask === 'area' ? 'כמה משבצות יש במלבן ' + ex.rows + ' על ' + ex.cols + '?' : 'מה ההיקף של מלבן ' + ex.rows + ' על ' + ex.cols + '?';
    return head + '<h3>' + (on ? '🥁 כל שורה היא כלי, כל עמודה פעמה' : 'מלבן משבצות') + '</h3>' +
      (on ? '<p class="jam-prompt">שורה ראשונה: ' + e(tr.kid.instrument.he) + '. שאר השורות: ' + e(tr.partner.instrument.he) + '.</p>' : '') +
      '<p class="jam-prompt">' + e(q) + '</p>' + gridHtml(ex, tr, on) + '<div class="jam-row">' +
      (on ? '<button type="button" class="secondary" data-act="playArea">▶ נגן שטח</button><button type="button" class="secondary" data-act="playLoop">▶ נגן היקף (סיבוב)</button>' : '') +
      '<input class="gg-answer" data-answer inputmode="numeric" aria-label="תשובה"><button type="button" class="primary" data-act="check">בדיקה</button>' +
      '<button type="button" class="secondary" data-act="next">תרגיל הבא ←</button></div>' +
      '<p class="jam-msg ' + (state.status === 'right' ? 'good' : state.status === 'retry' ? 'soft' : '') + '" role="status" aria-live="polite">' + e(state.message) + '</p>';
  }

  function mount(el) {
    JAM.registerTapVoices();
    let state = createState(0, JAM.loadShowMusic(GAME)), tr = tracks(), playing = null;
    function stop() { if (playing) playing.stop(); playing = null; }
    function draw() { el.innerHTML = renderHtml(state, tr); }
    function play(kind) {
      stop();
      const ex = state.ex, plan = kind === 'area' ? GG.areaPlan(ex.rows, ex.cols, tr.trackVoice) : GG.perimeterPlan(ex.rows, ex.cols, tr.trackVoice);
      // square of each perimeter step, so the grid pulses with the sound
      const map = kind === 'area' ? null : GG.perimeterPath(ex.rows, ex.cols).map(function (s) { return s.r * ex.cols + s.c; });
      el.querySelectorAll('.gg-cell.on').forEach(function (c) { c.classList.remove('on'); });
      playing = JAM.playNotes(plan, function (n) {
        n.steps.forEach(function (s) { const c = el.querySelector('[data-cell="' + (map ? map[s] : s) + '"]'); if (c) c.classList.add('on'); });
      });
    }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'playArea' || act === 'playLoop') { play(act === 'playArea' ? 'area' : 'loop'); return; }
      if (act === 'check') state = answer(state, (el.querySelector('[data-answer]') || {}).value || '');
      else if (act === 'plainCheck') {
        const answers = {};
        el.querySelectorAll('[data-plain]').forEach(function (i) { answers[i.getAttribute('data-plain')] = i.value; });
        state = checkPlain(state, answers);
      } else if (act === 'next' || act === 'restart') { stop(); state = createState(act === 'next' ? state.index + 1 : 0, state.showMusic); }
      else if (act === 'music') { stop(); state = Object.assign({}, state, { showMusic: !state.showMusic, sound: null }); JAM.saveShowMusic(GAME, state.showMusic); }
      draw();
      if (state.showMusic && state.sound) JAM.feedback(state.sound === 'right');
    });
    if (root.addEventListener) root.addEventListener(myInstrument().EVENT, function () { tr = tracks(); draw(); });
    JAM.stopWhenHidden(el, stop);
    draw();
    return { get state() { return state; } };
  }

  return { GAME: GAME, tracks: tracks, createState: createState, answer: answer, checkPlain: checkPlain, renderHtml: renderHtml, mount: mount };
});
