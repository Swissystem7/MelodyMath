'use strict';
// Refs #610: secrets are names in the repo and values only in the env Doppler injects.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const secrets = require('../tools/secrets');
const codecov = require('../tools/codecov');

const root = path.join(__dirname, '..');

test('a missing or placeholder secret stays empty', () => {
  assert.deepEqual(secrets.REQUIRED, ['SENTRY_DSN', 'CODECOV_TOKEN']);
  for (const name of secrets.REQUIRED) {
    assert.equal(secrets.secretOf(name, {}), '');
    assert.equal(secrets.secretOf(name, { [name]: '   ' }), '');
    assert.equal(secrets.secretOf(name, { [name]: secrets.PLACEHOLDER[name] }), '');
  }
  assert.equal(codecov.tokenOf({}), '');
  assert.equal(codecov.tokenOf({ CODECOV_TOKEN: secrets.PLACEHOLDER.CODECOV_TOKEN }), '');
});

test('Doppler env is the only place a value is read, and the page keeps its placeholder', () => {
  const dsn = 'https://public@o1.ingest.sentry.io/1';
  assert.equal(secrets.secretOf('SENTRY_DSN', { SENTRY_DSN: dsn }), dsn);
  assert.equal(secrets.secretOf('CODECOV_TOKEN', { CODECOV_TOKEN: 'tok-from-env' }), 'tok-from-env');
  const html = '<meta name="sentry-dsn" content="__SENTRY_DSN__">';
  assert.equal(secrets.injectPlaceholder(html, 'SENTRY_DSN', {}), html);
  assert.match(secrets.injectPlaceholder(html, 'SENTRY_DSN', { SENTRY_DSN: dsn }), /content="https:\/\/public@o1\.ingest\.sentry\.io\/1"/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /public@o1\.ingest\.sentry\.io/);
});

test('the README names the secrets and the repo stores no Doppler value', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /Doppler/);
  for (const name of secrets.REQUIRED) assert.match(readme, new RegExp(name));
  const files = ['README.md', 'tools/secrets.js', 'tools/codecov.js', 'src/lib/sentryLoader.js', 'index.html'];
  const blob = files.map((rel) => fs.readFileSync(path.join(root, rel), 'utf8')).join('\n');
  assert.doesNotMatch(blob, /SENTRY_DSN\s*[:=]\s*['"]https:\/\//);
  assert.doesNotMatch(blob, /CODECOV_TOKEN\s*[:=]\s*['"][A-Za-z0-9]{8,}/);
  assert.doesNotMatch(blob, /dp\.(?:st|ct)\./);
  const wf = path.join(root, '.github', 'workflows');
  if (fs.existsSync(wf)) {
    assert.deepEqual(fs.readdirSync(wf).sort(), ['ci.yml'], 'only .github/workflows/ci.yml is allowed');
  }
  assert.equal(fs.existsSync(path.join(root, 'doppler.yaml')), false);
});
