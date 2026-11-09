(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function isFiniteNumber(n) {
    return typeof n === 'number' && Number.isFinite(n);
  }

  function multiplyBy4(n) {
    return isFiniteNumber(n) ? n * 4 : null;
  }

  function stepsFor(n) {
    if (!isFiniteNumber(n)) return null;
    const step1 = n * 2;
    const step2 = step1 * 2;
    return { step1, step2, result: n * 4 };
  }

  return { multiplyBy4, stepsFor };
});
