// MelodyMath — mastery streak & musical phrase unlocks (#591, Task F4).
//
// 5 correct in a row in a topic unlocks one new short musical phrase on
// the current instrument (no points/shop); soft reset keeps unlocks.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.MM_MASTERY_STREAK = api; root.MM_TOPIC_STREAK = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STREAK_TARGET = 5;
  const STORAGE_KEY = 'mm.streakMastery.v1';
  const PHRASES = [
    { id: 'phrase_1', name: 'תרועת פתיחה', notes: [261.63, 329.63, 392.00, 523.25], durations: [0.15, 0.15, 0.15, 0.35] },
    { id: 'phrase_2', name: 'מנגינת ביניים', notes: [392.00, 440.00, 493.88, 523.25], durations: [0.12, 0.12, 0.12, 0.30] },
    { id: 'phrase_3', name: 'סולם עולה', notes: [261.63, 293.66, 329.63, 392.00, 523.25], durations: [0.10, 0.10, 0.10, 0.10, 0.35] },
    { id: 'phrase_4', name: 'הד הרמוני', notes: [523.25, 392.00, 329.63, 261.63], durations: [0.15, 0.15, 0.15, 0.35] },
    { id: 'phrase_5', name: 'שיא הניגון', notes: [329.63, 392.00, 523.25, 659.25], durations: [0.12, 0.12, 0.12, 0.40] },
  ];

  let storageRef = null;
  let topicState = {};

  function getStorage() {
    if (storageRef) return storageRef;
    try { if (typeof localStorage !== 'undefined') return localStorage; } catch (e) { /* private */ }
    return null;
  }

  function loadState() {
    const s = getStorage();
    if (!s) return;
    try {
      const raw = s.getItem(STORAGE_KEY);
      if (raw) { const p = JSON.parse(raw); if (p && typeof p === 'object') topicState = p; }
    } catch (e) { /* ignore */ }
  }

  function saveState() {
    const s = getStorage();
    if (s) { try { s.setItem(STORAGE_KEY, JSON.stringify(topicState)); } catch (e) { /* ignore */ } }
  }

  function recordAnswer(topicId, isCorrect, options) {
    const id = String(topicId || 'default');
    const opts = options || {};
    const instrument = opts.instrument || 'default';
    if (!topicState[id]) topicState[id] = { streak: 0, unlocks: [] };
    const cur = topicState[id];

    if (!isCorrect) {
      cur.streak = 0;
      saveState();
      return { streak: 0, unlocked: false, phrase: null, keepsUnlocks: true, totalUnlocks: cur.unlocks.length };
    }

    cur.streak += 1;
    let unlocked = null;
    if (cur.streak === STREAK_TARGET || (cur.streak > STREAK_TARGET && cur.streak % STREAK_TARGET === 0)) {
      const base = PHRASES[cur.unlocks.length % PHRASES.length];
      unlocked = {
        id: base.id, name: base.name, instrument: instrument,
        notes: base.notes.slice(), durations: base.durations.slice(), unlockedAtStreak: cur.streak,
      };
      cur.unlocks.push(unlocked);
      saveState();
      if (opts.audio !== false && typeof playPhrase === 'function') playPhrase(unlocked, instrument, opts.audioContext);
    } else {
      saveState();
    }
    return { streak: cur.streak, unlocked: Boolean(unlocked), phrase: unlocked, keepsUnlocks: true, totalUnlocks: cur.unlocks.length };
  }

  function getStreak(id) { return (topicState[String(id || 'default')] || {}).streak || 0; }
  function getUnlocks(id) { return ((topicState[String(id || 'default')] || {}).unlocks || []).slice(); }
  function softReset(id) {
    const k = String(id || 'default');
    if (topicState[k]) { topicState[k].streak = 0; saveState(); }
    return { streak: 0, unlocks: getUnlocks(k) };
  }
  function resetAll() {
    topicState = {};
    const s = getStorage();
    if (s) { try { s.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ } }
  }
  function setStorage(s) { storageRef = s; loadState(); }

  function playPhrase(phrase, instrument, audioCtx) {
    if (!phrase || !phrase.notes || typeof window === 'undefined') return null;
    const ac = audioCtx || (typeof getSharedAudioContext === 'function' ? getSharedAudioContext() : null);
    if (!ac || ac.state === 'suspended') return null;
    try {
      let t = ac.currentTime + 0.05;
      phrase.notes.forEach(function (hz, i) {
        const dur = (phrase.durations && phrase.durations[i]) || 0.15;
        const osc = ac.createOscillator(), gain = ac.createGain();
        osc.type = instrument === 'strings' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(hz, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(gain).connect(ac.destination);
        osc.start(t); osc.stop(t + dur + 0.02);
        t += dur + 0.03;
      });
      return { started: true, notes: phrase.notes.length };
    } catch (e) { return null; }
  }

  loadState();

  return {
    STREAK_TARGET, PHRASES, recordAnswer, getStreak, getUnlocks, softReset, resetAll, setStorage, playPhrase,
  };
});
