// MelodyMath — short celebration on a correct answer (Refs #665 req 4, re-do of #818).
//
// The answer grows (1 → 1.4 → stays at 1.15) and a ✨ flies off it, over 0.6s.
// Under prefers-reduced-motion the CSS in index.html shows it bigger with a
// yellow outline instead, nothing moves. The look lives in `.mm-celebrate`.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_CELEBRATE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CLASS_NAME = 'mm-celebrate';

  // Restart the animation: drop the class, force a layout read, add it back.
  function celebrate(el) {
    if (!el || !el.classList) return null;
    el.classList.remove(CLASS_NAME);
    void el.offsetWidth;
    el.classList.add(CLASS_NAME);
    return el;
  }

  // The answer sits in a <b> inside the feedback box (`התשובה: <b>…</b>`).
  function celebrateAnswerIn(box) {
    if (!box || typeof box.querySelector !== 'function') return null;
    return celebrate(box.querySelector('b'));
  }

  return { celebrate: celebrate, celebrateAnswerIn: celebrateAnswerIn, CLASS_NAME: CLASS_NAME };
});
