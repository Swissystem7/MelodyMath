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
        id: base.id, name: base.name, instrument: instrument, seq: mySong().length + 1,
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

  // The child's instrument: the one app-wide choice (myInstrument.js, #679),
  // else the topic's own instrument (instruments.js).
  const FALLBACK_VOICE = 'keys';
  function myInstrument() {
    const g = typeof globalThis !== 'undefined' ? globalThis : {};
    if (g.MM_MY_INSTRUMENT) return g.MM_MY_INSTRUMENT;
    try { return require('./myInstrument.js'); } catch (e) { return null; }
  }
  function instrumentFor(topic) {
    try {
      const mine = myInstrument();
      const id = mine && mine.getMyInstrument(getStorage());
      if (id) return id;
    } catch (e) { /* chooser not loaded */ }
    const g = typeof globalThis !== 'undefined' ? globalThis : {};
    const list = typeof g.forTopic === 'function' ? g.forTopic(topic) : [];
    return list && list[0] ? list[0].id : null;
  }
  function voiceFor(instrumentId) {
    const g = typeof globalThis !== 'undefined' ? globalThis : {};
    const x = instrumentId && typeof g.instrumentById === 'function' ? g.instrumentById(instrumentId) : null;
    return x && g.VOICES && g.VOICES[x.voice] ? x.voice : FALLBACK_VOICE;
  }

  // Plays a phrase on the instrument's voice (instrumentVoices.playVoice),
  // starting `delay` seconds from now so it follows the right-answer sound.
  function playPhrase(phrase, instrument, audioCtx, delay) {
    if (!phrase || !phrase.notes || typeof window === 'undefined') return null;
    const g = globalThis;
    if (g.audioState && g.audioState.muted) return null;
    const ac = audioCtx || (typeof g.getSharedAudioContext === 'function' ? g.getSharedAudioContext() : null);
    if (!ac) return null;
    if (ac.state === 'suspended') { try { ac.resume(); } catch (e) { /* autoplay policy */ } }
    const voice = voiceFor(instrument || phrase.instrument);
    try {
      let t = ac.currentTime + 0.05 + (Number(delay) || 0);
      phrase.notes.forEach(function (hz, i) {
        const dur = (phrase.durations && phrase.durations[i]) || 0.15;
        if (typeof g.playVoice === 'function') g.playVoice(ac, voice, hz, t);
        else {
          const osc = ac.createOscillator(), gain = ac.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(hz, t);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
          osc.connect(gain).connect(ac.destination);
          osc.start(t); osc.stop(t + dur + 0.02);
        }
        t += dur + 0.03;
      });
      return { started: true, notes: phrase.notes.length, voice: voice };
    } catch (e) { return null; }
  }

  // "השיר שלי": every unlocked phrase from every topic, in unlock order.
  function mySong() {
    const all = [];
    Object.keys(topicState).forEach(function (k) { (topicState[k].unlocks || []).forEach(function (p) { all.push(p); }); });
    return all.sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mySongHtml(list) {
    const song = list || mySong();
    if (!song.length) return '<p class="note">5 תשובות נכונות ברצף פותחות משפט מוזיקלי לשיר שלך.</p>';
    const g = typeof globalThis !== 'undefined' ? globalThis : {};
    return '<button type="button" data-song="all">▶ נגנו את כל השיר</button>' + song.map(function (p, i) {
      const x = p.instrument && typeof g.instrumentById === 'function' ? g.instrumentById(p.instrument) : null;
      const on = x && x.instrument ? ' · ' + x.instrument.he : '';
      return '<button type="button" data-song="' + i + '">▶ ' + esc(p.name + on) + '</button>';
    }).join('');
  }
  // Plays the whole song, phrase after phrase.
  function playSong(list, audioCtx) {
    let delay = 0;
    (list || mySong()).forEach(function (p) {
      playPhrase(p, null, audioCtx, delay);
      delay += p.notes.length * 0.03 + (p.durations || []).reduce(function (a, b) { return a + b; }, 0) + 0.3;
    });
    return delay;
  }

  loadState();

  return {
    STREAK_TARGET, PHRASES, recordAnswer, getStreak, getUnlocks, softReset, resetAll, setStorage, playPhrase,
    instrumentFor, voiceFor, mySong, mySongHtml, playSong,
  };
});
