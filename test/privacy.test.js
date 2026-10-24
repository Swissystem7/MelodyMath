// Issue #494: the privacy page for minors' data says nothing leaves the
// tablet. These checks keep that sentence true as pages change.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const pages = () => fs.readdirSync(root).filter((f) => f.endsWith('.html'));

test('the privacy page exists, is Hebrew RTL, and says how to delete', () => {
  const html = read('privacy.html');
  assert.match(html, /<html lang="he" dir="rtl">/);
  assert.match(html, /localStorage/);
  assert.match(html, /אין שרת/);
  assert.match(html, /id="delete"/);
});

test('the teacher kit, the offer page and the about page link to it', () => {
  ['index.html', 'offer.html', 'landing.html'].forEach((page) => {
    assert.match(read(page), /href="privacy\.html"/, page + ' has no privacy link');
  });
});

test('no page loads a script, style or frame from another site', () => {
  pages().forEach((page) => {
    const html = read(page);
    const remote = [...html.matchAll(/<(?:script|link|iframe|img)\b[^>]*\b(?:src|href)="(https?:)?\/\/[^"]+"/g)];
    assert.deepEqual(remote.map((m) => m[0]), [], page + ' loads a remote resource');
  });
});

test('no page or module sends data out: no beacon, XHR, cookie or microphone', () => {
  const files = pages().concat(fs.readdirSync(path.join(root, 'src', 'lib'))
    .filter((f) => f.endsWith('.js')).map((f) => path.join('src', 'lib', f)));
  files.forEach((rel) => {
    const text = read(rel);
    assert.doesNotMatch(text, /sendBeacon|XMLHttpRequest|document\.cookie|getUserMedia|geolocation/, rel);
    assert.doesNotMatch(text, /\bfetch\(/, rel + ' calls fetch; only sw.js may, for its own cache');
  });
});
