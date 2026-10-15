// MelodyMath — keep math expressions left-to-right inside the Hebrew page.
//
// In an RTL paragraph the Unicode bidi algorithm reorders "40 + 40 = ?" into
// "? = 40 + 40". Israeli textbooks print expressions left-to-right, so every
// run that holds an operator is wrapped in an isolated LTR span. Hebrew text
// around it stays RTL. Output is escaped HTML, safe for innerHTML.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // An operand: a number (3, 2.5, 3/4, 1,000), a blank (?, ☐, _) or a vulgar fraction.
  const OPERAND = '\\(?(?:\\d+(?:[.,/]\\d+)*|[?☐□_]+|[½⅓⅔¼¾⅕⅛])\\)?';
  // A colon followed by a space is a Hebrew label ("בדילוגי 2: 50, 48"), not
  // division; "3:00" and "10 : 2" still count. "שארית" is the word operator of
  // a division with remainder: without it "3 שארית 2" reorders to "2 שארית 3"
  // in the RTL page and reads as the wrong answer (see #93).
  // "=" before a lone "?" is prompt punctuation, not part of the numeric run.
  // Hyphen/colon are not operators inside Hebrew words (ו-5, למשל:).
  const OPERATOR = '(?:'
    + '\\s*[+×÷<>≠≤≥·*]\\s*'
    + '|\\s*(?<![\\u0590-\\u05FF])[\\-−–]\\s*'
    + '|\\s*=(?!\\s*\\?)\\s*'
    + '|\\s*שארית\\s*'
    + '|(?<!משל):'
    + '|\\s+:\\s+'
    + ')';
  const MATH_RUN = new RegExp(OPERAND + '(?:' + OPERATOR + OPERAND + ')+', 'g');
  const HEBREW = /[\u0590-\u05FF]/;
  const TRAILING_EQ_Q = /^ = \?$/;

  function mathRunSpan(s, run, at) {
    if (!HEBREW.test(s.slice(0, at)) && TRAILING_EQ_Q.test(s.slice(at + run.length))) {
      return run + ' = ?';
    }
    return run;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function mathRuns(text) {
    if (text == null) return [];
    return String(text).match(MATH_RUN) || [];
  }

  function mathHtml(text) {
    const s = String(text == null ? '' : text);
    let out = '';
    let last = 0;
    s.replace(MATH_RUN, function (run, at) {
      const span = mathRunSpan(s, run, at);
      out += escapeHtml(s.slice(last, at))
        + '<span class="math-ltr" dir="ltr">' + escapeHtml(span) + '</span>';
      last = at + span.length;
      return run;
    });
    return out + escapeHtml(s.slice(last));
  }

  function setMath(el, text) {
    if (el) el.innerHTML = mathHtml(text);
  }

  return { mathRuns: mathRuns, mathHtml: mathHtml, setMath: setMath };
});
