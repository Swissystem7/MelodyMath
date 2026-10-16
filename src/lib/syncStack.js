// MelodyMath — Dell validation helpers for the master→main sync stack (issue #329).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function stackNumbers(startPr, endPr) {
    if (endPr < startPr) throw new RangeError('endPr < startPr');
    const out = [];
    for (let n = startPr; n <= endPr; n++) out.push(n);
    return out;
  }

  function isByteIdentical(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
      throw new TypeError('expected string');
    }
    return a === b;
  }

  function formatStackComment(status, detail) {
    if (status === 'PASS') return 'PASS';
    if (status === 'FAIL') return detail;
    throw new RangeError('status must be PASS or FAIL');
  }

  function formatHandoff(stackStart, stackEnd) {
    return (
      'handoff: dell -> owner | review | stack #' +
      stackStart +
      '-#' +
      stackEnd +
      ' checked | - | -'
    );
  }

  return {
    stackNumbers,
    isByteIdentical,
    formatStackComment,
    formatHandoff,
  };
});
