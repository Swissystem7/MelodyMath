// Secrets come from the environment Doppler injects (Refs #610).
// This file lists names only. Values are never written here or committed.
'use strict';

const REQUIRED = ['SENTRY_DSN', 'CODECOV_TOKEN'];
const PLACEHOLDER = {
  SENTRY_DSN: '__SENTRY_DSN__',
  CODECOV_TOKEN: '__CODECOV_TOKEN__',
};

function secretOf(name, env) {
  const mark = PLACEHOLDER[name];
  const raw = env && Object.prototype.hasOwnProperty.call(env, name) ? env[name] : '';
  const value = String(raw == null ? '' : raw).trim();
  if (!value || value === mark) return '';
  return value;
}

// Deploy-time substitution. A missing secret leaves the placeholder in place,
// so the tablet keeps working and sends nothing.
function injectPlaceholder(text, name, env) {
  const mark = PLACEHOLDER[name];
  const value = secretOf(name, env);
  if (!mark || !value) return String(text == null ? '' : text);
  return String(text).split(mark).join(value);
}

module.exports = {
  REQUIRED: REQUIRED,
  PLACEHOLDER: PLACEHOLDER,
  secretOf: secretOf,
  injectPlaceholder: injectPlaceholder,
};
