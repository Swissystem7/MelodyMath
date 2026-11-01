// MelodyMath — Pre-Recorded Hebrew Narration Player & Fallback (Refs #515)
// Plays pre-recorded ElevenLabs voice clips for exercises/lessons with silent graceful fallback.
// No API keys in client, zero cloud dependencies at runtime.

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NarrationPlayer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const NARRATION_ASSETS = {
    addition: 'sounds/voice/he/prompt_addition.mp3',
    subtraction: 'sounds/voice/he/prompt_subtraction.mp3',
    multiplication: 'sounds/voice/he/prompt_multiplication.mp3',
    division: 'sounds/voice/he/prompt_division.mp3',
    feedback_good: 'sounds/voice/he/feedback_good.mp3',
    feedback_retry: 'sounds/voice/he/feedback_retry.mp3'
  };

  function getAudioPath(key) {
    return NARRATION_ASSETS[key] || null;
  }

  function playNarration(key, onEnded) {
    const src = getAudioPath(key);
    if (!src || typeof Audio === 'undefined') {
      if (typeof onEnded === 'function') onEnded();
      return null;
    }

    try {
      const audio = new Audio(src);
      if (typeof onEnded === 'function') {
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onEnded); // Graceful fallback
      }
      const promise = audio.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          if (typeof onEnded === 'function') onEnded();
        });
      }
      return audio;
    } catch (e) {
      if (typeof onEnded === 'function') onEnded();
      return null;
    }
  }

  return {
    NARRATION_ASSETS: NARRATION_ASSETS,
    getAudioPath: getAudioPath,
    playNarration: playNarration
  };
});
