// MelodyMath — adaptive difficulty and answer checking.
//
// These two rules are the pedagogical core of the product, so they live in one
// tested place rather than inside a click handler:
//
//   nextLevel   two right in a row moves up, two wrong in a row moves down,
//               anything else holds. Level never leaves 1..3.
//   isCorrect   answers are compared after normalisation, so "3 : 2", "3:2"
//               and " 3:2 " all count, and a decimal comma is accepted the way
//               a Hebrew-keyboard child actually types it. A mixed number is
//               compared by value inside its own form: "1 3/4" counts for
//               "1 ו־3/4", but the improper "7/4" does not.
//   eligibleExercises
//               only mastered (correct) ids drop out. Misses stay in the pool
//               and are preferred on the next turn so errors return sooner.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MIN_LEVEL = 1;
  const MAX_LEVEL = 3;

  function nextLevel(currentLevel, lastTwo) {
    if (!Array.isArray(lastTwo) || lastTwo.length !== 2) return currentLevel;
    if (lastTwo.every((x) => x.correct)) return Math.min(MAX_LEVEL, currentLevel + 1);
    if (lastTwo.every((x) => !x.correct)) return Math.max(MIN_LEVEL, currentLevel - 1);
    return currentLevel;
  }

  function normalizeAnswer(value) {
    return String(value).trim().replace(/\s/g, '').replace(/,/g, '.');
  }

  function normalizeHebrewText(value) {
    return String(value).trim().replace(/[\s\-\u05BE\u2011\u2013]/g, '');
  }

  function parseStudentNumber(rawIn) {
    let s = String(rawIn == null ? '' : rawIn).trim().replace(/\s/g, '');
    if (s === '') return NaN;
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma !== -1 && lastDot !== -1) {
      s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    } else if (lastComma !== -1) {
      s = s.replace(',', '.');
    }
    return Number(s);
  }

  function countDecimals(rawIn) {
    const s = String(rawIn == null ? '' : rawIn).trim().replace(/\s/g, '');
    const sep = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
    if (sep === -1) return 0;
    return s.slice(sep + 1).replace(/\D/g, '').length;
  }

  function closeEnough(val, expected, dec, rawIn) {
    const eps = 1e-9;
    const digits = typeof dec === 'number' ? dec : 2;
    const unit = Math.pow(10, -digits);
    if (Math.abs(val - expected) <= 0.5 * unit + eps) return true;
    const p = Math.pow(10, digits);
    if (Math.abs(Math.round(val * p) / p - expected) <= eps) return true;
    if (countDecimals(rawIn) <= 1) {
      if (Math.abs(Math.round(val * 10) / 10 - Math.round(expected * 10) / 10) <= eps) return true;
      if (Math.abs(val - expected) <= 0.05 + eps) return true;
    }
    return false;
  }

  function parseSimpleFraction(raw) {
    const s = String(raw == null ? '' : raw).trim().replace(/\s/g, '');
    if (s === '½') return { n: 1, d: 2 };
    if (s === '¼') return { n: 1, d: 4 };
    if (s === '⅛') return { n: 1, d: 8 };
    const m = /^(-?\d+)\/(-?\d+)$/.exec(s);
    if (!m) return null;
    const n = Number(m[1]);
    const d = Number(m[2]);
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
    return { n: n, d: d };
  }

  // A mixed number the way Hebrew textbooks print it: a whole part, the
  // connector "ו" (with or without a maqaf), then a fraction — "1 ו־3/4",
  // "1 ו 3/4", "1ו3/4". A bare space also separates ("1 3/4"), but a separator
  // is required: "123/4" is the fraction one hundred twenty three quarters and
  // must not read as 12 ו־3/4. Digits only, so 0x10 and 1e1 stay out (#88).
  const MIXED = /^(\d+)(?:\s*ו[־\-–]?\s*|\s+)(\d+)\s*\/\s*(\d+)$/;

  function parseMixedNumber(raw) {
    const m = MIXED.exec(String(raw == null ? '' : raw).trim());
    if (!m) return null;
    const whole = Number(m[1]);
    const n = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(whole) || !Number.isFinite(n) || !Number.isFinite(d)) return null;
    if (d === 0) return null;
    return { n: whole * d + n, d: d };
  }

  function isDecimalAnswer(raw) {
    if (raw == null) return false;
    const s = String(raw).trim().replace(/\s/g, '');
    if (!s || s.includes('/')) return false;
    return /^[+-]?(?:\d*[.,]\d+|\d+[.,]\d*)$/.test(s);
  }

  function isCorrect(given, expected) {
    const g = normalizeAnswer(given);
    if (g === '') return false;
    const e = normalizeAnswer(expected);
    if (g === e) return true;
    if (
      /[\u0590-\u05FF]/.test(g) &&
      /[\u0590-\u05FF]/.test(e) &&
      normalizeHebrewText(given) === normalizeHebrewText(expected)
    ) return true;
    const gf = parseSimpleFraction(given);
    const ef = parseSimpleFraction(expected);
    if (gf && ef && gf.n * ef.d === ef.n * gf.d) return true;
    // Mixed numbers compare by value, so "1 3/4" counts for "1 ו־3/4". Only
    // the mixed form parses, so the two conversion directions keep their
    // point: "7/4" is not accepted for "1 ו־3/4", and "1 ו־3/4" is not
    // accepted for an item that asked for the improper fraction.
    const gm = parseMixedNumber(given);
    const em = parseMixedNumber(expected);
    if (gm && em && gm.n * em.d === em.n * gm.d) return true;
    // Numeric compare: 3.5 == 3.50, .75 == 0.75, 1,25 == 1.25 (comma already
    // folded by normalizeAnswer). Ratios like 3:2 stay on the string path.
    // Only plain decimals reach Number(): it would also read 0x10, 1e1 and
    // 0b11 as 16, 10 and 3, which a child never meant as those answers.
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(g)) return false;
    const gn = Number(g);
    const en = Number(e);
    if (Number.isFinite(gn) && Number.isFinite(en)) {
      if (gn === en) return true;
      const tol = Math.max(1e-9, Math.abs(en) * 1e-9);
      return Math.abs(gn - en) <= tol;
    }
    return false;
  }

  // Approximate placement (מיקום מקורב): close enough counts. Same plain-decimal
  // gate as isCorrect, so "abc", "" and 0x10 are never within any band.
  function isWithinTolerance(given, expected, tol) {
    const g = normalizeAnswer(given);
    const e = normalizeAnswer(expected);
    const t = Number(tol);
    const num = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
    if (!num.test(g) || !num.test(e) || !Number.isFinite(t) || t < 0) return false;
    return Math.abs(Number(g) - Number(e)) <= t + 1e-9;
  }

  function eligibleExercises(items, history, lastId, chosenLevel) {
    const list = Array.isArray(items) ? items : [];
    const log = Array.isArray(history) ? history : [];
    const mastered = new Set(log.filter((h) => h.correct).map((h) => h.id));
    const missed = log.filter((h) => !h.correct && !mastered.has(h.id)).map((h) => h.id);
    const last = list.find((x) => x.id === lastId);
    const level = nextLevel(last ? last.level : chosenLevel, log.slice(-2));
    const atLevel = (pred) => list.filter((x) => x.level === level && pred(x));
    // Prefer a miss that is not the item just shown — one intervening question,
    // then the error returns. Immediate repeat only if nothing else is left.
    const retry = atLevel((x) => missed.includes(x.id) && x.id !== lastId);
    if (retry.length) return retry;
    let pool = atLevel((x) => !mastered.has(x.id) && x.id !== lastId);
    if (!pool.length) pool = atLevel((x) => !mastered.has(x.id));
    if (!pool.length) pool = list.filter((x) => !mastered.has(x.id) && x.id !== lastId);
    if (!pool.length) pool = list.filter((x) => !mastered.has(x.id));
    if (!pool.length) pool = list;
    return pool;
  }

  return {
    nextLevel, normalizeAnswer, isCorrect, isWithinTolerance, eligibleExercises,
    parseStudentNumber, countDecimals, closeEnough, parseSimpleFraction,
    parseMixedNumber, isDecimalAnswer,
    MIN_LEVEL, MAX_LEVEL,
  };
});
