// MelodyMath — PolyChallengePad (#683, Refs #665): optional polyrhythm (M4,
// weak) for grades ה׳-ו׳ only, hidden elsewhere; the topic is taught with M2.
// Voice 1 is the child's instrument, voice 2 another family, each in its
// colour and side. Shuffled "pick the reason", then a check with no music.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_POLY_CHALLENGE_PAD = api;
  if (typeof document !== 'undefined' && document.getElementById('pcCard')) api.mount(document.getElementById('pcCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const PC = root.MM_POLY_CHALLENGE || require('../lib/polyChallenge.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const IN = typeof root.instrumentById === 'function' ? root : require('../lib/instruments.js');
  const GAME = 'polyChallenge', BPM = 90;
  const GRADE_NUM = { 'ה': 5, 'ו': 6 };
  const PARTNER = { percussion: 'keys', keys: 'pluck', strings: 'breathy', winds: 'pluck' }; // never the child's family
  const VOICE_HZ = [330, 392, 659.25];
  const FLEX = { right: 'flex-start', center: 'center', left: 'flex-end' };

  function createState(opts) {
    const o = opts || {};
    return { grade: GRADE_NUM[o.grade] || 0, index: 0, lvl: PC.level(0, o.rand), stage: 'reason',
      showMusic: o.showMusic !== false, instrument: o.instrument || 'darbuka', status: '', message: '' };
  }
  // A wrong answer only asks again: no punishment sound.
  function pickReason(state, k) {
    if (state.stage !== 'reason') return state;
    if (Number(k) !== state.lvl.reason.answer) return Object.assign({}, state, { status: 'retry', message: 'עוד לא. הקשיבו שוב: מתי כל התופים מכים יחד?' });
    return Object.assign({}, state, { stage: 'check', status: 'right', message: 'נכון! עכשיו בדיקה בלי מוזיקה.' });
  }
  function answerCheck(state, value) {
    if (state.stage !== 'check') return state;
    if (Number(value) !== state.lvl.check.answer) return Object.assign({}, state, { status: 'retry', message: 'עוד לא. כתבו כפולות של כל מספר וחפשו את הראשונה המשותפת.' });
    return Object.assign({}, state, { stage: 'done', status: 'right', message: 'נכון! ' + state.lvl.meet + ' היא הכפולה המשותפת הקטנה ביותר.' });
  }
  function next(state, rand) {
    const index = (state.index + 1) % PC.levels().length;
    return Object.assign({}, state, { index: index, lvl: PC.level(index, rand), stage: 'reason', status: '', message: '' });
  }
  function voicesFor(state) { const x = IN.instrumentById(state.instrument) || { family: 'percussion', voice: 'drumLow' }; return [x.voice, PARTNER[x.family] || 'keys', 'woodBar']; }

  // Beats 0..meet; each voice sounds on its multiples, all of them on `meet`.
  function playPlan(lvl, voices) {
    const notes = [];
    for (let b = 0; b <= lvl.meet; b++) lvl.voices.forEach(function (v, k) {
      if (b % v.every === 0) notes.push({ at: b * 60 / BPM, voice: voices[k], hz: VOICE_HZ[k], beat: b, meet: b === lvl.meet });
    });
    return notes;
  }
  function lanesHtml(lvl, e) {
    return lvl.voices.map(function (v) {
      let cells = '';
      for (let b = 1; b <= lvl.meet; b++) {
        const hit = b % v.every === 0;
        cells += '<span class="ttg-beat' + (b === lvl.meet ? ' acc' : '') + '" data-beat="' + b + '"' + (hit ? ' style="background:' + v.colour + ';color:#fff">' + b : '>·') + '</span>';
      }
      return '<div class="jam-row" style="justify-content:' + FLEX[v.side] + '"><b style="color:' + v.colour + '">' + e(v.name) + ' · כל ' + v.every + '</b></div>' +
        '<div class="ttg-beats" role="img" aria-label="תוף ' + e(v.name) + ' מכה כל ' + v.every + ' פעמות">' + cells + '</div>';
    }).join('');
  }
  function renderHtml(state) {
    if (!PC.isAvailable(state.grade)) return '';
    const e = JAM.esc;
    const lvl = state.lvl;
    let body = '<div class="jam-row"><button type="button" class="secondary" data-act="next">רמה הבאה ←</button></div>';
    if (state.stage === 'reason') {
      body = lanesHtml(lvl, e) + (state.showMusic ? '<div class="jam-row"><button type="button" class="secondary" data-act="play">▶ נגנו את התופים</button></div>' : '') +
        '<p class="jam-prompt">' + e(lvl.reason.question) + '</p><div class="jam-row" role="group" aria-label="סיבות">' +
        lvl.reason.choices.map(function (c, k) { return '<button type="button" class="secondary" data-act="reason" data-k="' + k + '">' + e(c) + '</button>'; }).join('') + '</div>';
    } else if (state.stage === 'check') {
      body = '<p class="jam-prompt">בדיקה בלי מוזיקה: ' + e(lvl.check.question) + '</p><div class="jam-row">' +
        '<input type="number" inputmode="numeric" id="pcAnswer" aria-label="תשובה" style="max-width:120px"><button type="button" class="primary" data-act="check">בדיקה</button></div>';
    }
    return '<div class="jam-head"><span class="tag">M4 · אתגר רשות · כיתות ה׳–ו׳</span>' + JAM.musicToggleHtml(state.showMusic) + '</div>' +
      '<h3>🥁 אתגר: תופים שנפגשים</h3><p class="note">רשות. הדרך העיקרית לכפולות היא פעמות מודגשות (M2).</p>' +
      '<p>רמה ' + (state.index + 1) + ' מתוך ' + PC.levels().length + ': <bdi dir="ltr">' + e(lvl.id) + '</bdi></p>' + body +
      '<p class="jam-msg ' + (state.status === 'right' ? 'good' : state.status === 'retry' ? 'soft' : '') + '" role="status" aria-live="polite">' + e(state.message) + '</p>';
  }
  function mount(el) {
    const store = root.localStorage;
    function read(key) { try { return store.getItem(key); } catch (err) { return null; } }
    let state = createState({ grade: read('mm-grade'), showMusic: JAM.loadShowMusic(GAME), instrument: read('mm.myInstrument') || undefined });
    let playing = null;
    JAM.registerTapVoices();
    function stop() { if (playing) playing.stop(); playing = null; }
    function light(n) { if (n.meet) el.querySelectorAll('[data-beat="' + n.beat + '"]').forEach(function (s) { s.classList.remove('jam-lit'); void s.offsetWidth; s.classList.add('jam-lit'); }); }
    function draw() { el.innerHTML = renderHtml(state); el.hidden = !el.innerHTML; }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      const act = b && b.getAttribute('data-act');
      if (!act) return;
      stop();
      if (act === 'play') { if (state.showMusic) playing = JAM.playNotes(playPlan(state.lvl, voicesFor(state)), light); return; }
      if (act === 'reason') state = pickReason(state, b.getAttribute('data-k'));
      else if (act === 'check') state = answerCheck(state, (el.querySelector('#pcAnswer') || {}).value);
      else if (act === 'next') state = next(state);
      else if (act === 'music') { state = Object.assign({}, state, { showMusic: !state.showMusic }); JAM.saveShowMusic(GAME, state.showMusic); }
      draw();
    });
    // Follow the grade picker elsewhere on the page.
    function regrade() { state = Object.assign({}, state, { grade: GRADE_NUM[read('mm-grade')] || 0 }); draw(); }
    if (root.document) root.document.addEventListener('click', function (ev) { if (ev.target.closest && ev.target.closest('[data-grade]')) setTimeout(regrade, 0); });
    JAM.stopWhenHidden(el, stop);
    draw();
    return { get state() { return state; } };
  }
  return { GAME: GAME, createState: createState, pickReason: pickReason, answerCheck: answerCheck, next: next, voicesFor: voicesFor, playPlan: playPlan, renderHtml: renderHtml, mount: mount };
});
