// Adult gate in front of the teacher tab (#737): a new three-digit × two-digit
// product every time, confirmed by holding the button for 3 seconds. A strong
// grade-6 child can do 55 × 55 in their head; a long product plus a deliberate
// hold is a nuisance for a child and easy for an adult. Not a lock — it only
// keeps a child from wandering into the report by tapping a tab.
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const HOLD_MS = 3000;

  // lo..hi, never a round ten (340 × 20 is easy to do in your head).
  function pickNum(rand, lo, hi) {
    const r = typeof rand === 'function' ? rand : Math.random;
    let n = lo + Math.floor(r() * (hi - lo + 1));
    if (n > hi) n = hi;
    if (n < lo) n = lo;
    if (n % 10 === 0) {
      if (n + 1 <= hi) n += 1;
      else if (n - 1 >= lo) n -= 1;
    }
    return n;
  }

  function getBound(opts, keys, fallback) {
    if (!opts) return fallback;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (typeof opts[k] === 'number' && Number.isFinite(opts[k])) {
        return opts[k];
      }
    }
    return fallback;
  }

  function adultQuestion(rand, opts) {
    let r = typeof rand === 'function' ? rand : Math.random;
    let options = opts;
    if (typeof rand === 'object' && rand !== null && opts === undefined) {
      options = rand;
      r = typeof options.rand === 'function' ? options.rand : Math.random;
    }
    options = options || {};

    const boundsA = Array.isArray(options.boundsA) ? options.boundsA : (Array.isArray(options.a) ? options.a : null);
    const boundsB = Array.isArray(options.boundsB) ? options.boundsB : (Array.isArray(options.b) ? options.b : null);
    const boundsAll = Array.isArray(options.bounds) ? options.bounds : null;

    let aLo = boundsA ? boundsA[0] : getBound(options, ['aLo', 'loA', 'minA', 'aMin', 'lo', 'min'], boundsAll ? boundsAll[0] : 101);
    let aHi = boundsA ? boundsA[1] : getBound(options, ['aHi', 'hiA', 'maxA', 'aMax', 'hi', 'max'], boundsAll ? boundsAll[1] : 999);
    let bLo = boundsB ? boundsB[0] : getBound(options, ['bLo', 'loB', 'minB', 'bMin', 'lo', 'min'], boundsAll ? boundsAll[0] : 13);
    let bHi = boundsB ? boundsB[1] : getBound(options, ['bHi', 'hiB', 'maxB', 'bMax', 'hi', 'max'], boundsAll ? boundsAll[1] : 99);

    if (aLo > aHi) { const t = aLo; aLo = aHi; aHi = t; }
    if (bLo > bHi) { const t = bLo; bLo = bHi; bHi = t; }

    let a = pickNum(r, aLo, aHi);
    let b = pickNum(r, bLo, bHi);

    let selectedOp = '×';
    if (Array.isArray(options.ops) && options.ops.length > 0) {
      const idx = Math.floor(r() * options.ops.length);
      selectedOp = options.ops[Math.min(idx, options.ops.length - 1)];
    } else if (Array.isArray(options.op) && options.op.length > 0) {
      const idx = Math.floor(r() * options.op.length);
      selectedOp = options.op[Math.min(idx, options.op.length - 1)];
    } else if (typeof options.op === 'function') {
      selectedOp = options.op(r);
    } else if (options.op === 'dynamic' || options.op === 'random' || options.dynamic) {
      const choices = ['+', '-', '×'];
      const idx = Math.floor(r() * choices.length);
      selectedOp = choices[Math.min(idx, choices.length - 1)];
    } else if (typeof options.op === 'string') {
      selectedOp = options.op;
    }

    let opSymbol = '×';
    let answer;
    if (selectedOp === '+' || selectedOp === 'add') {
      opSymbol = '+';
      answer = a + b;
    } else if (selectedOp === '-' || selectedOp === 'sub') {
      opSymbol = '-';
      if (a < b) { const tmp = a; a = b; b = tmp; }
      answer = a - b;
    } else {
      opSymbol = '×';
      answer = a * b;
    }

    const res = { a: a, b: b, answer: answer, text: `כמה זה ${a} ${opSymbol} ${b}?` };
    Object.defineProperty(res, 'op', { value: opSymbol, enumerable: false, writable: true, configurable: true });
    return res;
  }

  function adultAnswerOk(q, given) {
    if (!q || typeof q !== 'object' || Array.isArray(q)) return false;
    if (typeof q.answer !== 'number' || !Number.isFinite(q.answer)) return false;
    if (given == null || typeof given === 'boolean' || typeof given === 'object' || typeof given === 'symbol' || typeof given === 'function') {
      return false;
    }
    const v = String(given).replace(/[\s,]/g, '');
    if (!/^[0-9]+$/.test(v)) return false;
    const parsed = Number(v);
    return Number.isSafeInteger(parsed) && parsed === q.answer;
  }

  // True only for a press that started and lasted at least HOLD_MS.
  function holdLongEnough(startMs, endMs) {
    return (
      typeof startMs === 'number' &&
      typeof endMs === 'number' &&
      Number.isFinite(startMs) &&
      Number.isFinite(endMs) &&
      endMs >= startMs &&
      endMs - startMs >= HOLD_MS
    );
  }

  return { adultQuestion: adultQuestion, adultAnswerOk: adultAnswerOk, holdLongEnough: holdLongEnough, HOLD_MS: HOLD_MS, pickNum: pickNum };
});
