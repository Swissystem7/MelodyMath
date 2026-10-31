// MelodyMath — MusicianshipPath screen (#591, owner comment 6376067230 part 2).
//
// An optional 2-3 minute path of four music skills (rhythm reading, pitch
// matching, instrument families, timbre ID), offered by a button at the end
// of a maths session and always skippable. Logic lives in
// src/lib/music/musicianship.js; this file renders it and wires the page.
// Progress is saved under the path's own key only (mm.musicianship.progress),
// never in a maths record, and no topic's music way changes here.
// The state functions and renderHtml are pure and tested in Node; mount()
// and wireOffers() wire them to the page.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_MUSICIANSHIP_PATH = api;
  if (typeof document !== 'undefined' && document.getElementById('mspCard')) {
    api.handle = api.mount(document.getElementById('mspCard'));
    api.wireOffers(document, api.handle);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const MS = root.MM_MUSICIANSHIP || require('../lib/music/musicianship.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const GAME = 'musicianshipPath';
  const BPM = 80;
  const KEY_VOICE = 'woodBar';

  function instrumentsLib() {
    if (Array.isArray(root.INSTRUMENTS)) return { INSTRUMENTS: root.INSTRUMENTS, FAMILIES: root.FAMILIES, instrumentById: root.instrumentById };
    return require('../lib/instruments.js');
  }
  function heOf(id) {
    const x = instrumentsLib().instrumentById(id);
    return x ? x.instrument.he : id;
  }

  // phase: 'intro' -> 'item' -> 'done'; 'skipped' when the child says no.
  function createState(seed, progress) {
    return { phase: 'intro', seed: Number(seed) || 1, items: [], i: 0, picked: null, result: null, results: [], progress: progress || MS.initialProgress(), message: '', sound: null };
  }
  function start(state) {
    return Object.assign({}, state, { phase: 'item', items: MS.buildPath(state.seed, state.progress), i: 0, picked: null, result: null, results: [], message: '', sound: null });
  }
  function skip(state) {
    return Object.assign({}, state, { phase: 'skipped', message: 'דילגתם. המסלול מחכה כאן מתי שתרצו.', sound: null });
  }
  function item(state) { return state.items[state.i] || null; }

  // A pitch key only selects (it already sounded on pointerdown); "בדיקה" checks.
  function pickKey(state, step) {
    const it = item(state);
    if (!it || it.skill !== 'pitch' || state.result) return state;
    return Object.assign({}, state, { picked: Number(step), sound: null });
  }

  function feedbackHe(it, r) {
    if (it.skill === 'pitch') {
      if (r.correct) return 'בדיוק אותו צליל! ' + MS.SCALE[it.target].he + '.';
      if (r.score === 0.5) return 'קרוב מאוד. הצליל היה ' + (r.move === 'higher' ? 'קצת יותר גבוה' : 'קצת יותר נמוך') + ': ' + MS.SCALE[it.target].he + '.';
      return 'הצליל היה ' + MS.SCALE[it.target].he + '. הקשיבו שוב ונסו בסבב הבא.';
    }
    if (it.skill === 'rhythm') return r.correct ? 'נכון! קראתם את התיבה: ' + MS.barHe(it.bar) + '.' : 'התיבה ששמעתם: ' + MS.barHe(it.bar) + '.';
    if (it.skill === 'families') return (r.correct ? 'נכון! ' : '') + it.he + ' הוא ' + MS.FAMILY_HE[it.options[it.answer]] + '.';
    return (r.correct ? 'נכון! ' : '') + 'ניגן ' + heOf(it.instrument) + '.';
  }

  // answer: an option index, or for pitch the picked key (state.picked).
  function answer(state, value) {
    const it = item(state);
    if (!it || state.result) return state;
    const a = it.skill === 'pitch' ? (value != null ? Number(value) : state.picked) : Number(value);
    if (it.skill === 'pitch' && (a == null || isNaN(a))) return Object.assign({}, state, { message: 'בחרו קודם צליל בקלידים.', sound: null });
    const r = MS.scoreItem(it, a);
    return Object.assign({}, state, {
      picked: a, result: r, results: state.results.concat([r]),
      progress: MS.recordResult(state.progress, r),
      message: feedbackHe(it, r), sound: r.correct ? 'right' : 'soft',
    });
  }
  function next(state) {
    if (state.i + 1 < state.items.length) return Object.assign({}, state, { i: state.i + 1, picked: null, result: null, message: '', sound: null });
    return Object.assign({}, state, { phase: 'done', progress: MS.finishPath(state.progress), message: '', sound: 'done' });
  }

  // Per-skill counts for this round: { rhythm: {right, of}, ... }
  function roundSummary(results) {
    const out = {};
    MS.SKILL_IDS.forEach(function (id) { out[id] = { right: 0, of: 0 }; });
    results.forEach(function (r) { const s = out[r.skill]; if (s) { s.of += 1; if (r.correct) s.right += 1; } });
    return out;
  }

  // What to play for the current item.
  function playPlan(state) {
    const it = item(state);
    if (!it) return [];
    if (it.skill === 'rhythm') return MS.rhythmPlan(it.bar, BPM, KEY_VOICE);
    if (it.skill === 'pitch') return MS.pitchPlan(it, KEY_VOICE);
    return [{ at: 0, voice: it.voice, kind: 'instrument' }];
  }

  function noteSyms(bar) {
    return bar.map(function (k) { return MS.NOTES.filter(function (n) { return n.id === k; })[0].sym; }).join(' ');
  }

  function renderItem(state) {
    const e = JAM.esc;
    const it = item(state);
    const skill = MS.SKILLS.filter(function (s) { return s.id === it.skill; })[0];
    const done = !!state.result;
    const head = '<div class="jam-head"><span class="tag">' + skill.icon + ' ' + e(skill.he) + '</span><span aria-label="שאלה ' + (state.i + 1) + ' מתוך ' + state.items.length + '">' + (state.i + 1) + '/' + state.items.length + '</span></div>';
    const playLabel = it.skill === 'rhythm' ? '▶ השמעת התיבה' : it.skill === 'pitch' ? (it.mode === 'interval' ? '▶ השמעת שני הצלילים' : '▶ השמעת הצליל') : '▶ השמעה';
    const play = '<button type="button" class="secondary" data-act="play">' + playLabel + '</button>';
    let prompt = '';
    let body = '';
    function optClass(i) {
      if (!done) return '';
      if (i === it.answer) return ' msp-right';
      return i === state.picked ? ' msp-wrong' : '';
    }
    if (it.skill === 'rhythm') {
      prompt = 'הקשיבו לתיבה. איזו תיבה כתובה כמו מה ששמעתם?';
      body = '<div class="jam-row" role="group" aria-label="תיבות לבחירה">' + it.options.map(function (bar, i) {
        return '<button type="button" class="msp-opt msp-bar' + optClass(i) + '" data-act="opt" data-opt="' + i + '"' + (done ? ' disabled' : '') + ' aria-label="תיבה ' + (i + 1) + ': ' + e(MS.barHe(bar)) + '"><span aria-hidden="true">' + noteSyms(bar) + '</span></button>';
      }).join('') + '</div><p class="msp-legend" aria-hidden="true">𝅝 שלם = 4 פעמות · 𝅗𝅥 חצי = 2 · ♩ רבע = 1 · ♪ שמינית = חצי פעמה</p>';
    } else if (it.skill === 'pitch') {
      prompt = it.mode === 'interval'
        ? 'שמעתם שני צלילים. הראשון מסומן בקלידים. מצאו את השני ולחצו "בדיקה".'
        : 'הקשיבו לצליל. נסו את הקלידים, מצאו אותו צליל ולחצו "בדיקה".';
      body = '<div class="jam-row msp-keys" role="group" aria-label="קלידים">' + MS.SCALE.map(function (k) {
        const cls = (state.picked === k.step ? ' msp-picked' : '') + (it.ref === k.step ? ' msp-ref' : '') + (done && k.step === it.target ? ' msp-right' : '');
        return '<button type="button" class="msp-key' + cls + '" data-act="key" data-key="' + k.step + '" data-tap="' + KEY_VOICE + '" data-hz="' + k.hz + '" aria-pressed="' + (state.picked === k.step ? 'true' : 'false') + '"' + (done ? ' disabled' : '') +
          ' aria-label="' + k.he + (it.ref === k.step ? ' (הצליל הראשון)' : '') + '">' + k.he + '</button>';
      }).join('') + '</div>' + (done ? '' : '<div class="jam-row"><button type="button" class="primary" data-act="check">בדיקה</button></div>');
    } else if (it.skill === 'families') {
      prompt = 'לאיזו משפחה שייך ' + e(it.he) + '?';
      body = '<div class="jam-row" role="group" aria-label="משפחות כלים">' + it.options.map(function (f, i) {
        return '<button type="button" class="msp-opt' + optClass(i) + '" data-act="opt" data-opt="' + i + '"' + (done ? ' disabled' : '') + '>' + e(MS.FAMILY_HE[f]) + '</button>';
      }).join('') + '</div>';
    } else {
      prompt = 'איזה כלי מנגן עכשיו?';
      body = '<div class="jam-row" role="group" aria-label="כלים לבחירה">' + it.options.map(function (id, i) {
        return '<button type="button" class="msp-opt' + optClass(i) + '" data-act="opt" data-opt="' + i + '"' + (done ? ' disabled' : '') + '>' + e(heOf(id)) + '</button>';
      }).join('') + '</div>';
    }
    const after = done ? '<div class="jam-row"><button type="button" class="primary" data-act="next">' + (state.i + 1 < state.items.length ? 'הבא ←' : 'סיום') + '</button></div>' : '';
    return head + '<p class="jam-prompt">' + prompt + '</p><div class="jam-row">' + play + '</div>' + body + after;
  }

  function progressHtml(progress) {
    return '<ul class="msp-progress" aria-label="ההתקדמות שלכם במוזיקה">' + MS.SKILLS.map(function (s) {
      const p = progress.skills[s.id];
      return '<li>' + s.icon + ' ' + s.he + ': ' + p.correct + ' נכונות מתוך ' + p.tries + '</li>';
    }).join('') + '</ul>';
  }

  function renderHtml(state) {
    const e = JAM.esc;
    const msg = '<p class="jam-msg ' + (state.sound === 'right' ? 'good' : state.sound === 'soft' ? 'soft' : '') + '" role="status" aria-live="polite">' + e(state.message) + '</p>';
    if (state.phase === 'intro' || state.phase === 'skipped') {
      return '<div class="jam-head"><span class="tag">מסלול מוזיקליות · 2–3 דקות · רשות</span></div>' +
        '<h3>🎶 מסלול מוזיקליות קצר</h3>' +
        '<p>ארבע מיומנויות מוזיקה: קריאת קצב, התאמת גובה צליל, משפחות כלים וזיהוי גוון. לומדים מוזיקה בשביל המוזיקה. ההתקדמות כאן נשמרת בנפרד מהחשבון.</p>' +
        '<div class="jam-row"><button type="button" class="primary" data-act="start">מתחילים</button>' +
        (state.phase === 'intro' ? '<button type="button" class="secondary" data-act="skip">דילוג</button>' : '') + '</div>' + msg;
    }
    if (state.phase === 'done') {
      const sum = roundSummary(state.results);
      return '<h3>🎶 סיימתם את מסלול המוזיקליות</h3>' +
        '<ul class="msp-round" aria-label="הסבב הזה">' + MS.SKILLS.map(function (s) { return '<li>' + s.icon + ' ' + s.he + ': ' + sum[s.id].right + ' מתוך ' + sum[s.id].of + '</li>'; }).join('') + '</ul>' +
        '<h4>מההתחלה ועד היום</h4>' + progressHtml(state.progress) +
        '<div class="jam-row"><button type="button" class="secondary" data-act="again">עוד סבב</button></div>' + msg;
    }
    return renderItem(state) + msg;
  }

  function memStorage() {
    try { return root.localStorage || null; } catch (e) { return null; }
  }

  function mount(el, opts) {
    const storage = (opts && opts.storage) || memStorage();
    let seed = (opts && opts.seed) || (Date.now() & 0x7fffffff);
    let state = createState(seed, MS.loadProgress(storage));
    let playing = null;
    JAM.registerTapVoices();
    function stop() { if (playing) playing.stop(); playing = null; }
    function draw(focusSel) {
      el.innerHTML = renderHtml(state);
      const f = focusSel && el.querySelector(focusSel);
      if (f && f.focus) f.focus();
    }
    function play() { stop(); playing = JAM.playNotes(playPlan(state)); }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      let focus = null;
      if (act === 'play') { play(); return; }
      if (act === 'start' || act === 'again') { seed += 1; state = start(Object.assign({}, state, { seed: seed })); focus = '[data-act="play"]'; }
      else if (act === 'skip') { stop(); state = skip(state); focus = '[data-act="start"]'; }
      else if (act === 'key') { state = pickKey(state, b.getAttribute('data-key')); focus = '[data-key="' + b.getAttribute('data-key') + '"]'; }
      else if (act === 'opt' || act === 'check') {
        state = answer(state, act === 'opt' ? b.getAttribute('data-opt') : null);
        if (state.result) MS.saveProgress(storage, state.progress);
        focus = state.result ? '[data-act="next"]' : '[data-act="check"]';
        if (state.sound) JAM.feedback(state.sound === 'right');
      } else if (act === 'next') {
        stop();
        state = next(state);
        if (state.phase === 'done') MS.saveProgress(storage, state.progress);
        focus = state.phase === 'done' ? '[data-act="again"]' : '[data-act="play"]';
      }
      draw(focus);
    });
    JAM.stopWhenHidden(el, stop);
    draw();
    return {
      get state() { return state; },
      open: function () { stop(); state = createState(seed, state.progress); draw('[data-act="start"]'); },
    };
  }

  // "מסלול מוזיקליות" buttons at the end of a maths session: open the
  // music-games tab on the path's intro (where "דילוג" is one tap away).
  function wireOffers(doc, handle) {
    doc.addEventListener('click', function (ev) {
      const b = ev.target && ev.target.closest ? ev.target.closest('[data-msp-offer]') : null;
      if (!b) return;
      const tab = doc.getElementById('tab-musicGames');
      if (tab && tab.click) tab.click();
      if (handle && handle.open) handle.open();
      const card = doc.getElementById('mspCard');
      if (card && card.scrollIntoView) card.scrollIntoView({ block: 'start' });
    });
  }

  return { GAME: GAME, BPM: BPM, createState: createState, start: start, skip: skip, pickKey: pickKey, answer: answer, next: next, roundSummary: roundSummary, playPlan: playPlan, renderHtml: renderHtml, mount: mount, wireOffers: wireOffers };
});
