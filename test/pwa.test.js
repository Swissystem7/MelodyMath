const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../src/lib/core');

const root = path.join(__dirname, '..');

function linkHref(html, rel) {
  const tags = html.match(/<link\b[^>]*>/gi);
  const tag = tags.find((item) => item.includes('rel="' + rel + '"'));
  return tag.match(/\bhref="([^"]*)"/)[1];
}

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
    // MM-602: pilot entries carry a cache-busting ?v= (the file on disk has no query).
    assert.ok(fs.existsSync(path.join(root, rel.split('?')[0])), rel);
  });
});

test('shared chrome registers the service worker', () => {
  const core = fs.readFileSync(path.join(root, 'src/lib/core.js'), 'utf8');
  assert.match(core, /serviceWorker/);
  assert.match(core, /sw\.js/);
  assert.match(core, /manifest/);
  assert.match(core, /scope: rootHref \|\| '\.\/'/);
  assert.match(core, /updateViaCache: 'none'/);
  assert.match(core, /apple-mobile-web-app-capable/);
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

test('every script a page loads is precached, so the page still works offline', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const listed = new Set([...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]));
  for (const page of ['index.html', 'curriculum.html', 'offer.html', 'landing.html', 'functions.html', '807.html']) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    for (const m of html.matchAll(/<script src="([^"]+)"/g)) {
      assert.ok(listed.has(m[1]), page + ' loads ' + m[1] + ' but sw.js does not precache it');
    }
  }
});

test('the cache name is not v7, which master (PR #34) ships with a different file set', () => {
  // main never served v7. Master's #34 bumps to v7 with its own curriculum.html and without
  // contact.js; one name for two different asset sets would pin whichever copy a tablet saw first.
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const m = sw.match(/const CACHE = 'melodymath-offline-v(\d+)'/);
  assert.ok(m, 'CACHE constant not found');
  assert.ok(Number(m[1]) >= 8, 'CACHE is v' + m[1]);
});

test('README says where the one contact value lives and that the lab tab is out', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /src\/lib\/contact\.js/);
  assert.match(readme, /CONTACT\.email/);
  assert.match(readme, /שעון/);
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

test('the MM-600 pilot demo is precached with every file it loads, and the home page links to it', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const listed = new Set([...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]));
  assert.ok(listed.has('pilot/index.html'), 'sw.js does not precache pilot/index.html');
  const html = fs.readFileSync(path.join(root, 'pilot', 'index.html'), 'utf8');
  const refs = [...html.matchAll(/<script src="([^"]+)"/g), ...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(refs.length >= 5, 'expected the pilot scripts and stylesheet');
  refs.forEach((ref) => {
    // MM-602: refs are versioned (file?v=...); sw.js precaches that exact URL.
    const rel = path.posix.normalize('pilot/' + ref);
    assert.ok(fs.existsSync(path.join(root, rel.split('?')[0])), ref + ' is missing on disk');
    assert.ok(listed.has(rel), 'pilot/index.html loads ' + rel + ' which sw.js does not precache');
  });
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(index, /<a href="pilot\/index\.html"[^>]*>הדגמת פיילוט למורים<\/a>/);
});

function pngSize(file) {
  const buf = fs.readFileSync(file);
  assert.equal(buf.toString('ascii', 12, 16), 'IHDR');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

test('the manifest id and scope stay relative so GitHub Pages and a local server share one file', () => {
  const m = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.id, './');
  assert.equal(m.scope, './');
  assert.equal(m.lang, 'he');
  assert.equal(m.dir, 'rtl');
  assert.equal(m.theme_color, '#6946e8');
  const maskable = m.icons.filter((icon) => icon.purpose === 'maskable');
  assert.deepEqual(maskable.map((icon) => icon.sizes).sort(), ['192x192', '512x512']);
  maskable.forEach((icon) => {
    const size = Number(icon.sizes.split('x')[0]);
    const got = pngSize(path.join(root, icon.src));
    assert.equal(got.width, size);
    assert.equal(got.height, size);
  });
});

test('every entry page links the manifest, icon and iOS install tags without dropping Hebrew RTL', () => {
  const pages = {
    'index.html': '',
    'landing.html': '',
    'curriculum.html': '',
    'functions.html': '',
    'offer.html': '',
    'exercise.html': '',
    'frequency.html': '',
    'privacy.html': '',
    'program.html': '',
    'check.html': '',
    'demo.html': '',
    '807.html': '',
    'pilot/index.html': '../',
    'tools/record-voice.html': '../',
  };
  for (const [page, prefix] of Object.entries(pages)) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(html, /<html\s+lang="he"\s+dir="rtl"/i, page);
    // Read the href out of the tag. Putting the prefix into a RegExp after
    // escaping only "." leaves a backslash able to change the pattern.
    assert.equal(linkHref(html, 'manifest'), prefix + 'manifest.webmanifest', page);
    assert.equal(linkHref(html, 'apple-touch-icon'), prefix + 'icons/icon-192.png', page);
    assert.match(html, /name="theme-color"\s+content="#6946e8"/, page);
    assert.match(html, /name="apple-mobile-web-app-capable"\s+content="yes"/, page);
    assert.match(html, /name="apple-mobile-web-app-title"\s+content="MelodyMath"/, page);
    const refsCore = html.includes('src/lib/core.js');
    if (!refsCore) {
      const inline = html.includes('serviceWorker.register');
      const viaScript = [...html.matchAll(/<script src="([^"]+)"/g)].some((match) => {
        const src = match[1].split('?')[0];
        const file = path.join(root, path.dirname(page), src);
        return fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes('serviceWorker.register');
      });
      assert.ok(inline || viaScript, page + ' does not register the service worker');
    }
  }
});

test('installation survives one missing precache file, and offline navigations fall back to the home page', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const version = sw.match(/const CACHE = 'melodymath-offline-v(\d+)'/);
  assert.ok(version, 'CACHE constant not found');
  // v52 and earlier called cache.addAll on the whole list, so one 404 rejected install.
  assert.ok(Number(version[1]) >= 53, 'CACHE is v' + version[1]);
  assert.match(sw, /function addBestEffort/);
  assert.match(sw, /cache\.addAll\(SHELL\)/);
  assert.match(sw, /addBestEffort\(cache, ASSETS\)/);
  assert.match(sw, /event\.request\.mode === 'navigate'/);
  assert.match(sw, /caches\.match\('\.\/index\.html'\)/);
});

function installDom() {
  const nodes = [];
  function make(tag) {
    const node = {
      tagName: String(tag).toLowerCase(),
      rel: '',
      href: '',
      name: '',
      content: '',
      id: '',
      className: '',
      textContent: '',
      attributes: {},
      children: [],
      parentNode: null,
      setAttribute(key, value) { this.attributes[key] = String(value); },
      appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
      },
      insertBefore(child, ref) {
        child.parentNode = this;
        const at = this.children.indexOf(ref);
        if (at === -1) this.children.push(child);
        else this.children.splice(at, 0, child);
        return child;
      },
    };
    nodes.push(node);
    return node;
  }
  const doc = {
    currentScript: { src: 'https://swissystem7.github.io/MelodyMath/src/lib/core.js' },
    head: make('head'),
    body: make('body'),
    readyState: 'complete',
    createElement: make,
    querySelector(selector) {
      return nodes.find((node) => {
        if (selector === 'link[data-mm-print]') return node.attributes['data-mm-print'] != null;
        if (selector === '.mm-skip') return node.className === 'mm-skip';
        const rel = /^link\[rel="([^"]+)"\]$/.exec(selector);
        if (rel) return node.tagName === 'link' && node.rel === rel[1];
        const meta = /^meta\[name="([^"]+)"\]$/.exec(selector);
        return node.tagName === 'meta' && node.name === meta[1];
      }) || null;
    },
    getElementById(id) {
      return nodes.find((node) => node.id === id) || null;
    },
  };
  doc.body.firstChild = null;
  return doc;
}

function metasNamed(doc, name) {
  return doc.head.children.filter((node) => node.tagName === 'meta' && node.name === name);
}

function withInstallGlobals(doc, navigatorValue, run) {
  const prevNav = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const prevDoc = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const prevLoc = Object.getOwnPropertyDescriptor(globalThis, 'location');
  function put(key, value) {
    Object.defineProperty(globalThis, key, { value: value, configurable: true, writable: true, enumerable: true });
  }
  function restore(key, desc) {
    if (desc) Object.defineProperty(globalThis, key, desc);
    else delete globalThis[key];
  }
  put('navigator', navigatorValue);
  put('document', doc);
  put('location', { pathname: '/MelodyMath/index.html' });
  return Promise.resolve()
    .then(run)
    .finally(() => {
      restore('navigator', prevNav);
      restore('document', prevDoc);
      restore('location', prevLoc);
    });
}

test('installSharedChrome fills missing install tags and registers the worker at the site root', async () => {
  const doc = installDom();
  const existing = doc.createElement('meta');
  existing.name = 'theme-color';
  existing.content = '#112233';
  doc.head.appendChild(existing);
  const status = doc.createElement('p');
  status.id = 'pwaStatus';
  doc.body.appendChild(status);
  const calls = [];
  const navigatorValue = {
    serviceWorker: {
      register(url, options) {
        const done = Promise.resolve();
        calls.push({ url: url, options: options, done: done });
        return done;
      },
    },
  };
  await withInstallGlobals(doc, navigatorValue, async () => {
    core.installSharedChrome();
    doc.currentScript = { src: '' };
    core.installSharedChrome();
    await calls[0].done;
    await calls[1].done;
    await new Promise((resolve) => setImmediate(resolve));
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://swissystem7.github.io/MelodyMath/sw.js');
  assert.deepEqual(calls[0].options, {
    scope: 'https://swissystem7.github.io/MelodyMath/',
    updateViaCache: 'none',
  });
  assert.equal(calls[1].url, 'sw.js');
  assert.deepEqual(calls[1].options, { scope: './', updateViaCache: 'none' });
  assert.equal(metasNamed(doc, 'theme-color').length, 1);
  assert.equal(metasNamed(doc, 'theme-color')[0].content, '#112233');
  assert.equal(metasNamed(doc, 'mobile-web-app-capable')[0].content, 'yes');
  assert.equal(metasNamed(doc, 'apple-mobile-web-app-capable')[0].content, 'yes');
  assert.equal(metasNamed(doc, 'apple-mobile-web-app-title')[0].content, 'MelodyMath');
  assert.equal(metasNamed(doc, 'apple-mobile-web-app-status-bar-style')[0].content, 'default');
  assert.equal(status.textContent, 'נשמר בטאבלט · עובד גם בלי רשת אחרי הביקור הראשון');
  const manifest = doc.head.children.find((node) => node.rel === 'manifest');
  assert.equal(manifest.href, 'https://swissystem7.github.io/MelodyMath/manifest.webmanifest');
});

test('installSharedChrome leaves the page usable when the worker registration fails', async () => {
  const doc = installDom();
  const status = doc.createElement('p');
  status.id = 'pwaStatus';
  doc.body.appendChild(status);
  const navigatorValue = {
    serviceWorker: {
      register() {
        return Promise.reject(new Error('offline'));
      },
    },
  };
  await withInstallGlobals(doc, navigatorValue, async () => {
    core.installSharedChrome();
    await new Promise((resolve) => setImmediate(resolve));
  });
  assert.equal(status.textContent, 'שמירה ללא-רשת דורשת פתיחה מ־https (לא מקובץ מקומי)');
});
