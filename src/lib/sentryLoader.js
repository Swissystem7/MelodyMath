// Optional Sentry browser SDK (Refs #609). The page ships with a placeholder DSN.
// Nothing loads, and nothing leaves the tablet, until a deploy replaces it.
// No token is stored in the repo. sendDefaultPii stays off.
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
  function dsnOf(doc) {
    if (!doc || typeof doc.querySelector !== 'function') return '';
    const meta = doc.querySelector('meta[name="sentry-dsn"]');
    const dsn = meta && meta.getAttribute ? meta.getAttribute('content') : '';
    if (!dsn || dsn === PLACEHOLDER) return '';
    return /^https:\/\/[^@\s]+@[^/\s]+\/\d+$/.test(dsn) ? dsn : '';
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
      if (Sentry && typeof Sentry.init === 'function') Sentry.init({ dsn: dsn, sendDefaultPii: false });
    };
    script.onerror = function () { /* CDN blocked: the app keeps working */ };
    (doc.head || doc.documentElement).appendChild(script);
    return { enabled: true };
  }
  return { PLACEHOLDER: PLACEHOLDER, SDK: SDK, dsnOf: dsnOf, initSentry: initSentry };
});
