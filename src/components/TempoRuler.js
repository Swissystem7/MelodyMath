// MelodyMath — TempoRuler screen (#591, owner comment 6376161970).
//
// Measuring time and length in beat units, one method (M3, note lengths as
// units). Flow: a silent 12-item pre-test, then three practice steps
// (1 pick a stick and measure, 2 compare lengths in different units,
// 3 convert seconds <-> beats by BPM), a parallel post-test that opens 4
// weeks after the pre-test and a retention check 30 days after that.
// The add-on: measuring sticks that play. A stick sounds on pointerdown
// (data-tap, timbre only) and "נגן מקלות" plays the row at the exercise
// tempo. The instrument is chosen once, at topic start, from 2-4 options.
// With the music switch off the same practice is silent rods.
// State functions and renderHtml are pure and tested in Node; mount() wires
// them to the page and to localStorage.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TEMPO_RULER_SCREEN = api;
  if (typeof document !== 'undefined' && document.getElementById('trCard')) api.handle = api.mount(document.getElementById('trCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TR = root.MM_TEMPO_RULER || require('../lib/music/tempoRuler.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  function instrumentsApi() {
    if (root && typeof root.forTopic === 'function') return root;
    try { return require('../lib/instruments.js'); } catch (e) { return null; }
  }
  const GAME = 'tempoRuler';
  const TOPIC = 'measurement';
  const PLAY_BPM = 60;

  // 2-4 instruments of the measurement topic (same mechanism, timbre only).
  function instrumentChoices() {
    const I = instrumentsApi();
    const list = I && I.forTopic ? I.forTopic(TOPIC) : [];
    return list.slice(0, 3).map(function (x) { return { id: x.id, he: x.instrument.he, voice: x.voice }; });
  }

  function createState(record, now, showMusic, instrumentId) {
    const choices = instrumentChoices();
    const inst = choices.filter(function (c) { return c.id === instrumentId; })[0] || choices[0] || { id: 'darbuka', he: 'דרבוקה', voice: 'drumLow' };
    return {
      view: 'intro', record: record || TR.emptyRecord(), now: Number(now), showMusic: showMusic !== false,
      instrument: inst, phase: null, form: [], i: 0, answers: {},
      step: 0, ex: 0, stick: null, status: '', message: '', sound: null, saved: false,
    };
  }

  function chooseInstrument(state, id) {
    if (state.view !== 'intro') return state;
    const c = instrumentChoices().filter(function (x) { return x.id === id; })[0];
    return c ? Object.assign({}, state, { instrument: c }) : state;
  }

  // "מתחילים": the test that is due, or the practice.
  function start(state, now) {
    const t = now == null ? state.now : Number(now);
    const p = TR.phaseAt(state.record, t).phase;
    if (p === 'pre' || p === 'post' || p === 'retention') {
      return Object.assign({}, state, { now: t, view: 'test', phase: p, form: TR.buildForm(p), i: 0, answers: {}, message: '', saved: false });
    }
    if (p === 'done') return Object.assign({}, state, { now: t, view: 'result' });
    return startPractice(Object.assign({}, state, { now: t }));
  }

  function startPractice(state) {
    return Object.assign({}, state, { view: 'practice', step: 0, ex: 0, stick: null, status: '', message: '', sound: null });
  }

  // One test answer; after the last item the result is recorded.
  function answerTest(state, opt, now) {
    if (state.view !== 'test') return state;
    const it = state.form[state.i];
    if (!it || it.choices.indexOf(String(opt)) === -1) return state;
    const answers = Object.assign({}, state.answers);
    answers[it.id] = String(opt);
    if (state.i + 1 < state.form.length) return Object.assign({}, state, { answers: answers, i: state.i + 1, saved: false });
    const t = now == null ? state.now : Number(now);
    const record = TR.recordTest(state.record, state.phase, answers, t);
    const next = Object.assign({}, state, { answers: answers, record: record, now: t, saved: true });
    if (state.phase === 'pre') return Object.assign(startPractice(next), { message: 'מבחן הפתיחה נשמר. מתחילים לתרגל.' });
    return Object.assign(next, { view: 'result' });
  }

  function stepId(state) { return TR.STEPS[state.step].id; }
  function exercise(state) { return TR.PRACTICE[stepId(state)][state.ex]; }

  // The answer of the current exercise; in step 1 it follows the chosen stick.
  function currentAnswer(state) {
    const id = stepId(state);
    const ex = exercise(state);
    if (id === 'measure') return TR.measureWithSticks(ex.beats, state.stick || ex.stick).count;
    return TR.practiceAnswer(id, ex);
  }

  function practiceChoices(state) {
    const id = stepId(state);
    if (id === 'compare') {
      const ex = exercise(state);
      return [
        { v: 'a', he: TR.label(ex.a.value, ex.a.unit) },
        { v: 'b', he: TR.label(ex.b.value, ex.b.unit) },
        { v: 'same', he: 'שווים' },
      ];
    }
    const a = currentAnswer(state);
    const seen = [];
    [a, a * 2, a + 1, a / 2].forEach(function (x) {
      const r = Math.round(x * 1000) / 1000;
      if (r > 0 && seen.indexOf(r) === -1) seen.push(r);
    });
    const shift = Math.round(a) % seen.length;
    return seen.slice(shift).concat(seen.slice(0, shift)).map(function (x) { return { v: String(x), he: String(x) }; });
  }

  function pickStick(state, id) {
    if (state.view !== 'practice' || stepId(state) !== 'measure') return state;
    if (!TR.STICKS.some(function (s) { return s.id === id; })) return state;
    return Object.assign({}, state, { stick: id, status: '', message: '', sound: null });
  }

  function answerPractice(state, v) {
    if (state.view !== 'practice' || state.status === 'right') return state;
    if (stepId(state) === 'measure' && !state.stick) return Object.assign({}, state, { message: 'בחרו קודם מקל מדידה.', sound: null });
    const ok = String(v) === String(currentAnswer(state));
    if (ok) return Object.assign({}, state, { status: 'right', message: 'נכון! ' + explain(state), sound: 'right' });
    return Object.assign({}, state, { status: 'wrong', message: 'עוד לא. ' + hint(state), sound: 'wrong' });
  }

  function explain(state) {
    const id = stepId(state);
    const ex = exercise(state);
    if (id === 'measure') {
      const s = TR.UNITS[state.stick];
      return ex.beats + ' ÷ ' + s.beats + ' = ' + currentAnswer(state) + ' מקלות של ' + s.he + '.';
    }
    if (id === 'compare') return TR.label(ex.a.value, ex.a.unit) + ' = ' + TR.convertUnits(ex.a.value, ex.a.unit, 'beat') + ' פעמות, ' + TR.label(ex.b.value, ex.b.unit) + ' = ' + TR.convertUnits(ex.b.value, ex.b.unit, 'beat') + ' פעמות.';
    const perBeat = TR.bpmToSeconds(1, ex.bpm);
    return 'בטמפו ' + ex.bpm + ' BPM פעמה נמשכת ' + perBeat + ' שניות.';
  }

  function hint(state) {
    const id = stepId(state);
    if (id === 'measure') return 'כמה מקלות כאלה נכנסים לאורך הקו? אפשר לנגן אותם ולספור.';
    if (id === 'compare') return 'המירו את שני האורכים לפעמות ואז השוו.';
    return 'בדקו כמה שניות נמשכת פעמה אחת בטמפו הזה.';
  }

  // Next exercise, next step, then the end of practice.
  function nextPractice(state) {
    if (state.view !== 'practice') return state;
    const list = TR.PRACTICE[stepId(state)];
    const base = { status: '', message: '', sound: null, stick: null };
    if (state.ex + 1 < list.length) return Object.assign({}, state, base, { ex: state.ex + 1 });
    if (state.step + 1 < TR.STEPS.length) return Object.assign({}, state, base, { step: state.step + 1, ex: 0 });
    return Object.assign({}, state, base, { view: 'practiceDone' });
  }

  // Sticks drawn along the line for step 1, or [] when no stick is picked.
  function stickRow(state) {
    if (state.view !== 'practice' || stepId(state) !== 'measure' || !state.stick) return [];
    const ex = exercise(state);
    const m = TR.measureWithSticks(ex.beats, state.stick);
    const out = [];
    const whole = Math.floor(m.count);
    for (let i = 0; i < whole; i++) out.push({ i: i, width: (TR.UNITS[state.stick].beats / ex.beats) * 100 });
    return out;
  }

  function days(ms) { return Math.max(0, Math.ceil(ms / TR.DAY)); }

  function introHtml(state) {
    const e = JAM.esc;
    const ph = TR.phaseAt(state.record, state.now);
    const choices = instrumentChoices();
    const inst = choices.length >= 2 ? '<div class="jam-row" role="radiogroup" aria-label="בחירת כלי למקלות">' + choices.map(function (c) {
      const sel = c.id === state.instrument.id;
      return '<button type="button" class="secondary" role="radio" data-act="inst" data-inst="' + e(c.id) + '" aria-checked="' + sel + '">' + (sel ? '✓ ' : '') + e(c.he) + '</button>';
    }).join('') + '</div><p class="note">הכלי משנה רק את הצליל של המקלות. השיטה נשארת אותה שיטה.</p>' : '';
    let what;
    if (ph.phase === 'pre') what = 'מתחילים במבחן פתיחה קצר של 12 שאלות, בלי צליל. אחר כך מתרגלים בשלושה שלבים.';
    else if (ph.phase === 'post') what = 'עברו 4 שבועות. הגיע הזמן למבחן הסיום, 12 שאלות בלי צליל.';
    else if (ph.phase === 'retention') what = 'עברו 30 יום ממבחן הסיום. בדיקה קצרה: מה נשאר?';
    else if (ph.phase === 'done') what = 'כל המבחנים הושלמו. אפשר לראות את התוצאות.';
    else what = 'ממשיכים לתרגל. ' + (ph.postDueAt ? 'מבחן הסיום ייפתח בעוד ' + days(ph.postDueAt - state.now) + ' ימים.' : 'הבדיקה אחרי 30 יום תיפתח בעוד ' + days(ph.retentionDueAt - state.now) + ' ימים.');
    return '<p class="jam-prompt">מודדים זמן ואורך בפעמות: חצי פעמה, פעמה ותיבה.</p>' + (state.showMusic ? inst : '') +
      '<p>' + e(what) + '</p><div class="jam-row"><button type="button" class="primary" data-act="start">מתחילים</button></div>';
  }

  function testHtml(state) {
    const e = JAM.esc;
    const it = state.form[state.i];
    return '<p class="tag" role="status" aria-live="polite">' + e(TR.PHASE_HE[state.phase]) + ' · שאלה ' + (state.i + 1) + ' מתוך ' + state.form.length + '</p>' +
      '<p class="jam-prompt" id="trQ">' + e(it.prompt) + '</p>' +
      '<div class="jam-row" role="group" aria-labelledby="trQ">' + it.choices.map(function (c) {
        return '<button type="button" class="secondary" data-act="opt" data-opt="' + e(c) + '"><bdi>' + e(c) + '</bdi></button>';
      }).join('') + '</div><p class="note">במבחן אין צליל ואין משוב, כדי למדוד מה אתם יודעים בלי עזרה.</p>';
  }

  function practiceHtml(state) {
    const e = JAM.esc;
    const id = stepId(state);
    const ex = exercise(state);
    const on = state.showMusic;
    const voice = state.instrument.voice;
    let body = '';
    if (id === 'measure') {
      const sticks = '<div class="jam-row" role="radiogroup" aria-label="בחירת מקל מדידה">' + TR.STICKS.map(function (s) {
        const sel = s.id === state.stick;
        const tap = on ? ' data-tap="' + e(voice) + '"' : '';
        return '<button type="button" class="secondary tr-stick" role="radio" data-act="stick" data-stick="' + s.id + '"' + tap + ' aria-checked="' + sel + '" aria-label="מקל של ' + s.he + ', ' + s.beats + ' פעמות">' +
          '<span class="tr-rod" style="width:' + (s.beats * 18) + 'px"></span>' + e(s.he) + '</button>';
      }).join('') + '</div>';
      const row = stickRow(state).map(function (r) {
        return '<span class="tr-seg" data-seg="' + r.i + '" style="width:' + r.width + '%"></span>';
      }).join('');
      body = sticks + '<div class="tr-line" role="img" aria-label="קו באורך ' + ex.beats + ' פעמות' + (state.stick ? ', מכוסה במקלות של ' + TR.UNITS[state.stick].he : '') + '">' + row + '</div>' +
        (on && state.stick ? '<div class="jam-row"><button type="button" class="secondary" data-act="play">▶ נגן מקלות</button></div>' : '');
    }
    const prompt = id === 'measure'
      ? (state.stick ? 'קו באורך ' + TR.label(ex.beats, 'beat') + '. כמה מקלות של ' + TR.UNITS[state.stick].he + ' מודדים אותו?' : 'קו באורך ' + TR.label(ex.beats, 'beat') + '. בחרו מקל מדידה.')
      : TR.practicePrompt(id, ex);
    const opts = id === 'measure' && !state.stick ? '' : '<div class="jam-row" role="group" aria-label="תשובות">' + practiceChoices(state).map(function (c) {
      return '<button type="button" class="secondary" data-act="ans" data-v="' + e(c.v) + '"><bdi>' + e(c.he) + '</bdi></button>';
    }).join('') + '</div>';
    return '<p class="tag">' + e(TR.STEPS[state.step].he) + ' · תרגיל ' + (state.ex + 1) + ' מתוך ' + TR.PRACTICE[id].length + '</p>' +
      '<p class="jam-prompt">' + e(prompt) + '</p>' + body + opts +
      '<p class="jam-msg ' + (state.status === 'right' ? 'good' : state.status === 'wrong' ? 'soft' : '') + '" role="status" aria-live="polite">' + e(state.message) + '</p>' +
      (state.status === 'right' ? '<div class="jam-row"><button type="button" class="primary" data-act="next">הבא ←</button></div>' : '');
  }

  function pct(x) { return Math.round(x * 100) + '%'; }

  function resultHtml(state) {
    const e = JAM.esc;
    const r = TR.report(state.record);
    if (!r) return '<p>אין עדיין תוצאות.</p>';
    let lines = '<li>שאלות שלא תורגלו, בפתיחה: ' + pct(r.pre) + ', בסיום: ' + pct(r.post) + '</li>' +
      '<li>גודל השינוי: ' + (r.d == null ? 'אי אפשר לחשב (אין פיזור בפתיחה)' : '<bdi dir="ltr">d = ' + r.d + '</bdi>') + ' · היעד: <bdi dir="ltr">' + TR.TARGET_D + '</bdi></li>';
    if (r.retention != null) lines += '<li>אחרי 30 יום: ' + pct(r.retention) + (r.retained ? ' · התוצאה נשמרה' : ' · התוצאה לא נשמרה במלואה') + '</li>';
    else lines += '<li>הבדיקה אחרי 30 יום עוד לא נעשתה.</li>';
    return '<p class="jam-prompt">התוצאות שלכם</p><ul class="tr-result">' + lines + '</ul><p class="note">' + e(TR.LOCAL_COUNT_NOTE) + '</p>' +
      '<div class="jam-row"><button type="button" class="secondary" data-act="practice">חזרה לתרגול</button></div>';
  }

  function renderHtml(state) {
    let body;
    if (state.view === 'test') body = testHtml(state);
    else if (state.view === 'practice') body = practiceHtml(state);
    else if (state.view === 'practiceDone') {
      const ph = TR.phaseAt(state.record, state.now);
      body = '<p class="jam-prompt">סיימתם את שלושת השלבים!</p><p>' +
        (ph.postDueAt ? 'מבחן הסיום ייפתח בעוד ' + days(ph.postDueAt - state.now) + ' ימים. עד אז אפשר לתרגל שוב.' : 'אפשר לתרגל שוב.') +
        '</p><div class="jam-row"><button type="button" class="secondary" data-act="practice">תרגול נוסף</button><button type="button" class="primary" data-act="start">המשך</button></div>';
    } else if (state.view === 'result') body = resultHtml(state);
    else body = introHtml(state);
    const toggle = state.view === 'test' ? '' : JAM.musicToggleHtml(state.showMusic);
    return '<div class="jam-head"><span class="tag">M3 · משכי תווים כיחידות מידה · מדידה</span>' + toggle + '</div>' +
      '<h3>' + (state.showMusic && state.view !== 'test' ? '📏🥁 סרגל הטמפו' : 'סרגל הטמפו') + '</h3>' + body;
  }

  function mount(el, props) {
    const p = props || {};
    const storage = p.storage || root.localStorage;
    const clock = p.now || function () { return Date.now(); };
    JAM.registerTapVoices();
    let state = createState(TR.loadRecord(storage), clock(), JAM.loadShowMusic(GAME, storage));
    let playing = null;
    function stop() { if (playing) playing.stop(); playing = null; }
    function draw(focusSel) {
      el.innerHTML = renderHtml(state);
      const f = (focusSel && el.querySelector(focusSel)) || null;
      if (f && f.focus) f.focus();
    }
    function sound() {
      if (!state.showMusic || state.view === 'test') return;
      if (state.sound === 'right') JAM.feedback(true);
      if (state.sound === 'wrong') JAM.feedback(false);
    }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      let focus = '[data-act="' + act + '"]';
      if (act === 'inst') state = chooseInstrument(state, b.getAttribute('data-inst'));
      else if (act === 'start') { state = start(state, clock()); focus = '[data-act]'; }
      else if (act === 'opt') {
        state = answerTest(state, b.getAttribute('data-opt'), clock());
        if (state.saved) saveRecord();
        focus = '[data-act]';
      }
      else if (act === 'stick') { state = pickStick(state, b.getAttribute('data-stick')); focus = '[data-stick="' + b.getAttribute('data-stick') + '"]'; }
      else if (act === 'ans') state = answerPractice(state, b.getAttribute('data-v'));
      else if (act === 'next') { stop(); state = nextPractice(state); focus = '[data-act]'; }
      else if (act === 'practice') { state = startPractice(state); focus = '[data-act]'; }
      else if (act === 'music') { stop(); state = Object.assign({}, state, { showMusic: !state.showMusic, sound: null }); JAM.saveShowMusic(GAME, state.showMusic, storage); }
      else if (act === 'play') {
        stop();
        const ex = exercise(state);
        const m = TR.measureWithSticks(ex.beats, state.stick);
        playing = JAM.playNotes(TR.stickPlan(state.stick, Math.floor(m.count), PLAY_BPM, state.instrument.voice), function (n) {
          const s = el.querySelector('[data-seg="' + n.stick + '"]');
          if (s) { s.classList.remove('lit'); void s.offsetWidth; s.classList.add('lit'); }
        });
        return;
      }
      draw(focus);
      sound();
    });
    function saveRecord() { TR.saveRecord(storage, state.record); state = Object.assign({}, state, { saved: false }); }
    JAM.stopWhenHidden(el, stop);
    draw();
    return {
      get state() { return state; },
      // Re-read the stored record (e.g. after the date moved on).
      reload: function () { stop(); state = createState(TR.loadRecord(storage), clock(), state.showMusic, state.instrument.id); draw(); },
    };
  }

  return {
    GAME: GAME, TOPIC: TOPIC, instrumentChoices: instrumentChoices, createState: createState, chooseInstrument: chooseInstrument,
    start: start, startPractice: startPractice, answerTest: answerTest, currentAnswer: currentAnswer, practiceChoices: practiceChoices,
    pickStick: pickStick, answerPractice: answerPractice, nextPractice: nextPractice, stickRow: stickRow, renderHtml: renderHtml, mount: mount,
  };
});
