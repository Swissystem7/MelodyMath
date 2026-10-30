// Adult gate in front of the teacher tab (#737): a new three-digit × two-digit
// product every time, confirmed by holding the button for 3 seconds. A strong
// grade-6 child can do 55 × 55 in their head; a long product plus a deliberate
// hold is a nuisance for a child and easy for an adult. Not a lock — it only
// keeps a child from wandering into the report by tapping a tab.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const HOLD_MS = 3000;

  // lo..hi, never a round ten (340 × 20 is easy to do in your head).
  function pickNum(rand, lo, hi) {
    const n = lo + Math.floor(rand() * (hi - lo + 1));
    return n % 10 === 0 ? n + 1 : n;
  }

  function adultQuestion(rand) {
    const r = typeof rand === 'function' ? rand : Math.random;
    const a = pickNum(r, 101, 999);
    const b = pickNum(r, 13, 99);
    return { a: a, b: b, answer: a * b, text: 'כמה זה ' + a + ' × ' + b + '?' };
  }

  function adultAnswerOk(q, given) {
    const v = String(given == null ? '' : given).replace(/[\s,]/g, '');
    return !!q && /^\d+$/.test(v) && Number(v) === q.answer;
  }

  // True only for a press that started and lasted at least HOLD_MS.
  function holdLongEnough(startMs, endMs) {
    return typeof startMs === 'number' && typeof endMs === 'number' && endMs - startMs >= HOLD_MS;
  }

  return { adultQuestion: adultQuestion, adultAnswerOk: adultAnswerOk, holdLongEnough: holdLongEnough, HOLD_MS: HOLD_MS };
});
