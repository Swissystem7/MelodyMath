// MM-602 — the pilot demo is several files. After #957 a browser that had cached
// MM-600's js/music.js ran it with MM-601's js/app.js: window.MMPilotMusic was
// missing, stopSound() threw and sign-in silently failed. pilot/index.html now
// loads every script and stylesheet with one shared ?v=, so a new page never
// pairs with an old cached file, and sw.js precaches exactly those URLs.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'pilot', 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]);
const sheets = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map((m) => (m[0].match(/href="([^"]+)"/) || [])[1]);
const refs = scripts.concat(sheets);
const versionOf = (ref) => { const m = /[?&]v=([^&#]+)/.exec(ref || ''); return m ? m[1] : null; };

test('every script and stylesheet in pilot/index.html carries ?v=, and all share one value', () => {
  assert.ok(scripts.length >= 9, 'expected the pilot scripts, found ' + scripts.length);
  assert.ok(sheets.length >= 1, 'expected pilot.css');
  refs.forEach((ref) => assert.ok(versionOf(ref), ref + ' has no ?v='));
  const versions = new Set(refs.map(versionOf));
  assert.equal(versions.size, 1, 'more than one ?v= in pilot/index.html: ' + [...versions].join(', '));
  assert.match([...versions][0], /^[0-9a-f]{7,40}$|^\d{8}$/, 'the version is a short commit sha or YYYYMMDD');
});

test('sw.js precaches each versioned pilot URL exactly, with the same ?v=', () => {
  const listed = new Set([...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]));
  const v = versionOf(refs[0]);
  refs.forEach((ref) => {
    const rel = path.posix.normalize('pilot/' + ref);
    assert.ok(listed.has(rel), 'sw.js does not precache ' + rel);
  });
  const pilotEntries = [...listed].filter((rel) => /[?&]v=/.test(rel));
  pilotEntries.forEach((rel) => assert.equal(versionOf(rel), v, rel + ' in sw.js has a different ?v= than pilot/index.html'));
});

test('the service-worker cache moved past v33, which mixed MM-600 and MM-601 pilot files', () => {
  const m = sw.match(/const CACHE = 'melodymath-offline-v(\d+)'/);
  assert.ok(m, 'CACHE constant not found');
  assert.ok(Number(m[1]) > 33, 'CACHE is still v' + m[1]);
});

test('app.js reaches js/music.js only through the fail-safe music() helper', () => {
  const app = fs.readFileSync(path.join(root, 'pilot', 'js', 'app.js'), 'utf8');
  assert.equal([...app.matchAll(/G\.MMPilotMusic/g)].length, 1, 'MMPilotMusic is read once, inside music()');
  assert.doesNotMatch(app, /MMPilotMusic\.[a-zA-Z]/, 'no direct MMPilotMusic.fn() call');
  assert.match(app, /const M = music\(\);/);
  assert.match(app, /console\.warn/);
});
