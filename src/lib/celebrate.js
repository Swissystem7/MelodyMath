// MelodyMath — celebrate a correct answer (#665 requirement 4).
//
// After a correct answer the answer itself grows and a sparkle flies off it,
// on every screen where the child answers: practice, the short check, the
// plan, class mode, beat mode, the lesson quiz and the fraction builder.
// The motion lives in index.html's CSS (.mm-celebrate); under
// prefers-reduced-motion the answer is shown bigger and outlined, with no
// movement. This file only (re)starts it on the right element.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_CELEBRATE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CLASS = 'mm-celebrate';

  // Restart the animation even when the same element is celebrated twice:
  // drop the class, force a layout read, add it again.
  function celebrate(el) {
    if (!el || !el.classList) return false;
    el.classList.remove(CLASS);
    void el.offsetWidth;
    el.classList.add(CLASS);
    return true;
  }

  // The feedback boxes print the answer as <b>…</b> («התשובה: <b>12</b>»).
  function celebrateAnswerIn(box) {
    return celebrate(box && box.querySelector ? box.querySelector('b') : null);
  }

  return { CLASS: CLASS, celebrate: celebrate, celebrateAnswerIn: celebrateAnswerIn };
});
