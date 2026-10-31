// MelodyMath — DataBeats + PercentMix measurement (#591, the measurement
// structure of owner comment 6376159285, RhythmMaster):
// a 12-item pre-test, a parallel post-test after 4 weeks, and a check of the
// same result 30 days after the post-test. Target: a gain of at least 0.3 SD
// on the items that were NOT practised, kept after 30 days.
//
// Half of the 12 slots have the shape of a practice step (mean, trend and
// range of heard columns, percent of a bar); the other half are transfer
// items with no bar and no beat (a table of temperatures, 25% of 20
// children). The effect size uses the unpractised half only, so a gain
// there is not just the practised item shape coming back.
// Form A (pre and the 30-day check) and form B (post) fill every slot with
// different numbers of the same difficulty. The tests run silent: a sound
// that cues the answer would stop them measuring what the child does alone.
//
// Results stay on this device: load/save take an injectable storage like
// unlocks.js, nothing is sent anywhere. This is a local count for a teacher,
// not a controlled study.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_DATA_PERCENT_CHECK = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'mm.dataBeats.check';
  const POST_AFTER_DAYS = 28;
  const RETENTION_AFTER_DAYS = 30;
  const TARGET_D = 0.3;
  const DAY = 24 * 60 * 60 * 1000;
  const CHECK_PHASES = ['pre', 'post', 'retention'];
  const FORM_OF = { pre: 'A', post: 'B', retention: 'A' };
  const PHASE_HE = { pre: 'מבחן פתיחה', post: 'מבחן סיום', retention: 'בדיקה אחרי 30 יום' };
  const CHECK_DISCLAIMER = 'זו ספירה מקומית במכשיר הזה ולא ניסוי מבוקר: אין קבוצת ביקורת והמדגם קטן, ולכן אי אפשר להסיק מהמספרים שהתרגול הוא שגרם לשינוי.';
  const TREND = ['עולה', 'יורדת', 'כמעט קבועה'];

  // [id, topic, practised, formA, formB]; a form is [prompt, answer, choices].
  const SLOTS = [
    ['p1', 'mean', true,
      ['בשלוש עמודות יש 3, 5 ו־7 הקשות. מה הממוצע?', '5', ['3', '5', '6', '7']],
      ['בשלוש עמודות יש 4, 6 ו־8 הקשות. מה הממוצע?', '6', ['4', '5', '6', '8']]],
    ['p2', 'mean', true,
      ['בארבע עמודות יש 2, 6, 4 ו־8 הקשות. מה הממוצע?', '5', ['4', '5', '6', '8']],
      ['בארבע עמודות יש 3, 7, 5 ו־9 הקשות. מה הממוצע?', '6', ['5', '6', '7', '9']]],
    ['p3', 'trend', true,
      ['העמודות הן 2, 4, 5 ו־8 הקשות, לפי הסדר. לאן הולכת המגמה?', 'עולה', TREND],
      ['העמודות הן 9, 6, 5 ו־2 הקשות, לפי הסדר. לאן הולכת המגמה?', 'יורדת', TREND]],
    ['p4', 'range', true,
      ['העמודות הן 3, 8, 5 ו־6 הקשות. מה הטווח?', '5', ['3', '5', '6', '8']],
      ['העמודות הן 2, 9, 4 ו־6 הקשות. מה הטווח?', '7', ['2', '6', '7', '9']]],
    ['p5', 'percent', true,
      ['בתיבה של 4 פעמות מילאנו פעמה אחת. כמה אחוזים מהתיבה מילאנו?', '25%', ['4%', '25%', '40%', '75%']],
      ['בתיבה של 4 פעמות מילאנו שתי פעמות. כמה אחוזים מהתיבה מילאנו?', '50%', ['2%', '20%', '50%', '75%']]],
    ['p6', 'percent', true,
      ['כמה פעמות שלמות הן 75% מתיבה של 4 פעמות?', '3', ['1', '2', '3', '4']],
      ['כמה פעמות שלמות הן 50% מתיבה של 4 פעמות?', '2', ['1', '2', '3', '4']]],
    // Transfer: no columns, no beats, no bar.
    ['u1', 'mean', false,
      ['בשלושה ימים מדדו 20, 22 ו־24 מעלות. מה הטמפרטורה הממוצעת?', '22', ['20', '21', '22', '24']],
      ['בשלושה ימים מדדו 15, 17 ו־19 מעלות. מה הטמפרטורה הממוצעת?', '17', ['15', '16', '17', '19']]],
    ['u2', 'mean', false,
      ['ארבעה ילדים קיבלו 6, 8, 10 ו־8 נקודות. מה הממוצע?', '8', ['6', '7', '8', '10']],
      ['ארבעה ילדים קיבלו 5, 9, 7 ו־7 נקודות. מה הממוצע?', '7', ['5', '6', '7', '9']]],
    ['u3', 'range', false,
      ['הגבהים של שלושה ילדים: 120, 135 ו־128 ס״מ. מה הטווח?', '15', ['7', '8', '15', '135']],
      ['הגבהים של שלושה ילדים: 110, 126 ו־118 ס״מ. מה הטווח?', '16', ['8', '16', '18', '126']]],
    ['u4', 'trend', false,
      ['מספר הקוראים בספרייה: בינואר 30, בפברואר 25, במרץ 18. לאן הולכת המגמה?', 'יורדת', TREND],
      ['מספר הקוראים בספרייה: בינואר 40, בפברואר 46, במרץ 55. לאן הולכת המגמה?', 'עולה', TREND]],
    ['u5', 'percent', false,
      ['בכיתה 20 ילדים, ו־25% מהם הגיעו באופניים. כמה ילדים הגיעו באופניים?', '5', ['4', '5', '20', '25']],
      ['בכיתה 30 ילדים, ו־50% מהם הגיעו ברגל. כמה ילדים הגיעו ברגל?', '15', ['10', '15', '20', '50']]],
    ['u6', 'percent', false,
      ['איזה שבר שווה ל־10%?', '1/10', ['1/10', '1/100', '10/1', '1/5']],
      ['איזה שבר שווה ל־20%?', '1/5', ['1/2', '1/5', '1/20', '2/100']]],
  ];

  function items(phase) {
    const f = FORM_OF[phase];
    if (!f) throw new RangeError('unknown phase ' + phase);
    return SLOTS.map(function (s) {
      const x = f === 'A' ? s[3] : s[4];
      return { id: s[0], topic: s[1], practised: s[2], prompt: x[0], answer: x[1], choices: x[2].slice() };
    });
  }

  // answers: { slotId: chosen string }. Unanswered items count as wrong.
  function scoreAnswers(phase, answers) {
    const a = answers || {};
    const out = { total: 0, practised: 0, unpractised: 0, of: { total: 0, practised: 0, unpractised: 0 } };
    items(phase).forEach(function (it) {
      const half = it.practised ? 'practised' : 'unpractised';
      out.of.total += 1;
      out.of[half] += 1;
      if (Object.prototype.hasOwnProperty.call(a, it.id) && String(a[it.id]) === it.answer) { out.total += 1; out[half] += 1; }
    });
    return out;
  }

  function empty() { return { v: 1, learners: {} }; }

  function load(storage) {
    try {
      const raw = storage && storage.getItem(STORAGE_KEY);
      const d = raw ? JSON.parse(raw) : null;
      return d && d.v === 1 && d.learners && typeof d.learners === 'object' ? d : empty();
    } catch (e) { return empty(); }
  }
  function save(storage, data) {
    try { storage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
  }

  function days(from, to) { return Math.floor((to - from) / DAY); }

  // What this learner does next: { phase, daysLeft }. phase is 'pre',
  // 'wait-post', 'post', 'wait-retention', 'retention' or 'done'.
  function nextStep(rec, now) {
    const r = rec || {};
    if (!r.pre) return { phase: 'pre', daysLeft: 0 };
    if (!r.post) {
      const left = POST_AFTER_DAYS - days(r.pre.at, now);
      return left > 0 ? { phase: 'wait-post', daysLeft: left } : { phase: 'post', daysLeft: 0 };
    }
    if (!r.retention) {
      const left = RETENTION_AFTER_DAYS - days(r.post.at, now);
      return left > 0 ? { phase: 'wait-retention', daysLeft: left } : { phase: 'retention', daysLeft: 0 };
    }
    return { phase: 'done', daysLeft: 0 };
  }

  // A new data object with this learner's result for `phase`. The order is
  // pre -> post (28+ days later) -> retention (30+ days after post); a test
  // out of turn throws, so a post-test can never be saved before its pre-test.
  function record(data, learner, phase, answers, at) {
    if (CHECK_PHASES.indexOf(phase) === -1) throw new RangeError('unknown phase ' + phase);
    if (!learner) throw new RangeError('a learner id is needed');
    const d = JSON.parse(JSON.stringify(data || empty()));
    const rec = d.learners[learner] || {};
    const step = nextStep(rec, at);
    if (step.phase !== phase) throw new RangeError(phase + ' is not due for ' + learner + ' (next: ' + step.phase + ')');
    rec[phase] = { at: at, form: FORM_OF[phase], answers: Object.assign({}, answers), score: scoreAnswers(phase, answers) };
    d.learners[learner] = rec;
    return d;
  }

  function sd(xs) {
    if (xs.length < 2) return 0;
    const m = xs.reduce(function (s, x) { return s + x; }, 0) / xs.length;
    return Math.sqrt(xs.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (xs.length - 1));
  }

  // (mean post - mean pre) / SD of pre, on the unpractised items, over every
  // learner with both tests. { d, n, meets } or { d: null, n, reason }.
  function effectSize(data) {
    const pairs = Object.keys((data && data.learners) || {}).map(function (k) { return data.learners[k]; })
      .filter(function (r) { return r.pre && r.post; });
    const n = pairs.length;
    if (n < 2) return { d: null, n: n, reason: 'need-two-learners' };
    const pre = pairs.map(function (r) { return r.pre.score.unpractised; });
    const post = pairs.map(function (r) { return r.post.score.unpractised; });
    const s = sd(pre);
    if (s === 0) return { d: null, n: n, reason: 'no-spread-in-pre' };
    const gain = post.reduce(function (a, x) { return a + x; }, 0) / n - pre.reduce(function (a, x) { return a + x; }, 0) / n;
    const d = Math.round((gain / s) * 100) / 100;
    return { d: d, n: n, meets: d >= TARGET_D };
  }

  // The 30-day check for one learner: 'not-due' (no post yet or under 30
  // days), 'due', or 'kept' / 'dropped'. Kept = the unpractised score is at
  // most one item below the post-test.
  function retention(rec, now) {
    const r = rec || {};
    if (!r.post) return { status: 'not-due', daysLeft: null };
    if (!r.retention) {
      const left = RETENTION_AFTER_DAYS - days(r.post.at, now);
      return left > 0 ? { status: 'not-due', daysLeft: left } : { status: 'due', daysLeft: 0 };
    }
    const kept = r.retention.score.unpractised >= r.post.score.unpractised - 1;
    return { status: kept ? 'kept' : 'dropped', post: r.post.score.unpractised, later: r.retention.score.unpractised };
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    POST_AFTER_DAYS: POST_AFTER_DAYS,
    RETENTION_AFTER_DAYS: RETENTION_AFTER_DAYS,
    TARGET_D: TARGET_D,
    DAY: DAY,
    CHECK_PHASES: CHECK_PHASES,
    FORM_OF: FORM_OF,
    PHASE_HE: PHASE_HE,
    CHECK_DISCLAIMER: CHECK_DISCLAIMER,
    SLOTS: SLOTS,
    items: items,
    scoreAnswers: scoreAnswers,
    empty: empty,
    load: load,
    save: save,
    nextStep: nextStep,
    record: record,
    effectSize: effectSize,
    retention: retention,
  };
});
