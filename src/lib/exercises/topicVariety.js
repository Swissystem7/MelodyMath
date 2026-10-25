// MelodyMath — variety for every curriculum topic, grades א׳–ו׳ (#757, Refs #752, #741, #665).
// A topic keeps ONE exercise type (the bank skill) and ONE main music way (the
// item's music tag) for the whole session. Only the numbers (another bank item
// of the same type and way), the instrument (a timbre, never a new method), the
// tempo and the rhythm pattern change, and never the same exercise twice in a
// row. Numbers stay inside the topic range of #741. The last round of a way
// item is a check without music (#665).
// Research: Rohrer, D., & Taylor, K. (2007). The shuffling of mathematics problems improves learning. Instructional Science, 35(6), 481-498. doi:10.1007/s11251-007-9015-8
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    let inst;
    try { inst = require('../instruments.js'); } catch (_) { inst = null; }
    module.exports = factory(root, inst);
  } else {
    root.MM_TOPIC_VARIETY = factory(root, null);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, INST) {
  'use strict';

  // Same tables as src/lib/exercises/variety.js of #741; that file wins when it is loaded.
  const V = root.MM_VARIETY || {};
  const BPM_STEPS = V.BPM_STEPS || [84, 92, 96, 104, 112, 118, 124, 128];
  const RHYTHM_PATTERNS = V.RHYTHM_PATTERNS || [
    { id: 'quarters_4', he: 'מקצב רבעים', meter: '4/4' },
    { id: 'eighths_4', he: 'מקצב שמיניות', meter: '4/4' },
    { id: 'half_quarters', he: 'מקצב חצאים ורבעים', meter: '4/4' },
    { id: 'swing_dotted', he: 'מקצב מנוקד', meter: '4/4' }
  ];
  // Highest topic index of each grade in curriculum.js MATRIX (mm-cur-<n>).
  const GRADE_BOUNDS = [{ g: 'א', m: 12 }, { g: 'ב', m: 21 }, { g: 'ג', m: 30 }, { g: 'ד', m: 37 }, { g: 'ה', m: 49 }, { g: 'ו', m: 58 }];
  const GRADE_RANGES = V.GRADE_RANGES || { 'א': { min: 1, max: 20 }, 'ב': { min: 1, max: 100 }, 'ג': { min: 1, max: 1000 }, 'ד': { min: 1, max: 10000 }, 'ה': { min: 1, max: 100000 }, 'ו': { min: 1, max: 1000000 } };
  const TOPIC_RANGES = V.TOPIC_RANGES || {
    'mm-cur-0': { min: 1, max: 20 }, 'mm-cur-1': { min: 10, max: 100 }, 'mm-cur-2': { min: 0, max: 100 }, 'mm-cur-3': { min: 1, max: 20 },
    'mm-cur-4': { min: 10, max: 100, step: 10, wholeTens: true }, 'mm-cur-5': { min: 1, max: 100 }, 'mm-cur-6': { min: 1, max: 20 },
    'mm-cur-7': { min: 1, max: 20 }, 'mm-cur-11': { min: 1, max: 20 }, 'mm-cur-12': { min: 1, max: 20 }, 'mm-cur-13': { min: 1, max: 1000 },
    'mm-cur-14': { min: 10, max: 100 }, 'mm-cur-15': { min: 1, max: 100 }, 'mm-cur-16': { min: 1, max: 100 }, 'mm-cur-18': { min: 1, max: 100 },
    'mm-cur-19': { min: 1, max: 100 }, 'mm-cur-22': { min: 100, max: 10000 }, 'mm-cur-23': { min: 10, max: 1000 }, 'mm-cur-24': { min: 1, max: 100 },
    'mm-cur-25': { min: 1, max: 100 }, 'mm-cur-31': { min: 100, max: 1000000 }, 'mm-cur-38': { min: 1000, max: 10000000 },
    'mm-cur-39': { min: 10, max: 1000000 }, 'mm-cur-40': { min: 2, max: 100 }, 'mm-cur-50': { min: 1, max: 10000 }, 'mm-cur-53': { min: 1, max: 100 }
  };
  const FALLBACK_INSTRUMENT = { id: 'darbuka', voice: 'drumLow', instrument: { he: 'דרבוקה' } };

  function gradeOf(row) {
    if (row && row.grade) return row.grade;
    const n = parseInt(String((row && row.topicId) || row || '').replace('mm-cur-', ''), 10);
    const b = GRADE_BOUNDS.find(function (x) { return n <= x.m; });
    return b ? b.g : null;
  }

  function rangeFor(row) {
    const id = row && typeof row === 'object' ? row.topicId : row;
    return TOPIC_RANGES[id] || GRADE_RANGES[gradeOf(row)] || { min: 1, max: 100 };
  }

  // Every number a child reads in the prompt or writes as the answer ("2,500" is one number).
  function numbersOf(it) {
    const text = String((it && it.prompt) || '') + ' ' + String(it && it.answer != null ? it.answer : '');
    return (text.match(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g) || []).map(function (s) { return Number(s.replace(/,/g, '')); });
  }

  function inRange(it, range) {
    return numbersOf(it).every(function (n) { return n >= 0 && n <= range.max; });
  }

  // The topic's largest group of in-range items sharing one type and one main way.
  function poolFor(row, items) {
    const range = rangeFor(row), groups = {}, order = [];
    (Array.isArray(items) ? items : []).forEach(function (it) {
      if (!it || !it.skill || !it.music || !inRange(it, range)) return;
      const k = it.skill + '|' + it.music;
      if (!groups[k]) { groups[k] = []; order.push(k); }
      groups[k].push(it);
    });
    let best = [];
    order.forEach(function (k) { if (groups[k].length > best.length) best = groups[k]; });
    return best;
  }

  // An instrument is a timbre on the same way: the topic's own instruments, else any non-optional one.
  function instrumentsFor(skill) {
    const I = INST || root;
    const strong = function (x) { return !x.optional; };
    const own = (I && typeof I.forTopic === 'function' ? I.forTopic(skill) : []).filter(strong);
    if (own.length) return own;
    const all = I && Array.isArray(I.INSTRUMENTS) ? I.INSTRUMENTS.filter(strong) : [];
    return all.length ? all : [FALLBACK_INSTRUMENT];
  }

  function createTopicSession(row, items, options) {
    const opts = options || {}, seed = Math.abs(Math.round(Number(opts.seed) || 0));
    const range = rangeFor(row), pool = poolFor(row, items), history = [];

    function variant(it, round) {
      // #665: the child solves through music; the last round of a way item is a check without it.
      const noMusic = Boolean(opts.noMusic) || Boolean(it.musicNote && opts.totalRounds > 0 && round >= opts.totalRounds - 1);
      const insts = instrumentsFor(it.skill), inst = insts[(round + seed) % insts.length];
      const pattern = RHYTHM_PATTERNS[(round + seed) % RHYTHM_PATTERNS.length];
      const nums = numbersOf(it);
      return {
        id: (it.id || 'ex') + '-var-r' + round, round: round, item: it,
        topicId: (row && row.topicId) || null, grade: gradeOf(row) || it.grade,
        prompt: it.prompt, answer: it.answer, hint: it.hint,
        exerciseType: it.skill, mainWay: it.music, musicNote: it.musicNote || null,
        numbers: nums, numberKey: nums.length ? nums.join(',') : String(it.id || it.prompt),
        // 3 is coprime with the 8 tempi, so two rounds in a row never share a tempo.
        bpm: noMusic ? null : BPM_STEPS[(round * 3 + seed) % BPM_STEPS.length],
        meter: pattern.meter || '4/4',
        pattern: noMusic ? null : pattern.id, patternHe: noMusic ? null : pattern.he,
        instrument: noMusic ? null : inst.id, voice: noMusic ? null : inst.voice,
        instrumentHe: noMusic ? null : ((inst.instrument && inst.instrument.he) || inst.id),
        hasMusic: !noMusic, noMusic: noMusic
      };
    }

    function push(v) { history.push(v); return v; }

    return {
      range: range,
      size: pool.length,
      exerciseType: pool.length ? pool[0].skill : null,
      mainWay: pool.length ? pool[0].music : null,
      // Next generated exercise: the next item of the pool, so numbers change each round.
      next: function () {
        if (!pool.length) return null;
        const r = history.length;
        return push(variant(pool[(r + seed) % pool.length], r));
      },
      // Dress an item already picked elsewhere (the plan loop) in the round's variety.
      decorate: function (it, round) {
        if (!it) return null;
        return push(variant(it, round != null ? round : history.length));
      },
      getHistory: function () { return history.slice(); }
    };
  }

  function badgeHtml(v) {
    if (!v) return '';
    if (v.noMusic) return '<span class="mm-variety-badge" data-no-music="1">✏️ בדיקה בלי מוזיקה</span>';
    return '<span class="mm-variety-badge" data-bpm="' + v.bpm + '" data-instrument="' + v.instrument + '" data-pattern="' + v.pattern + '">'
      + '🎵 ' + v.instrumentHe + ' · ⏱️ ' + v.bpm + ' BPM · 🥁 ' + v.patternHe + '</span>';
  }

  return {
    BPM_STEPS: BPM_STEPS, RHYTHM_PATTERNS: RHYTHM_PATTERNS, GRADE_BOUNDS: GRADE_BOUNDS, GRADE_RANGES: GRADE_RANGES, TOPIC_RANGES: TOPIC_RANGES,
    gradeOf: gradeOf, rangeFor: rangeFor, numbersOf: numbersOf, inRange: inRange, poolFor: poolFor,
    instrumentsFor: instrumentsFor, createTopicSession: createTopicSession, badgeHtml: badgeHtml
  };
});
