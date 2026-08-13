// MelodyMath — adaptive difficulty and answer checking.
//
// These two rules are the pedagogical core of the product, so they live in one
// tested place rather than inside a click handler:
//
//   nextLevel   two right in a row moves up, two wrong in a row moves down,
//               anything else holds. Level never leaves 1..3.
//   isCorrect   answers are compared after normalisation, so "3 : 2", "3:2"
//               and " 3:2 " all count, and a decimal comma is accepted the way
//               a Hebrew-keyboard child actually types it.
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

  function isCorrect(given, expected) {
    const g = normalizeAnswer(given);
    if (g === '') return false;
    const e = normalizeAnswer(expected);
    if (g === e) return true;
    // Numeric compare: 3.5 == 3.50, .75 == 0.75, 1,25 == 1.25 (comma already
    // folded by normalizeAnswer). Ratios like 3:2 stay on the string path.
    const gn = Number(g);
    const en = Number(e);
    if (Number.isFinite(gn) && Number.isFinite(en)) {
      if (gn === en) return true;
      const tol = Math.max(1e-9, Math.abs(en) * 1e-9);
      return Math.abs(gn - en) <= tol;
    }
    return false;
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
    nextLevel, normalizeAnswer, isCorrect, eligibleExercises,
    parseStudentNumber, countDecimals, closeEnough,
    MIN_LEVEL, MAX_LEVEL,
  };
});
