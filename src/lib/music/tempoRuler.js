// MelodyMath — TempoRuler: measuring time and length in beat units
// (#591, owner comment 6376161970).
//
// One method (dosage rule 4): the note length is the unit of measure (M3,
// note durations as units, Courey et al. 2012). The child picks a unit (half
// beat, beat, bar), measures with it, compares lengths given in different
// units and converts seconds <-> beats by the tempo (BPM). The steady beat is
// only the clock that makes a beat last a fixed time; it is not a second
// method. The add-on "measuring sticks that play" is a timbre: each stick
// sounds when tapped, the maths is the same with the sound off.
//
// Measurement (same structure as RhythmMaster, comment 6376159285): a
// 12-item pre-test, a parallel post-test after 4 weeks and a retention check
// 30 days after the post-test, all silent. Gain is reported as an effect size
// (post - pre) / SD(pre) on the items the practice never shows (target 0.3).
// Results stay on this device through an injectable storage; no server.
// Everything here is pure and tested in Node (test/tempoRuler.test.js).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TEMPO_RULER = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const BEATS_PER_BAR = 4;
  const DAY = 24 * 60 * 60 * 1000;
  const POST_AFTER_DAYS = 28;
  const RETENTION_AFTER_DAYS = 30;
  const TARGET_D = 0.3;
  const STORAGE_KEY = 'mm.tempoRuler.measure';

  // Units in beats. 'second' depends on the tempo and is handled apart.
  const UNITS = {
    half: { beats: 0.5, he: 'חצי פעמה', hePlural: 'חצאי פעמה' },
    beat: { beats: 1, he: 'פעמה', hePlural: 'פעמות' },
    bar: { beats: BEATS_PER_BAR, he: 'תיבה', hePlural: 'תיבות' },
  };
  const SECOND_HE = { he: 'שנייה', hePlural: 'שניות' };

  // Measuring sticks: one per unit, its drawn length proportional to beats.
  const STICKS = ['half', 'beat', 'bar'].map(function (id) {
    return { id: id, beats: UNITS[id].beats, he: UNITS[id].he };
  });

  function clean(x) {
    // Hide float noise such as 0.30000000000000004.
    return Math.round(x * 1e9) / 1e9;
  }

  function validBpm(bpm) {
    const b = Number(bpm);
    return Number.isFinite(b) && b > 0 && b <= 400 ? b : null;
  }

  // Seconds that `beats` beats last at `bpm` beats per minute.
  function bpmToSeconds(beats, bpm) {
    const b = validBpm(bpm);
    const n = Number(beats);
    if (b == null || !Number.isFinite(n)) return null;
    return clean(n * 60 / b);
  }

  // Beats that fit in `seconds` at `bpm`.
  function secondsToBeats(seconds, bpm) {
    const b = validBpm(bpm);
    const s = Number(seconds);
    if (b == null || !Number.isFinite(s)) return null;
    // 6 decimals: seconds that came from bpmToSeconds give the beats back exactly.
    return Math.round(s * b / 60 * 1e6) / 1e6;
  }

  // value in unit `from` -> unit `to`. Units: half, beat, bar, second.
  // Seconds need opts.bpm; opts.beatsPerBar changes the bar (default 4).
  function convertUnits(value, from, to, opts) {
    const o = opts || {};
    const v = Number(value);
    if (!Number.isFinite(v)) return null;
    const perBar = o.beatsPerBar == null ? BEATS_PER_BAR : Number(o.beatsPerBar);
    if (!Number.isInteger(perBar) || perBar < 1) return null;
    function toBeats(x, u) {
      if (u === 'second') return secondsToBeats(x, o.bpm);
      if (u === 'bar') return x * perBar;
      return UNITS[u] && Object.prototype.hasOwnProperty.call(UNITS, u) ? x * UNITS[u].beats : null;
    }
    const beats = toBeats(v, from);
    if (beats == null) return null;
    if (to === 'second') return bpmToSeconds(beats, o.bpm);
    if (to === 'bar') return clean(beats / perBar);
    if (!Object.prototype.hasOwnProperty.call(UNITS, to)) return null;
    return clean(beats / UNITS[to].beats);
  }

  // Compare {value, unit} a with b: 1 when a is longer, -1 shorter, 0 equal.
  function compareLengths(a, b, opts) {
    const x = convertUnits(a.value, a.unit, 'beat', opts);
    const y = convertUnits(b.value, b.unit, 'beat', opts);
    if (x == null || y == null) return null;
    return x > y ? 1 : x < y ? -1 : 0;
  }

  // How many sticks of `stickId` measure a length of `beats` beats.
  function measureWithSticks(beats, stickId) {
    const s = STICKS.filter(function (x) { return x.id === stickId; })[0];
    const n = Number(beats);
    if (!s || !Number.isFinite(n) || n < 0) return null;
    const count = clean(n / s.beats);
    return { count: count, exact: Number.isInteger(count), stick: s.id };
  }

  // Notes for playing a row of sticks: one stroke where each stick starts,
  // so a stick of a bar sounds once and lasts four beats.
  function stickPlan(stickId, count, bpm, voice) {
    const s = STICKS.filter(function (x) { return x.id === stickId; })[0];
    const n = Math.max(0, Math.min(32, Math.floor(Number(count) || 0)));
    if (!s || validBpm(bpm) == null) return [];
    const notes = [];
    for (let i = 0; i < n; i++) notes.push({ at: bpmToSeconds(i * s.beats, bpm), voice: voice || 'woodClick', stick: i });
    return notes;
  }

  function label(value, unit) {
    const u = unit === 'second' ? SECOND_HE : UNITS[unit];
    if (!u) return String(value);
    if (value === 1) return u.he + ' אחת';
    return value + ' ' + u.hePlural;
  }

  // ---------- practice: the three steps ----------
  // Step 1 measure with a chosen stick, step 2 compare, step 3 convert by BPM.
  const STEPS = [
    { id: 'measure', he: 'שלב 1: בוחרים מקל ומודדים' },
    { id: 'compare', he: 'שלב 2: משווים בין יחידות' },
    { id: 'convert', he: 'שלב 3: ממירים שניות ופעמות לפי הטמפו' },
  ];
  const PRACTICE = {
    measure: [
      { beats: 4, stick: 'beat' }, { beats: 3, stick: 'half' }, { beats: 8, stick: 'bar' }, { beats: 6, stick: 'half' },
    ],
    compare: [
      { a: { value: 3, unit: 'half' }, b: { value: 1, unit: 'beat' } },
      { a: { value: 2, unit: 'bar' }, b: { value: 8, unit: 'beat' } },
      { a: { value: 5, unit: 'beat' }, b: { value: 1, unit: 'bar' } },
    ],
    convert: [
      { value: 4, from: 'beat', to: 'second', bpm: 60 },
      { value: 6, from: 'beat', to: 'second', bpm: 120 },
      { value: 10, from: 'second', to: 'beat', bpm: 60 },
      { value: 3, from: 'second', to: 'beat', bpm: 120 },
    ],
  };

  function practiceAnswer(step, ex) {
    if (step === 'measure') return measureWithSticks(ex.beats, ex.stick).count;
    if (step === 'compare') { const c = compareLengths(ex.a, ex.b); return c > 0 ? 'a' : c < 0 ? 'b' : 'same'; }
    return convertUnits(ex.value, ex.from, ex.to, { bpm: ex.bpm });
  }

  function practicePrompt(step, ex) {
    if (step === 'measure') return 'קו באורך ' + label(ex.beats, 'beat') + '. כמה מקלות של ' + UNITS[ex.stick].he + ' צריך כדי למדוד אותו?';
    if (step === 'compare') return 'מה ארוך יותר: ' + label(ex.a.value, ex.a.unit) + ' או ' + label(ex.b.value, ex.b.unit) + '?';
    return 'בטמפו ' + ex.bpm + ' BPM, ' + label(ex.value, ex.from) + ' הן כמה ' + (ex.to === 'second' ? SECOND_HE.hePlural : UNITS[ex.to].hePlural) + '?';
  }

  // ---------- pre / post / retention: 12 parallel slots ----------
  // [id, practised, shape, paramsA, paramsB, paramsC]. Practised slots use a
  // shape the practice shows; the 5 unpractised slots are transfer items
  // (minutes, metres, a new rate, a smaller unit) that the gain is computed on.
  // Form A = pre, B = post, C = retention; same shape and size, new numbers.
  const SLOTS = [
    ['t1', true, 'compare-half', [3, 1], [3, 2], [7, 3]],
    ['t2', true, 'bars-to-beats', [3], [5], [6]],
    ['t3', true, 'beats-to-halves', [4], [6], [7]],
    ['t4', true, 'beats-to-seconds-60', [5], [8], [9]],
    ['t5', true, 'seconds-to-beats-120', [4], [6], [7]],
    ['t6', true, 'sticks-bars', [3], [2], [5]],
    ['t7', true, 'beats-to-bars', [12], [20], [16]],
    ['t8', false, 'minutes-to-seconds', [3], [4], [5]],
    ['t9', false, 'metres-to-cm', [2], [3], [4]],
    ['t10', false, 'smaller-unit', [6], [5], [7]],
    ['t11', false, 'rate-per-minute', [90, 20], [60, 30], [120, 15]],
    ['t12', false, 'compare-minutes', [150, 2], [100, 2], [200, 3]],
  ];
  const FORMS = { pre: 0, post: 1, retention: 2 };
  const PHASE_HE = { pre: 'מבחן פתיחה', post: 'מבחן סיום', retention: 'בדיקה אחרי 30 יום' };

  function itemFor(shape, p) {
    switch (shape) {
      case 'compare-half': return { prompt: 'מה ארוך יותר: ' + p[0] + ' חצאי פעמה או ' + label(p[1], 'beat') + '?', answer: p[0] * 0.5 > p[1] ? 'חצאי הפעמה' : p[0] * 0.5 < p[1] ? 'הפעמות' : 'שווים', choices: ['חצאי הפעמה', 'הפעמות', 'שווים'] };
      case 'bars-to-beats': return num('כמה פעמות יש ב־' + p[0] + ' תיבות של 4/4?', p[0] * 4);
      case 'beats-to-halves': return num('כמה חצאי פעמה יש ב־' + p[0] + ' פעמות?', p[0] * 2);
      case 'beats-to-seconds-60': return num('בטמפו 60 BPM, כמה שניות נמשכות ' + p[0] + ' פעמות?', bpmToSeconds(p[0], 60));
      case 'seconds-to-beats-120': return num('בטמפו 120 BPM, כמה פעמות יש ב־' + p[0] + ' שניות?', secondsToBeats(p[0], 120));
      case 'sticks-bars': return num('מקל של תיבה אחת אורכו 4 פעמות. כמה מקלות של פעמה אחת ממלאים ' + p[0] + ' תיבות?', p[0] * 4);
      case 'beats-to-bars': return num(p[0] + ' פעמות הן כמה תיבות של 4/4?', p[0] / 4);
      case 'minutes-to-seconds': return num('כמה שניות יש ב־' + p[0] + ' דקות?', p[0] * 60);
      case 'metres-to-cm': return num('חבל אורכו ' + p[0] + ' מטרים. כמה סנטימטרים זה?', p[0] * 100);
      case 'smaller-unit': return num('שולחן אורכו ' + p[0] + ' עפרונות. מחק אורכו חצי עפרון. כמה מחקים אורכו של השולחן?', p[0] * 2);
      case 'rate-per-minute': return num('ברז מטפטף ' + p[0] + ' טיפות בדקה. כמה טיפות יטפטפו ב־' + p[1] + ' שניות?', p[0] * p[1] / 60);
      case 'compare-minutes': return { prompt: 'מה ארוך יותר: ' + p[0] + ' שניות או ' + p[1] + ' דקות?', answer: p[0] > p[1] * 60 ? 'השניות' : p[0] < p[1] * 60 ? 'הדקות' : 'שווים', choices: ['השניות', 'הדקות', 'שווים'] };
      default: return null;
    }
  }

  // A numeric item with 4 fixed choices: the answer and three near misses
  // (half, double, plus one), in an order that depends only on the answer.
  function num(prompt, answer) {
    const a = clean(answer);
    const pool = [a, clean(a * 2), clean(a + 1), clean(a / 2), clean(a + 2)];
    const seen = [];
    pool.forEach(function (x) { if (seen.indexOf(x) === -1 && seen.length < 4 && x > 0) seen.push(x); });
    const shift = Math.round(a) % seen.length;
    const choices = seen.slice(shift).concat(seen.slice(0, shift)).map(String);
    return { prompt: prompt, answer: String(a), choices: choices };
  }

  function buildForm(phase) {
    const f = FORMS[phase];
    if (f == null) return [];
    return SLOTS.map(function (s) {
      const it = itemFor(s[2], s[3 + f]);
      return { id: s[0], practised: s[1], shape: s[2], prompt: it.prompt, answer: it.answer, choices: it.choices };
    });
  }

  // answers: { itemId: chosen string }. Proportions correct overall, on the
  // practised and on the unpractised items.
  function scoreForm(form, answers) {
    const a = answers || {};
    const r = { total: 0, practised: 0, unpractised: 0, n: form.length, nPractised: 0, nUnpractised: 0, items: {} };
    form.forEach(function (it) {
      const ok = String(a[it.id]) === it.answer;
      r.items[it.id] = ok ? 1 : 0;
      if (it.practised) { r.nPractised++; if (ok) r.practised++; } else { r.nUnpractised++; if (ok) r.unpractised++; }
      if (ok) r.total++;
    });
    return {
      n: r.n, correct: r.total, items: r.items,
      practised: r.nPractised ? r.practised / r.nPractised : 0,
      unpractised: r.nUnpractised ? r.unpractised / r.nUnpractised : 0,
    };
  }

  function mean(xs) { return xs.reduce(function (s, x) { return s + x; }, 0) / xs.length; }
  function sd(xs) {
    if (xs.length < 2) return 0;
    const m = mean(xs);
    return Math.sqrt(xs.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (xs.length - 1));
  }

  // (mean(post) - mean(pre)) / SD(pre). pre and post are lists of
  // unpractised-item scores (per learner on a class device, or per item for
  // one learner). null when SD(pre) is 0 or a list is empty: no number is
  // better than a made-up one.
  function effectSize(pre, post) {
    if (!Array.isArray(pre) || !Array.isArray(post) || !pre.length || !post.length) return null;
    const s = sd(pre);
    if (!(s > 0)) return null;
    return Math.round(((mean(post) - mean(pre)) / s) * 100) / 100;
  }

  function unpractisedItems(score, form) {
    return form.filter(function (it) { return !it.practised; }).map(function (it) { return score.items[it.id] || 0; });
  }

  // ---------- record + schedule ----------
  function emptyRecord() { return { pre: null, post: null, retention: null }; }

  function recordTest(record, phase, answers, now) {
    if (!FORMS.hasOwnProperty(phase)) return record;
    const r = Object.assign(emptyRecord(), record || {});
    const form = buildForm(phase);
    r[phase] = { at: Number(now), answers: Object.assign({}, answers), score: scoreForm(form, answers) };
    return r;
  }

  // What the child can do now: 'pre' | 'practice' | 'post' | 'retention' | 'done'.
  // During 'practice' postDueAt (or retentionDueAt) says when the next test opens.
  function phaseAt(record, now) {
    const r = record || emptyRecord();
    const t = Number(now);
    if (!r.pre) return { phase: 'pre' };
    if (!r.post) {
      const due = r.pre.at + POST_AFTER_DAYS * DAY;
      return t >= due ? { phase: 'post', dueAt: due } : { phase: 'practice', postDueAt: due };
    }
    if (!r.retention) {
      const due = r.post.at + RETENTION_AFTER_DAYS * DAY;
      return t >= due ? { phase: 'retention', dueAt: due } : { phase: 'practice', retentionDueAt: due };
    }
    return { phase: 'done' };
  }

  // Gain and retention for one learner, from item-level unpractised scores.
  // retained: the retention check still shows a gain of at least TARGET_D.
  function report(record) {
    const r = record || emptyRecord();
    if (!r.pre || !r.post) return null;
    const pre = unpractisedItems(r.pre.score, buildForm('pre'));
    const post = unpractisedItems(r.post.score, buildForm('post'));
    const d = effectSize(pre, post);
    const out = {
      pre: r.pre.score.unpractised, post: r.post.score.unpractised, d: d,
      meetsTarget: d != null && d >= TARGET_D, retention: null, dRetention: null, retained: null,
    };
    if (r.retention) {
      const ret = unpractisedItems(r.retention.score, buildForm('retention'));
      out.retention = r.retention.score.unpractised;
      out.dRetention = effectSize(pre, ret);
      out.retained = out.dRetention != null && out.dRetention >= TARGET_D;
    }
    return out;
  }

  function loadRecord(storage, key) {
    try {
      const raw = storage && storage.getItem(key || STORAGE_KEY);
      const v = raw ? JSON.parse(raw) : null;
      return v && typeof v === 'object' ? Object.assign(emptyRecord(), v) : emptyRecord();
    } catch (e) { return emptyRecord(); }
  }
  function saveRecord(storage, record, key) {
    try { storage.setItem(key || STORAGE_KEY, JSON.stringify(record)); return true; } catch (e) { return false; }
  }

  const LOCAL_COUNT_NOTE = 'זו ספירה מקומית במכשיר הזה ולא ניסוי מבוקר: אין קבוצת ביקורת והמדגם קטן, ולכן אי אפשר להסיק מהמספרים האלה מה גרם לשינוי.';

  return {
    BEATS_PER_BAR: BEATS_PER_BAR, DAY: DAY, POST_AFTER_DAYS: POST_AFTER_DAYS, RETENTION_AFTER_DAYS: RETENTION_AFTER_DAYS,
    TARGET_D: TARGET_D, STORAGE_KEY: STORAGE_KEY, UNITS: UNITS, STICKS: STICKS, STEPS: STEPS, PRACTICE: PRACTICE,
    SLOTS: SLOTS, PHASE_HE: PHASE_HE, LOCAL_COUNT_NOTE: LOCAL_COUNT_NOTE,
    bpmToSeconds: bpmToSeconds, secondsToBeats: secondsToBeats, convertUnits: convertUnits, compareLengths: compareLengths,
    measureWithSticks: measureWithSticks, stickPlan: stickPlan, label: label,
    practiceAnswer: practiceAnswer, practicePrompt: practicePrompt,
    buildForm: buildForm, scoreForm: scoreForm, effectSize: effectSize,
    emptyRecord: emptyRecord, recordTest: recordTest, phaseAt: phaseAt, report: report,
    loadRecord: loadRecord, saveRecord: saveRecord,
  };
});
