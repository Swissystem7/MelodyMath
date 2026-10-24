// MelodyMath — RhythmPolygon screen: the rhythm clock (#591, owner comment
// 6376161263, geometry).
//
// N beats on a circle make a regular polygon. The child names its sides, the
// angle 360/N between neighbouring beats, its symmetry axes and turns, and
// hears a turn of the polygon as the rhythm starting later. One method only:
// M6 (rhythmic patterns and symmetry). The flow follows the RhythmMaster
// measurement: a silent 12-item pre-test, three practice steps (sides,
// angles, symmetry and rotation), a parallel post-test once 4 weeks have
// passed and a retention check 30 days later (polygonCheck.js).
// Choices: the instrument (timbre only) at topic start, nowhere else.
// "גובה לפי זווית" is an optional add-on with weak evidence, off by default.
// The showMusic switch makes the practice silent; the maths stays the same.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_RHYTHM_POLYGON_SCREEN = api;
  if (typeof document !== 'undefined' && document.getElementById('rpCard')) api.handle = api.mount(document.getElementById('rpCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const RP = root.MM_RHYTHM_POLYGON || require('../lib/music/rhythmPolygon.js');
  const CHK = root.MM_POLYGON_CHECK || require('../lib/music/polygonCheck.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const GAME = 'rhythmPolygon';
  const BPM = 100;
  // Timbre choice at topic start: the M6 instruments of instruments.js.
  const INSTRUMENTS = ['marimba', 'dizi'];
  const TEST_HE = { pre: 'בדיקת פתיחה', post: 'בדיקת סיום', retention: 'בדיקת זכירה' };

  const STEPS = [
    { he: 'שלב 1 · צלעות', items: [3, 4, 6, 8].map(function (n) { return CHK.buildItem('sides', { n: n }); }) },
    { he: 'שלב 2 · זוויות', items: [3, 4, 6, 8].map(function (n) { return CHK.buildItem('angle', { n: n }); }) },
    { he: 'שלב 3 · סימטריה וסיבוב', items: [
      CHK.buildItem('axes', { n: 6 }),
      CHK.buildItem('shift', { cycle: 8, onsets: [0, 1, 4], k: 2 }),
      CHK.buildItem('same', { cycle: 6, a: [0, 1, 3], b: [2, 3, 5] }),
      CHK.buildItem('same', { cycle: 8, a: [0, 1, 3], b: [0, 2, 3] }),
    ] },
  ];

  const HINT = {
    sides: 'כל פעמה היא פינה. ספרו את הפינות.',
    angle: 'סיבוב שלם הוא 360°. חלקו אותו במספר הפעמות.',
    axes: 'במצולע משוכלל יש צירי סימטריה כמספר הצלעות.',
    shift: 'כל פעמה בשעון היא 360° חלקי מספר הפעמות.',
    same: 'סובבו את הקצב הראשון פעמה אחרי פעמה ובדקו אם הוא נהיה השני. היפוך במראה הוא לא סיבוב.',
  };

  function base(rec, now, showMusic) {
    return { phase: 'pre', i: 0, answers: [], step: 0, item: 0, solved: false, message: '', sound: null,
      showMusic: showMusic !== false, pitch: false, turn: 0, instrument: INSTRUMENTS[0], daysLeft: 0, report: CHK.report(rec, now) };
  }

  // Where a returning child lands.
  function start(rec, now, showMusic) {
    const s = base(rec, now, showMusic);
    if (!rec || !rec.pre) return Object.assign(s, { phase: 'choose' });
    if (!rec.post) return Object.assign(s, { phase: 'steps' });
    return refresh(s, rec, now);
  }

  function refresh(state, rec, now) {
    const s = Object.assign({}, state, { report: CHK.report(rec, now), sound: null, message: '' });
    if (CHK.canTake(rec, 'post', now).ok) return Object.assign(s, { phase: 'post', i: 0, answers: [] });
    if (CHK.canTake(rec, 'retention', now).ok) return Object.assign(s, { phase: 'retention', i: 0, answers: [] });
    if (rec && rec.retention) return Object.assign(s, { phase: 'report' });
    const next = rec && rec.post ? 'retention' : 'post';
    return Object.assign(s, { phase: 'wait', daysLeft: CHK.canTake(rec, next, now).daysLeft || 0 });
  }

  function choose(state, id) {
    if (state.phase !== 'choose' || INSTRUMENTS.indexOf(id) < 0) return state;
    return Object.assign({}, state, { phase: 'pre', instrument: id, i: 0, answers: [] });
  }

  function formOf(phase) { return CHK.buildForm(CHK.FORM_OF[phase]); }

  function currentItem(state) {
    if (TEST_HE[state.phase]) return formOf(state.phase)[state.i] || null;
    if (state.phase === 'steps') return STEPS[state.step].items[state.item];
    return null;
  }

  // A test answer: no feedback, next item at once; after item 12 the results
  // are stored. Returns { state, rec }.
  function answerTest(state, rec, choice, now) {
    const it = currentItem(state);
    if (!it || !TEST_HE[state.phase]) return { state: state, rec: rec };
    const answers = state.answers.concat([{ id: it.id, correct: CHK.grade(it, choice) }]);
    if (answers.length < formOf(state.phase).length) return { state: Object.assign({}, state, { i: state.i + 1, answers: answers }), rec: rec };
    const nextRec = CHK.record(rec, state.phase, answers, now);
    if (state.phase === 'pre') return { state: Object.assign({}, state, { phase: 'steps', step: 0, item: 0, answers: [], report: CHK.report(nextRec, now) }), rec: nextRec };
    return { state: refresh(Object.assign({}, state, { answers: [] }), nextRec, now), rec: nextRec };
  }

  function answerStep(state, choice) {
    const it = currentItem(state);
    if (state.phase !== 'steps' || !it || state.solved) return state;
    if (CHK.grade(it, choice)) return Object.assign({}, state, { solved: true, message: 'נכון! ' + it.answer, sound: 'right' });
    return Object.assign({}, state, { message: 'עוד לא. ' + HINT[it.kind], sound: 'wrong' });
  }

  function nextStep(state, rec, now) {
    if (state.phase !== 'steps' || !state.solved) return state;
    const s = Object.assign({}, state, { solved: false, message: '', sound: null, turn: 0 });
    if (s.item + 1 < STEPS[s.step].items.length) return Object.assign(s, { item: s.item + 1 });
    if (s.step + 1 < STEPS.length) return Object.assign(s, { step: s.step + 1, item: 0 });
    return refresh(s, rec, now);
  }

  // Notes for "נגן": the clock once, and for a turned rhythm the second one after it.
  function playPlan(item, turn, voice, pitch) {
    const c = item.clock;
    if (!c) return [];
    const opts = { bpm: BPM, voice: voice, pitch: pitch };
    const first = RP.cyclePlan(RP.rotate(c.onsets, turn || 0, c.cycle), c.cycle, opts);
    if (!c.turned) return first;
    const gap = (c.cycle + 1) * 60 / BPM;
    return first.concat(RP.cyclePlan(c.turned, c.cycle, opts).map(function (n) { return Object.assign({}, n, { at: n.at + gap, second: true }); }));
  }

  function pts(poly) {
    return poly.vertices.map(function (v) { return v.x + ',' + v.y; }).join(' ');
  }

  function clockSvg(c, turn) {
    if (!c) return '';
    const on = RP.rotate(c.onsets, turn || 0, c.cycle);
    const a = RP.polygonFromBeats(on, c.cycle);
    const b = c.turned ? RP.polygonFromBeats(c.turned, c.cycle) : null;
    let dots = '';
    for (let i = 0; i < c.cycle; i++) {
      const r = i * 2 * Math.PI / c.cycle;
      const corner = on.indexOf(i) >= 0;
      dots += '<circle data-beat="' + i + '" cx="' + (Math.sin(r)).toFixed(3) + '" cy="' + (-Math.cos(r)).toFixed(3) + '" r="' + (corner ? 0.09 : 0.05) + '" class="' + (corner ? 'rp-corner' : 'rp-beat') + '"/>';
    }
    const label = 'שעון קצב של ' + c.cycle + ' פעמות, ' + a.nameHe + (b ? ', ולידו הקצב השני' : '');
    return '<svg class="rp-clock" viewBox="-1.25 -1.25 2.5 2.5" role="img" aria-label="' + JAM.esc(label) + '">' +
      '<circle cx="0" cy="0" r="1" class="rp-ring"/>' +
      (b && b.isPolygon ? '<polygon class="rp-poly2" points="' + pts(b) + '"/>' : '') +
      (a.isPolygon ? '<polygon class="rp-poly" points="' + pts(a) + '"/>' : '') + dots + '</svg>';
  }

  function optionsHtml(item, act) {
    return '<div class="jam-row" role="group" aria-label="תשובות">' + item.choices.map(function (c) {
      return '<button type="button" class="secondary" data-act="' + act + '" data-opt="' + JAM.esc(c) + '"><bdi dir="ltr">' + JAM.esc(c) + '</bdi></button>';
    }).join('') + '</div>';
  }

  function reportHtml(r) {
    if (r.gain == null) return '';
    let t = 'שינוי בפריטים שלא תורגלו: <bdi dir="ltr">' + r.gain + '</bdi> סטיות תקן (היעד: <bdi dir="ltr">' + CHK.TARGET_SD + '</bdi>).';
    if (r.retentionGain != null) t += ' אחרי 30 יום: <bdi dir="ltr">' + r.retentionGain + '</bdi>.';
    return '<p class="rp-report">' + t + '</p><p class="hint">' + JAM.esc(r.disclaimer) + '</p>';
  }

  function renderHtml(state) {
    const e = JAM.esc;
    const head = '<div class="jam-head"><span class="tag">M6 · שעון קצב · גאומטריה</span>' + (state.phase === 'steps' ? JAM.musicToggleHtml(state.showMusic) : '') + '</div>';
    if (state.phase === 'choose') {
      return head + '<h3>🕒 שעון הקצב</h3><p class="jam-prompt">פעמות על מעגל יוצרות מצולע. באיזה כלי לנגן? הכלי משנה רק את הצליל.</p>' +
        '<div class="jam-row" role="group" aria-label="בחירת כלי">' + INSTRUMENTS.map(function (id) {
          return '<button type="button" class="secondary" data-act="choose" data-inst="' + id + '">' + e(JAM.instrument(id, 'woodBar').he) + '</button>';
        }).join('') + '</div><p class="hint">קודם בדיקת פתיחה קצרה, בלי צלילים ובלי ציון.</p>';
    }
    if (TEST_HE[state.phase]) {
      const it = currentItem(state);
      return head + '<h3>' + TEST_HE[state.phase] + ' · <bdi dir="ltr">' + (state.i + 1) + '/12</bdi></h3>' +
        '<p class="jam-prompt">' + e(it.prompt) + '</p>' + clockSvg(it.clock, 0) + optionsHtml(it, 'test');
    }
    if (state.phase === 'steps') {
      const st = STEPS[state.step];
      const it = currentItem(state);
      const on = state.showMusic;
      const sound = on ? '<div class="jam-row"><button type="button" class="secondary" data-act="play">▶ נגן</button>' +
        (it.clock && !it.clock.turned ? '<button type="button" class="secondary" data-act="turn">↻ הזיזו את הקצב בפעמה</button>' : '') +
        '<button type="button" class="secondary" data-act="pitch" aria-pressed="' + state.pitch + '">' + e(RP.PITCH_ADDON.he) + '</button></div>' +
        // Free play before answering (touch goal A.3): sounds on pointerdown via data-tap, multi-touch.
        '<div class="jam-free" role="group" aria-label="נגינה חופשית"><span>🎵 נגנו חופשי:</span>' +
        '<button type="button" class="jam-pad" data-tap="' + e(JAM.instrument(state.instrument, 'woodBar').voice) + '">פינה</button>' +
        '<button type="button" class="jam-pad" data-tap="woodClick">פעמה</button></div>' : '';
      return head + '<h3>' + st.he + ' <bdi dir="ltr">(' + (state.item + 1) + '/' + st.items.length + ')</bdi></h3>' +
        '<p class="jam-prompt">' + e(it.prompt) + '</p>' + clockSvg(it.clock, state.turn) +
        (state.turn ? '<p class="hint">הקצב זז ב־' + state.turn + ' פעמות, המצולע הסתובב ב־<bdi dir="ltr">' + (state.turn * 360 / it.clock.cycle) + '°</bdi>. הוא נשאר אותו מצולע.</p>' : '') +
        sound + optionsHtml(it, 'step') +
        '<div class="jam-row"><button type="button" class="primary" data-act="next"' + (state.solved ? '' : ' disabled') + '>הבא ←</button></div>' +
        '<p class="jam-msg ' + (state.solved ? 'good' : state.sound === 'wrong' ? 'soft' : '') + '" role="status" aria-live="polite">' + e(state.message) + '</p>';
    }
    if (state.phase === 'wait') {
      return head + '<h3>🕒 סיימתם את שלושת השלבים</h3><p class="jam-prompt">הבדיקה הבאה תיפתח בעוד <bdi dir="ltr">' + state.daysLeft + '</bdi> ימים. בינתיים אפשר לחזור לתרגל.</p>' +
        reportHtml(state.report) + '<div class="jam-row"><button type="button" class="secondary" data-act="again">תרגול חוזר</button><button type="button" class="secondary" data-act="refresh">בדיקה אם נפתח</button></div>';
    }
    return head + '<h3>🕒 סיימתם את כל הבדיקות</h3>' + reportHtml(state.report);
  }

  function mount(el, props) {
    const p = props || {};
    const storage = p.storage || root.localStorage;
    const clock = p.now || function () { return Date.now(); };
    JAM.registerTapVoices();
    let rec = CHK.load(storage);
    let state = start(rec, clock(), JAM.loadShowMusic(GAME));
    let playing = null;
    function stop() { if (playing) playing.stop(); playing = null; }
    function voice() { return JAM.instrument(state.instrument, 'woodBar').voice; }
    function play(turn) {
      stop();
      const it = currentItem(state);
      if (!it || !state.showMusic) return;
      playing = JAM.playNotes(playPlan(it, turn, voice(), state.pitch), function (n) {
        const d = el.querySelector('[data-beat="' + n.beat + '"]');
        if (d && d.classList) { d.classList.remove('lit'); void d.getBoundingClientRect(); d.classList.add('lit'); }
      });
    }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      const now = clock();
      if (act === 'choose') state = choose(state, b.getAttribute('data-inst'));
      else if (act === 'test') { const r = answerTest(state, rec, b.getAttribute('data-opt'), now); state = r.state; if (r.rec !== rec) { rec = r.rec; CHK.save(storage, rec); } }
      else if (act === 'step') { state = answerStep(state, b.getAttribute('data-opt')); if (state.showMusic && state.sound) JAM.feedback(state.sound === 'right'); }
      else if (act === 'next') { stop(); state = nextStep(state, rec, now); }
      else if (act === 'again') state = Object.assign({}, state, { phase: 'steps', step: 0, item: 0, solved: false, message: '' });
      else if (act === 'refresh') { rec = CHK.load(storage); state = refresh(state, rec, now); }
      else if (act === 'music') { stop(); state = Object.assign({}, state, { showMusic: !state.showMusic, sound: null }); JAM.saveShowMusic(GAME, state.showMusic); }
      else if (act === 'pitch') state = Object.assign({}, state, { pitch: !state.pitch });
      else if (act === 'play') { play(state.turn); return; }
      else if (act === 'turn') { const it = currentItem(state); state = Object.assign({}, state, { turn: (state.turn + 1) % it.clock.cycle }); }
      el.innerHTML = renderHtml(state);
      const f = el.querySelector('[data-act="' + act + '"]:not([disabled])') || el.querySelector('[data-act]');
      if (f && f.focus) f.focus();
      if (act === 'turn') play(state.turn);
    });
    JAM.stopWhenHidden(el, stop);
    el.innerHTML = renderHtml(state);
    return { get state() { return state; }, get rec() { return rec; } };
  }

  return { GAME: GAME, STEPS: STEPS, INSTRUMENTS: INSTRUMENTS, start: start, refresh: refresh, choose: choose, currentItem: currentItem,
    answerTest: answerTest, answerStep: answerStep, nextStep: nextStep, playPlan: playPlan, clockSvg: clockSvg, renderHtml: renderHtml, mount: mount };
});
