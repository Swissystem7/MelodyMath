// MelodyMath — RhythmMaster measurement (#591, owner comment 6376159285).
//
// A 12-item pre-test (form A), a parallel post-test (form B) four weeks
// later and a retention test (form C) 30 days after the post-test. Every
// slot fixes the task kind, the number of voices and whether a voice is
// non-whole; the three forms fill it with different numbers. Six slots are
// practised (drum wording, as in practice), six are unpractised: the same
// maths about buses, lights and gears, which practice never shows. The
// owner's target is a gain of at least 0.3 SD of the pre-test on the
// unpractised items, kept after 30 days.
//
// The tests are silent (no play button): a sound that cues the answer would
// stop them from measuring what the child can do without one. Results stay
// on this device behind an injectable storage, like streak.js; nothing is
// sent anywhere. This is a local count, not a controlled study.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_RHYTHM_MEASURE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const RM = (root && root.MM_RHYTHM_MASTER) || (typeof require === 'function' ? require('./rhythmMaster.js') : {});

  const DAY_MS = 24 * 60 * 60 * 1000;
  const POST_AFTER_DAYS = 28;
  const RETENTION_AFTER_DAYS = 30;
  const TARGET_D = 0.3;
  const STORAGE_KEY = 'mm.rhythmMaster.measure';
  const TEST_PHASES = ['pre', 'post', 'retention'];
  const FORM_OF = { pre: 'A', post: 'B', retention: 'C' };
  const PHASE_HE = { pre: 'מבחן פתיחה', post: 'מבחן מקביל', retention: 'בדיקת שימור' };
  const MEASURE_DISCLAIMER = 'זו ספירה מקומית במכשיר הזה ולא ניסוי מבוקר: אין קבוצת ביקורת והמדגם קטן, ולכן אי אפשר להסיק מהמספרים שהתרגול הוא שגרם לשינוי.';

  // [slot, kind, practised, context, A, B, C]
  const SLOTS = [
    ['p1', 'lcm', true, 'drums', [3, 4], [2, 5], [3, 5]],
    ['p2', 'lcm', true, 'drums', [4, 6], [6, 9], [4, 10]],
    ['p3', 'ratio', true, 'drums', [2, 3], [3, 4], [2, 5]],
    ['p4', 'fraction', true, 'drums', [3, 4], [2, 5], [4, 6]],
    ['p5', 'lcm', true, 'drums', [2, 3, 5], [2, 5, 6], [3, 5, 6]],
    ['p6', 'lcm', true, 'drums', ['3/2', 2], ['5/2', 2], ['3/2', 4]],
    ['u1', 'lcm', false, 'bus', [4, 5], [3, 7], [5, 6]],
    ['u2', 'lcm', false, 'lights', [6, 8], [4, 10], [6, 9]],
    ['u3', 'ratio', false, 'gears', [3, 5], [2, 7], [4, 5]],
    ['u4', 'fraction', false, 'bus', [2, 3], [3, 5], [2, 5]],
    ['u5', 'lcm', false, 'lights', [2, 3, 4], [2, 4, 6], [3, 4, 6]],
    ['u6', 'ratio', false, 'gears', [2, 3, 6], [2, 4, 8], [3, 4, 6]],
  ];

  function buildForm(form) {
    const col = { A: 4, B: 5, C: 6 }[form];
    if (!col) return [];
    return SLOTS.map(function (s, i) {
      const t = RM.makeTask(s[1], s[col], { context: s[3], turn: i });
      return Object.assign(t, { slot: s[0], practised: s[2], form: form });
    });
  }

  function formForPhase(phase) {
    return buildForm(FORM_OF[phase]);
  }

  // answers: array of the child's answers, same order as the items.
  function scoreForm(items, answers) {
    const out = { correct: 0, total: items.length, practised: { correct: 0, total: 0 }, unpractised: { correct: 0, total: 0 } };
    items.forEach(function (it, i) {
      const ok = RM.sameAnswer(it.kind, (answers || [])[i], it.answer);
      const part = it.practised ? out.practised : out.unpractised;
      part.total += 1;
      if (ok) { out.correct += 1; part.correct += 1; }
    });
    return out;
  }

  function emptyRecord() {
    return { pre: null, post: null, retention: null, steps: 0 };
  }

  // Store one finished test on a learner record (pure). A post-test taken
  // before 4 weeks is kept but marked early, and left out of the effect size.
  function recordTest(record, phase, score, at) {
    if (TEST_PHASES.indexOf(phase) === -1) throw new Error('unknown phase ' + phase);
    const r = Object.assign(emptyRecord(), record || {});
    const entry = { at: Number(at), score: score };
    if (phase === 'post') entry.early = !r.pre || Number(at) - r.pre.at < POST_AFTER_DAYS * DAY_MS;
    if (phase === 'retention') entry.early = !r.post || Number(at) - r.post.at < RETENTION_AFTER_DAYS * DAY_MS;
    r[phase] = entry;
    return r;
  }

  function addSteps(record, n) {
    const r = Object.assign(emptyRecord(), record || {});
    r.steps = (r.steps || 0) + (Number(n) || 0);
    return r;
  }

  // What is next for a learner on day `now`: 'pre', 'practice', 'post',
  // 'retention' or 'done', with the dates the post and retention tests open.
  function schedule(record, now) {
    const r = Object.assign(emptyRecord(), record || {});
    const t = Number(now);
    const postOpens = r.pre ? r.pre.at + POST_AFTER_DAYS * DAY_MS : null;
    const retentionOpens = r.post ? r.post.at + RETENTION_AFTER_DAYS * DAY_MS : null;
    let next = 'pre';
    if (r.pre && !r.post) next = t >= postOpens ? 'post' : 'practice';
    else if (r.post && !r.retention) next = t >= retentionOpens ? 'retention' : 'practice';
    else if (r.retention) next = 'done';
    return { next: next, postOpens: postOpens, retentionOpens: retentionOpens };
  }

  function share(part) {
    return part && part.total ? part.correct / part.total : null;
  }

  function mean(xs) { return xs.reduce(function (a, b) { return a + b; }, 0) / xs.length; }
  function sd(xs) {
    if (xs.length < 2) return 0;
    const m = mean(xs);
    return Math.sqrt(xs.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / (xs.length - 1));
  }

  // Effect size on the UNPRACTISED items over a group of learner records:
  // d = mean(post - pre) / SD(pre), both as shares of the 6 items. Records
  // without a pre and an on-time post are left out (and counted). d is null
  // when fewer than 2 learners remain or every pre score is the same.
  function effectSize(records, opts) {
    const o = opts || {};
    const list = (records || []).filter(function (r) { return r && r.pre && r.post && (o.includeEarly || !r.post.early); });
    const pre = list.map(function (r) { return share(r.pre.score.unpractised); });
    const gain = list.map(function (r) { return share(r.post.score.unpractised) - share(r.pre.score.unpractised); });
    const out = { n: list.length, skipped: (records || []).length - list.length, meanGain: null, sdPre: null, d: null, meetsTarget: false };
    if (list.length < 2) return out;
    out.meanGain = mean(gain);
    out.sdPre = sd(pre);
    if (out.sdPre === 0) return out;
    out.d = out.meanGain / out.sdPre;
    out.meetsTarget = out.d >= TARGET_D;
    return out;
  }

  // 30-day retention for one learner: the retention test is taken at least
  // 30 days after the post-test and keeps the post-test's unpractised score
  // within one item. null until there is an on-time retention test.
  function retentionCheck(record) {
    const r = record || {};
    if (!r.post || !r.retention || r.retention.early) return null;
    const post = r.post.score.unpractised.correct;
    const kept = r.retention.score.unpractised.correct;
    return { days: Math.floor((r.retention.at - r.post.at) / DAY_MS), post: post, retention: kept, retained: kept >= post - 1 };
  }

  function retentionRate(records) {
    const checks = (records || []).map(retentionCheck).filter(Boolean);
    if (!checks.length) return null;
    return checks.filter(function (c) { return c.retained; }).length / checks.length;
  }

  // ---- storage -----------------------------------------------------------

  function defaultStorage() {
    try { return root && root.localStorage ? root.localStorage : null; } catch (e) { return null; }
  }

  function loadAll(storage, key) {
    const s = storage || defaultStorage();
    try {
      const raw = s && s.getItem(key || STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : null;
      return data && data.learners ? data : { learners: {} };
    } catch (e) {
      return { learners: {} };
    }
  }

  function saveAll(data, storage, key) {
    const s = storage || defaultStorage();
    if (!s) return false;
    try { s.setItem(key || STORAGE_KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
  }

  function loadRecord(learner, storage, key) {
    return loadAll(storage, key).learners[learner || 'device'] || emptyRecord();
  }

  function saveRecord(learner, record, storage, key) {
    const data = loadAll(storage, key);
    data.learners[learner || 'device'] = record;
    return saveAll(data, storage, key);
  }

  return {
    DAY_MS: DAY_MS,
    POST_AFTER_DAYS: POST_AFTER_DAYS,
    RETENTION_AFTER_DAYS: RETENTION_AFTER_DAYS,
    TARGET_D: TARGET_D,
    STORAGE_KEY: STORAGE_KEY,
    TEST_PHASES: TEST_PHASES,
    FORM_OF: FORM_OF,
    PHASE_HE: PHASE_HE,
    MEASURE_DISCLAIMER: MEASURE_DISCLAIMER,
    SLOTS: SLOTS,
    buildForm: buildForm,
    formForPhase: formForPhase,
    scoreForm: scoreForm,
    emptyRecord: emptyRecord,
    recordTest: recordTest,
    addSteps: addSteps,
    schedule: schedule,
    effectSize: effectSize,
    retentionCheck: retentionCheck,
    retentionRate: retentionRate,
    loadAll: loadAll,
    saveAll: saveAll,
    loadRecord: loadRecord,
    saveRecord: saveRecord,
  };
});
