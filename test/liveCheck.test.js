const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { localRefs, youtubeEmbeds, sizeVerdict } = require('../tools/live-check');

test('localRefs keeps same-origin paths and drops outside links, anchors and query strings', () => {
  const html = '<link rel="stylesheet" href="src/theme.css?v=2">'
    + '<script src="src/lib/core.js"></script>'
    + '<a href="#top">x</a><a href="https://example.com/">x</a><a href="//cdn.x/y.js">x</a>'
    + '<a href="mailto:a@b.c">x</a><img src="data:image/png;base64,AA">'
    + '<a href="offer.html#price">x</a><a href="./curriculum.html">x</a>';
  assert.deepEqual(localRefs(html, 'index.html'),
    ['curriculum.html', 'offer.html', 'src/lib/core.js', 'src/theme.css']);
});

test('localRefs resolves relative to the page folder', () => {
  assert.deepEqual(localRefs('<a href="../index.html"></a><img src="a.png">', 'docs/x.html'),
    ['docs/a.png', 'index.html']);
});

test('every local script and stylesheet index.html references exists in the repo', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const refs = localRefs(html, 'index.html');
  assert.ok(refs.includes('src/lib/grade1Music.js'));
  for (const r of refs) assert.ok(fs.existsSync(path.join(root, r)), r + ' is referenced but missing');
});

test('youtubeEmbeds finds embed iframes only', () => {
  const html = '<iframe src="https://www.youtube.com/embed/abc123"></iframe>'
    + '<iframe src="//www.youtube-nocookie.com/embed/x"></iframe>'
    + '<a href="https://www.youtube.com/watch?v=abc">x</a>';
  assert.deepEqual(youtubeEmbeds(html),
    ['https://www.youtube.com/embed/abc123', 'https://www.youtube-nocookie.com/embed/x']);
});

test('sizeVerdict tells a lagging deploy from a match', () => {
  assert.equal(sizeVerdict(100, 100), 'זהה');
  assert.match(sizeVerdict(90, 100), /מאחור \(10/);
  assert.match(sizeVerdict(110, 100), /שונה/);
  assert.equal(sizeVerdict(null, 100), 'חסר באתר');
  assert.equal(sizeVerdict(100, null), 'חסר ב־ref');
});
