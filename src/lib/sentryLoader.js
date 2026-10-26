// Optional Sentry browser SDK (Refs #609). The page ships with a placeholder DSN.
// Nothing loads, and nothing leaves the tablet, until a deploy replaces it.
// No token is stored in the repo. sendDefaultPii stays off.
// beforeSend still strips the user field and request body, and redacts child
// names inside breadcrumb messages, in case a later event carries them.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_SENTRY = api;
  if (typeof document !== 'undefined' && document && typeof document.querySelector === 'function') {
    try { api.initSentry(document, root); } catch (e) { /* absent DSN stays silent */ }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const PLACEHOLDER = '__SENTRY_DSN__';
  const SDK = 'https://browser.sentry-cdn.com/7.76.0/bundle.min.js';
  const WHO_KEY = 'mm-who-v1';
  const ROSTER_PREFIX = 'mm-roster-v1:';
  const NAME_MARK = '[name]';

  function dsnOf(doc) {
    if (!doc || typeof doc.querySelector !== 'function') return '';
    const meta = doc.querySelector('meta[name="sentry-dsn"]');
    const dsn = meta && meta.getAttribute ? meta.getAttribute('content') : '';
    if (!dsn || dsn === PLACEHOLDER) return '';
    return /^https:\/\/[^@\s]+@[^/\s]+\/\d+$/.test(dsn) ? dsn : '';
  }

  // A one-letter name would redact ordinary Hebrew. Prototype keys are never
  // students. The same name is kept once, then longest-first so a full name
  // is removed before a shorter one inside it.
  function childLabel(value) {
    const label = String(value == null ? '' : value).trim().replace(/\s+/g, ' ');
    if (label.length < 2 || label in Object.prototype) return '';
    return label;
  }

  function rememberName(out, seen, value) {
    const label = childLabel(value);
    if (!label || seen[label]) return;
    seen[label] = 1;
    out.push(label);
  }

  function usableNames(names) {
    let raw = names;
    if (typeof names === 'function') {
      try { raw = names(); } catch (e) { raw = []; }
    }
    const out = [];
    const seen = Object.create(null);
    if (Array.isArray(raw)) raw.forEach(function (value) { rememberName(out, seen, value); });
    out.sort(function (a, b) { return b.length - a.length; });
    return out;
  }

  function storageOf(storage) {
    if (storage) return storage;
    try {
      if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
    } catch (e) { /* private mode */ }
    return null;
  }

  function namesFromStorage(storage) {
    const out = [];
    const seen = Object.create(null);
    const ls = storageOf(storage);
    if (!ls || typeof ls.getItem !== 'function') return out;
    try {
      const who = JSON.parse(ls.getItem(WHO_KEY) || 'null');
      if (who && typeof who === 'object') rememberName(out, seen, who.name);
    } catch (e) { /* a broken who-record still leaves the roster readable */ }
    const count = typeof ls.length === 'number' ? ls.length : 0;
    if (typeof ls.key !== 'function' || count <= 0) return out;
    for (let i = 0; i < count; i++) {
      let key = '';
      try { key = ls.key(i) || ''; } catch (e) { continue; }
      if (key.indexOf(ROSTER_PREFIX) !== 0) continue;
      try {
        const data = JSON.parse(ls.getItem(key) || 'null');
        const students = data && data.students;
        if (!students || typeof students !== 'object') continue;
        Object.keys(students).forEach(function (name) {
          // A prototype key is never a student, and neither is anything stored under it.
          if (!childLabel(name)) return;
          rememberName(out, seen, name);
          const row = students[name];
          if (row && typeof row === 'object') rememberName(out, seen, row.name);
        });
      } catch (e) { /* skip one bad class */ }
    }
    return out;
  }

  function redactNames(text, names) {
    let out = text;
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      if (out.indexOf(name) === -1) continue;
      out = out.split(name).join(NAME_MARK);
    }
    return out;
  }

  function crumbList(event) {
    const crumbs = event.breadcrumbs;
    if (Array.isArray(crumbs)) return crumbs;
    if (crumbs && typeof crumbs === 'object' && Array.isArray(crumbs.values)) return crumbs.values;
    return null;
  }

  // Returns the same event with identity and typed text removed. A null event
  // stays null so the SDK drops it. Any other event is still sent.
  function scrubEvent(event, names) {
    if (!event || typeof event !== 'object') return event;
    const list = usableNames(names);
    try { delete event.user; } catch (e) { /* frozen event */ }
    const req = event.request;
    if (req && typeof req === 'object') {
      try { delete req.data; } catch (e) { /* frozen request */ }
    }
    const crumbs = crumbList(event);
    if (crumbs) {
      for (let i = 0; i < crumbs.length; i++) {
        const crumb = crumbs[i];
        if (!crumb || typeof crumb !== 'object' || typeof crumb.message !== 'string') continue;
        crumb.message = redactNames(crumb.message, list);
      }
    }
    return event;
  }

  function initSentry(doc, g) {
    const dsn = dsnOf(doc);
    if (!dsn) return { enabled: false };
    const scope = g || root;
    const script = doc.createElement('script');
    script.src = SDK;
    script.crossOrigin = 'anonymous';
    script.onload = function () {
      const Sentry = scope && scope.Sentry;
      if (Sentry && typeof Sentry.init === 'function') {
        Sentry.init({
          dsn: dsn,
          sendDefaultPii: false,
          beforeSend: function (event) {
            try { return scrubEvent(event, namesFromStorage()); }
            catch (e) { return scrubEvent(event, []); }
          },
        });
      }
    };
    script.onerror = function () { /* CDN blocked: the app keeps working */ };
    (doc.head || doc.documentElement).appendChild(script);
    return { enabled: true };
  }

  return {
    PLACEHOLDER: PLACEHOLDER,
    SDK: SDK,
    dsnOf: dsnOf,
    initSentry: initSentry,
    scrubEvent: scrubEvent,
    namesFromStorage: namesFromStorage,
  };
});
