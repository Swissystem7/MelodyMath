// MelodyMath — RhythmPolygon items and the pre/post/retention check (#591,
// owner comments 6376161263 + 6376159285).
//
// Measurement, same structure as RhythmMaster: a 12-item pre-test (form A),
// a parallel post-test (form B) once 4 weeks have passed, and a retention
// check (form C) 30 days after the post-test. Six slots use clocks the three
// practice steps use (3, 4, 6, 8 beats); six are UNPRACTISED (5, 9, 10, 12
// beats), and only those count for the target: a gain of at least 0.3 SD of
// the pre-test, still there at the retention check. The check is silent, the
// same maths without music.
//
// Every answer is computed from rhythmPolygon.js, never typed in by hand.
// Results stay on this device (injectable storage, like unlocks.js). This
// is a local count, not a controlled study.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_POLYGON_CHECK = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const RP = root.MM_RHYTHM_POLYGON || require('./rhythmPolygon.js');
  const STORAGE_KEY = 'mm.polygon.check';
  const DAY = 864e5;
  const POST_AFTER_DAYS = 28;
  const RETENTION_DAYS = 30;
  const TARGET_SD = 0.3;
  const PHASES = ['pre', 'post', 'retention'];
  const FORM_OF = { pre: 'A', post: 'B', retention: 'C' };
  const ALL_N = [3, 4, 5, 6, 8, 9, 10, 12];
  const PRACTISED_N = [3, 4, 6, 8];
  const DISCLAIMER = 'זו ספירה מקומית בטאבלט הזה ולא ניסוי מבוקר, ולכן אי אפשר להסיק ממנה שהתרגול הוא שגרם לשינוי.';

  // [slot, kind, practised, formA, formB, formC]
  const SLOTS = [
    ['s1', 'sides', true, { n: 4 }, { n: 6 }, { n: 8 }],
    ['s2', 'sides', false, { n: 5 }, { n: 10 }, { n: 9 }],
    ['s3', 'angle', true, { n: 6 }, { n: 4 }, { n: 3 }],
    ['s4', 'angle', false, { n: 10 }, { n: 12 }, { n: 9 }],
    ['s5', 'beatsFromAngle', true, { n: 4 }, { n: 6 }, { n: 8 }],
    ['s6', 'beatsFromAngle', false, { n: 12 }, { n: 9 }, { n: 10 }],
    ['s7', 'axes', true, { n: 3 }, { n: 4 }, { n: 6 }],
    ['s8', 'axes', false, { n: 5 }, { n: 9 }, { n: 10 }],
    ['s9', 'turn', true, { n: 8 }, { n: 6 }, { n: 4 }],
    ['s10', 'turn', false, { n: 9 }, { n: 12 }, { n: 5 }],
    ['s11', 'shift', true, { cycle: 8, onsets: [0, 3, 5], k: 2 }, { cycle: 8, onsets: [0, 2, 3], k: 3 }, { cycle: 6, onsets: [0, 1, 3], k: 2 }],
    ['s12', 'shift', false, { cycle: 12, onsets: [0, 3, 7], k: 4 }, { cycle: 10, onsets: [0, 4, 7], k: 3 }, { cycle: 9, onsets: [0, 2, 5], k: 3 }],
  ];

  function nameOf(n) { return RP.NAMES_HE[n] || ('מצולע בן ' + n + ' צלעות'); }

  // The number a kind asks about for an N-beat regular clock.
  function valueFor(kind, n) {
    const p = RP.polygonFromBeats(n);
    if (kind === 'sides' || kind === 'beatsFromAngle') return p.sides;
    if (kind === 'angle') return p.centralAngle;
    if (kind === 'axes') return p.axes;
    if (kind === 'turn') return 360 / p.rotationOrder;
    return null;
  }

  function unit(kind) { return kind === 'angle' || kind === 'turn' || kind === 'shift' ? '°' : ''; }

  // The answer and the three nearest other values, smallest first.
  function choicesFor(answer, pool, u) {
    const others = pool.filter(function (v, i) { return v !== answer && pool.indexOf(v) === i; })
      .sort(function (a, b) { return Math.abs(a - answer) - Math.abs(b - answer) || a - b; }).slice(0, 3);
    return others.concat([answer]).sort(function (a, b) { return a - b; }).map(function (v) { return v + u; });
  }

  function promptFor(kind, p) {
    if (kind === 'sides') return 'בשעון קצב של ' + p.n + ' פעמות שוות מחברים את כל הפעמות. כמה צלעות יש למצולע?';
    if (kind === 'angle') return 'בשעון קצב של ' + p.n + ' פעמות שוות, מה הזווית במרכז השעון בין שתי פעמות שכנות?';
    if (kind === 'beatsFromAngle') return 'בין כל שתי פעמות שכנות בשעון יש ' + valueFor('angle', p.n) + '° במרכז. כמה פעמות יש בשעון?';
    if (kind === 'axes') return 'כמה צירי סימטריה יש ל' + nameOf(p.n) + ' המשוכלל שנוצר מ־' + p.n + ' פעמות שוות?';
    if (kind === 'turn') return 'בכמה מעלות לפחות צריך לסובב את ה' + nameOf(p.n) + ' המשוכלל כדי שייראה בדיוק אותו דבר?';
    if (kind === 'shift') return 'בשעון של ' + p.cycle + ' פעמות הקצב הוזז ב־' + p.k + ' פעמות קדימה. בכמה מעלות הסתובב המצולע?';
    if (kind === 'same') return 'בשעון של ' + p.cycle + ' פעמות: האם הקצב השני הוא אותו קצב, רק מסובב?';
    return '';
  }

  // One item: { kind, prompt, answer, choices, clock: { cycle, onsets, turned? } }.
  function buildItem(kind, p) {
    const item = { kind: kind, prompt: promptFor(kind, p) };
    if (kind === 'shift') {
      const turned = RP.rotate(p.onsets, p.k, p.cycle);
      const eq = RP.rotationEquivalence(p.onsets, turned, p.cycle);
      const pool = [];
      for (let j = 1; j < p.cycle; j++) pool.push(j * 360 / p.cycle);
      item.answer = eq.minDegrees + '°';
      item.choices = choicesFor(eq.minDegrees, pool, '°');
      item.clock = { cycle: p.cycle, onsets: p.onsets.slice(), turned: turned };
    } else if (kind === 'same') {
      const eq = RP.rotationEquivalence(p.a, p.b, p.cycle);
      item.answer = eq.equivalent ? 'כן' : 'לא';
      item.choices = ['כן', 'לא'];
      item.clock = { cycle: p.cycle, onsets: p.a.slice(), turned: RP.normalize(p.b, p.cycle).onsets };
    } else {
      const v = valueFor(kind, p.n);
      item.answer = v + unit(kind);
      item.choices = choicesFor(v, ALL_N.map(function (n) { return valueFor(kind, n); }), unit(kind));
      // The angle item names the beats only through the angle, so no clock is drawn.
      item.clock = kind === 'beatsFromAngle' ? null : { cycle: p.n, onsets: RP.normalize(p.n).onsets };
    }
    return item;
  }

  function buildForm(form) {
    const col = { A: 3, B: 4, C: 5 }[form];
    if (!col) return [];
    return SLOTS.map(function (s) {
      return Object.assign({ id: s[0] + form, slot: s[0], practised: s[2] }, buildItem(s[1], s[col]));
    });
  }

  function grade(item, choice) { return String(choice) === String(item.answer); }

  // ---------- local results ----------
  function empty() { return { pre: null, post: null, retention: null }; }

  function load(storage, key) {
    try {
      const raw = (storage || root.localStorage).getItem(key || STORAGE_KEY);
      const v = raw ? JSON.parse(raw) : null;
      return v && typeof v === 'object' ? Object.assign(empty(), v) : empty();
    } catch (e) { return empty(); }
  }

  function save(storage, rec, key) {
    try { (storage || root.localStorage).setItem(key || STORAGE_KEY, JSON.stringify(rec)); return true; } catch (e) { return false; }
  }

  // When may a phase be taken? { ok, daysLeft }.
  function canTake(rec, phase, now) {
    const r = rec || empty();
    const t = Number(now);
    if (PHASES.indexOf(phase) < 0 || r[phase]) return { ok: false, daysLeft: null };
    if (phase === 'pre') return { ok: true, daysLeft: 0 };
    const before = phase === 'post' ? r.pre : r.post;
    if (!before) return { ok: false, daysLeft: null };
    const wait = phase === 'post' ? POST_AFTER_DAYS : RETENTION_DAYS;
    const left = Math.ceil(wait - (t - before.at) / DAY);
    return left <= 0 ? { ok: true, daysLeft: 0 } : { ok: false, daysLeft: left };
  }

  // results: [{ id, correct }]. The first attempt at a phase is the one kept.
  function record(rec, phase, results, now) {
    const r = Object.assign(empty(), rec || {});
    if (!canTake(r, phase, now).ok) return r;
    r[phase] = { at: Number(now), form: FORM_OF[phase], results: (results || []).map(function (x) { return { id: x.id, correct: !!x.correct }; }) };
    return r;
  }

  // 0/1 per slot of the given group, in slot order.
  function scores(phaseRec, practised) {
    if (!phaseRec) return [];
    const by = {};
    phaseRec.results.forEach(function (x) { by[x.id.replace(/[ABC]$/, '')] = x.correct ? 1 : 0; });
    return SLOTS.filter(function (s) { return s[2] === practised && s[0] in by; }).map(function (s) { return by[s[0]]; });
  }

  function mean(xs) { return xs.reduce(function (a, b) { return a + b; }, 0) / xs.length; }
  function sd(xs) {
    const m = mean(xs);
    return Math.sqrt(xs.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / (xs.length - 1));
  }

  // (mean(post) - mean(pre)) / SD(pre). With one child the spread is across
  // its unpractised items; for a class pass one score per child. null when
  // the pre-test has no spread (all right or all wrong) or fewer than 2 values.
  function effectSize(pre, post) {
    if (!pre || !post || pre.length < 2 || !post.length) return null;
    const s = sd(pre);
    if (!(s > 0)) return null;
    return Math.round((mean(post) - mean(pre)) / s * 100) / 100;
  }

  function report(rec, now) {
    const r = rec || empty();
    const pre = scores(r.pre, false);
    const gain = effectSize(pre, scores(r.post, false));
    const kept = effectSize(pre, scores(r.retention, false));
    return {
      gain: gain,
      meetsTarget: gain == null ? null : gain >= TARGET_SD,
      retentionGain: kept,
      retained: kept == null ? null : kept >= TARGET_SD,
      next: !r.pre ? 'pre' : !r.post ? 'post' : !r.retention ? 'retention' : null,
      wait: !r.pre ? 0 : (canTake(r, !r.post ? 'post' : 'retention', now).daysLeft || 0),
      disclaimer: DISCLAIMER,
    };
  }

  return {
    STORAGE_KEY: STORAGE_KEY, POST_AFTER_DAYS: POST_AFTER_DAYS, RETENTION_DAYS: RETENTION_DAYS, TARGET_SD: TARGET_SD,
    CHECK_PHASES: PHASES, FORM_OF: FORM_OF, SLOTS: SLOTS, PRACTISED_N: PRACTISED_N, CHECK_DISCLAIMER: DISCLAIMER,
    valueFor: valueFor, buildItem: buildItem, buildForm: buildForm, grade: grade,
    empty: empty, load: load, save: save, canTake: canTake, record: record, scores: scores, effectSize: effectSize, report: report,
  };
});
