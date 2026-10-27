// MelodyMath — NoteLengthLineScreen (#591): the fillBar bar drawn as the 0–1
// segment of a number line. The child hears a note, drags it onto the line,
// the bar fills to that point and plays at that length, then at the true
// length: too short or too long is heard. Compare items play two notes in a
// row to order on the line. Feedback is by distance (close / far) and the
// mean magnitudeError is kept per child. The no-music check is last (#665).
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_NOTE_LENGTH_LINE_SCREEN = api;
  if (typeof document !== 'undefined' && document.getElementById('nllCard')) api.mount(document.getElementById('nllCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const NLL = root.MM_NOTE_LENGTH_LINE || require('../lib/noteLengthLine.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const MINE = root.MM_MY_INSTRUMENT || require('../lib/myInstrument.js');
  const GAME = 'noteLengthLine', DEFAULT_INSTRUMENT = 'ukulele', STEPS = 1000;

  function createState(index, showMusic) {
    const n = NLL.ITEMS.length, i = Number(index) || 0;
    return { index: i, item: i < n ? NLL.ITEMS[i] : null, chosen: [], feedback: [], status: i < n ? 'open' : 'plain', message: '', showMusic: showMusic !== false };
  }

  // x: 0..1 of the line. Places the next note of the item.
  function place(state, x) {
    const it = state.item;
    if (!it || state.status === 'done') return state;
    const k = state.chosen.length, v = NLL.positionToValue(x, it.max), fb = NLL.feedback(v, it.values[k], it.max);
    const chosen = state.chosen.concat([v]), feedback = state.feedback.concat([fb]);
    const done = chosen.length === it.values.length;
    let message = fb.he;
    if (done && it.kind === 'compare') message = (NLL.orderRight(chosen, it.values, it.max) ? 'הסדר על הקו נכון! ' : 'הסדר הפוך — מי מהתווים ארוך יותר? ') + fb.he;
    else if (!done) message = fb.he + ' עכשיו התו השני.';
    return Object.assign({}, state, { chosen: chosen, feedback: feedback, status: done ? 'done' : 'open', message: message });
  }

  // Notes after a placement: the child's length, then the true one.
  function placedPlan(state, voice) {
    const k = state.chosen.length - 1;
    return NLL.playPlan([state.chosen[k], state.item.values[k]], voice);
  }

  function checkPlain(state, answers) {
    const right = NLL.NO_MUSIC_CHECK_ITEMS.filter(function (it) { return String(answers[it.id] || '').replace(/\s/g, '') === it.answer; }).length;
    return Object.assign({}, state, { message: right + ' מתוך ' + NLL.NO_MUSIC_CHECK_ITEMS.length + ' נכונות.' });
  }

  function pct(v, max) { return (v / max) * 100; }

  function renderHtml(state, instrumentHe) {
    const e = JAM.esc, on = state.showMusic;
    const head = '<div class="jam-head"><span class="tag">M3 · התיבה היא הקו · כיתות ג׳–ו׳</span>' + JAM.musicToggleHtml(on) + '</div>';
    if (!state.item) {
      return head + '<h3>בדיקה בלי מוזיקה</h3>' + NLL.NO_MUSIC_CHECK_ITEMS.map(function (it) {
        return '<p class="jam-prompt"><label>' + e(it.prompt) + ' <input data-plain="' + e(it.id) + '" dir="ltr"></label></p>';
      }).join('') + '<div class="jam-row"><button type="button" class="primary" data-act="plainCheck">בדיקה</button>' +
        '<button type="button" class="secondary" data-act="restart">מתחילים מחדש</button></div><p class="jam-msg" role="status" aria-live="polite">' + e(state.message) + '</p>';
    }
    const it = state.item, max = it.max, k = Math.min(state.chosen.length, it.values.length - 1);
    const last = state.chosen.length ? state.chosen[state.chosen.length - 1] : 0;
    const ticks = [];
    for (let t = 0; t <= max; t++) ticks.push('<span class="nll-tick" style="position:absolute;left:' + pct(t, max) + '%;top:100%;transform:translateX(-50%)">' + t + '</span>');
    const marks = state.chosen.map(function (v, i) {
      return '<span class="nll-mark" data-mark="' + i + '" style="position:absolute;left:' + pct(v, max) + '%;top:-1.4em;transform:translateX(-50%)">' + 'אב'[i] + '</span>' +
        '<span class="nll-true" style="position:absolute;left:' + pct(NLL.value(it.values[i]), max) + '%;bottom:0;height:100%;border-left:2px dashed var(--good)"></span>';
    }).join('');
    // One object: the fill of the bar and the point on the line share pct(last, max).
    const line = '<div class="nll-line" dir="ltr" style="position:relative;height:40px;margin:1.6em 0 2em;border:2px solid var(--line);border-radius:8px">' +
      '<span class="nll-fill" style="position:absolute;left:0;top:0;bottom:0;width:' + pct(last, max) + '%;background:var(--accent,#6a5acd);opacity:.45"></span>' + ticks.join('') + marks +
      '<input type="range" data-line min="0" max="' + STEPS + '" value="' + Math.round((last / max) * STEPS) + '" aria-label="גררו את התו על הקו מ־0 עד ' + max + '"' +
      (state.status === 'done' ? ' disabled' : '') + ' style="position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:.6"></div>';
    const what = it.values.map(function (v, i) { return (it.values.length > 1 ? 'אב'[i] + ': ' : '') + '<bdi dir="ltr">' + e(v) + '</bdi>'; }).join(' · ');
    return head + '<h3>' + (on ? '🎵 איפה התו הזה יושב על הקו?' : 'איפה השבר יושב על הקו?') + '</h3>' +
      '<p class="jam-prompt">' + (it.kind === 'compare' ? 'סדרו את שני התווים על הקו. ' : 'גררו את התו למקום שלו על הקו. ') + what +
      (it.kind === 'compare' && state.status !== 'done' ? ' — עכשיו ' + 'אב'[k] : '') + '</p>' + line +
      (on ? '<p><small>התיבה היא הקטע מ־0 עד 1 · ' + e(instrumentHe || '') + '</small></p>' : '') + '<div class="jam-row">' +
      (on ? '<button type="button" class="secondary" data-act="play">▶ הקשיבו לתו</button>' : '') +
      '<button type="button" class="secondary" data-act="next">תרגיל הבא ←</button></div>' +
      '<p class="jam-msg ' + (state.feedback.length && state.feedback[state.feedback.length - 1].level === 'close' ? 'good' : state.feedback.length ? 'soft' : '') + '" role="status" aria-live="polite">' + e(state.message) + '</p>';
  }

  function mount(el) {
    JAM.registerTapVoices();
    let state = createState(0, JAM.loadShowMusic(GAME)), playing = null;
    function inst() { return JAM.instrument(MINE.instrumentFor(DEFAULT_INSTRUMENT), 'pluck'); }
    function stop() { if (playing) playing.stop(); playing = null; }
    function play(notes) { stop(); if (state.showMusic) playing = JAM.playNotes(notes); }
    function draw() { el.innerHTML = renderHtml(state, inst().he); }
    el.addEventListener('change', function (ev) {
      if (!ev.target.hasAttribute || !ev.target.hasAttribute('data-line')) return;
      state = place(state, Number(ev.target.value) / STEPS);
      NLL.recordError(state.feedback[state.feedback.length - 1].err);
      draw();
      play(placedPlan(state, inst().voice));
    });
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'play') { const it = state.item; play(NLL.playPlan(it.kind === 'compare' ? it.values : [it.values[0]], inst().voice)); return; }
      if (act === 'plainCheck') {
        const answers = {};
        el.querySelectorAll('[data-plain]').forEach(function (i) { answers[i.getAttribute('data-plain')] = i.value; });
        state = checkPlain(state, answers);
      } else if (act === 'next' || act === 'restart') { stop(); state = createState(act === 'next' ? state.index + 1 : 0, state.showMusic); }
      else if (act === 'music') { stop(); state = Object.assign({}, state, { showMusic: !state.showMusic }); JAM.saveShowMusic(GAME, state.showMusic); }
      draw();
    });
    if (root.addEventListener) root.addEventListener(MINE.EVENT, draw);
    JAM.stopWhenHidden(el, stop);
    draw();
    return { get state() { return state; } };
  }

  return { GAME: GAME, DEFAULT_INSTRUMENT: DEFAULT_INSTRUMENT, STEPS: STEPS, createState: createState, place: place, placedPlan: placedPlan, checkPlain: checkPlain, renderHtml: renderHtml, mount: mount };
});
