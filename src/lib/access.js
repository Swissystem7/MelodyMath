// MelodyMath — sensory settings for a shared special-ed tablet.
//
// A11y is the product. These are device preferences, not a treatment and not
// a claim that larger type or speech "closes gaps". Speech uses the browser
// engine (Web Speech API) when it exists; Node tests stay silent.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const ACCESS_KEY = 'mm-access-v1';
  const BODY_CLASSES = ['mm-contrast', 'mm-large', 'mm-quiet'];
  const DEFAULTS = {
    contrast: false,
    large: false,
    speak: false,
    quiet: false,
    wait: false,
  };

  let activeHear = null;

  function defaultStorage() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) { /* private mode */ }
    return null;
  }

  function normalizePrefs(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    return {
      contrast: !!src.contrast,
      large: !!src.large,
      speak: !!src.speak,
      quiet: !!src.quiet,
      wait: !!src.wait,
    };
  }

  function loadAccess(storage) {
    const ls = storage || defaultStorage();
    if (!ls) return normalizePrefs(DEFAULTS);
    try {
      const raw = ls.getItem(ACCESS_KEY);
      if (!raw) return normalizePrefs(DEFAULTS);
      return normalizePrefs(JSON.parse(raw));
    } catch (e) {
      return normalizePrefs(DEFAULTS);
    }
  }

  function saveAccess(prefs, storage) {
    const ls = storage || defaultStorage();
    const next = normalizePrefs(prefs);
    if (!ls) return next;
    try {
      ls.setItem(ACCESS_KEY, JSON.stringify(next));
    } catch (e) { /* quota */ }
    return next;
  }

  function toggleAccess(key, storage) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) return loadAccess(storage);
    const prefs = loadAccess(storage);
    prefs[key] = !prefs[key];
    return saveAccess(prefs, storage);
  }

  function bodyClassList(prefs) {
    const p = normalizePrefs(prefs);
    const out = [];
    if (p.contrast) out.push('mm-contrast');
    if (p.large) out.push('mm-large');
    if (p.quiet) out.push('mm-quiet');
    return out;
  }

  function applyAccessToDocument(prefs, doc) {
    const d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.body) return bodyClassList(prefs);
    const next = bodyClassList(prefs);
    BODY_CLASSES.forEach(function (c) { d.body.classList.remove(c); });
    next.forEach(function (c) { d.body.classList.add(c); });
    d.body.dataset.mmSpeak = normalizePrefs(prefs).speak ? '1' : '0';
    d.body.dataset.mmWait = normalizePrefs(prefs).wait ? '1' : '0';
    return next;
  }

  function speakHebrew(text, opts) {
    if (typeof speechSynthesis === 'undefined') return false;
    const t = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
    if (!t) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'he-IL';
      u.rate = opts && typeof opts.rate === 'number' && opts.rate > 0 ? opts.rate : 0.9;
      speechSynthesis.speak(u);
      return true;
    } catch (e) {
      return false;
    }
  }

  function speakIfEnabled(text, prefs, opts) {
    const p = prefs || loadAccess();
    if (!p.speak) return false;
    return speakHebrew(text, opts);
  }

  function cancelSpeech() {
    if (typeof speechSynthesis === 'undefined') return;
    try { speechSynthesis.cancel(); } catch (e) { /* closed */ }
  }

  function waitAfterAnswer(prefs, reducedMotion) {
    const p = normalizePrefs(prefs);
    if (reducedMotion) return 200;
    if (p.wait) return 1400;
    return 700;
  }

  function sanitizeHear(groups) {
    if (!Array.isArray(groups) || !groups.length) return null;
    const out = [];
    for (let i = 0; i < groups.length && out.length < 4; i++) {
      const n = Math.round(Number(groups[i]));
      if (!Number.isFinite(n) || n < 1 || n > 12) return null;
      out.push(n);
    }
    return out.length ? out : null;
  }

  function setActiveHear(groups) {
    activeHear = sanitizeHear(groups);
    if (typeof document === 'undefined') return activeHear;
    const b = document.getElementById('mm-hear');
    if (b) {
      b.hidden = !activeHear;
      b.disabled = !activeHear;
    }
    return activeHear;
  }

  function getActiveHear() {
    return activeHear ? activeHear.slice() : null;
  }

  function refreshSpeakNow(doc) {
    const d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.getElementById) return '';
    const b = d.getElementById('mm-speak-now');
    const t = currentPromptText(d);
    if (b) {
      b.hidden = !t;
      b.disabled = !t;
    }
    return t;
  }

  function currentPromptText(doc) {
    const d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.querySelector) return '';
    const selectors = [
      '#classPlay:not(.hidden) #classPrompt',
      '#beatPlay:not(.hidden) #beatPrompt',
      '#lessonPlay:not(.hidden) #lessonPrompt',
      '#rmPlan:not(.hidden) #rmPlanPrompt',
      '#rmQuiz:not(.hidden) #rmPrompt',
      '#quiz:not(.hidden) #prompt',
      '.panel.active h2.prompt',
      '#prompt',
      '#formula',
    ];
    for (let i = 0; i < selectors.length; i++) {
      const el = d.querySelector(selectors[i]);
      if (!el) continue;
      const t = String(el.textContent || '').replace(/\s+/g, ' ').trim();
      if (t) return t;
    }
    return '';
  }

  // ------------------------------------------------------------------
  // makeAnonLogEntry - one anonymous log row from one UI event.
  //
  // WHAT THIS BUILDS ON. src/lib/anonLog.js already stores anonymous practice
  // events in localStorage (PR #13, extended in PR #21, carried today on
  // release/candidate-2026-09-09 / draft PR #24). It is not on master and not
  // on this branch, so it cannot be required from here; this function is
  // written to compose with it rather than to replace it, and the two
  // differences below are the whole reason it exists. When #24 lands, the
  // intended shape is anonLog.record(makeAnonLogEntry(ev, origin)) and the
  // owner decides whether anonLog.normalizeEvent keeps its own Date.now().
  //
  //   1. NO CLOCK. anonLog.normalizeEvent stamps Date.now() on a row that
  //      arrives without a ts. A wall clock is an identifier: rows timed to
  //      the millisecond, plus a class timetable, narrow down who was holding
  //      the shared tablet. This function never reads a clock. The CALLER
  //      passes the origin of the session and the row carries an offset in
  //      milliseconds from it. With no origin, the offset is null - never
  //      "now", and never a value invented here.
  //   2. AN ALLOWLIST, NOT A BLOCKLIST. anonLog.stripPii removes a list of
  //      banned keys plus anything matching /name|email|phone|address|tz|id/.
  //      A blocklist only removes the fields somebody thought of: birthday,
  //      school, city, teacher and gender all pass it today. This function
  //      reads a fixed set of fields and builds a fresh object, so a field
  //      nobody thought of cannot survive - it is never read at all.
  //
  // A row is these seven keys and nothing else, always all present so the log
  // is a rectangular table, and null where the event did not say:
  //
  //   type            one of ANON_EVENTS, or 'other'. A free-text type is a
  //                   text field, and a text field is where a name ends up
  //                   ("exerciseCompleted:דנה"), so an unknown type is
  //                   counted rather than quoted.
  //   tOffsetMs       whole milliseconds since the origin the caller passed,
  //                   never negative, or null.
  //   grade           one of ANON_GRADES (the four grades banks.js ships), or
  //                   null. A grade is a cohort of tens of thousands.
  //   level           1..3, the difficulty band, or null.
  //   skill           a short ASCII slug such as 'multiplication'. Anything
  //                   with a space, an accent or a Hebrew letter is refused,
  //                   which is exactly what a typed name looks like.
  //   correct         true / false / null. Never a score, never a streak.
  //   durationBucket  one of ANON_DURATION_BUCKETS. How long a child took is
  //                   a fingerprint at millisecond resolution and a useful
  //                   pedagogical signal at four buckets; the row keeps the
  //                   bucket.
  // ------------------------------------------------------------------
  const ANON_EVENTS = Object.freeze([
    'pageOpened',
    'exerciseCompleted',
    'audioStarted',
    'audioPaused',
    'audioStopped',
    'settingChanged',
  ]);
  const ANON_OTHER = 'other';
  // Mirrors banks.js GRADES. access.js is loaded by pages that do not load
  // banks.js, so it is written out rather than imported; test/access.test.js
  // asserts the two lists stay identical.
  const ANON_GRADES = Object.freeze(['א', 'ב', 'ג', 'ד']);
  const ANON_DURATION_BUCKETS = Object.freeze(['0-5s', '5-15s', '15-60s', '60s+']);
  const ANON_LOG_FIELDS = Object.freeze([
    'type', 'tOffsetMs', 'grade', 'level', 'skill', 'correct', 'durationBucket',
  ]);

  function anonType(value) {
    return ANON_EVENTS.indexOf(value) !== -1 ? value : ANON_OTHER;
  }

  function anonOffset(at, origin) {
    if (typeof at !== 'number' || !isFinite(at)) return null;
    if (typeof origin !== 'number' || !isFinite(origin)) return null;
    const d = Math.round(at - origin);
    return d < 0 ? 0 : d;
  }

  function anonGrade(value) {
    return ANON_GRADES.indexOf(value) !== -1 ? value : null;
  }

  function anonLevel(value) {
    if (typeof value !== 'number' || !isFinite(value)) return null;
    const n = Math.round(value);
    return (n >= 1 && n <= 3) ? n : null;
  }

  function anonSkill(value) {
    if (typeof value !== 'string') return null;
    const s = value.trim();
    return /^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/.test(s) ? s : null;
  }

  function anonCorrect(value) {
    return typeof value === 'boolean' ? value : null;
  }

  function anonDurationBucket(ms) {
    if (typeof ms !== 'number' || !isFinite(ms) || ms < 0) return null;
    if (ms < 5000) return ANON_DURATION_BUCKETS[0];
    if (ms < 15000) return ANON_DURATION_BUCKETS[1];
    if (ms < 60000) return ANON_DURATION_BUCKETS[2];
    return ANON_DURATION_BUCKETS[3];
  }

  // `origin` is the start of the session, in the same units as event.at. It
  // may also travel on the event itself as event.origin.
  function makeAnonLogEntry(event, origin) {
    const ev = (event && typeof event === 'object') ? event : {};
    const base = (typeof origin === 'number') ? origin : ev.origin;
    return {
      type: anonType(ev.type),
      tOffsetMs: anonOffset(ev.at, base),
      grade: anonGrade(ev.grade),
      level: anonLevel(ev.level),
      skill: anonSkill(ev.skill),
      correct: anonCorrect(ev.correct),
      durationBucket: anonDurationBucket(ev.durationMs),
    };
  }

  return {
    ACCESS_KEY: ACCESS_KEY,
    DEFAULTS: DEFAULTS,
    normalizePrefs: normalizePrefs,
    loadAccess: loadAccess,
    saveAccess: saveAccess,
    toggleAccess: toggleAccess,
    bodyClassList: bodyClassList,
    applyAccessToDocument: applyAccessToDocument,
    speakHebrew: speakHebrew,
    speakIfEnabled: speakIfEnabled,
    cancelSpeech: cancelSpeech,
    waitAfterAnswer: waitAfterAnswer,
    sanitizeHear: sanitizeHear,
    setActiveHear: setActiveHear,
    getActiveHear: getActiveHear,
    currentPromptText: currentPromptText,
    refreshSpeakNow: refreshSpeakNow,
    ANON_EVENTS: ANON_EVENTS,
    ANON_GRADES: ANON_GRADES,
    ANON_DURATION_BUCKETS: ANON_DURATION_BUCKETS,
    ANON_LOG_FIELDS: ANON_LOG_FIELDS,
    ANON_OTHER: ANON_OTHER,
    makeAnonLogEntry: makeAnonLogEntry,
  };
});
