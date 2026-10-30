'use strict';
// Refs #609: Sentry stays off without a DSN, and Codecov does not upload without a token.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sentry = require('../src/lib/sentryLoader');
const codecov = require('../tools/codecov');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

function fakeDoc(dsn) {
  const scripts = [];
  const meta = dsn == null ? null : { getAttribute: () => dsn };
  return {
    scripts: scripts,
    querySelector: (sel) => (sel === 'meta[name="sentry-dsn"]' ? meta : null),
    createElement: () => { const el = { src: '' }; scripts.push(el); return el; },
    head: { appendChild() {} },
  };
}

test('a placeholder or missing DSN does not load Sentry', () => {
  for (const dsn of ['__SENTRY_DSN__', '', 'not-a-dsn', null]) {
    const doc = fakeDoc(dsn);
    assert.deepEqual(sentry.initSentry(doc, {}), { enabled: false });
    assert.equal(doc.scripts.length, 0);
  }
});

test('a real DSN loads the SDK and disables PII', () => {
  const doc = fakeDoc('https://public@o1.ingest.sentry.io/1');
  const seen = [];
  const g = { Sentry: { init: (opts) => seen.push(opts) } };
  assert.deepEqual(sentry.initSentry(doc, g), { enabled: true });
  assert.equal(doc.scripts.length, 1);
  assert.equal(doc.scripts[0].src, sentry.SDK);
  doc.scripts[0].onload();
  assert.equal(seen[0].sendDefaultPii, false);
  assert.equal(seen[0].dsn, 'https://public@o1.ingest.sentry.io/1');
});

test('home keeps the placeholder, loads the local loader, and stores no secret', () => {
  const html = read('index.html');
  assert.match(html, /<meta name="sentry-dsn" content="__SENTRY_DSN__">/);
  assert.match(html, /<script src="src\/lib\/sentryLoader\.js"><\/script>/);
  assert.doesNotMatch(html, /browser\.sentry-cdn\.com/);
  assert.match(read('sw.js'), /\.\/src\/lib\/sentryLoader\.js/);
  const blob = html + read('src/lib/sentryLoader.js') + read('tools/codecov.js') + read('README.md');
  assert.doesNotMatch(blob, /https:\/\/[0-9a-f]+@[a-z0-9.]+\.sentry\.io\/\d+/);
  assert.doesNotMatch(blob, /CODECOV_TOKEN\s*[:=]\s*['"][A-Za-z0-9]{8,}/);
  assert.equal(fs.existsSync(path.join(root, '.github', 'workflows')), false);
});

test('Codecov upload is skipped when the token is missing', async () => {
  assert.equal(codecov.tokenOf({}), '');
  assert.equal(codecov.tokenOf({ CODECOV_TOKEN: '  ' }), '');
  assert.equal(codecov.tokenOf({ CODECOV_TOKEN: '__CODECOV_TOKEN__' }), '');
  let called = 0;
  const r = await codecov.uploadReport('TN:\n', {}, () => { called += 1; });
  assert.equal(called, 0);
  assert.deepEqual(r, { ok: true, uploaded: false, reason: 'token-missing' });
  assert.match(read('README.md'), /SENTRY_DSN/);
  assert.match(read('README.md'), /CODECOV_TOKEN/);
  assert.match(read('package.json'), /"coverage": "node tools\/codecov\.js"/);
});
