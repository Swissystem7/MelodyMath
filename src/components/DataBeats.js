// MelodyMath — DataBeats + PercentMix screen (#591, owner comment 6376162984).
//
// One card, one flow, the measurement structure of 6376159285:
//   1. a silent 12-item pre-test (dataPercentCheck.js, form A),
//   2. three practice steps:
//      step 1 DataBeats: hear a bar graph in time, one tap per unit, and find
//             the mean (M1, cajón timbre);
//      step 2 DataBeats: the trend and the range of another series;
//      step 3 PercentMix: fill X% of one bar of 100 sub-beats (M3, darbuka
//             timbre; TODO-source, see percentMix.js);
//   3. the parallel post-test (form B) when 4 weeks have passed, then the
//      30-day check (form A again).
// Pitch is an optional add-on in steps 1-2, off by default and labelled as
// weak evidence. The music switch turns every step into a silent exercise.
// Choices only at the start of a step (the pitch add-on, the music switch);
// nothing changes mid-question. No timers, no coins, no randomness.
// State functions and renderHtml are pure and tested in Node; mount() wires
// them to the page.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_DATA_BEATS_SCREEN = api;
  if (typeof document !== 'undefined' && document.getElementById('dbCard')) api.handle = api.mount(document.getElementById('dbCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const DB = root.MM_DATA_BEATS || require('../lib/music/dataBeats.js');
  const PM = root.MM_PERCENT_MIX || require('../lib/music/percentMix.js');
  const CK = root.MM_DATA_PERCENT_CHECK || require('../lib/music/dataPercentCheck.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const GAME = 'dataBeats';
  const LEARNER = 'local';
  const BPM = 100;
  const STEPS = [
    { id: 'mean', he: 'שלב 1 מתוך 3 · ממוצע', tag: 'M1 · גרף שומעים לפי זמן' },
    { id: 'trendRange', he: 'שלב 2 מתוך 3 · מגמה וטווח', tag: 'M1 · גרף שומעים לפי זמן' },
    { id: 'percent', he: 'שלב 3 מתוך 3 · אחוזים בתיבה', tag: 'M3 · 100 תת־פעמות בתיבה' },
  ];

  function trendSeries() { return DB.SERIES.filter(function (s) { return !s.zigzag; }); }

  function questionsFor(step, round) {
    if (step === 0) {
      const s = DB.SERIES[round % DB.SERIES.length];
      return { series: s, qs: [DB.meanQuestion(s.values)] };
    }
    if (step === 1) {
      const list = trendSeries();
      const s = list[(round + 1) % list.length];
      return { series: s, qs: [DB.trendQuestion(s.values), DB.rangeQuestion(s.values)] };
    }
    return { target: PM.TARGETS[round % PM.TARGETS.length], qs: [] };
  }

  function createState(opts) {
    const o = opts || {};
    return {
      view: 'home', data: o.data || CK.empty(), now: o.now || Date.now(), learner: o.learner || LEARNER,
      showMusic: o.showMusic !== false, pitch: false, round: 0,
      test: null, step: 0, q: 0, fill: [], status: '', message: '', over: 0, sound: null,
    };
  }

  function rec(state) { return state.data.learners[state.learner] || {}; }
  function next(state) { return CK.nextStep(rec(state), state.now); }

  // ---- tests (silent) ----
  function startTest(state, phase) {
    if (next(state).phase !== phase) return state;
    return Object.assign({}, state, { view: 'test', test: { phase: phase, i: 0, items: CK.items(phase), answers: {} }, message: '', sound: null });
  }

  // One answer per item, then the next item; no right/wrong shown during a
  // test. After the last item the result is saved and shown.
  function answerTest(state, choice) {
    const t = state.test;
    const it = t.items[t.i];
    if (!it || it.choices.indexOf(choice) === -1) return state;
    const answers = Object.assign({}, t.answers);
    answers[it.id] = choice;
    if (t.i + 1 < t.items.length) return Object.assign({}, state, { test: Object.assign({}, t, { i: t.i + 1, answers: answers }) });
    const data = CK.record(state.data, state.learner, t.phase, answers, state.now);
    return Object.assign({}, state, { view: 'result', data: data, test: Object.assign({}, t, { answers: answers, done: true }), message: '' });
  }

  // ---- practice ----
  function startPractice(state) {
    if (!rec(state).pre) return state;
    return Object.assign({}, state, { view: 'step', step: 0, q: 0, fill: [], status: '', message: '', over: 0, sound: null });
  }

  function choose(state, choice) {
    if (state.view !== 'step' || state.status === 'right') return state;
    const q = questionsFor(state.step, state.round).qs[state.q];
    if (!q) return state;
    const val = q.kind === 'trend' ? choice : Number(choice);
    if (val === q.answer) {
      const say = q.kind === 'trend' ? 'נכון, המגמה ' + DB.TREND_HE[q.answer] + '.' : q.kind === 'mean' ? 'נכון, הממוצע הוא ' + q.answer + ' הקשות.' : 'נכון, הטווח הוא ' + q.answer + ' הקשות.';
      return Object.assign({}, state, { status: 'right', message: say, sound: 'right' });
    }
    const hint = q.kind === 'mean' ? 'עוד לא. נסו להעביר הקשות מעמודה ארוכה לקצרה עד שכולן שוות.'
      : q.kind === 'range' ? 'עוד לא. ספרו את העמודה הארוכה ואת הקצרה, וחסרו.'
        : 'עוד לא. הקשיבו שוב: העמודות מתארכות, מתקצרות או נשארות דומות?';
    return Object.assign({}, state, { status: 'try', message: hint, sound: 'wrong' });
  }

  function tapTile(state, id) {
    if (state.view !== 'step' || state.step !== 2 || state.status === 'right') return Object.assign({}, state, { sound: null });
    const target = questionsFor(2, state.round).target;
    if (target.allowed.indexOf(id) === -1) return Object.assign({}, state, { sound: null });
    const r = PM.addTile(state.fill, id, target.percent);
    if (!r.accepted) return Object.assign({}, state, { over: r.over, status: 'try', message: 'עברת ב־' + r.over + ' תת־פעמות. נסו אריח קצר יותר.', sound: 'wrong' });
    if (r.status === 'exact') {
      const p = PM.percentToSubbeats(target.percent);
      return Object.assign({}, state, { fill: r.fill, over: 0, status: 'right', sound: 'cadence',
        message: target.percent + '% = ' + p.subbeats + ' מתוך 100 תת־פעמות = ' + p.fraction + ' מהתיבה.' });
    }
    return Object.assign({}, state, { fill: r.fill, over: 0, status: '', message: '', sound: null });
  }

  function undo(state) {
    return Object.assign({}, state, { fill: state.fill.slice(0, -1), status: '', over: 0, message: '', sound: null });
  }

  function checkPercent(state) {
    const target = questionsFor(2, state.round).target;
    const c = PM.checkFill(state.fill, target.percent);
    if (c.status === 'exact') return state;
    return Object.assign({}, state, { status: 'try', message: 'חסרות ' + c.missing + ' תת־פעמות.', sound: 'wrong' });
  }

  // After a right answer: the next question of the step, the next step, or
  // back home when all three steps are done.
  function advance(state) {
    if (state.view !== 'step' || state.status !== 'right') return state;
    const qs = questionsFor(state.step, state.round).qs;
    const base = { status: '', message: '', over: 0, sound: null, fill: [] };
    if (state.q + 1 < qs.length) return Object.assign({}, state, base, { q: state.q + 1 });
    if (state.step + 1 < STEPS.length) return Object.assign({}, state, base, { step: state.step + 1, q: 0 });
    return Object.assign({}, state, base, { view: 'home', round: state.round + 1, step: 0, q: 0, message: 'סיימתם את שלושת השלבים.' });
  }

  function setPitch(state, on) {
    // Only between questions: never while an answer is half given.
    if (state.view === 'step' && state.status === 'try') return state;
    return Object.assign({}, state, { pitch: !!on });
  }
  function home(state) { return Object.assign({}, state, { view: 'home', test: null, message: '', sound: null }); }

  // Notes to play for the current step (empty when music is off).
  function playPlan(state, voices) {
    if (!state.showMusic || state.view !== 'step') return [];
    const v = voices || {};
    if (state.step < 2) return DB.sonifySeries(questionsFor(state.step, state.round).series.values, { bpm: BPM, pitch: state.pitch, voice: v.data }).notes;
    return PM.barPlan(state.fill, 90, v.percent);
  }

  // ---- render ----
  const e = JAM.esc;
  function choiceButtons(list, act, label) {
    return '<div class="jam-row" role="group" aria-label="' + e(label) + '">' + list.map(function (c) {
      const text = act === 'trend' ? DB.TREND_HE[c] : c;
      return '<button type="button" class="secondary db-choice" data-act="' + act + '" data-val="' + e(c) + '"><bdi>' + e(text) + '</bdi></button>';
    }).join('') + '</div>';
  }

  function columnsHtml(values) {
    const max = Math.max.apply(null, values);
    return '<div class="db-cols" role="img" aria-label="' + values.map(function (v, i) { return 'עמודה ' + (i + 1) + ': ' + v + ' הקשות'; }).join(', ') + '">' +
      values.map(function (v, i) {
        let dots = '';
        for (let n = 0; n < v; n++) dots += '<span class="db-dot"></span>';
        return '<span class="db-col" data-col="' + i + '" style="--h:' + (max ? v / max : 0) + '">' + dots + '<b>' + v + '</b></span>';
      }).join('') + '</div>';
  }

  function scoreLine(s) {
    return 'נכונות: ' + s.total + ' מתוך ' + s.of.total + ' (שתורגלו: ' + s.practised + ' מתוך ' + s.of.practised + ', שלא תורגלו: ' + s.unpractised + ' מתוך ' + s.of.unpractised + ')';
  }

  function homeHtml(state) {
    const r = rec(state);
    const n = next(state);
    let body = '<p>מבחן פתיחה של 12 שאלות בלי צליל, שלושה שלבי תרגול, ומבחן מקביל אחרי 4 שבועות. התוצאות נשמרות רק במכשיר הזה.</p>';
    const rows = CK.CHECK_PHASES.filter(function (p) { return r[p]; }).map(function (p) { return '<li>' + CK.PHASE_HE[p] + ': ' + scoreLine(r[p].score) + '</li>'; }).join('');
    if (rows) body += '<ul class="db-scores">' + rows + '</ul>';
    const acts = [];
    if (n.phase === 'pre') acts.push('<button type="button" class="primary" data-act="test" data-phase="pre">מתחילים מבחן פתיחה</button>');
    if (r.pre) acts.push('<button type="button" class="primary" data-act="practice">תרגול: שלושה שלבים</button>');
    if (n.phase === 'post' || n.phase === 'retention') acts.push('<button type="button" class="primary" data-act="test" data-phase="' + n.phase + '">' + CK.PHASE_HE[n.phase] + '</button>');
    if (n.phase === 'wait-post') body += '<p class="db-wait">מבחן הסיום ייפתח בעוד ' + n.daysLeft + ' ימים.</p>';
    if (n.phase === 'wait-retention') body += '<p class="db-wait">הבדיקה החוזרת תיפתח בעוד ' + n.daysLeft + ' ימים.</p>';
    const ret = CK.retention(r, state.now);
    if (ret.status === 'kept') body += '<p>אחרי 30 יום: התוצאה בשאלות שלא תורגלו נשמרה.</p>';
    if (ret.status === 'dropped') body += '<p>אחרי 30 יום: התוצאה בשאלות שלא תורגלו ירדה. כדאי לחזור לשלבי התרגול.</p>';
    body += '<p class="db-note">' + e(CK.CHECK_DISCLAIMER) + '</p>';
    return body + '<div class="jam-row">' + acts.join('') + '</div>';
  }

  function testHtml(state) {
    const t = state.test;
    const it = t.items[t.i];
    return '<p class="tag">' + CK.PHASE_HE[t.phase] + ' · שאלה ' + (t.i + 1) + ' מתוך ' + t.items.length + ' · בלי צליל</p>' +
      '<p class="jam-prompt" id="dbQ">' + e(it.prompt) + '</p>' +
      '<div class="jam-row" role="group" aria-labelledby="dbQ">' + it.choices.map(function (c) {
        return '<button type="button" class="secondary db-choice" data-act="answer" data-val="' + e(c) + '"><bdi dir="ltr">' + e(c) + '</bdi></button>';
      }).join('') + '</div>';
  }

  function resultHtml(state) {
    const t = state.test;
    const s = rec(state)[t.phase].score;
    const es = CK.effectSize(state.data);
    let out = '<p class="jam-prompt">' + CK.PHASE_HE[t.phase] + ' נשמר.</p><p>' + scoreLine(s) + '</p>';
    if (t.phase !== 'pre' && es.d !== null) out += '<p>גודל אפקט בשאלות שלא תורגלו, על ' + es.n + ' ילדים במכשיר: <bdi dir="ltr">d = ' + es.d + '</bdi> (יעד: לפחות 0.3).</p>';
    return out + '<p class="db-note">' + e(CK.CHECK_DISCLAIMER) + '</p><div class="jam-row"><button type="button" class="primary" data-act="home">המשך</button></div>';
  }

  function stepHtml(state, voices) {
    const on = state.showMusic;
    const st = STEPS[state.step];
    const set = questionsFor(state.step, state.round);
    let out = '<p class="tag">' + st.he + ' · ' + st.tag + '</p>';
    if (state.step < 2) {
      const q = set.qs[state.q];
      out += '<p>' + e(set.series.he) + '.</p>' + columnsHtml(set.series.values);
      if (on) {
        out += '<div class="jam-row"><button type="button" class="secondary" data-act="play">▶ שומעים את הגרף</button>' +
          '<button type="button" class="secondary" data-act="pitch" aria-pressed="' + (state.pitch ? 'true' : 'false') + '">' +
          (state.pitch ? '🎚 גם גובה צליל: פועל' : '🎚 גם גובה צליל') + ' · תוספת, ראיות חלשות</button></div>';
      }
      out += '<p class="jam-prompt" id="dbQ">' + e(q.he) + '</p>' + choiceButtons(q.choices, q.kind === 'trend' ? 'trend' : 'pick', q.he);
    } else {
      const target = set.target;
      const sum = PM.filled(state.fill);
      out += '<p class="jam-prompt">' + e(target.he) + '. בתיבה 100 תת־פעמות, 25 בכל פעמה.</p>' +
        '<div class="db-bar' + (state.status === 'right' ? ' done' : '') + '" role="img" aria-label="מולאו ' + sum + ' מתוך 100 תת־פעמות">' +
        state.fill.map(function (id, i) { const t = PM.tile(id); return '<span class="db-seg" data-seg="' + i + '" style="width:' + t.n + '%">' + t.n + '</span>'; }).join('') + '</div>' +
        '<p>מילאתם <bdi dir="ltr">' + sum + '/100 = ' + sum + '%</bdi></p>' +
        '<div class="jam-row" role="group" aria-label="אריחים">' + target.allowed.map(function (id) {
          const t = PM.tile(id);
          const tap = on ? ' data-tap="' + e((voices && voices.percent) || 'drumLow') + '"' : '';
          return '<button type="button" class="fbp-tile" data-act="tile" data-tile="' + id + '"' + tap + ' aria-label="אריח ' + t.he + ', ' + t.n + ' תת־פעמות"><b><bdi dir="ltr">' + t.n + '</bdi></b><span>' + t.he + '</span></button>';
        }).join('') + '</div><div class="jam-row">' + (on ? '<button type="button" class="secondary" data-act="play">▶ נגן תיבה</button>' : '') +
        '<button type="button" class="secondary" data-act="undo">↩ הסרת אריח</button><button type="button" class="primary" data-act="check">בדיקה</button></div>';
    }
    if (state.status === 'right') out += '<div class="jam-row"><button type="button" class="primary" data-act="next">' + (state.step === 2 ? 'סיום השלבים' : 'הבא ←') + '</button></div>';
    return out;
  }

  function renderHtml(state, voices) {
    const head = '<div class="jam-head"><span class="tag">נתונים ואחוזים · כיתות ד׳–ו׳</span>' + (state.view === 'step' ? JAM.musicToggleHtml(state.showMusic) : '') + '</div>' +
      '<h3>📊 DataBeats + PercentMix: נתונים ואחוזים בפעמות</h3>';
    let body;
    if (state.view === 'test') body = testHtml(state);
    else if (state.view === 'result') body = resultHtml(state);
    else if (state.view === 'step') body = stepHtml(state, voices);
    else body = homeHtml(state);
    const msg = '<p class="jam-msg ' + (state.status === 'right' ? 'good' : state.status === 'try' ? 'soft' : '') + '" role="status" aria-live="polite">' + e(state.message) + '</p>';
    return head + body + msg;
  }

  function mount(el, props) {
    const p = props || {};
    const storage = p.storage || root.localStorage;
    const voices = { data: JAM.instrument('cajon', 'woodClick').voice, percent: JAM.instrument('darbuka', 'drumLow').voice };
    JAM.registerTapVoices();
    let state = createState({ data: CK.load(storage), showMusic: JAM.loadShowMusic(GAME), now: p.now ? p.now() : Date.now() });
    let playing = null;
    function stop() { if (playing) playing.stop(); playing = null; }
    function draw(focusSel) {
      el.innerHTML = renderHtml(state, voices);
      const f = (focusSel && el.querySelector(focusSel)) || el.querySelector('.db-choice, [data-act="next"]');
      if (f && f.focus && focusSel !== false) f.focus();
    }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      const val = b.getAttribute('data-val');
      state = Object.assign({}, state, { now: p.now ? p.now() : Date.now() });
      let focus = null;
      if (act === 'test') state = startTest(state, b.getAttribute('data-phase'));
      else if (act === 'answer') state = answerTest(state, val);
      else if (act === 'practice') state = startPractice(state);
      else if (act === 'pick' || act === 'trend') state = choose(state, val);
      else if (act === 'tile') { state = tapTile(state, b.getAttribute('data-tile')); focus = '[data-tile="' + b.getAttribute('data-tile') + '"]'; }
      else if (act === 'undo') state = undo(state);
      else if (act === 'check') state = checkPercent(state);
      else if (act === 'next') { stop(); state = advance(state); }
      else if (act === 'home') state = home(state);
      else if (act === 'pitch') { state = setPitch(state, !state.pitch); focus = '[data-act="pitch"]'; }
      else if (act === 'music') { stop(); state = Object.assign({}, state, { showMusic: !state.showMusic, sound: null }); JAM.saveShowMusic(GAME, state.showMusic); focus = '[data-act="music"]'; }
      else if (act === 'play') {
        stop();
        playing = JAM.playNotes(playPlan(state, voices), function (n) {
          const sel = n.kind === 'tap' ? '[data-col="' + n.bar + '"]' : n.kind === 'tile' ? '[data-seg="' + n.tile + '"]' : null;
          const s = sel && el.querySelector(sel);
          if (s) { s.classList.remove('lit'); void s.offsetWidth; s.classList.add('lit'); }
        });
        return;
      }
      if (state.view === 'result' && state.test && state.test.done) CK.save(storage, state.data);
      draw(focus);
      if (state.showMusic && state.view === 'step') {
        if (state.sound === 'wrong') JAM.feedback(false);
        if (state.sound === 'right') JAM.feedback(true);
        if (state.sound === 'cadence') { JAM.feedback(true); setTimeout(function () { JAM.cadence(voices.percent); }, 250); }
      }
    });
    JAM.stopWhenHidden(el, stop);
    draw(false);
    return {
      get state() { return state; },
      reload: function () { state = Object.assign(createState({ data: CK.load(storage), showMusic: state.showMusic, now: p.now ? p.now() : Date.now() })); draw(false); },
    };
  }

  return {
    GAME: GAME, STEPS: STEPS, BPM: BPM,
    questionsFor: questionsFor, createState: createState, startTest: startTest, answerTest: answerTest,
    startPractice: startPractice, choose: choose, tapTile: tapTile, undo: undo, checkPercent: checkPercent,
    advance: advance, setPitch: setPitch, home: home, playPlan: playPlan, renderHtml: renderHtml, mount: mount,
  };
});
