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

  function isCorrect(given, expected) {
    const g = normalizeAnswer(given);
    if (g === '') return false;
    return g === normalizeAnswer(expected);
  }

  return { nextLevel, normalizeAnswer, isCorrect, MIN_LEVEL, MAX_LEVEL };
});
