// MelodyMath — "my instrument": the one instrument the child chose, for the
// whole app (#679, mid-session switch). Every screen reads the choice from
// here; no screen keeps its own key or its own instrument list.
//
// - One storage key, validated against instrumentById of instruments.js, so
//   any world instrument is allowed and an unknown id is never returned.
// - Migration of the old per-screen key 'mm-tap-instrument' (#753): each
//   pick written there moves here once, and the old key is removed.
// - mountPicker() is the app's only instrument picker (#myInstCard).
// - setMyInstrument() fires 'mm:instrument' on the window so an open screen
//   can redraw in the new timbre without losing its progress.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_MY_INSTRUMENT = api;
  if (typeof document !== 'undefined' && document.getElementById('myInstCard')) api.mountPicker(document.getElementById('myInstCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const KEY = 'mm.myInstrument';
  const LEGACY_KEY = 'mm-tap-instrument';
  const EVENT = 'mm:instrument';

  function data() {
    if (root && typeof root.instrumentById === 'function') return root;
    try { return require('./instruments.js'); } catch (e) { return null; }
  }
  function valid(id) {
    const d = data();
    return typeof id === 'string' && !!d && !!d.instrumentById(id);
  }
  function store(storage) {
    try { return storage || root.localStorage || null; } catch (e) { return null; }
  }

  // The chosen instrument id, or null when the child has not chosen one.
  function getMyInstrument(storage) {
    const s = store(storage);
    if (!s) return null;
    try {
      // #753's tap picker still writes the old key. Its pick is the newest
      // one, so it moves here and the old key goes: read, write, remove.
      const old = s.getItem(LEGACY_KEY);
      if (old != null) {
        s.removeItem(LEGACY_KEY);
        if (valid(old)) s.setItem(KEY, old);
      }
      const id = s.getItem(KEY);
      return valid(id) ? id : null;
    } catch (e) { return null; }
  }

  // Saves the choice; false for an unknown id (the old choice stays).
  function setMyInstrument(id, storage) {
    if (!valid(id)) return false;
    const s = store(storage);
    try { if (s) s.setItem(KEY, id); } catch (e) { /* private mode */ }
    try {
      if (root && typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {
        root.dispatchEvent(new root.CustomEvent(EVENT, { detail: { id: id } }));
      }
    } catch (e) { /* no DOM */ }
    return true;
  }

  // The instrument a screen should sound: the child's choice first, then the
  // screen's own default. `allowed` limits it to the ids the screen offers.
  function instrumentFor(fallbackId, allowed, storage) {
    const id = getMyInstrument(storage);
    if (id && (!allowed || allowed.indexOf(id) >= 0)) return id;
    return fallbackId;
  }

  // The app's one instrument picker: every instrument, by family, the
  // current choice pressed. Screens only read the choice; none has its own.
  const FAMILY_HE = { percussion: 'כלי הקשה', strings: 'כלי מיתר', winds: 'כלי נשיפה', keys: 'כלי מקלדת' };
  function esc(v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function pickerHtml(current) {
    const d = data();
    if (!d || !d.INSTRUMENTS) return '';
    return '<h3>🎻 הכלי שלי</h3><p>הכלי שתבחרו ינגן בכל משחקי המוזיקה.</p>' + d.FAMILIES.map(function (f) {
      return '<div class="jam-row" role="group" aria-label="' + FAMILY_HE[f] + '">' + d.INSTRUMENTS.filter(function (x) { return x.family === f; }).map(function (x) {
        return '<button type="button" class="jam-pad" data-my-inst="' + esc(x.id) + '" data-tap="' + esc(x.voice) + '" aria-pressed="' + (x.id === current) + '">' + esc(x.instrument.he) + '</button>';
      }).join('') + '</div>';
    }).join('');
  }
  function mountPicker(el, storage) {
    function draw() { el.innerHTML = pickerHtml(getMyInstrument(storage)); }
    el.addEventListener('click', function (ev) {
      const b = ev.target && ev.target.closest ? ev.target.closest('[data-my-inst]') : null;
      if (b) setMyInstrument(b.getAttribute('data-my-inst'), storage);
    });
    if (root && typeof root.addEventListener === 'function') root.addEventListener(EVENT, draw);
    draw();
    return { draw: draw };
  }

  return { KEY, LEGACY_KEY, EVENT, getMyInstrument, setMyInstrument, instrumentFor, pickerHtml, mountPicker };
});
