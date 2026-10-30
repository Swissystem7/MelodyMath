// MelodyMath — shared kit for the #591 music-game screens (FractionBarPad,
// TimesTableGroove, BeatCounter, PatternEcho, DailyJam).
//
// - Instrument taps: every world-instrument voice of instrumentVoices.js is
//   registered as a musicEngine tap voice, so data-tap="drumLow" on a button
//   sounds on pointerdown through the same instant path (and window.audioState
//   timing) as every other tap in the app. The tap copy is a short version of
//   the voice: oscillators and noise, without the filter.
// - playNotes(): a stoppable lookahead scheduler on AudioContext time for
//   phrases (a bar, a groove, a pattern), with a visual callback per note.
// - dragToTarget(): drag a piece from a button onto a target, the tap on
//   the button kept as the no-drag path (SoundAdd's basket, #671).
// - The showMusic switch: every exercise can be solved without sound
//   (dosage rule 5); the choice is kept per game in localStorage.
// Pure parts (tapPartsFor, musicKey) are tested in Node.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_JAM = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  // In the browser the libs are globals; in Node they are required.
  function need(path) {
    try { return require(path); } catch (e) { return null; }
  }
  function voices() {
    if (root && typeof root.playVoice === 'function') return { VOICES: root.VOICES, playVoice: root.playVoice };
    return need('../lib/instrumentVoices.js');
  }
  function engine() { return (root && root.musicEngine) || need('../lib/musicEngine.js'); }
  function instruments() { return root && typeof root.instrumentById === 'function' ? root : need('../lib/instruments.js'); }

  // instrumentVoices voice -> musicEngine tap parts {at, dur, hz, gain, type, drop, noise, mul}.
  // Drums (a falling pitch) keep their own pitch; pitched voices take the
  // button's data-hz or data-step.
  function tapPartsFor(v) {
    if (!v) return null;
    const total = v.partials.reduce(function (s, p) { return s + p[1]; }, 0) + v.noise;
    const scale = total > 0 ? 0.3 / Math.max(total, 1) : 0;
    const dur = Math.min(1.2, v.attack + v.decay);
    const parts = v.partials.map(function (p) {
      const part = { at: 0, dur: dur, gain: p[1] * scale, type: v.wave };
      if (v.sweep < 1) { part.hz = v.hz * p[0]; part.drop = v.hz * p[0] * v.sweep; } else { part.hz = 0; part.mul = p[0]; }
      return part;
    });
    if (v.noise > 0) parts.push({ at: 0, dur: Math.min(v.decay, 0.15), noise: true, gain: v.noise * scale });
    return parts;
  }

  let registered = false;
  function registerTapVoices() {
    const iv = voices();
    const me = engine();
    if (registered || !iv || !iv.VOICES || !me || !me.TAP_VOICES) return registered;
    Object.keys(iv.VOICES).forEach(function (k) { if (!me.TAP_VOICES[k]) me.TAP_VOICES[k] = tapPartsFor(iv.VOICES[k]); });
    registered = true;
    return true;
  }

  // { id, he, voice, why, source } for an instrument id; the voice falls back
  // to `fallback` when the data module is not loaded.
  function instrument(id, fallback) {
    const data = instruments();
    const x = data && data.instrumentById ? data.instrumentById(id) : null;
    if (!x) return { id: id, he: id, voice: fallback || 'woodBar', why: '', source: 'TODO' };
    return { id: x.id, he: x.instrument.he, voice: x.voice, why: x.why, source: x.source };
  }

  function musicKey(game) { return 'mm.jam.showMusic.' + game; }
  function loadShowMusic(game, storage) {
    try { const v = (storage || root.localStorage).getItem(musicKey(game)); return v !== '0'; } catch (e) { return true; }
  }
  function saveShowMusic(game, on, storage) {
    try { (storage || root.localStorage).setItem(musicKey(game), on ? '1' : '0'); } catch (e) { /* private mode */ }
  }
  function musicToggleHtml(on) {
    return '<button type="button" class="secondary mm-music-toggle" data-act="music" aria-pressed="' + (on ? 'true' : 'false') + '">' +
      (on ? '🎵 עם מוזיקה' : '🔇 בלי מוזיקה') + '</button>';
  }

  function now() { return root.performance && root.performance.now ? root.performance.now() : Date.now(); }

  // notes: [{ at (seconds from start), voice, hz }]. Schedules 0.2 s ahead on
  // the shared AudioContext; onNote(note, i) fires near each note for the
  // visuals, and the returned handle's stop() cancels what is not yet queued.
  function playNotes(notes, onNote, onEnd) {
    const me = engine();
    const iv = voices();
    const ac = me && me.getSharedAudioContext ? me.getSharedAudioContext() : null;
    const handle = { stopped: false, stop: function () { handle.stopped = true; } };
    if (me && me.audioState && me.audioState.muted) return handle;
    if (ac && ac.state === 'suspended') { try { ac.resume(); } catch (e) { /* autoplay */ } }
    const t0 = ac ? ac.currentTime + 0.05 : 0;
    const w0 = now() + 50;
    let next = 0;
    function pump() {
      if (handle.stopped) return;
      const lookahead = ac ? ac.currentTime + 0.2 - t0 : (now() - w0) / 1000 + 0.2;
      while (next < notes.length && notes[next].at <= lookahead) {
        const n = notes[next];
        const i = next;
        if (ac && iv && n.voice) iv.playVoice(ac, n.voice, n.hz, t0 + n.at, null, n.held ? { dur: n.dur, gain: n.gain } : undefined); // a held ten (#665)
        if (onNote) setTimeout(function () { if (!handle.stopped) onNote(n, i); }, Math.max(0, w0 + n.at * 1000 - now()));
        next += 1;
      }
      if (next < notes.length) setTimeout(pump, 50);
      else if (onEnd) {
        const last = notes.length ? notes[notes.length - 1].at + 0.4 : 0;
        setTimeout(function () { if (!handle.stopped) onEnd(); }, Math.max(0, w0 + last * 1000 - now()));
      }
    }
    pump();
    return handle;
  }

  // Gentle right/wrong sounds from the engine; silent when music is off.
  function feedback(correct, on) {
    const me = engine();
    if (on === false || !me || !me.playTap) return null;
    return me.playTap(correct ? 'correct' : 'wrong');
  }

  // A short closing phrase (scale steps 5-4-3-1 of C major) on `voice`.
  function cadence(voice, on) {
    if (on === false) return null;
    return playNotes([392, 349.23, 329.63, 261.63].map(function (hz, i) { return { at: i * 0.18, voice: voice || 'woodBar', hz: hz }; }));
  }

  // Stop a game's sound when its tab panel is hidden.
  function stopWhenHidden(el, stop) {
    const panel = el && el.closest ? el.closest('.panel') : null;
    if (!panel || typeof root.MutationObserver !== 'function') return;
    new root.MutationObserver(function () { if (panel.hidden) stop(); }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  // Drag one piece from a source button onto a target (#671): a ghost
  // follows the finger once it moves DRAG_MIN px; dropped on the target it
  // calls onDrop, dropped elsewhere nothing happens. The tap path is kept: a
  // plain tap or Enter on the source is still its click. The click a browser
  // fires after a drag must be ignored, so the screen asks dragged(button)
  // first. o = { source, target, ghostClass, onDrop, enabled() }.
  // Callers must call cancel() on teardown to remove a live ghost.
  const DRAG_MIN = 10;
  function dragToTarget(el, o) {
    const doc = root.document;
    let drag = null;
    let after = false;
    function isOwner(ev) {
      return !ev || ev.pointerId == null || !drag || ev.pointerId === drag.pointerId;
    }
    function removeGhost() {
      if (drag && drag.ghost) { drag.ghost.remove(); drag.ghost = null; return true; }
      return false;
    }
    function endDrag() { removeGhost(); drag = null; after = false; }
    el.addEventListener('pointerdown', function (ev) {
      if (drag) return;
      after = false;
      const s = ev.target.closest ? ev.target.closest(o.source) : null;
      if (!s || s.disabled || (o.enabled && !o.enabled())) return;
      drag = { pointerId: ev.pointerId, x: ev.clientX, y: ev.clientY, ghost: null };
      if (s.setPointerCapture) s.setPointerCapture(ev.pointerId);
    });
    el.addEventListener('pointermove', function (ev) {
      if (!drag) return;
      if (!isOwner(ev)) return;
      if (!drag.ghost) {
        if (Math.abs(ev.clientX - drag.x) + Math.abs(ev.clientY - drag.y) < DRAG_MIN) return;
        drag.ghost = doc.createElement('span');
        drag.ghost.className = o.ghostClass || '';
        doc.body.appendChild(drag.ghost);
      }
      drag.ghost.style.left = ev.clientX + 'px';
      drag.ghost.style.top = ev.clientY + 'px';
    });
    function drop(ev) {
      if (!drag) return;
      if (!isOwner(ev)) return;
      const hadGhost = removeGhost();
      drag = null;
      if (!hadGhost) return;
      after = true;
      const over = ev.type === 'pointerup' && doc.elementFromPoint(ev.clientX, ev.clientY);
      if (over && over.closest && over.closest(o.target)) o.onDrop(over);
    }
    el.addEventListener('pointerup', drop);
    el.addEventListener('pointercancel', drop);
    return {
      // true once for the click on the source that ends a drag
      dragged: function (b) {
        if (!after) return false;
        after = false;
        return !!(b && b.closest && b.closest(o.source));
      },
      cancel: function () { endDrag(); },
    };
  }

  return {
    tapPartsFor: tapPartsFor,
    registerTapVoices: registerTapVoices,
    instrument: instrument,
    musicKey: musicKey,
    loadShowMusic: loadShowMusic,
    saveShowMusic: saveShowMusic,
    musicToggleHtml: musicToggleHtml,
    playNotes: playNotes,
    feedback: feedback,
    cadence: cadence,
    stopWhenHidden: stopWhenHidden,
    esc: esc,
    DRAG_MIN: DRAG_MIN,
    dragToTarget: dragToTarget,
  };
});
