// MelodyMath — vertical (מאונך) column format for two-digit addition and
// subtraction (כיתה ב׳). Display only: the child still types the answer
// in the normal answer box, same pattern as numberLine and bar44.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Imported items (banks.js keeps raw.vert as-is) may carry any number; past
  // four digits String() can switch to exponent form (1e+21) and the column
  // stops lining up, so operands are capped like the ruler length in measure.js.
  const MAX_OPERAND = 9999;

  function normalizeVertical(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    let a = Math.round(Number(src.a));
    let b = Math.round(Number(src.b));
    if (!Number.isFinite(a)) a = 0;
    if (!Number.isFinite(b)) b = 0;
    if (a < 0) a = 0;
    if (b < 0) b = 0;
    a = Math.min(MAX_OPERAND, a);
    b = Math.min(MAX_OPERAND, b);
    const op = src.op === '-' ? '-' : '+';
    return { a: a, b: b, op: op };
  }

  function padDigits(n, width) {
    const s = String(Math.abs(Math.round(Number(n))));
    if (s.length >= width) return s;
    return new Array(width - s.length + 1).join('\u00a0') + s;
  }

  function renderVerticalHtml(vert) {
    const V = normalizeVertical(vert);
    const width = Math.max(String(V.a).length, String(V.b).length + 1);
    const opWord = V.op === '+' ? 'ועוד' : 'פחות';
    return '<div class="vert" dir="ltr" role="img" aria-label="חישוב מאונך: '
      + V.a + ' ' + opWord + ' ' + V.b + '">'
      + '<div class="vert-row vert-a">' + padDigits(V.a, width) + '</div>'
      + '<div class="vert-row vert-b"><span class="vert-op" aria-hidden="true">' + V.op + '</span>'
      + padDigits(V.b, width - 1) + '</div>'
      + '<div class="vert-line" aria-hidden="true"></div>'
      + '</div>';
  }

  function bindVertical(root, vert) {
    if (!root) return null;
    root.innerHTML = renderVerticalHtml(vert);
    return {};
  }

  return {
    normalizeVertical: normalizeVertical,
    renderVerticalHtml: renderVerticalHtml,
    bindVertical: bindVertical,
    MAX_OPERAND: MAX_OPERAND,
  };
});
