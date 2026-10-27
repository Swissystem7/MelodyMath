// MelodyMath — BalanceBarsScreen: equations and inequalities as a balance of
// two bars, grades ד׳–ה׳ (balanceBars, the א׳-ב׳ way, extending fillBar).
// The left side plays on the child's instrument (myInstrument.instrumentFor),
// the right on a partner. The no-music check comes last (#665). Refs #710.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_BALANCE_BARS_SCREEN = api;
  if (typeof document !== 'undefined' && document.getElementById('bbCard')) api.mount(document.getElementById('bbCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const BB = root.MM_BALANCE_BARS || require('../lib/music/balanceBars.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const MINE = root.MM_MY_INSTRUMENT || require('../lib/myInstrument.js');
  const GAME = 'balanceBars', DEFAULT_INSTRUMENT = 'marimba', PARTNER = 'kora';
  const SIGNS = ['<', '=', '>'];

  function createState(index, showMusic) {
    const n = BB.TARGETS.length, i = Number(index) || 0;
    return { index: i, ex: i < n ? BB.TARGETS[i] : null, status: i < n ? 'open' : 'plain', message: '', guess: null, showMusic: showMusic !== false };
  }

  function check(state, typed) {
    const ex = state.ex, t = String(typed == null ? '' : typed).trim().replace(/,/g, '');
    if (ex.kind === 'sign') {
      if (t === ex.answer) return Object.assign({}, state, { status: 'right', guess: null, message: 'נכון! ' + ex.expr.replace('?', ex.answer) });
      return Object.assign({}, state, { status: 'wrong', guess: null, message: 'הקשיבו שוב: איזו תיבה נגמרת אחרונה?' });
    }
    if (t === '' || Number.isNaN(Number(t))) return Object.assign({}, state, { status: 'wrong', guess: null, message: 'כתבו מספר.' });
    const g = Number(t), fill = BB.fillCheck(ex.expr, g);
    if (g === ex.answer) return Object.assign({}, state, { status: 'right', guess: g, message: 'שתי התיבות נגמרות יחד — ' + ex.expr.replace(BB.BLANK, String(ex.answer)) });
    return Object.assign({}, state, { status: 'wrong', guess: g, message: (fill.he || 'עוד לא מאוזן') + '. נסו שוב.' });
  }

  function checkPlain(state, answers) {
    const right = BB.NO_MUSIC_CHECK_ITEMS.filter(function (it) { return BB.plainOk(it, answers[it.id]); }).length;
    return Object.assign({}, state, { message: right + ' מתוך ' + BB.NO_MUSIC_CHECK_ITEMS.length + ' נכונות.', done: right === BB.NO_MUSIC_CHECK_ITEMS.length });
  }

  // The two bars as now known: the side with ☐ is empty until a guess fills it.
  function current(state) {
    const ex = state.ex, s = BB.sides(ex.expr, state.guess == null ? 0 : state.guess);
    const p = BB.parse(ex.expr), blank = p.left.indexOf(BB.BLANK) >= 0 ? 0 : p.right.indexOf(BB.BLANK) >= 0 ? 1 : -1;
    return { left: s.left, right: s.right, blank: blank, silent: blank >= 0 && state.guess == null ? blank : null };
  }

  function barHtml(pct, k, on, name) {
    return '<div class="bb-side" data-side="' + k + '" style="margin:4px 0"><div class="bb-bar" style="height:22px;border-radius:6px;width:' + Math.max(pct, 2) +
      '%;background:' + (k === 0 ? 'var(--accent,#6a5acd)' : '#14b8a6') + '"></div>' + (on ? '<small>' + JAM.esc(name || '') + '</small>' : '') + '</div>';
  }

  // names: Hebrew instrument names of the two sides, shown with music on.
  function renderHtml(state, names) {
    const e = JAM.esc, on = state.showMusic;
    const head = '<div class="jam-head"><span class="tag">M3 · מאזן של שתי תיבות · כיתות ד׳–ה׳</span>' + JAM.musicToggleHtml(on) + '</div>';
    if (!state.ex) {
      return head + '<h3>בדיקה בלי מוזיקה</h3>' + BB.NO_MUSIC_CHECK_ITEMS.map(function (it) {
        return '<p class="jam-prompt"><label><bdi dir="ltr">' + e(it.prompt) + '</bdi> <input data-plain="' + e(it.id) + '"' + (typeof it.answer === 'number' ? ' inputmode="numeric"' : '') + '></label></p>';
      }).join('') + '<div class="jam-row"><button type="button" class="primary" data-act="plainCheck">בדיקה</button>' +
        '<button type="button" class="secondary" data-act="restart">מתחילים מחדש</button></div><p class="jam-msg" role="status" aria-live="polite">' + e(state.message) + '</p>';
    }
    const ex = state.ex, c = current(state), w = BB.barWidths(c.left, c.right);
    const ask = ex.kind === 'sign' ? 'איזה סימן במקום ?' : 'איזה מספר במקום ☐ מאזן את שתי התיבות?';
    const answer = ex.kind === 'sign'
      ? SIGNS.map(function (s) { return '<button type="button" class="secondary" data-sign="' + e(s) + '" style="min-width:48px;min-height:48px">' + e(s) + '</button>'; }).join('')
      : '<label>☐ = <input data-answer inputmode="numeric"></label><button type="button" class="primary" data-act="check">בדיקה</button>';
    return head + '<h3>' + (on ? '🎶 שני נגנים מתחילים יחד' : 'שתי תיבות, שני צדדים') + ' · כיתה ' + e(ex.grade) + '׳</h3>' +
      '<p class="jam-prompt"><bdi dir="ltr">' + e(ex.expr) + '</bdi> — ' + ask + '</p>' +
      '<div class="bb-balance" dir="ltr" role="img" aria-label="שתי תיבות באורך שני הצדדים">' + barHtml(c.silent === 0 ? 0 : w[0], 0, on, names[0]) + barHtml(c.silent === 1 ? 0 : w[1], 1, on, names[1]) + '</div>' +
      '<div class="jam-row">' + (on ? '<button type="button" class="secondary" data-act="play">▶ נגנו את המאזן</button>' : '') + answer +
      '<button type="button" class="secondary" data-act="next">תרגיל הבא ←</button></div>' +
      '<p class="jam-msg ' + (state.status === 'right' ? 'good' : state.status === 'wrong' ? 'soft' : '') + '" role="status" aria-live="polite">' + e(state.message) + '</p>';
  }

  function mount(el) {
    JAM.registerTapVoices();
    let state = createState(0, JAM.loadShowMusic(GAME)), playing = null;
    function stop() { if (playing) playing.stop(); playing = null; }
    function band() {
      const mine = MINE.instrumentFor(DEFAULT_INSTRUMENT);
      return [JAM.instrument(mine, 'woodBar'), JAM.instrument(mine === PARTNER ? DEFAULT_INSTRUMENT : PARTNER, 'woodBar')];
    }
    function draw() { el.innerHTML = renderHtml(state, band().map(function (x) { return x.he; })); }
    function play() {
      stop();
      const c = current(state);
      playing = JAM.playNotes(BB.balancePlan(c.left, c.right, band().map(function (x) { return x.voice; }), c.silent));
    }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act],[data-sign]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      if (b.hasAttribute('data-sign')) state = check(state, b.getAttribute('data-sign'));
      else if (act === 'play') { play(); return; }
      else if (act === 'check') { const inp = el.querySelector('[data-answer]'); state = check(state, inp ? inp.value : ''); }
      else if (act === 'plainCheck') {
        const answers = {};
        el.querySelectorAll('[data-plain]').forEach(function (i) { answers[i.getAttribute('data-plain')] = i.value; });
        state = checkPlain(state, answers);
      } else if (act === 'next' || act === 'restart') { stop(); state = createState(act === 'next' ? state.index + 1 : 0, state.showMusic); }
      else if (act === 'music') { stop(); state = Object.assign({}, state, { showMusic: !state.showMusic }); JAM.saveShowMusic(GAME, state.showMusic); }
      draw();
      // After a guess the child hears the two bars with that number in place.
      if (state.showMusic && state.ex && state.status !== 'open' && (act === 'check' || b.hasAttribute('data-sign'))) { if (state.ex.kind === 'fill' && state.guess != null) play(); else JAM.feedback(state.status === 'right'); }
    });
    if (root.addEventListener) root.addEventListener(MINE.EVENT, draw);
    JAM.stopWhenHidden(el, stop);
    draw();
    return { get state() { return state; } };
  }

  return { GAME: GAME, DEFAULT_INSTRUMENT: DEFAULT_INSTRUMENT, PARTNER: PARTNER, createState: createState, check: check, checkPlain: checkPlain, current: current, renderHtml: renderHtml, mount: mount };
});
