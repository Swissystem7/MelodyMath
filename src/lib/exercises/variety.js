// MelodyMath — Exercise Variety Engine (Task V1, Refs #665).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    let inst;
    try { inst = require('../instruments.js'); } catch (_) { inst = null; }
    module.exports = factory(inst);
  } else {
    root.MM_VARIETY = factory(root.MelodyMathInstruments || root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (I) {
  'use strict';

  const BPM_STEPS = [84, 92, 96, 104, 112, 118, 124, 128];
  const RHYTHM_PATTERNS = [
    { id: 'quarters_4', he: 'מקצב רבעים', meter: '4/4', subdivision: 'quarters', method: 'steady_beat', accents: [0] },
    { id: 'eighths_4', he: 'מקצב שמיניות', meter: '4/4', subdivision: 'eighths', method: 'steady_beat', accents: [0, 2] },
    { id: 'half_quarters', he: 'מקצב חצאים ורבעים', meter: '4/4', subdivision: 'half_quarters', method: 'steady_beat', accents: [0] },
    { id: 'swing_dotted', he: 'מקצב מנוקד', meter: '4/4', subdivision: 'dotted', method: 'steady_beat', accents: [0, 2] }
  ];
  const FRACTION_PAIRS = [[1, 2], [1, 4], [2, 4], [3, 4], [1, 3], [2, 3], [1, 6], [5, 6], [1, 8], [3, 8], [5, 8], [7, 8], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10]];

  const GRADE_NAMES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
  const GRADE_BOUNDS = [{ g: 'א', m: 12 }, { g: 'ב', m: 21 }, { g: 'ג', m: 30 }, { g: 'ד', m: 37 }, { g: 'ה', m: 49 }, { g: 'ו', m: 58 }];
  const GRADE_RANGES = { 'א': { min: 1, max: 20 }, 'ב': { min: 1, max: 100 }, 'ג': { min: 1, max: 1000 }, 'ד': { min: 1, max: 10000 }, 'ה': { min: 1, max: 100000 }, 'ו': { min: 1, max: 1000000 } };
  const TOPIC_RANGES = {
    'mm-cur-0': { min: 1, max: 20 }, 'mm-cur-1': { min: 10, max: 100 }, 'mm-cur-2': { min: 0, max: 100 },
    'mm-cur-3': { min: 1, max: 20 }, 'mm-cur-4': { min: 10, max: 100, step: 10, wholeTens: true },
    'mm-cur-5': { min: 1, max: 100 }, 'mm-cur-6': { min: 1, max: 20 }, 'mm-cur-7': { min: 1, max: 20 },
    'mm-cur-11': { min: 1, max: 20 }, 'mm-cur-12': { min: 1, max: 20 }, 'mm-cur-13': { min: 1, max: 1000 },
    'mm-cur-14': { min: 10, max: 100 }, 'mm-cur-15': { min: 1, max: 100 }, 'mm-cur-16': { min: 1, max: 100 },
    'mm-cur-18': { min: 1, max: 100 }, 'mm-cur-19': { min: 1, max: 100 }, 'mm-cur-22': { min: 100, max: 10000 },
    'mm-cur-23': { min: 10, max: 1000 }, 'mm-cur-24': { min: 1, max: 100 }, 'mm-cur-25': { min: 1, max: 100 },
    'mm-cur-31': { min: 100, max: 1000000 }, 'mm-cur-38': { min: 1000, max: 10000000 }, 'mm-cur-39': { min: 10, max: 1000000 },
    'mm-cur-40': { min: 2, max: 100 }, 'mm-cur-50': { min: 1, max: 10000 }, 'mm-cur-53': { min: 1, max: 100 }
  };

  function isWholeTensTopic(topicOrItem) {
    const raw = typeof topicOrItem === 'object' && topicOrItem !== null
      ? (topicOrItem.topicId || topicOrItem.id || topicOrItem.skill || topicOrItem.topic || '')
      : (topicOrItem || '');
    const s = String(raw).toLowerCase();
    return s.includes('mm-cur-4') || s.includes('עשרות') || s.includes('tens') || Boolean(TOPIC_RANGES[raw] && TOPIC_RANGES[raw].wholeTens);
  }

  function resolveGrade(topicOrItem, options) {
    if (options && options.grade != null) {
      const g = String(options.grade);
      const idx = ['1', '2', '3', '4', '5', '6'].indexOf(g);
      return idx >= 0 ? GRADE_NAMES[idx] : g;
    }
    const s = typeof topicOrItem === 'object' && topicOrItem !== null
      ? String(topicOrItem.grade || topicOrItem.topicId || topicOrItem.id || topicOrItem.skill || topicOrItem.mathTopic || '')
      : String(topicOrItem || '');
    if (s.startsWith('mm-cur-')) {
      const n = parseInt(s.slice(7), 10);
      const b = GRADE_BOUNDS.find(x => n <= x.m);
      return b ? b.g : null;
    }
    for (let i = 0; i < 6; i++) {
      const num = String(i + 1), he = GRADE_NAMES[i];
      if (s === num || s === he || s.startsWith('g' + num) || s.includes('grade' + num)) return he;
    }
    return null;
  }

  function getTopicRange(topicOrItem, options) {
    const raw = typeof topicOrItem === 'object' && topicOrItem !== null
      ? (topicOrItem.topicId || topicOrItem.id || topicOrItem.topic || '')
      : String(topicOrItem || '');
    if (TOPIC_RANGES[raw]) return TOPIC_RANGES[raw];
    const grade = resolveGrade(topicOrItem, options);
    if (grade && GRADE_RANGES[grade]) return GRADE_RANGES[grade];
    return { min: 1, max: 100 };
  }

  function resolveTopicKey(topicOrItem) {
    if (!topicOrItem) return 'counting';
    const s = String(typeof topicOrItem === 'string' ? topicOrItem : (topicOrItem.topicId || topicOrItem.skill || topicOrItem.mathTopic || topicOrItem.topic || '')).toLowerCase();
    if (s.includes('mult') || s.includes('כפל')) return 'multiplication';
    if (s.includes('div') || s.includes('חילוק')) return 'division';
    if (s.includes('skip') || s.includes('דילוג')) return 'skipCounting';
    if (s.includes('next') || s.includes('עוקב') || s.includes('קודם') || s.includes('sub') || s.includes('חיסור')) return 'nextPrev';
    if (s.includes('frac') || s.includes('שבר')) return 'fractions';
    if (s.includes('dec') || s.includes('עשרונ')) return 'decimals';
    if (s.includes('pat') || s.includes('דגם') || s.includes('סדר')) return 'patterns';
    if (s.includes('sym') || s.includes('סימטר')) return 'symmetry';
    return (s.includes('line') || s.includes('ישר')) ? 'numberLine' : 'counting';
  }

  function pickTempo(roundIndex, seed) {
    return BPM_STEPS[(Math.abs(Number(roundIndex) || 0) + (Number(seed) || 0)) % BPM_STEPS.length];
  }

  function pickPattern(roundIndex, seed) {
    return RHYTHM_PATTERNS[(Math.abs(Number(roundIndex) || 0) + (Number(seed) || 0)) % RHYTHM_PATTERNS.length];
  }

  function pickInstrument(topicKey, roundIndex, seed) {
    let list = (I && typeof I.forTopic === 'function') ? I.forTopic(topicKey) : [];
    if (!list || !list.length) list = (I && Array.isArray(I.INSTRUMENTS) && I.INSTRUMENTS.length) ? I.INSTRUMENTS : [{ id: 'darbuka', voice: 'drumLow', instrument: { he: 'דרבוקה' } }];
    return list[(Math.abs(Number(roundIndex) || 0) + (Number(seed) || 0)) % list.length];
  }

  function detectExerciseType(topicOrItem) {
    if (typeof topicOrItem === 'object' && topicOrItem !== null) {
      if (topicOrItem.exerciseType) return topicOrItem.exerciseType;
      if (topicOrItem.kind) return topicOrItem.kind;
      const p = String(topicOrItem.prompt || '');
      if (p.includes('+')) return 'addition';
      if (p.includes('-') || p.includes('−')) return 'subtraction';
      if (p.includes('×') || p.includes('*')) return 'multiplication';
      if (p.includes(':') || p.includes('÷')) return 'division';
      if (p.includes('/') || (topicOrItem.skill && topicOrItem.skill.includes('fraction'))) return 'fractions';
    }
    const k = resolveTopicKey(topicOrItem);
    return (k === 'multiplication' || k === 'division' || k === 'fractions' || k === 'decimals' || k === 'patterns') ? k : (k === 'nextPrev' ? 'subtraction' : 'addition');
  }

  function generateNumberSet(type, roundIndex, recentKeys, grade, topicOrItem) {
    const range = getTopicRange(topicOrItem, { grade });
    const maxVal = range.max || 20;
    const isGrade1 = grade === '1' || grade === 'א' || maxVal <= 20;
    const wholeTens = isWholeTensTopic(topicOrItem) || Boolean(range.wholeTens);
    const seen = new Set(recentKeys || []);
    let candidate = null;

    for (let tryIdx = 0; tryIdx < 100; tryIdx++) {
      const step = roundIndex * 3 + tryIdx;
      if (type === 'addition') {
        let a, b;
        if (wholeTens) {
          const tMax = Math.max(2, Math.floor(maxVal / 10));
          a = (((step * 3 + 1) % (tMax - 1)) + 1) * 10;
          b = (((step * 7 + 2) % (tMax - a / 10)) + 1) * 10;
        } else if (isGrade1) {
          a = ((step * 5 + 3) % 10) + 1;
          b = ((step * 7 + 2) % (maxVal - a)) + 1;
        } else if (maxVal <= 100) {
          a = ((step * 7 + 13) % 45) + 10;
          b = ((step * 11 + 7) % (maxVal - a - 5)) + 5;
        } else {
          a = ((step * 7 + 3) % 18) + 2;
          b = ((step * 11 + 5) % 18) + 2;
        }
        const key = `${a}+${b}`;
        if (!seen.has(key) || tryIdx === 99) { candidate = { a, b, answer: a + b, key, prompt: `${a} + ${b} = ?`, hint: `${a} ועוד ${b} הם ${a + b}` }; break; }
      } else if (type === 'subtraction') {
        let a, b, diff;
        if (wholeTens) {
          const tMax = Math.max(2, Math.floor(maxVal / 10));
          a = (((step * 3 + 3) % (tMax - 1)) + 2) * 10;
          b = (((step * 5 + 1) % (a / 10 - 1)) + 1) * 10;
          diff = a - b;
        } else if (isGrade1) {
          a = ((step * 7 + 5) % (maxVal - 1)) + 2;
          b = ((step * 3 + 1) % (a - 1)) + 1;
          diff = a - b;
        } else if (maxVal <= 100) {
          a = ((step * 13 + 17) % (maxVal - 15)) + 15;
          b = ((step * 7 + 3) % (a - 5)) + 2;
          diff = a - b;
        } else {
          b = ((step * 7 + 2) % 15) + 2;
          diff = ((step * 5 + 1) % 12) + 1;
          a = b + diff;
        }
        const key = `${a}-${b}`;
        if (!seen.has(key) || tryIdx === 99) { candidate = { a, b, answer: diff, key, prompt: `${a} - ${b} = ?`, hint: `${a} פחות ${b} הם ${diff}` }; break; }
      } else if (type === 'multiplication') {
        let a = isGrade1 ? ((step * 3 + 1) % 4) + 2 : ((step * 5 + 2) % 9) + 2;
        let b = isGrade1 ? ((step * 5 + 2) % Math.floor(maxVal / a)) + 1 : ((step * 7 + 3) % 9) + 2;
        const key = `${a}*${b}`;
        if (!seen.has(key) || tryIdx === 99) { candidate = { a, b, answer: a * b, key, prompt: `${a} × ${b} = ?`, hint: `${a} כפול ${b} הם ${a * b}` }; break; }
      } else if (type === 'division') {
        let divisor = isGrade1 ? ((step * 3 + 1) % 3) + 2 : ((step * 3 + 2) % 8) + 2;
        let quot = isGrade1 ? ((step * 5 + 2) % Math.floor(maxVal / divisor)) + 1 : ((step * 5 + 1) % 8) + 2;
        let dividend = divisor * quot;
        const key = `${dividend}:${divisor}`;
        if (!seen.has(key) || tryIdx === 99) { candidate = { a: dividend, b: divisor, answer: quot, key, prompt: `${dividend} : ${divisor} = ?`, hint: `${dividend} לחלק ל־${divisor} הם ${quot}` }; break; }
      } else if (type === 'fractions') {
        const pairs = isGrade1 ? [[1, 2], [2, 2], [1, 3], [2, 3], [1, 4], [2, 4], [3, 4], [4, 4]] : FRACTION_PAIRS;
        const pair = pairs[step % pairs.length], num = pair[0], denom = pair[1], key = `${num}/${denom}`;
        if (!seen.has(key) || tryIdx === 99) { candidate = { a: num, b: denom, answer: `${num}/${denom}`, key, prompt: `איזה שבר מייצג ${num} מתוך ${denom} פעימות בתיבה?`, hint: `${num} חלקים מתוך ${denom}` }; break; }
      } else {
        let n = isGrade1 ? Math.min(maxVal, ((step * 5 + 2) % Math.min(18, maxVal - 2)) + 3) : ((step * 7 + 2) % 20) + 3;
        const key = `count:${n}`;
        if (!seen.has(key) || tryIdx === 99) { candidate = { n, answer: n, key, prompt: 'כמה פעימות נשמעו?', hint: `ספרו את הפעימות: יש ${n}` }; break; }
      }
    }
    return candidate;
  }

  function generateVariant(topicOrItem, roundIndex, options) {
    const opts = options || {}, topicKey = resolveTopicKey(topicOrItem), exerciseType = detectExerciseType(topicOrItem);
    const recentKeys = opts.recentNumbers || (opts.history && opts.history.slice(-5).map(x => x.numberKey)) || [];
    const grade = resolveGrade(topicOrItem, opts), numSet = generateNumberSet(exerciseType, roundIndex, recentKeys, grade, topicOrItem);
    const tempo = pickTempo(roundIndex, opts.seed), pattern = pickPattern(roundIndex, opts.seed), inst = pickInstrument(topicKey, roundIndex, opts.seed);
    const basePrompt = typeof topicOrItem === 'object' && topicOrItem !== null ? topicOrItem.prompt : '';
    const baseId = typeof topicOrItem === 'object' && topicOrItem !== null ? (topicOrItem.id || 'ex') : String(topicKey);

    return {
      id: `${baseId}-var-r${roundIndex}`,
      topicId: (typeof topicOrItem === 'object' && topicOrItem && topicOrItem.topicId) || (typeof topicOrItem === 'string' && topicOrItem.startsWith('mm-cur-') ? topicOrItem : topicKey),
      mathTopic: topicKey, exerciseType: exerciseType,
      kind: (typeof topicOrItem === 'object' && topicOrItem && topicOrItem.kind) || exerciseType,
      prompt: numSet ? numSet.prompt : basePrompt, answer: numSet ? numSet.answer : 1, hint: numSet ? numSet.hint : '',
      numberKey: numSet ? numSet.key : `r${roundIndex}`, roundIndex: roundIndex, bpm: tempo, rhythmPattern: pattern,
      instrument: inst.id, voice: inst.voice, instrumentHe: (inst.instrument && inst.instrument.he) || inst.id, hasMusic: true
    };
  }

  function createVarietySession(topicOrItem, options) {
    const opts = options || {}, history = [], recentKeys = [];
    return {
      next: function (overrideRound) {
        const round = overrideRound != null ? overrideRound : history.length;
        const ex = generateVariant(topicOrItem, round, Object.assign({}, opts, { recentNumbers: recentKeys, history: history }));
        history.push(ex);
        recentKeys.push(ex.numberKey);
        if (recentKeys.length > 5) recentKeys.shift();
        return ex;
      },
      getHistory: function () { return history.slice(); }
    };
  }

  return {
    BPM_STEPS, RHYTHM_PATTERNS, FRACTION_PAIRS, GRADE_RANGES, TOPIC_RANGES,
    resolveGrade, getTopicRange, resolveTopicKey, pickTempo, pickPattern,
    pickInstrument, detectExerciseType, generateNumberSet, generateVariant,
    createVarietySession
  };
});
