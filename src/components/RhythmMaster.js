// MelodyMath — RhythmMaster screen, the polyrhythm challenge track (#591,
// owner comment 6376159285).
//
// Flow: a silent 12-item pre-test (form A), then practice steps. A step is
// one task (when the voices meet again / the ratio of strokes / a fraction
// of the cycle, interleaved) answered from 2-4 options, then "why?": the
// child picks the reason from 3 options. "המציאו חידה" lets the child build
// a polyrhythm and a question; validatePosedProblem refuses one without a
// solution. After 3 steps the parallel post-test (form B) can be taken; the
// screen says it is meant for 4 weeks after the pre-test and an earlier one
// is kept out of the effect size. The retention test (form C) opens 30 days
// after the post-test.
// Difficulty adapts to about 80% success (adaptStep). TODO-source: the owner
// marked adaptive difficulty as having no direct evidence here.
// The reducer and renderHtml are pure and tested in Node; mount() wires them
// to the page.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_RHYTHM_MASTER_UI = api;
  if (typeof document !== 'undefined' && document.getElementById('rmCard')) api.handle = api.mount(document.getElementById('rmCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const RM = root.MM_RHYTHM_MASTER || (typeof require === 'function' ? require('../lib/music/rhythmMaster.js') : {});
  const MS = root.MM_RHYTHM_MEASURE || (typeof require === 'function' ? require('../lib/music/rhythmMeasure.js') : {});
  const JAM = root.MM_JAM || (typeof require === 'function' ? require('./jamKit.js') : null);
  const GAME = 'rhythmMaster';
  const ADAPT_KEY = 'mm.rhythmMaster.adapt';
  const STEPS_BEFORE_POST = 3;
  const POSE_VOICES = ['1', '3/2', '2', '5/2', '3', '7/2', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  function createState(opts) {
    const o = opts || {};
    const record = o.record || MS.emptyRecord();
    const adapt = o.adapt || RM.initialAdapt(0);
    return {
      phase: 'intro',
      record: record,
      adapt: adapt,
      step: record.steps || 0,
      visitSteps: 0,
      task: null,
      sub: 'answer',
      answer: null,
      answerOk: null,
      reason: null,
      reasonOk: null,
      message: '',
      move: null,
      test: null,
      pose: { draft: { voices: ['3', '4', ''], kind: 'lcm', within: '', strokes: '', answer: '' }, result: null },
      showMusic: o.showMusic !== false,
      sound: null,
      now: Number(o.now) || 0,
    };
  }

  function withTask(state) {
    return Object.assign({}, state, { task: RM.taskForStep(state.adapt.level, state.step), sub: 'answer', answer: null, answerOk: null, reason: null, reasonOk: null, message: '' });
  }

  function startTest(state, phase) {
    return Object.assign({}, state, { phase: phase, test: { phase: phase, items: MS.formForPhase(phase), index: 0, answers: [] }, message: '', sound: null });
  }

  function testAnswer(state, value) {
    const t = state.test;
    if (!t) return state;
    const answers = t.answers.concat([String(value)]);
    if (answers.length < t.items.length) {
      return Object.assign({}, state, { test: Object.assign({}, t, { answers: answers, index: answers.length }), sound: null });
    }
    const score = MS.scoreForm(t.items, answers);
    const record = MS.recordTest(state.record, t.phase, score, state.now);
    const done = Object.assign({}, state, { record: record, test: null, sound: null, lastScore: { phase: t.phase, score: score } });
    if (t.phase === 'pre') return withTask(Object.assign(done, { phase: 'practice' }));
    return Object.assign(done, { phase: 'summary', message: '' });
  }

  function answer(state, value) {
    if (state.phase !== 'practice' || state.sub !== 'answer' || !state.task) return state;
    const ok = RM.checkAnswer(state.task, value);
    const a = RM.adaptStep(state.adapt, ok);
    const msg = ok ? 'נכון! עכשיו: למה?' : 'עוד לא. התשובה היא ' + state.task.answer + '. עכשיו: למה?';
    return Object.assign({}, state, { sub: 'explain', answer: String(value), answerOk: ok, adapt: a.state, move: a.move ? { move: a.move, added: a.added } : null, message: msg, sound: ok ? 'right' : 'wrong' });
  }

  function reason(state, id) {
    if (state.phase !== 'practice' || state.sub !== 'explain') return state;
    const ok = RM.checkReason(state.task, id);
    const right = state.task.reasons.filter(function (r) { return r.id === state.task.reasonId; })[0];
    const msg = (ok ? 'נימוק נכון: ' : 'הנימוק המתאים: ') + right.he + '.';
    return Object.assign({}, state, {
      sub: 'done', reason: id, reasonOk: ok, message: msg, sound: null,
      step: state.step + 1, visitSteps: state.visitSteps + 1, record: MS.addSteps(state.record, 1),
    });
  }

  function poseCheck(state, draft) {
    const d = Object.assign({}, state.pose.draft, draft || {});
    const q = { kind: d.kind };
    if (d.kind === 'lcm' && d.within !== '') q.within = d.within;
    if (d.kind === 'fraction') { q.voice = 0; q.strokes = d.strokes === '' ? 1 : d.strokes; }
    const result = RM.validatePosedProblem({ voices: d.voices, question: q, answer: d.answer });
    return Object.assign({}, state, { pose: { draft: d, result: result }, sound: result.ok ? 'right' : 'wrong' });
  }

  // One reducer for every button. ctx.now is the clock (ms), injected.
  function reduce(state, action, ctx) {
    const a = action || {};
    const s = Object.assign({}, state, { now: ctx && ctx.now != null ? Number(ctx.now) : state.now });
    if (a.type === 'start-test') return startTest(s, a.phase);
    if (a.type === 'test-answer') return testAnswer(s, a.value);
    if (a.type === 'practice') return withTask(Object.assign(s, { phase: 'practice' }));
    if (a.type === 'answer') return answer(s, a.value);
    if (a.type === 'reason') return reason(s, a.id);
    if (a.type === 'next') return withTask(s);
    if (a.type === 'pose-open') return Object.assign(s, { phase: 'pose', sound: null });
    if (a.type === 'pose-check') return poseCheck(s, a.draft);
    if (a.type === 'pose-close') return Object.assign(s, { phase: 'practice', sound: null });
    if (a.type === 'music') return Object.assign(s, { showMusic: !s.showMusic, sound: null });
    return s;
  }

  function dateHe(ms) {
    if (ms == null) return '';
    const d = new Date(ms);
    return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear();
  }

  function choiceButtons(act, list, attr) {
    const e = JAM.esc;
    return '<div class="jam-row rm-choices" role="group" aria-label="אפשרויות">' + list.map(function (c) {
      const v = typeof c === 'string' ? c : c.id;
      const label = typeof c === 'string' ? '<bdi dir="ltr">' + e(c) + '</bdi>' : e(c.he);
      return '<button type="button" class="secondary rm-choice" data-act="' + act + '" data-' + attr + '="' + e(v) + '">' + label + '</button>';
    }).join('') + '</div>';
  }

  function voicesLine(task) {
    return '<p class="rm-voices">קולות: <bdi dir="ltr">' + task.voices.map(RM.voiceText).join(' : ') + '</bdi></p>';
  }

  function renderTest(state) {
    const t = state.test;
    const it = t.items[t.index];
    return '<h3>' + MS.PHASE_HE[t.phase] + '</h3>' +
      '<p class="rm-progress" aria-live="polite">שאלה ' + (t.index + 1) + ' מתוך ' + t.items.length + ' · בלי צליל ובלי משוב עד הסוף</p>' +
      '<p class="jam-prompt" data-item="' + JAM.esc(it.slot) + '">' + JAM.esc(it.prompt) + '</p>' +
      choiceButtons('test', it.choices, 'value');
  }

  function postButton(state) {
    const sch = MS.schedule(state.record, state.now);
    if (state.record.post) {
      if (sch.next === 'retention') return '<button type="button" class="primary" data-act="start-test" data-phase="retention">' + MS.PHASE_HE.retention + '</button>';
      return state.record.retention ? '' : '<p class="rm-note">' + MS.PHASE_HE.retention + ' תיפתח ב־' + dateHe(sch.retentionOpens) + ' (30 יום אחרי המבחן המקביל).</p>';
    }
    if (state.record.steps < STEPS_BEFORE_POST) return '<p class="rm-note">המבחן המקביל נפתח אחרי ' + STEPS_BEFORE_POST + ' שלבים.</p>';
    const early = sch.next !== 'post';
    return '<button type="button" class="' + (early ? 'secondary' : 'primary') + '" data-act="start-test" data-phase="post">' + MS.PHASE_HE.post + '</button>' +
      (early ? '<p class="rm-note">מומלץ לעשות אותו מ־' + dateHe(sch.postOpens) + ' (4 שבועות אחרי מבחן הפתיחה). מבחן מוקדם נשמר, אבל לא נכנס לחישוב השיפור.</p>' : '');
  }

  function renderPractice(state) {
    const e = JAM.esc;
    const t = state.task;
    const level = RM.LEVELS[state.adapt.level];
    const move = state.move && state.move.move === 'up'
      ? '<p class="rm-note" role="note">' + (state.move.added === 'voice' ? 'נוסף קול!' : 'נוסף קול בחצאי פעמה!') + '</p>'
      : (state.move && state.move.move === 'down' ? '<p class="rm-note" role="note">חוזרים רגע לשלב קל יותר.</p>' : '');
    let body = '<p class="jam-prompt">' + e(t.prompt) + '</p>' + voicesLine(t);
    if (state.showMusic) {
      body += '<div class="jam-row"><button type="button" class="secondary" data-act="play">▶ השמעת המחזור</button></div>';
      // Free play before answering: one pad per voice, sounding on
      // pointerdown through data-tap (multi-touch, glow, vibrate). Never scored.
      body += '<div class="jam-free" role="group" aria-label="נגינה חופשית על הקולות"><span>🥁 נגנו חופשי:</span>' + t.voices.map(function (v, i) {
        return '<button type="button" class="jam-pad" data-tap="' + RM.VOICE_TIMBRES[i % RM.VOICE_TIMBRES.length] + '" aria-label="קול ' + ['א׳', 'ב׳', 'ג׳', 'ד׳'][i] + ', כל ' + e(RM.voiceText(v)) + '">קול ' + ['א׳', 'ב׳', 'ג׳', 'ד׳'][i] + '</button>';
      }).join('') + '</div>';
    }
    if (state.sub === 'answer') body += choiceButtons('answer', t.choices, 'value');
    if (state.sub === 'explain') body += '<p class="rm-why"><b>למה?</b> בחרו נימוק:</p>' + choiceButtons('reason', t.reasons, 'id');
    if (state.sub === 'done') body += '<div class="jam-row"><button type="button" class="primary" data-act="next">שלב הבא ←</button></div>';
    return '<h3>🥁 RhythmMaster · שלב ' + (state.step + (state.sub === 'done' ? 0 : 1)) + '</h3>' +
      '<p class="rm-level">' + e(RM.KIND_HE[t.kind]) + ' · ' + e(level.he) + '</p>' + move + body +
      '<p class="jam-msg ' + (state.answerOk ? 'good' : state.answerOk === false ? 'soft' : '') + '" role="status" aria-live="polite">' + e(state.message) + '</p>' +
      '<div class="jam-row"><button type="button" class="secondary" data-act="pose-open">✏️ המציאו חידה</button></div>' + postButton(state);
  }

  function renderPose(state) {
    const e = JAM.esc;
    const d = state.pose.draft;
    const sel = function (id, i) {
      return '<label for="' + id + '">קול ' + ['א׳', 'ב׳', 'ג׳'][i] + '</label><select id="' + id + '" data-pose="v' + i + '"><option value="">—</option>' +
        POSE_VOICES.map(function (v) { return '<option value="' + v + '"' + (String(d.voices[i]) === v ? ' selected' : '') + '>כל ' + v + '</option>'; }).join('') + '</select>';
    };
    const kinds = RM.KINDS.map(function (k) { return '<option value="' + k + '"' + (d.kind === k ? ' selected' : '') + '>' + RM.KIND_HE[k] + '</option>'; }).join('');
    const r = state.pose.result;
    let out = '';
    if (r && !r.ok) out = '<p class="jam-msg soft" role="status" aria-live="polite">לחידה הזאת אין פתרון: ' + e(r.messages.join(' ')) + '</p>';
    if (r && r.ok) {
      out = '<p class="jam-msg good" role="status" aria-live="polite">יש לחידה פתרון: <bdi dir="ltr">' + e(r.answer) + '</bdi>.' +
        (r.answerMatches === true ? ' גם התשובה שלכם נכונה.' : r.answerMatches === false ? ' התשובה שכתבתם שונה, בדקו שוב.' : '') + '</p>';
    }
    return '<h3>✏️ המציאו חידה</h3><p>בחרו 2 או 3 קולות (כל כמה פעימות כל קול מכה) ושאלה. המערכת בודקת שיש לחידה פתרון.</p>' +
      '<div class="rm-pose" role="group" aria-label="בניית חידה">' + sel('rmPoseV0', 0) + sel('rmPoseV1', 1) + sel('rmPoseV2', 2) +
      '<label for="rmPoseKind">שאלה</label><select id="rmPoseKind" data-pose="kind">' + kinds + '</select>' +
      '<label for="rmPoseWithin">לפני פעימה (לא חובה, לשאלת מתי נפגשים)</label><input id="rmPoseWithin" data-pose="within" inputmode="numeric" value="' + e(d.within) + '">' +
      '<label for="rmPoseStrokes">כמה מכות של קול א׳ (לשאלת שבר)</label><input id="rmPoseStrokes" data-pose="strokes" inputmode="numeric" value="' + e(d.strokes) + '">' +
      '<label for="rmPoseAnswer">התשובה שלכם (לא חובה)</label><input id="rmPoseAnswer" data-pose="answer" dir="ltr" value="' + e(d.answer) + '"></div>' +
      '<div class="jam-row"><button type="button" class="primary" data-act="pose-check">בדיקת החידה</button><button type="button" class="secondary" data-act="pose-close">חזרה לתרגול</button></div>' + out;
  }

  function scoreLine(label, entry) {
    if (!entry) return '';
    const s = entry.score;
    return '<li>' + label + ': ' + s.correct + ' מתוך ' + s.total + ' (בפריטים שלא תורגלו: ' + s.unpractised.correct + ' מתוך ' + s.unpractised.total + ')' + (entry.early ? ' · מוקדם' : '') + '</li>';
  }

  function renderSummary(state) {
    const r = state.record;
    const ret = MS.retentionCheck(r);
    return '<h3>הסיכום שלכם</h3><ul class="rm-summary">' + scoreLine(MS.PHASE_HE.pre, r.pre) + scoreLine(MS.PHASE_HE.post, r.post) + scoreLine(MS.PHASE_HE.retention, r.retention) + '</ul>' +
      (ret ? '<p>' + (ret.retained ? 'התוצאה נשמרה גם אחרי ' + ret.days + ' יום.' : 'אחרי ' + ret.days + ' יום התוצאה ירדה. כדאי לחזור לתרגל.') + '</p>' : '') +
      '<p class="rm-note">' + MS.MEASURE_DISCLAIMER + '</p>' +
      '<div class="jam-row"><button type="button" class="primary" data-act="practice">ממשיכים לתרגל</button></div>' + (r.post ? postButton(state) : '');
  }

  function renderHtml(state) {
    let body;
    if (state.phase === 'intro') {
      body = '<h3>🥁 RhythmMaster · אתגר פולי־ריתמוס</h3><p>כמה תופים מנגנים יחד, כל אחד בקצב שלו. מנבאים מתי ייפגשו שוב, בונים יחסים ושברים מהמכות, ומסבירים למה.</p>' +
        (state.record.pre ? '<div class="jam-row"><button type="button" class="primary" data-act="practice">ממשיכים לתרגל</button></div>' + postButton(state)
          : '<p>מתחילים במבחן פתיחה קצר של 12 שאלות, בלי צליל.</p><div class="jam-row"><button type="button" class="primary" data-act="start-test" data-phase="pre">' + MS.PHASE_HE.pre + '</button></div>');
    } else if (state.phase === 'pre' || state.phase === 'post' || state.phase === 'retention') body = renderTest(state);
    else if (state.phase === 'practice') body = renderPractice(state);
    else if (state.phase === 'pose') body = renderPose(state);
    else body = renderSummary(state);
    const toggle = state.phase === 'practice' || state.phase === 'pose' ? JAM.musicToggleHtml(state.showMusic) : '';
    return '<div class="jam-head"><span class="tag">אתגר למתקדמים · כפולה משותפת, יחס, שבר</span>' + toggle + '</div>' + body;
  }

  function memStorage() {
    try { return root.localStorage || null; } catch (e) { return null; }
  }

  function loadAdapt(storage) {
    try {
      const raw = storage && storage.getItem(ADAPT_KEY);
      const a = raw ? JSON.parse(raw) : null;
      return a && Number.isInteger(a.level) && Array.isArray(a.recent) ? a : RM.initialAdapt(0);
    } catch (e) { return RM.initialAdapt(0); }
  }

  function mount(el, props) {
    const p = props || {};
    const storage = p.storage || memStorage();
    const clock = p.now || function () { return Date.now(); };
    JAM.registerTapVoices();
    let state = createState({ record: MS.loadRecord(p.learner, storage), adapt: loadAdapt(storage), showMusic: JAM.loadShowMusic(GAME), now: clock() });
    let playing = null;
    function stop() { if (playing) playing.stop(); playing = null; }
    function save() {
      MS.saveRecord(p.learner, state.record, storage);
      try { if (storage) storage.setItem(ADAPT_KEY, JSON.stringify(state.adapt)); } catch (e) { /* full */ }
    }
    // Focus moves only after a click inside the card, never on page load.
    function draw(focusSel, auto) {
      el.innerHTML = renderHtml(state);
      const f = (focusSel && el.querySelector(focusSel)) || (auto ? el.querySelector('.rm-choice, [data-act="next"]') : null);
      if (f && f.focus) f.focus();
    }
    function readDraft() {
      const v = function (k) { const n = el.querySelector('[data-pose="' + k + '"]'); return n ? n.value : ''; };
      return { voices: [v('v0'), v('v1'), v('v2')], kind: v('kind'), within: v('within').trim(), strokes: v('strokes').trim(), answer: v('answer').trim() };
    }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'play') {
        stop();
        if (state.showMusic && state.task) playing = JAM.playNotes(RM.cyclePlan(state.task.voices));
        return;
      }
      stop();
      const map = {
        'start-test': { type: 'start-test', phase: b.getAttribute('data-phase') },
        test: { type: 'test-answer', value: b.getAttribute('data-value') },
        answer: { type: 'answer', value: b.getAttribute('data-value') },
        reason: { type: 'reason', id: b.getAttribute('data-id') },
        next: { type: 'next' },
        practice: { type: 'practice' },
        'pose-open': { type: 'pose-open' },
        'pose-check': { type: 'pose-check', draft: act === 'pose-check' ? readDraft() : null },
        'pose-close': { type: 'pose-close' },
        music: { type: 'music' },
      };
      if (!map[act]) return;
      state = reduce(state, map[act], { now: clock() });
      if (act === 'music') JAM.saveShowMusic(GAME, state.showMusic);
      save();
      draw(act === 'pose-check' ? '[data-act="pose-check"]' : null, true);
      if (state.showMusic && (state.phase === 'practice' || state.phase === 'pose') && state.sound) JAM.feedback(state.sound === 'right');
    });
    JAM.stopWhenHidden(el, stop);
    draw();
    return { get state() { return state; } };
  }

  return { GAME: GAME, STEPS_BEFORE_POST: STEPS_BEFORE_POST, POSE_VOICES: POSE_VOICES, createState: createState, reduce: reduce, renderHtml: renderHtml, mount: mount };
});
