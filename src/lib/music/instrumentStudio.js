// MelodyMath — InstrumentStudio logic (#591, owner spec 6376023552 with the
// correction 6376035473: every instrument is free, nothing is sold).
//
// The child picks an instrument at three moments only: when a topic starts,
// after 5 correct answers in a row, and when a new instrument opens. Each
// moment offers 2-4 instruments (Patall, Cooper & Robinson 2008), never in the
// middle of an exercise. Every instrument is a real InstrumentProfile
// {samples, feel, theme, mechanic}: its own voices, its own way to play and
// its own look. No two profiles share a mechanic and a sample set.
//
// The instrument is timbre and mechanic only (dosage rules 6368976807):
// primaryMethod(topic) is the same for every instrument, and answers, streaks
// and progress are counted the same whatever is chosen. Instruments open by
// mastery (5 correct answers in a topic), in a fixed order: no randomness,
// no timers, no virtual money. An instrument whose touch path cannot sound within the
// 50 ms budget (comment 6369013171) is marked unavailable on the device.
// Pure and tested in Node; storage is injectable like streak.js.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_STUDIO = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const DATA = root && typeof root.instrumentById === 'function' ? root : require('../instruments.js');

  const STREAK = 5;
  const MASTERY = 5;
  const MIN_OPTIONS = 2;
  const MAX_OPTIONS = 4;
  const BUDGET_MS = 50;
  const ONSET_MS = 4; // the tap path ramps every voice in over 4 ms
  const STORAGE_KEY = 'mm.studio';

  // How each mechanic is played. inputDelayMs: time the gesture needs before
  // the first sound may start (all of these sound on pointerdown).
  const MECHANICS = {
    tapZones: { he: 'הקשה באזורים: דום במרכז, טק בשוליים', inputDelayMs: 0 },
    barsByPitch: { he: 'קורות לפי גובה: ארוכה נמוכה, קצרה גבוהה', inputDelayMs: 0 },
    thumbPluck: { he: 'פריטה באגודל על לשוניות', inputDelayMs: 0 },
    pressSlide: { he: 'לוחצים ומחליקים: הצליל עולה ויורד', inputDelayMs: 0 },
    strikeDamp: { he: 'מכה ועמעום: כל מכה משתיקה את הקודמת', inputDelayMs: 0 },
    keys: { he: 'קלידים, גם כמה אצבעות יחד', inputDelayMs: 0 },
  };

  // p(id, mechanic, samples, feel, icon, color, mastered-topics-to-open)
  function p(id, mechanic, samples, feel, icon, color, opensAt) {
    const x = DATA.instrumentById(id);
    return { id: id, he: x ? x.instrument.he : id, family: x ? x.family : null, mechanic: mechanic, samples: samples,
      voice: samples[0], feel: feel, theme: { icon: icon, color: color }, opensAt: opensAt };
  }

  const PROFILES = [
    p('darbuka', 'tapZones', ['drumLow', 'drumHigh'], { decay: 'short', zones: ['דום', 'טק'] }, '🪘', 'yellow', 0),
    p('marimba', 'barsByPitch', ['woodBar'], { decay: 'warm', notes: [262, 294, 330, 392, 440, 523, 587, 659] }, '🪵', 'pink', 0),
    p('piano', 'keys', ['keys'], { decay: 'long', notes: [262, 294, 330, 349, 392, 440, 494, 523] }, '🎹', 'ink', 0),
    p('kalimba', 'thumbPluck', ['tine'], { decay: 'ring', notes: [523, 587, 659, 784, 880, 1047, 1175] }, '🎐', 'mint', 1),
    p('tabla', 'pressSlide', ['drumHigh', 'frameDrum'], { decay: 'short', slide: [110, 130, 150, 175, 200] }, '🥁', 'purple', 2),
    p('gamelan', 'strikeDamp', ['gong'], { decay: 'long', notes: [262, 294, 349, 392, 440] }, '🔔', 'good', 3),
  ];

  function profile(id) {
    for (let i = 0; i < PROFILES.length; i++) if (PROFILES[i].id === id) return PROFILES[i];
    return null;
  }

  // The one primary musical way of a topic. The instrument argument is
  // accepted and ignored on purpose: no instrument can change the method.
  const METHOD_HE = { M1: 'פעימה קבועה', M2: 'פעימות מודגשות בקבוצות', M3: 'משכי תווים בתיבה', M4: 'פולי־ריתמוס (העשרה)', M5: 'גובה צליל (העשרה)', M6: 'דגמים מלודיים וקצביים', M7: 'הליכה ופנייה בקצב (העשרה)' };
  function primaryMethod(topic) {
    const t = DATA.TOPICS[topic];
    if (!t) return null;
    return { topic: topic, mechanism: t.mechanism, he: METHOD_HE[t.mechanism], optional: DATA.WEAK.indexOf(t.mechanism) >= 0 };
  }
  function topics() {
    return Object.keys(DATA.TOPICS).filter(function (t) { return DATA.PRIMARY.indexOf(DATA.TOPICS[t].mechanism) >= 0; });
  }

  // Estimated pointerdown-to-sound time on this device: the measured JS path
  // (window.audioState) plus the mechanic's gesture time plus the onset ramp.
  function latencyMs(prof, device) {
    const d = device || {};
    const m = MECHANICS[prof.mechanic];
    return (Number(d.jsPathMs) || 0) + (m ? m.inputDelayMs : BUDGET_MS) + ONSET_MS;
  }
  function isAvailable(prof, device) {
    return latencyMs(prof, device) < BUDGET_MS;
  }

  function initialState() {
    return { correct: {}, streak: 0, current: 'darbuka', moment: null, choices: 0, opened: ['darbuka', 'marimba', 'piano'] };
  }

  function masteredCount(state) {
    const c = (state && state.correct) || {};
    return Object.keys(c).filter(function (t) { return c[t] >= MASTERY; }).length;
  }
  function unlockedIds(state) {
    const n = masteredCount(state);
    return PROFILES.filter(function (x) { return x.opensAt <= n; }).map(function (x) { return x.id; });
  }

  // 2-4 open, available instruments, the current one and a fresh one first;
  // the rest rotate with the number of earlier choices (deterministic).
  function choiceOptions(state, device, fresh) {
    const open = unlockedIds(state).filter(function (id) { return isAvailable(profile(id), device); });
    const first = [fresh, state.current].filter(function (id, i, a) { return id && open.indexOf(id) >= 0 && a.indexOf(id) === i; });
    const rest = open.filter(function (id) { return first.indexOf(id) < 0; });
    const k = rest.length ? state.choices % rest.length : 0;
    const out = first.concat(rest.slice(k), rest.slice(0, k)).slice(0, MAX_OPTIONS);
    return out.length >= MIN_OPTIONS ? out : null;
  }

  function withMoment(state, kind, device, fresh) {
    const options = choiceOptions(state, device, fresh);
    return Object.assign({}, state, { moment: options ? { kind: kind, options: options, fresh: fresh || null } : null });
  }

  // The only three events that can open a choice. Anything else (a tile, a
  // hint, a step inside an exercise) returns the state unchanged.
  function onEvent(state, ev, device) {
    const s = state || initialState();
    if (!ev) return s;
    if (ev.type === 'topicStart') return withMoment(s, 'topicStart', device);
    if (ev.type !== 'answer') return s;
    const correct = Object.assign({}, s.correct);
    const topic = String(ev.topic || 'general');
    if (ev.correct) correct[topic] = (correct[topic] || 0) + 1;
    const next = Object.assign({}, s, { correct: correct, streak: ev.correct ? s.streak + 1 : 0 });
    const fresh = unlockedIds(next).filter(function (id) { return s.opened.indexOf(id) < 0; })[0] || null;
    if (fresh) {
      next.opened = s.opened.concat([fresh]);
      return withMoment(next, 'unlock', device, isAvailable(profile(fresh), device) ? fresh : null);
    }
    if (ev.correct && next.streak % STREAK === 0) return withMoment(next, 'streak', device);
    return next;
  }

  function choose(state, id) {
    if (!state.moment || state.moment.options.indexOf(id) < 0) return state;
    return Object.assign({}, state, { current: id, moment: null, choices: state.choices + 1 });
  }

  function load(storage, key) {
    try {
      const v = JSON.parse(storage.getItem(key || STORAGE_KEY));
      if (v && v.correct && Array.isArray(v.opened) && profile(v.current)) return Object.assign(initialState(), v, { moment: null });
    } catch (e) { /* unreadable storage -> start fresh */ }
    return initialState();
  }
  function save(storage, state, key) {
    try { storage.setItem(key || STORAGE_KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
  }

  return {
    STREAK: STREAK, MASTERY: MASTERY, MIN_OPTIONS: MIN_OPTIONS, MAX_OPTIONS: MAX_OPTIONS, BUDGET_MS: BUDGET_MS,
    MECHANICS: MECHANICS, PROFILES: PROFILES, profile: profile, primaryMethod: primaryMethod, topics: topics,
    latencyMs: latencyMs, isAvailable: isAvailable, initialState: initialState, masteredCount: masteredCount,
    unlockedIds: unlockedIds, choiceOptions: choiceOptions, onEvent: onEvent, choose: choose, load: load, save: save,
  };
});
