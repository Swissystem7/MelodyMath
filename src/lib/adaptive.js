// MelodyMath — adaptive difficulty and answer checking.
//
// These rules are the pedagogical core of the product, so they live in one
// tested place rather than inside a click handler:
//
//   nextLevel   the original streak rule: two right in a row moves up, two
//               wrong in a row moves down, anything else holds. Still exported
//               and still used by 807.html; it is also the fallback when
//               mastery.js has not been loaded.
//   nextLevelFromMastery
//               the BKT rule: fold the WHOLE history into P(known) with
//               Bayesian Knowledge Tracing (mastery.js) and read the level off
//               that — P < 0.4 easier, 0.4..0.85 hold, P > 0.85 harder. A
//               streak of two is a very noisy estimator; BKT accounts for
//               slips and guesses and uses every answer, not the last two.
//   isCorrect   answers are compared after normalisation, so "3 : 2", "3:2"
//               and " 3:2 " all count, and a decimal comma is accepted the way
//               a Hebrew-keyboard child actually types it.
//   eligibleExercises
//               only mastered (correct) ids drop out. Misses stay in the pool
//               and are preferred on the next turn so errors return sooner.
//               Its 5th argument picks which rule paces the level.
//
// WHY BKT IS OPT-IN AND NOT THE DEFAULT (2026-09-10)
// The escalation backlog asks for two things that cannot both be true:
// "pick the next difficulty from P(known) ... instead of raw streaks" AND
// "keep the existing tests passing (add, do not rewrite)". From pInit = 0.2
// two correct answers give P(known) = 0.843952, which is inside the 0.4..0.85
// HOLD band, so BKT keeps the level; test/banks.test.js:153 pins level 2 after
// exactly those two answers, because that is what the streak rule does. Under
// BKT the level moves up after the THIRD correct answer (P = 0.958476).
// So `pace: 'streak'` stays the default and nothing existing changes
// behaviour; `pace: 'bkt'` selects the P(known) rule. Flipping the default is
// a one-line change here plus one expectation in banks.test.js, and it is the
// owner's pedagogical call, not this patch's.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MIN_LEVEL = 1;
  const MAX_LEVEL = 3;

  // Same lookup shape worksheets.js uses for banks.js. In the browser this is
  // globalThis, and mastery.js assigns onto it — resolved lazily at call time,
  // so the <script> order in index.html does not matter.
  const MASTERY = (typeof module === 'object' && module.exports)
    ? require('./mastery')
    : (typeof globalThis !== 'undefined' ? globalThis : {});

  function nextLevel(currentLevel, lastTwo) {
    if (!Array.isArray(lastTwo) || lastTwo.length !== 2) return currentLevel;
    if (lastTwo.every((x) => x.correct)) return Math.min(MAX_LEVEL, currentLevel + 1);
    if (lastTwo.every((x) => !x.correct)) return Math.max(MIN_LEVEL, currentLevel - 1);
    return currentLevel;
  }

  // P(known) for the whole history, or null if mastery.js is not reachable.
  function masteryOf(history, params) {
    if (!MASTERY || typeof MASTERY.masteryFromHistory !== 'function') return null;
    return MASTERY.masteryFromHistory(history, params);
  }

  function nextLevelFromMastery(currentLevel, history, params) {
    const base = Number(currentLevel);
    // Nothing numeric to reason about: hand back exactly what came in, the way
    // the streak rule did for a short history.
    if (!Number.isFinite(base)) return currentLevel;
    const p = masteryOf(history, params);
    if (p == null) {
      const log = Array.isArray(history) ? history : [];
      return nextLevel(base, log.slice(-2));
    }
    const band = typeof MASTERY.masteryBand === 'function'
      ? MASTERY.masteryBand(p)
      : (p < 0.4 ? 'easier' : (p > 0.85 ? 'harder' : 'same'));
    if (band === 'harder') return Math.min(MAX_LEVEL, base + 1);
    if (band === 'easier') return Math.max(MIN_LEVEL, base - 1);
    return base;
  }

  // Which rule paces the session. `options` is optional and backwards
  // compatible: absent or anything without pace:'bkt' keeps the streak rule.
  //   paceLevel(2, log)                    -> streak (default)
  //   paceLevel(2, log, { pace: 'bkt' })   -> P(known) bands
  //   paceLevel(2, log, { pace: 'bkt', params: { pLearn: 0.2 } })
  function paceLevel(currentLevel, history, options) {
    const opt = options || {};
    if (opt.pace === 'bkt') {
      return nextLevelFromMastery(currentLevel, history, opt.params);
    }
    const log = Array.isArray(history) ? history : [];
    return nextLevel(currentLevel, log.slice(-2));
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

  function isCorrect(given, expected) {
    const g = normalizeAnswer(given);
    if (g === '') return false;
    const e = normalizeAnswer(expected);
    if (g === e) return true;
    const gf = parseSimpleFraction(given);
    const ef = parseSimpleFraction(expected);
    if (gf && ef && gf.n * ef.d === ef.n * gf.d) return true;
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

  function eligibleExercises(items, history, lastId, chosenLevel, options) {
    const list = Array.isArray(items) ? items : [];
    const log = Array.isArray(history) ? history : [];
    const mastered = new Set(log.filter((h) => h.correct).map((h) => h.id));
    const missed = log.filter((h) => !h.correct && !mastered.has(h.id)).map((h) => h.id);
    const last = list.find((x) => x.id === lastId);
    const level = paceLevel(last ? last.level : chosenLevel, log, options);
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
    nextLevel, nextLevelFromMastery, paceLevel, masteryOf,
    normalizeAnswer, isCorrect, eligibleExercises,
    parseStudentNumber, countDecimals, closeEnough, parseSimpleFraction,
    MIN_LEVEL, MAX_LEVEL,
  };
});
