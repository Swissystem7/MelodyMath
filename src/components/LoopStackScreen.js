// MelodyMath — LoopStackScreen: box volume as stacked loop layers, grade ו׳
// (cubeLayerGroups, the ד׳ way). Layer 1 plays on the child's instrument
// (myInstrument.instrumentFor), each next layer on another family. The
// no-music check comes last (#665). Refs #591.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_LOOP_STACK_SCREEN = api;
  if (typeof document !== 'undefined' && document.getElementById('lsCard')) api.mount(document.getElementById('lsCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const LS = root.MM_LOOP_STACK || require('../lib/music/loopStack.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const MINE = root.MM_MY_INSTRUMENT || require('../lib/myInstrument.js');
  const GAME = 'loopStack', DEFAULT_INSTRUMENT = 'marimba';

  function createState(index, showMusic) {
    const n = LS.TARGETS.length, i = Number(index) || 0;
    return { index: i, ex: i < n ? LS.TARGETS[i] : null, status: i < n ? 'open' : 'plain', message: '', showMusic: showMusic !== false };
  }

  function check(state, typed) {
    const ex = state.ex, want = LS.volume(ex.a, ex.b, ex.c);
    if (Number(String(typed).trim()) === want) {
      return Object.assign({}, state, { status: 'right', message: ex.c + ' שכבות של ' + (ex.a * ex.b) + ' = ' + want + ' סמ״ק — בדיוק!' });
    }
    return Object.assign({}, state, { status: 'wrong', message: 'נסו שוב: כמה קוביות בשכבה אחת, וכמה שכבות?' });
  }

  function checkPlain(state, answers) {
    const right = LS.NO_MUSIC_CHECK_ITEMS.filter(function (it) { return Number(String(answers[it.id] || '').trim()) === it.answer; }).length;
    return Object.assign({}, state, { message: right + ' מתוך ' + LS.NO_MUSIC_CHECK_ITEMS.length + ' נכונות.' });
  }

  // names: Hebrew instrument name per layer, shown only with music on.
  function renderHtml(state, names) {
    const e = JAM.esc, on = state.showMusic;
    const head = '<div class="jam-head"><span class="tag">M2 · נפח תיבה בשכבות · כיתה ו׳</span>' + JAM.musicToggleHtml(on) + '</div>';
    if (!state.ex) {
      return head + '<h3>בדיקה בלי מוזיקה</h3>' + LS.NO_MUSIC_CHECK_ITEMS.map(function (it) {
        return '<p class="jam-prompt"><label>' + e(it.prompt) + ' <input data-plain="' + e(it.id) + '" inputmode="decimal"></label></p>';
      }).join('') + '<div class="jam-row"><button type="button" class="primary" data-act="plainCheck">בדיקה</button>' +
        '<button type="button" class="secondary" data-act="restart">מתחילים מחדש</button></div><p class="jam-msg" role="status" aria-live="polite">' + e(state.message) + '</p>';
    }
    const ex = state.ex;
    const stack = LS.layers(ex.a, ex.b, ex.c).reverse().map(function (l) {
      const cubes = LS.baseLoop(ex.a, ex.b).map(function () { return '<span class="ls-cube" style="width:18px;height:18px;border-radius:3px;background:var(--accent,#6a5acd)"></span>'; }).join('');
      return '<div class="ls-layer" data-layer="' + l.layer + '" style="display:grid;grid-template-columns:repeat(' + ex.b + ',18px);gap:2px;margin:4px 0">' + cubes +
        '</div>' + (on ? '<small>שכבה ' + (l.layer + 1) + ' · ' + e(names[l.layer] || '') + '</small>' : '');
    }).join('');
    return head + '<h3>' + (on ? '🎶 כל שכבה היא לופ' : 'כל שכבה היא קבוצה') + '</h3>' +
      '<p class="jam-prompt">בסיס ' + ex.a + ' על ' + ex.b + ', גובה ' + ex.c + ' שכבות. מה הנפח בסמ״ק?</p>' +
      '<div class="ls-stack" role="img" aria-label="' + ex.c + ' שכבות של ' + ex.a + ' על ' + ex.b + '">' + stack + '</div><div class="jam-row">' +
      (on ? '<button type="button" class="secondary" data-act="play">▶ נגן את הערימה</button>' : '') +
      '<label>נפח: <input data-answer inputmode="numeric"></label><button type="button" class="primary" data-act="check">בדיקה</button>' +
      '<button type="button" class="secondary" data-act="next">תרגיל הבא ←</button></div>' +
      '<p class="jam-msg ' + (state.status === 'right' ? 'good' : state.status === 'wrong' ? 'soft' : '') + '" role="status" aria-live="polite">' + e(state.message) + '</p>';
  }

  function mount(el) {
    JAM.registerTapVoices();
    let state = createState(0, JAM.loadShowMusic(GAME)), playing = null;
    function stop() { if (playing) playing.stop(); playing = null; }
    function band() {
      const childId = MINE.instrumentFor(DEFAULT_INSTRUMENT), own = JAM.instrument(childId, 'woodBar');
      const data = root.instrumentById ? root.instrumentById(childId) : null;
      const ids = LS.layerInstruments(state.ex ? state.ex.c : 0, childId, data ? data.family : 'percussion');
      return ids.map(function (id, i) { return i === 0 ? own : JAM.instrument(id, 'woodBar'); });
    }
    function draw() { el.innerHTML = renderHtml(state, band().map(function (x) { return x.he; })); }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'play') {
        stop();
        const voices = band().map(function (x) { return x.voice; }), ex = state.ex;
        playing = JAM.playNotes(LS.stackPlan(ex.a, ex.b, ex.c, function (i) { return voices[i]; }));
        return;
      }
      if (act === 'check') { const inp = el.querySelector('[data-answer]'); state = check(state, inp ? inp.value : ''); }
      else if (act === 'plainCheck') {
        const answers = {};
        el.querySelectorAll('[data-plain]').forEach(function (i) { answers[i.getAttribute('data-plain')] = i.value; });
        state = checkPlain(state, answers);
      } else if (act === 'next' || act === 'restart') { stop(); state = createState(act === 'next' ? state.index + 1 : 0, state.showMusic); }
      else if (act === 'music') { stop(); state = Object.assign({}, state, { showMusic: !state.showMusic }); JAM.saveShowMusic(GAME, state.showMusic); }
      draw();
      if (state.showMusic && act === 'check') JAM.feedback(state.status === 'right');
    });
    if (root.addEventListener) root.addEventListener(MINE.EVENT, draw);
    JAM.stopWhenHidden(el, stop);
    draw();
    return { get state() { return state; } };
  }

  return { GAME: GAME, DEFAULT_INSTRUMENT: DEFAULT_INSTRUMENT, createState: createState, check: check, checkPlain: checkPlain, renderHtml: renderHtml, mount: mount };
});
