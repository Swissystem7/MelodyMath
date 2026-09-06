// MelodyMath — anonymous practice events (time, exercise, accuracy). No PII.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STORE_KEY = 'mm-anon-log-v1';
  const MAX_EVENTS = 500;
  const BANNED_KEYS = Object.freeze([
    'name', 'fullName', 'studentName', 'email', 'phone', 'mobile',
    'idNumber', 'nationalId', 'tz', 'address', 'classCode', 'notes',
  ]);

  function defaultStorage() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) { /* private mode */ }
    return null;
  }

  function stripPii(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const out = {};
    Object.keys(src).forEach(function (k) {
      if (BANNED_KEYS.indexOf(k) !== -1) return;
      if (/name|email|phone|address|tz|id/i.test(k) && k !== 'exerciseId') return;
      out[k] = src[k];
    });
    return out;
  }

  function normalizeEvent(raw) {
    const src = stripPii(raw);
    const ts = typeof src.ts === 'number' && Number.isFinite(src.ts) ? src.ts : Date.now();
    const exerciseId = String(src.exerciseId == null ? '' : src.exerciseId).slice(0, 64);
    const correct = src.correct === true;
    let durationMs = Math.round(Number(src.durationMs));
    if (!Number.isFinite(durationMs) || durationMs < 0) durationMs = 0;
    durationMs = Math.min(durationMs, 60 * 60 * 1000);
    return {
      ts: ts,
      exerciseId: exerciseId,
      correct: correct,
      durationMs: durationMs,
    };
  }

  function load(storage) {
    const ls = storage || defaultStorage();
    if (!ls) return [];
    try {
      const raw = ls.getItem(STORE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.map(normalizeEvent).slice(-MAX_EVENTS);
    } catch (e) {
      return [];
    }
  }

  function save(events, storage) {
    const ls = storage || defaultStorage();
    if (!ls) return false;
    try {
      ls.setItem(STORE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
      return true;
    } catch (e) {
      return false;
    }
  }

  function record(raw, storage) {
    const events = load(storage);
    const ev = normalizeEvent(raw);
    events.push(ev);
    save(events, storage);
    return ev;
  }

  function summarize(storage) {
    const events = load(storage);
    const total = events.length;
    const hits = events.filter(function (e) { return e.correct; }).length;
    return {
      total: total,
      correct: hits,
      accuracy: total ? hits / total : null,
      anonymous: true,
      pii: false,
    };
  }

  function exportEvents(storage) {
    return load(storage).map(function (e) {
      return {
        ts: e.ts,
        exerciseId: e.exerciseId,
        correct: e.correct,
        durationMs: e.durationMs,
      };
    });
  }

  function clear(storage) {
    const ls = storage || defaultStorage();
    if (ls && typeof ls.removeItem === 'function') ls.removeItem(STORE_KEY);
    return [];
  }

  return {
    STORE_KEY: STORE_KEY,
    BANNED_KEYS: BANNED_KEYS,
    stripPii: stripPii,
    normalizeEvent: normalizeEvent,
    record: record,
    load: load,
    summarize: summarize,
    exportEvents: exportEvents,
    clear: clear,
  };
});
