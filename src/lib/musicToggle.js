// MelodyMath - dosage rule 5 (#591, owner 23.10 15:54): every exercise can be
// seen and solved without music too, with a visible toggle on each exercise.
//
// The choice is one device preference (like the sensory settings in access.js)
// so it stays the same from one exercise to the next. With music off:
// - the music way and the optional extras are hidden (body.mm-no-music),
// - nothing plays by itself (counted-beat cue, metronome, rewards),
// - the widgets stay on screen but are silent,
// - the prompt, the visual widget and the answer stay exactly the same.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SHOW_MUSIC_KEY = 'mm-show-music-v1';
  const NO_MUSIC_CLASS = 'mm-no-music';
  // Fields of an item that only exist for the music; the no-music view drops them.
  const MUSIC_FIELDS = ['music', 'musicSrc', 'musicEv', 'musicNote', 'musicExtra', 'musicStory', 'hear'];

  function store(storage) {
    if (storage) return storage;
    try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; }
  }

  // Music is on unless the child or teacher turned it off on this device.
  function loadShowMusic(storage) {
    const s = store(storage);
    if (!s) return true;
    try { return s.getItem(SHOW_MUSIC_KEY) !== 'off'; } catch (e) { return true; }
  }

  function saveShowMusic(on, storage) {
    const s = store(storage);
    if (s) {
      try { s.setItem(SHOW_MUSIC_KEY, on ? 'on' : 'off'); } catch (e) { /* private mode: keep the session value */ }
    }
    return !!on;
  }

  function isMusicOff(storage) {
    return !loadShowMusic(storage);
  }

  function toggleLabel(on) {
    return on ? '🎵 מוזיקה פועלת · לכבות' : '🔇 בלי מוזיקה · להדליק';
  }

  // Paint every toggle and the body class. Returns the number of toggles found.
  function applyShowMusic(on, doc) {
    const d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.querySelectorAll) return 0;
    if (d.body && d.body.classList) d.body.classList.toggle(NO_MUSIC_CLASS, !on);
    const buttons = d.querySelectorAll('[data-music-toggle]');
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = toggleLabel(on);
    });
    if (!on) {
      const hear = d.getElementById && d.getElementById('mm-hear');
      if (hear) { hear.hidden = true; hear.disabled = true; }
    }
    return buttons.length;
  }

  // The exercise as it is shown with music off: same prompt, answer, hint and
  // visual widget, no music fields.
  function withoutMusic(item) {
    if (!item) return null;
    const out = {};
    Object.keys(item).forEach(function (k) {
      if (MUSIC_FIELDS.indexOf(k) === -1) out[k] = item[k];
    });
    return out;
  }

  const VS16 = String.fromCharCode(0xfe0f);

  // Lengths of the runs of one repeated symbol (🥁🥁🥁, • • •), spaces allowed
  // between the symbols. Letters, digits and ASCII marks are not symbols.
  function symbolRuns(text) {
    const out = [];
    let prev = null;
    let n = 0;
    const close = function () {
      if (prev !== null && !/[\p{L}\p{N}]/u.test(prev) && prev.charCodeAt(0) > 127) out.push(n);
    };
    Array.from(String(text || '').split(VS16).join('')).forEach(function (ch) {
      if (ch.trim() === '') return;
      if (ch === prev) { n++; return; }
      close();
      prev = ch;
      n = 1;
    });
    close();
    return out;
  }

  // A counted-beat cue (item.hear) is only a sound; with music off the same
  // counts must be on screen, as digits or as a row of symbols.
  function hearVisible(prompt, groups) {
    if (!groups || !groups.length) return true;
    const runs = symbolRuns(prompt);
    const nums = (String(prompt || '').match(/\d+/g) || []).map(Number);
    return groups.every(function (g) { return runs.indexOf(g) !== -1 || nums.indexOf(g) !== -1; });
  }

  function solvableWithoutMusic(item) {
    if (!item) return false;
    const plain = withoutMusic(item);
    if (!plain.prompt || !String(plain.prompt).trim()) return false;
    if (plain.answer === undefined || plain.answer === null || String(plain.answer).trim() === '') return false;
    return hearVisible(item.prompt, item.hear);
  }

  return {
    SHOW_MUSIC_KEY: SHOW_MUSIC_KEY,
    NO_MUSIC_CLASS: NO_MUSIC_CLASS,
    MUSIC_FIELDS: MUSIC_FIELDS,
    loadShowMusic: loadShowMusic,
    saveShowMusic: saveShowMusic,
    isMusicOff: isMusicOff,
    toggleLabel: toggleLabel,
    applyShowMusic: applyShowMusic,
    withoutMusic: withoutMusic,
    symbolRuns: symbolRuns,
    hearVisible: hearVisible,
    solvableWithoutMusic: solvableWithoutMusic,
  };
});
