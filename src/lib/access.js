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
  let announcementQueue = [];
  let isSpeaking = false;
  let currentUtterance = null;

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
    updateQuietFallback(d);
    return next;
  }

  function normalizePriority(priority) {
    if (typeof priority === 'number') return priority;
    if (priority === true) return 1;
    if (typeof priority === 'string') {
      const p = priority.toLowerCase().trim();
      if (p === 'high' || p === 'assertive' || p === 'urgent') return 1;
    }
    return 0;
  }

  function queueAnnouncement(text, priority, opts) {
    const t = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
    if (!t) return false;
    const prio = normalizePriority(priority);
    const item = {
      text: t,
      priority: prio,
      opts: opts || {},
    };
    announcementQueue.push(item);
    try {
      if (typeof speechSynthesis !== 'undefined') {
        const prefs = loadAccess();
        if (prefs && prefs.speak) {
          processSpeechQueue();
        }
      }
    } catch (e) { /* ignore */ }
    return true;
  }

  function dequeueAnnouncementItem() {
    if (!announcementQueue.length) return null;
    let bestIdx = 0;
    let bestPriority = announcementQueue[0].priority;
    for (let i = 1; i < announcementQueue.length; i++) {
      if (announcementQueue[i].priority > bestPriority) {
        bestPriority = announcementQueue[i].priority;
        bestIdx = i;
      }
    }
    const [item] = announcementQueue.splice(bestIdx, 1);
    return item || null;
  }

  function dequeueAnnouncement() {
    const item = dequeueAnnouncementItem();
    return item ? item.text : null;
  }

  function clearAnnouncements() {
    announcementQueue = [];
  }

  function getAnnouncementQueue() {
    return announcementQueue.map(function (item) {
      return { text: item.text, priority: item.priority };
    });
  }

  function processSpeechQueue() {
    if (typeof speechSynthesis === 'undefined') return false;
    if (isSpeaking) return false;
    if (!announcementQueue.length) return false;

    const item = dequeueAnnouncementItem();
    if (!item) return false;

    try {
      isSpeaking = true;
      const u = new SpeechSynthesisUtterance(item.text);
      u.lang = 'he-IL';
      const opts = item.opts || {};
      u.rate = opts && typeof opts.rate === 'number' && opts.rate > 0 ? opts.rate : 0.9;

      // speechSynthesis.cancel() fires the cancelled utterance's end/error
      // event later, asynchronously. By then a new utterance may already be
      // playing; a stale callback must not free the queue for it.
      const onDone = function () {
        if (currentUtterance !== u) return;
        currentUtterance = null;
        isSpeaking = false;
        processSpeechQueue();
      };

      u.onend = onDone;
      u.onerror = onDone;
      currentUtterance = u;
      speechSynthesis.speak(u);
      return true;
    } catch (e) {
      currentUtterance = null;
      isSpeaking = false;
      return false;
    }
  }

  function speakHebrew(text, opts) {
    if (typeof speechSynthesis === 'undefined') return false;
    const t = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
    if (!t) return false;
    try {
      if (opts && (opts.cancel || opts.interrupt)) {
        cancelSpeech();
      }
      const priority = opts && (opts.priority || opts.urgent || opts.assertive);
      queueAnnouncement(t, priority, opts);
      processSpeechQueue();
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
    announcementQueue = [];
    isSpeaking = false;
    currentUtterance = null;
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

  function hearFallbackText(groups) {
    if (!Array.isArray(groups) || !groups.length) return '';
    return groups.map(function (n) { return n + ' פעימות'; }).join(', ואז ');
  }

  function updateQuietFallback(doc) {
    const d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !d.getElementById) return;
    const el = d.getElementById('mm-quiet-fallback');
    if (!el) return;
    const prefs = loadAccess();
    const hear = getActiveHear();
    if (prefs.quiet && hear) {
      el.textContent = 'מצב שקט: ' + hearFallbackText(hear) + ' (תיאור במקום צליל)';
      el.hidden = false;
      el.classList.remove('hidden');
    } else {
      el.textContent = '';
      el.hidden = true;
      el.classList.add('hidden');
    }
  }

  function setActiveHear(groups) {
    activeHear = sanitizeHear(groups);
    if (typeof document === 'undefined') return activeHear;
    const b = document.getElementById('mm-hear');
    if (b) {
      b.hidden = !activeHear;
      b.disabled = !activeHear;
    }
    updateQuietFallback();
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
    queueAnnouncement: queueAnnouncement,
    enqueueAnnouncement: queueAnnouncement,
    dequeueAnnouncement: dequeueAnnouncement,
    nextAnnouncement: dequeueAnnouncement,
    clearAnnouncements: clearAnnouncements,
    getAnnouncementQueue: getAnnouncementQueue,
    queueMessage: queueAnnouncement,
    dequeueMessage: dequeueAnnouncement,
    nextMessage: dequeueAnnouncement,
  };
});
