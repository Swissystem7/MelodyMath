// MelodyMath — Exercise Variety Engine (Task V1, Refs #665).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { let inst; try { inst = require('../instruments.js'); } catch (_) { inst = null; } module.exports = factory(inst); }
  else root.MM_VARIETY = factory(root.MelodyMathInstruments || root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (I) { 'use strict';
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
    'mm-cur-40': { min: 2, max: 100 }, 'mm-cur-45': { min: 0, max: 100 }, 'mm-cur-46': { min: 0, max: 100 }, 'mm-cur-50': { min: 1, max: 10000 }, 'mm-cur-53': { min: 1, max: 100 }
  };
  const TOPIC_TYPES = {
    'mm-cur-0': 'counting', 'mm-cur-1': 'counting', 'mm-cur-2': 'number_line', 'mm-cur-3': 'addition',
    'mm-cur-4': 'addition', 'mm-cur-5': 'place_value', 'mm-cur-6': 'patterns', 'mm-cur-7': 'word_problems',
    'mm-cur-11': 'measurement', 'mm-cur-12': 'data', 'mm-cur-13': 'place_value', 'mm-cur-14': 'addition',
    'mm-cur-15': 'multiplication', 'mm-cur-16': 'division', 'mm-cur-18': 'measurement', 'mm-cur-19': 'measurement',
    'mm-cur-22': 'place_value', 'mm-cur-23': 'addition', 'mm-cur-24': 'multiplication', 'mm-cur-25': 'division',
    'mm-cur-31': 'place_value', 'mm-cur-38': 'place_value', 'mm-cur-39': 'operations', 'mm-cur-40': 'factors',
    'mm-cur-45': 'decimals', 'mm-cur-46': 'decimals', 'mm-cur-50': 'operations', 'mm-cur-53': 'percent'
  };
  const OWN_TYPES = { addition: 1, subtraction: 1, multiplication: 1, division: 1, fractions: 1, basic_fractions: 1, counting: 1, number_line: 1, place_value: 1, patterns: 1, word_problems: 1, measurement: 1, data: 1, percent: 1, factors: 1, operations: 1, decimals: 1 };
  function topicIdOf(topicOrItem) {
    const raw = typeof topicOrItem === 'object' && topicOrItem !== null ? (topicOrItem.topicId || topicOrItem.id || topicOrItem.topic || '') : (topicOrItem || '');
    const m = String(raw).match(/mm-cur-\d+/);
    return m ? m[0] : '';
  }
  function isWholeTensTopic(topicOrItem) {
    const id = topicIdOf(topicOrItem);
    if (id) return Boolean(TOPIC_RANGES[id] && TOPIC_RANGES[id].wholeTens);
    const s = String(typeof topicOrItem === 'object' && topicOrItem ? (topicOrItem.skill || topicOrItem.topic || '') : (topicOrItem || '')).toLowerCase();
    return s.includes('עשרות') || s.includes('tens');
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
    const raw = String(topicOrItem || '').toLowerCase(), k = resolveTopicKey(topicOrItem);
    if (k === 'multiplication' || k === 'division' || k === 'fractions' || k === 'decimals' || k === 'patterns') return k;
    if (k === 'numberLine') return 'number_line';
    if (k === 'skipCounting') return 'multiplication';
    if (raw.includes('sub') || raw.includes('חיסור')) return 'subtraction';
    return (raw.includes('add') || raw.includes('חיבור')) ? 'addition' : 'counting';
  }
  function exerciseTypeOf(topicOrItem) {
    if (typeof topicOrItem === 'object' && topicOrItem !== null) {
      if (topicOrItem.exerciseType) return topicOrItem.exerciseType;
      if (topicOrItem.skill) return topicOrItem.skill;
    }
    const id = topicIdOf(topicOrItem);
    if (id && TOPIC_TYPES[id]) return TOPIC_TYPES[id];
    return detectExerciseType(topicOrItem);
  }
  function instrumentKey(exerciseType, topicKey) {
    const map = { percent: 'percent', multiplication: 'multiplication', division: 'division', fractions: 'fractions', basic_fractions: 'fractions', decimals: 'decimals', patterns: 'patterns', number_line: 'numberLine', data: 'data', factors: 'lcm', counting: 'counting', place_value: 'counting' };
    const k = map[exerciseType];
    if (k && I && typeof I.forTopic === 'function' && I.forTopic(k).length) return k;
    return topicKey;
  }
  function spanPick(range, step, salt) {
    const lo = range.min || 0, hi = range.max != null ? range.max : lo, span = Math.max(0, hi - lo);
    return lo + ((Math.abs(step) * salt + 7) % (span + 1));
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
  function otherSet(type, step, range) {
    const hi = range.max != null ? range.max : 20, lo = range.min || 0, s = Math.abs(step);
    if (type === 'counting') { const start = lo + (s % Math.max(1, hi - lo)), answer = Math.min(hi, start + 1); return { answer: answer, key: 'next:' + start, prompt: start + ', ואז המספר הבא?', hint: 'אחרי ' + start + ' בא ' + answer }; }
    if (type === 'number_line') { const n = spanPick(range, step, 17), low = n <= lo, anchor = low ? n + 1 : n - 1; return { answer: n, key: 'line:' + n, prompt: 'על הישר, נקודה אחת ' + (low ? 'לפני ' : 'אחרי ') + anchor + '. איזה מספר עומד שם?', hint: 'המספר הוא ' + n }; }
    if (type === 'place_value') { const n = spanPick(range, step, 13), tens = Math.floor(n / 10), ones = n % 10; return { answer: n, key: 'pv:' + n, prompt: tens + ' עשרות ו־' + ones + ' יחידות — איזה מספר זה?', hint: String(tens * 10 + ones) }; }
    if (type === 'patterns') { const d = 1 + (s % 3), room = Math.max(1, hi - lo - 3 * d), a0 = lo + (s % room), answer = Math.min(hi, a0 + 3 * d); return { answer: answer, key: 'pat:' + a0 + ':' + d, prompt: 'הדגם ' + a0 + ', ' + (a0 + d) + ', ' + (a0 + 2 * d) + '. מה הבא?', hint: 'הקפיצה היא ' + d }; }
    if (type === 'word_problems') { const sum = Math.max(2, Math.min(hi, Math.max(lo, 2) + (s % Math.max(1, hi - Math.max(lo, 2) + 1)))), a = 1 + ((s * 3) % Math.max(1, sum - 1)), answer = sum - a; return { a: a, b: answer, answer: answer, key: 'miss:' + a + ':' + sum, prompt: 'כמה חסר ל־' + a + ' כדי להגיע ל־' + sum + '?', hint: a + ' ועוד ' + answer + ' הם ' + sum }; }
    if (type === 'measurement' || type === 'data') { const n = spanPick(range, step, type === 'data' ? 19 : 23); return { answer: n, key: type + ':' + n, prompt: type === 'data' ? ('בעמודה יש ' + n + '. כמה יש בעמודה?') : ('הסרגל מראה ' + n + ' ס״מ. כמה ס״מ זה?'), hint: String(n), hearN: n }; }
    if (type === 'percent') { const p = [10, 20, 25, 50][s % 4], cap = Math.min(hi, 100), floor = Math.max(lo, 1), answer = floor + (s % Math.max(1, cap - floor + 1)), whole = answer * (100 / p); return { a: p, b: whole, answer: answer, key: p + '%of' + whole, prompt: 'כמה זה ' + p + '% מ־' + whole + '?', hint: p + '% הם ' + answer }; }
    if (type === 'factors') { const pairs = [[2, 3], [2, 5], [3, 4], [3, 5], [4, 5], [5, 6], [5, 7], [6, 7], [7, 8], [7, 9], [8, 9], [9, 10], [4, 7], [3, 7], [3, 8], [4, 9], [6, 11], [7, 11], [8, 11], [9, 11]], pair = pairs[s % pairs.length], answer = pair[0] / gcd(pair[0], pair[1]) * pair[1]; return { a: pair[0], b: pair[1], answer: answer, key: 'lcm:' + pair[0] + ':' + pair[1], prompt: 'תוף אחד כל ' + pair[0] + ' פעימות ותוף שני כל ' + pair[1] + '. אחרי כמה פעימות הם נפגשים?', hint: 'הכפולה המשותפת היא ' + answer }; }
    if (type === 'operations') { const floor = Math.max(1, lo), cap = hi; let a = 2 + (s % 8), b = 2 + ((s * 3 + 1) % 8); if (a * b < floor) b = Math.max(b, Math.ceil(floor / a)); if (a * b > cap) { a = 1; b = Math.min(cap, Math.max(floor, 1)); } let answer = a * b; if (answer < floor || answer > cap) { a = 1; b = floor; answer = floor; } return { a: a, b: b, answer: answer, key: 'op:' + a + '*' + b, prompt: a + ' × ' + b + ' = ?', hint: a + ' כפול ' + b + ' הם ' + answer }; }
    if (type === 'decimals') { const t = 1 + (Math.floor(s / 3) % 9), answer = (10 + t) / 10; return { answer: answer, key: 'dec:' + t, prompt: 'כתבו כשבר עשרוני: ' + (10 + t) + '/10', hint: String(answer) }; }
    return null;
  }
  function hearFor(type, set) {
    if (!set) return null;
    const ok = function (n) { return typeof n === 'number' && n >= 1 && n <= 12 && n === Math.round(n); };
    if (type === 'multiplication' || type === 'division' || type === 'operations' || type === 'percent' || type === 'factors' || type === 'fractions' || type === 'decimals' || type === 'place_value' || type === 'number_line' || type === 'patterns' || type === 'counting') return null;
    if ((type === 'addition' || type === 'word_problems') && ok(set.a) && (type === 'word_problems' || ok(set.b))) return type === 'word_problems' ? [set.a] : [set.a, set.b];
    if (type === 'subtraction' && ok(set.a)) return [set.a];
    if (ok(set.hearN) && String(set.prompt || '').indexOf(String(set.hearN)) >= 0) return [set.hearN];
    return null;
  }
  function generateNumberSet(type, roundIndex, recentKeys, grade, topicOrItem, seed) {
    if (type === 'basic_fractions') type = 'fractions';
    const range = getTopicRange(topicOrItem, { grade });
    const maxVal = range.max || 20;
    const wideSum = !isWholeTensTopic(topicOrItem) && !(grade === '1' || grade === 'א' || maxVal <= 20) && (range.min || 0) >= 10 && maxVal > 100;
    const isGrade1 = grade === '1' || grade === 'א' || maxVal <= 20;
    const wholeTens = isWholeTensTopic(topicOrItem) || Boolean(range.wholeTens);
    const seen = new Set(recentKeys || []);
    let candidate = null;
    for (let tryIdx = 0; tryIdx < 100; tryIdx++) {
      const step = roundIndex * 3 + tryIdx + (Math.abs(Number(seed) || 0) % 89) * 5;
      if (type === 'addition') {
        let a, b;
        if (wideSum) {
          const lo = range.min || 0;
          const span = Math.max(0, maxVal - lo);
          const answer = lo + ((step * 13 + tryIdx) % (span + 1));
          const room = Math.max(1, answer - 1);
          b = 1 + ((step * 5 + 3) % room);
          a = answer - b;
        } else if (wholeTens) {
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
        const made = otherSet(type, step, range);
        if (made && made.answer >= (range.min || 0) && (typeof made.answer !== 'number' || made.answer <= (range.max != null ? range.max : made.answer)) && (!seen.has(made.key) || tryIdx === 99)) { candidate = made; break; }
        if (!made && !OWN_TYPES[type]) {
          let n = isGrade1 ? Math.min(maxVal, ((step * 5 + 2) % Math.min(18, Math.max(1, maxVal - 2))) + 3) : ((step * 7 + 2) % 20) + 3;
          const key = `count:${n}`;
          if (!seen.has(key) || tryIdx === 99) { candidate = { n, answer: n, key, prompt: 'כמה פעימות נשמעו?', hint: `ספרו את הפעימות: יש ${n}` }; break; }
        }
      }
    }
    return candidate;
  }
  function sameShape(type, prompt) {
    const p = String(prompt || ''), bit = { counting: 'המספר הבא', number_line: 'על הישר', patterns: 'הדגם', word_problems: 'כמה חסר', measurement: 'הסרגל', data: 'בעמודה' };
    if (type === 'percent') return p.indexOf('%') >= 0 && p.indexOf('כמה זה') >= 0;
    if (type === 'addition') return /^\d+\s*\+\s*\d+\s*=/.test(p);
    if (type === 'subtraction') return /^\d+\s*[-−]\s*\d+\s*=/.test(p);
    if (type === 'multiplication' || type === 'operations') return /^\d+\s*×\s*\d+\s*=/.test(p);
    if (type === 'division') return /^\d+\s*[:÷]\s*\d+\s*=/.test(p);
    if (type === 'fractions' || type === 'basic_fractions') return p.indexOf('איזה שבר') >= 0;
    if (type === 'factors') return p.indexOf('תוף') >= 0 && p.indexOf('נפגש') >= 0;
    if (type === 'place_value') return p.indexOf('עשרות') >= 0 && p.indexOf('יחידות') >= 0;
    if (type === 'decimals') return p.indexOf('כשבר עשרוני') >= 0 && /\/10(?!\d)/.test(p);
    return bit[type] ? p.indexOf(bit[type]) >= 0 : false;
  }
  function retune(prompt, answer, step, range, type) {
    const near = function (a, b) { return Math.abs(a - b) < 1e-6; }, hits = [], re = /\d[\d,]*(?:\.\d+)?/g, p = String(prompt);
    let m;
    while ((m = re.exec(p)) && hits.length < 8) hits.push([m.index, m[0], Number(m[0].replace(/,/g, ''))]);
    const A = Number(answer);
    if (!isFinite(A) || hits.length < 2 || (range && range.wholeTens)) return null;
    const mul = /×|\*|בכל/.test(p) || type === 'multiplication' || type === 'operations', div = /÷|לכל|צלח/.test(p) || type === 'division', sub = /−|-|אכל|עפו|נשאר|פחות|יותר|אחורה/.test(p) || type === 'subtraction', add = /\+|ועוד|עוד|קדימה|ו/.test(p) || type === 'addition';
    let op = null, i = 0, j = 0;
    for (i = 0; i < hits.length && !op; i++) for (j = i + 1; j < hits.length && !op; j++) {
      const x = hits[i][2], y = hits[j][2];
      if (mul && near(x * y, A)) op = '*'; else if (div && y && x % y === 0 && near(x / y, A)) op = '/'; else if (sub && near(x - y, A)) op = '-'; else if (add && near(x + y, A)) op = '+';
    }
    if (!op) return null;
    i -= 1; j -= 1;
    const hi = range.max != null ? range.max : 20, lo = range.min || 0, s = Math.abs(step) + 1, dec = hits[i][1].indexOf('.') >= 0 || hits[j][1].indexOf('.') >= 0;
    let a, b, ans;
    if (dec && (op === '+' || op === '-')) { a = (1 + (s % 9)) / 10; b = (1 + ((s * 3) % 9)) / 10; if (op === '-' && b >= a) b = a / 2; ans = Math.round((op === '+' ? a + b : a - b) * 10) / 10; }
    else if (op === '*') { a = 2 + (s % 8); b = 2 + ((s * 3) % 8); if (a * b > hi) b = Math.max(1, Math.floor(hi / a)); ans = a * b; }
    else if (op === '/') { b = 2 + (s % 5); ans = 2 + ((s * 3) % 7); if (ans === b) ans += 1; a = b * ans; if (a > hi) { b = 2; ans = Math.max(1, Math.floor(hi / b)); if (ans === b) ans = 1; a = b * ans; } }
    else if (op === '-') { a = Math.min(hi, Math.max(lo + 2, 2 + (s % Math.max(2, hi - lo)))); b = 1 + ((s * 3) % Math.max(1, a - lo)); ans = a - b; }
    else { const cap = Math.max(1, hi - Math.max(lo, 1)); a = Math.max(1, lo) + (s % Math.min(12, cap)); b = 1 + ((s * 5) % Math.max(1, hi - a)); ans = a + b; if (ans > hi) { b = Math.max(1, hi - a); ans = a + b; } }
    if (!isFinite(ans) || ans < lo || ans > hi || near(a, hits[i][2]) && near(b, hits[j][2])) return null;
    const fmt = function (n, sample) { return sample.indexOf(',') >= 0 ? String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : String(n); };
    let out = p;
    [[hits[j], b], [hits[i], a]].forEach(function (pair) { const h = pair[0], v = fmt(pair[1], h[1]); out = out.slice(0, h[0]) + v + out.slice(h[0] + h[1].length); });
    if (new RegExp('(^|[^\\d.])' + String(ans).replace(/\\/g, '\\\\').replace(/\./g, '\\.') + '([^\\d]|$)').test(out)) return null;
    return { prompt: out, answer: ans, key: op + a + ':' + b, a: a, b: b, hint: '' };
  }
  function generateVariant(topicOrItem, roundIndex, options) {
    const opts = options || {}, topicKey = resolveTopicKey(topicOrItem), exerciseType = exerciseTypeOf(topicOrItem);
    const source = typeof topicOrItem === 'object' && topicOrItem !== null ? topicOrItem : null;
    const recentKeys = opts.recentNumbers || (opts.history && opts.history.slice(-5).map(x => x.numberKey)) || [];
    const grade = resolveGrade(topicOrItem, opts);
    const real = !!(source && source.prompt && source.prompt !== 'old');
    const shaped = real && !!OWN_TYPES[exerciseType] && sameShape(exerciseType, source.prompt);
    const tuned = real ? retune(source.prompt, source.answer, roundIndex * 17 + (Math.abs(Number(opts.seed) || 0) % 89) * 5, getTopicRange(topicOrItem, opts), exerciseType) : null;
    const keep = real && !shaped && !tuned;
    const numSet = tuned || (keep ? null : generateNumberSet(exerciseType, roundIndex, recentKeys, grade, topicOrItem, opts.seed));
    const tempo = pickTempo(roundIndex, opts.seed), pattern = pickPattern(roundIndex, opts.seed), inst = pickInstrument(instrumentKey(exerciseType, topicKey), roundIndex, opts.seed);
    const basePrompt = source ? source.prompt : '';
    const baseId = source ? (source.id || 'ex') : String(topicKey);
    const silent = !!(opts.noMusic || (typeof opts.rounds === 'number' && roundIndex === opts.rounds - 1) || (source && (source.noMusic || source.plain || source.musicStage === 'no_music_check')));
    const prompt = numSet ? numSet.prompt : basePrompt;
    const answer = numSet ? numSet.answer : (source && source.answer != null ? source.answer : 1);
    const hear = silent ? null : (keep ? (source.hear || null) : hearFor(exerciseType, numSet));
    const out = {
      id: `${baseId}-var-r${roundIndex}`,
      topicId: (source && source.topicId) || (typeof topicOrItem === 'string' && topicOrItem.startsWith('mm-cur-') ? topicOrItem : topicKey),
      mathTopic: topicKey, exerciseType: exerciseType,
      skill: (source && source.skill) || exerciseType,
      kind: (source && source.kind) || exerciseType,
      prompt: prompt, answer: answer, hint: numSet ? numSet.hint : (source && source.hint) || '',
      numberKey: numSet ? numSet.key : `keep:${roundIndex}`, roundIndex: roundIndex, bpm: tempo, rhythmPattern: pattern,
      instrument: inst.id, voice: inst.voice, instrumentHe: (inst.instrument && inst.instrument.he) || inst.id,
      hear: hear, hasMusic: !silent, noMusic: silent
    };
    if (silent) out.music = null;
    else if (source && source.music) out.music = source.music;
    else if (exerciseType === 'percent') out.music = 'percentBar';
    if (exerciseType === 'number_line' && new RegExp('(^|[^\\d.])' + String(out.answer).replace(/\\/g, '\\\\').replace(/\./g, '\\.') + '([^\\d]|$)').test(String(out.prompt))) { const safe = otherSet('number_line', roundIndex * 17 + 1, getTopicRange(topicOrItem, opts)); if (safe) { out.prompt = safe.prompt; out.answer = safe.answer; out.hint = safe.hint; out.numberKey = safe.key; } }
    return out;
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
    BPM_STEPS, RHYTHM_PATTERNS, FRACTION_PAIRS, GRADE_RANGES, TOPIC_RANGES, TOPIC_TYPES,
    resolveGrade, getTopicRange, resolveTopicKey, pickTempo, pickPattern,
    pickInstrument, detectExerciseType, exerciseTypeOf, generateNumberSet, generateVariant,
    createVarietySession
  };
});
