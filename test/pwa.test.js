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

test('the service-worker cache moved past v6, which holds the curriculum.html that threw on load', () => {
  // sw.js is cache-first and re-caches only when its own bytes change. v6 precached the page whose
  // `const grades = grades();` threw a TDZ ReferenceError, so a browser that opened any page since
  // a677d10 keeps serving that copy until CACHE changes.
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const m = sw.match(/const CACHE = 'melodymath-offline-v(\d+)'/);
  assert.ok(m, 'CACHE constant not found');
  assert.ok(Number(m[1]) > 6, 'CACHE is still v' + m[1]);
});

test('the service-worker cache moved past v7, which pinned the files from before #65-#71', () => {
  // v7 was set in #64. The seven fixes that followed changed teacherStore.js, measure.js and
  // index.html without touching sw.js, so a tablet that had visited once never saw them: the old
  // handler answered from the cache and never asked the network again.
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const m = sw.match(/const CACHE = 'melodymath-offline-v(\d+)'/);
  assert.ok(m, 'CACHE constant not found');
  assert.ok(Number(m[1]) > 7, 'CACHE is still v' + m[1]);
});

test('every page names an icon, so no page asks for /favicon.ico and logs a 404', () => {
  // A page with no rel="icon" makes the browser guess /favicon.ico, which this
  // site does not serve: one 404 in the console on every single page load.
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const listed = new Set([...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]));
  const pages = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
  assert.ok(pages.length >= 5, 'expected the site pages at the repo root');
  pages.forEach((page) => {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    // No '<' in the pattern: this asserts an attribute pair, it is not a tag filter.
    const icon = /\srel="icon"\s+href="([^"]+)"/.exec(html);
    assert.ok(icon, page + ' has no <link rel="icon">, so it will 404 on /favicon.ico');
    assert.ok(fs.existsSync(path.join(root, icon[1])), page + ' points at a missing ' + icon[1]);
    assert.ok(listed.has(icon[1]), page + ' points at ' + icon[1] + ' which sw.js does not precache');
  });
});

test('every script a page loads is in the precache list', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const listed = new Set([...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]));
  const pages = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
  assert.ok(pages.length >= 5, 'expected the site pages at the repo root');
  pages.forEach((page) => {
    assert.ok(listed.has(page), page + ' is not precached');
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    [...html.matchAll(/ src="(src\/lib\/[^"]+)"/g)].forEach((m) => {
      assert.ok(listed.has(m[1]), page + ' loads ' + m[1] + ' which sw.js does not precache');
    });
  });
});
