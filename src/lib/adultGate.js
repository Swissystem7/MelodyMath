// Adult gate in front of the teacher tab (#737): a two-digit × two-digit
// product, past what the primary grades on this device practise. Not a lock —
// it only keeps a child from wandering into the report by tapping a tab.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // 11–99, skipping round tens (20 × 30 is easy to do in your head).
  function twoDigit(rand) {
    let n;
    do { n = 11 + Math.floor(rand() * 89); } while (n % 10 === 0);
    return n;
  }

  function adultQuestion(rand) {
    const r = typeof rand === 'function' ? rand : Math.random;
    const a = twoDigit(r);
    const b = twoDigit(r);
    return { a: a, b: b, answer: a * b, text: 'כמה זה ' + a + ' × ' + b + '?' };
  }

  function adultAnswerOk(q, given) {
    const v = String(given == null ? '' : given).replace(/[\s,]/g, '');
    return !!q && /^\d+$/.test(v) && Number(v) === q.answer;
  }

  return { adultQuestion: adultQuestion, adultAnswerOk: adultAnswerOk };
});
