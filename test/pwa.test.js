const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('the manifest is Hebrew RTL standalone and points at real icons', () => {
  const m = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.lang, 'he');
  assert.equal(m.dir, 'rtl');
  assert.equal(m.display, 'standalone');
  assert.equal(m.start_url, './index.html');
  assert.ok(Array.isArray(m.icons) && m.icons.length >= 2);
  m.icons.forEach((icon) => {
    assert.ok(fs.existsSync(path.join(root, icon.src)), icon.src);
  });
  assert.doesNotMatch(JSON.stringify(m), /יעילות|טיפול|משפר/);
});

test('the service worker precaches files that exist on disk', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const listed = [...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]).filter(Boolean);
  assert.ok(listed.includes('index.html'));
  assert.ok(listed.includes('src/lib/banks.js'));
  assert.ok(listed.includes('src/lib/tabs.js'));
  listed.forEach((rel) => {
    if (rel === '' || rel === './') return;
    assert.ok(fs.existsSync(path.join(root, rel)), rel);
  });
});

test('shared chrome registers the service worker', () => {
  const core = fs.readFileSync(path.join(root, 'src/lib/core.js'), 'utf8');
  assert.match(core, /serviceWorker/);
  assert.match(core, /sw\.js/);
  assert.match(core, /manifest/);
});
