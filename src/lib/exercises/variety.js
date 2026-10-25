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

  // Rhythm patterns vary within the same musical method (M1 steady beat, 4/4 meter):
  // varying subdivisions (quarters, eighths, half+quarters, dotted) without changing method or meter.
  const RHYTHM_PATTERNS = [
    { id: 'quarters_4', he: 'מקצב רבעים', meter: '4/4', subdivision: 'quarters', method: 'steady_beat', accents: [0] },
    { id: 'eighths_4', he: 'מקצב שמיניות', meter: '4/4', subdivision: 'eighths', method: 'steady_beat', accents: [0, 2] },
    { id: 'half_quarters', he: 'מקצב חצאים ורבעים', meter: '4/4', subdivision: 'half_quarters', method: 'steady_beat', accents: [0] },
    { id: 'swing_dotted', he: 'מקצב מנוקד', meter: '4/4', subdivision: 'dotted', method: 'steady_beat', accents: [0, 2] }
  ];

  const FRACTION_PAIRS = [[1, 2], [1, 4], [2, 4], [3, 4], [1, 3], [2, 3], [1, 6], [5, 6], [1, 8], [3, 8], [5, 8], [7, 8], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10]];

  function resolveGrade(topicOrItem, options) {
    if (options && options.grade != null) return String(options.grade);
    if (typeof topicOrItem === 'object' && topicOrItem !== null) {
      if (topicOrItem.grade != null) return String(topicOrItem.grade);
      const tid = String(topicOrItem.topicId || topicOrItem.id || '');
      if (tid.startsWith('mm-cur-')) {
        const num = parseInt(tid.replace('mm-cur-', ''), 10);
        if (num >= 0 && num <= 12) return 'א';
      }
    }
    return null;
  }

  function resolveTopicKey(topicOrItem) {
    if (!topicOrItem) return 'counting';
    const raw = typeof topicOrItem === 'string'
      ? topicOrItem
      : (topicOrItem.topicId || topicOrItem.skill || topicOrItem.mathTopic || topicOrItem.topic || '');
    const s = String(raw).toLowerCase();
    if (s.includes('mult') || s.includes('כפל')) return 'multiplication';
    if (s.includes('div') || s.includes('חילוק')) return 'division';
    if (s.includes('skip') || s.includes('דילוג')) return 'skipCounting';
    if (s.includes('next') || s.includes('עוקב') || s.includes('קודם') || s.includes('sub') || s.includes('חיסור')) return 'nextPrev';
    if (s.includes('frac') || s.includes('שבר')) return 'fractions';
    if (s.includes('dec') || s.includes('עשרונ')) return 'decimals';
    if (s.includes('pat') || s.includes('דגם') || s.includes('סדר')) return 'patterns';
    if (s.includes('sym') || s.includes('סימטר')) return 'symmetry';
    if (s.includes('line') || s.includes('ישר')) return 'numberLine';
    return 'counting';
  }

  function pickTempo(roundIndex, seed) {
    const s = Number(seed) || 0;
    const idx = (Math.abs(Number(roundIndex) || 0) + s) % BPM_STEPS.length;
    return BPM_STEPS[idx];
  }

  function pickPattern(roundIndex, seed) {
    const s = Number(seed) || 0;
    const idx = (Math.abs(Number(roundIndex) || 0) + s) % RHYTHM_PATTERNS.length;
    return RHYTHM_PATTERNS[idx];
  }

  function pickInstrument(topicKey, roundIndex, seed) {
    const s = Number(seed) || 0;
    let list = [];
    if (I && typeof I.forTopic === 'function') {
      list = I.forTopic(topicKey);
    }
    if (!list || !list.length) {
      if (I && Array.isArray(I.INSTRUMENTS) && I.INSTRUMENTS.length) list = I.INSTRUMENTS;
      else list = [{ id: 'darbuka', voice: 'drumLow', instrument: { he: 'דרבוקה' } }];
    }
    const idx = (Math.abs(Number(roundIndex) || 0) + s) % list.length;
    return list[idx];
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

  function generateNumberSet(type, roundIndex, recentKeys, grade) {
    const isGrade1 = grade === '1' || grade === 'א' || grade === 1;
    const seen = new Set(recentKeys || []);
    const maxTries = 100;
    let candidate = null;
    let key = '';

    for (let tryIdx = 0; tryIdx < maxTries; tryIdx++) {
      const step = roundIndex * 3 + tryIdx;
      if (type === 'addition') {
        let a, b;
        if (isGrade1) {
          a = ((step * 5 + 3) % 10) + 1;
          b = ((step * 7 + 2) % (20 - a)) + 1;
        } else {
          a = ((step * 7 + 3) % 18) + 2;
          b = ((step * 11 + 5) % 18) + 2;
        }
        key = `${a}+${b}`;
        if (!seen.has(key)) {
          candidate = { a, b, answer: a + b, key, prompt: `${a} + ${b} = ?`, hint: `${a} ועוד ${b} הם ${a + b}` };
          break;
        }
      } else if (type === 'subtraction') {
        let a, b, diff;
        if (isGrade1) {
          a = ((step * 7 + 5) % 19) + 2;
          b = ((step * 3 + 1) % (a - 1)) + 1;
          diff = a - b;
        } else {
          b = ((step * 7 + 2) % 15) + 2;
          diff = ((step * 5 + 1) % 12) + 1;
          a = b + diff;
        }
        key = `${a}-${b}`;
        if (!seen.has(key)) {
          candidate = { a, b, answer: diff, key, prompt: `${a} - ${b} = ?`, hint: `${a} פחות ${b} הם ${diff}` };
          break;
        }
      } else if (type === 'multiplication') {
        const a = ((step * 5 + 2) % 9) + 2;
        const b = ((step * 7 + 3) % 9) + 2;
        key = `${a}*${b}`;
        if (!seen.has(key)) {
          candidate = { a, b, answer: a * b, key, prompt: `${a} × ${b} = ?`, hint: `${a} כפול ${b} הם ${a * b}` };
          break;
        }
      } else if (type === 'division') {
        const divisor = ((step * 3 + 2) % 8) + 2;
        const quot = ((step * 5 + 1) % 8) + 2;
        const dividend = divisor * quot;
        key = `${dividend}:${divisor}`;
        if (!seen.has(key)) {
          candidate = { a: dividend, b: divisor, answer: quot, key, prompt: `${dividend} : ${divisor} = ?`, hint: `${dividend} לחלק ל־${divisor} הם ${quot}` };
          break;
        }
      } else if (type === 'fractions') {
        const pair = FRACTION_PAIRS[step % FRACTION_PAIRS.length];
        const num = pair[0], denom = pair[1];
        key = `${num}/${denom}`;
        if (!seen.has(key)) {
          candidate = { a: num, b: denom, answer: `${num}/${denom}`, key, prompt: `איזה שבר מייצג ${num} מתוך ${denom} פעימות בתיבה?`, hint: `${num} חלקים מתוך ${denom}` };
          break;
        }
      } else {
        let n;
        if (isGrade1) {
          n = ((step * 5 + 2) % 18) + 3;
          if (n > 20) n = 20;
        } else {
          n = ((step * 7 + 2) % 20) + 3;
        }
        key = `count:${n}`;
        if (!seen.has(key)) {
          candidate = { n, answer: n, key, prompt: 'כמה פעימות נשמעו?', hint: `ספרו את הפעימות: יש ${n}` };
          break;
        }
      }
    }

    return candidate;
  }

  function generateVariant(topicOrItem, roundIndex, options) {
    const opts = options || {};
    const topicKey = resolveTopicKey(topicOrItem);
    const exerciseType = detectExerciseType(topicOrItem);
    const recentKeys = opts.recentNumbers || (opts.history && opts.history.slice(-5).map(x => x.numberKey)) || [];

    const grade = resolveGrade(topicOrItem, opts);
    const numSet = generateNumberSet(exerciseType, roundIndex, recentKeys, grade);
    const tempo = pickTempo(roundIndex, opts.seed);
    const pattern = pickPattern(roundIndex, opts.seed);
    const inst = pickInstrument(topicKey, roundIndex, opts.seed);

    const basePrompt = typeof topicOrItem === 'object' && topicOrItem !== null ? topicOrItem.prompt : '';
    const baseId = typeof topicOrItem === 'object' && topicOrItem !== null ? (topicOrItem.id || 'ex') : String(topicKey);

    return {
      id: `${baseId}-var-r${roundIndex}`,
      topicId: topicKey,
      mathTopic: topicKey,
      exerciseType: exerciseType,
      kind: (typeof topicOrItem === 'object' && topicOrItem && topicOrItem.kind) || exerciseType,
      prompt: numSet ? numSet.prompt : basePrompt,
      answer: numSet ? numSet.answer : 1,
      hint: numSet ? numSet.hint : '',
      numberKey: numSet ? numSet.key : `r${roundIndex}`,
      roundIndex: roundIndex,
      bpm: tempo,
      rhythmPattern: pattern,
      instrument: inst.id,
      voice: inst.voice,
      instrumentHe: (inst.instrument && inst.instrument.he) || inst.id,
      hasMusic: true
    };
  }

  function createVarietySession(topicOrItem, options) {
    const opts = options || {};
    const history = [];
    const recentKeys = [];

    return {
      next: function (overrideRound) {
        const round = overrideRound != null ? overrideRound : history.length;
        const ex = generateVariant(topicOrItem, round, Object.assign({}, opts, {
          recentNumbers: recentKeys,
          history: history
        }));
        history.push(ex);
        recentKeys.push(ex.numberKey);
        if (recentKeys.length > 5) recentKeys.shift();
        return ex;
      },
      getHistory: function () {
        return history.slice();
      }
    };
  }

  return {
    BPM_STEPS,
    RHYTHM_PATTERNS,
    FRACTION_PAIRS,
    resolveGrade,
    resolveTopicKey,
    pickTempo,
    pickPattern,
    pickInstrument,
    detectExerciseType,
    generateNumberSet,
    generateVariant,
    createVarietySession
  };
});
