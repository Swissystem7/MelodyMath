// MM-720 — PWA polish: manifest id, maskable icons, theme matching the page.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const m = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('manifest has an id and 192/512 maskable PNG icons that exist and are precached', () => {
  assert.equal(m.id, './index.html');
  const mask = m.icons.filter((i) => /maskable/.test(i.purpose || ''));
  assert.deepEqual(mask.map((i) => i.sizes).sort(), ['192x192', '512x512']);
  mask.forEach((i) => {
    assert.ok(fs.existsSync(path.join(root, i.src)), i.src);
    assert.ok(sw.includes("'./" + i.src + "'"), i.src + ' is not precached');
  });
});

test('index.html declares the manifest, theme-color and apple-touch-icon statically', () => {
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /<link rel="apple-touch-icon" href="icons\/icon-192\.png">/);
  const meta = html.match(/<meta name="theme-color" content="([^"]+)">/);
  assert.ok(meta, 'no static theme-color');
  assert.equal(m.theme_color.toLowerCase(), meta[1].toLowerCase());
  assert.notEqual(m.theme_color.toLowerCase(), '#6946e8');
});

test('manifest colours are the page tokens (--confidence, --bg)', () => {
  assert.match(html, new RegExp('--confidence:' + m.theme_color));
  assert.match(html, new RegExp('--bg:' + m.background_color));
});
