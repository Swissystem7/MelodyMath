const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pages = [
  'index.html',
  'curriculum.html',
  'program.html',
  'check.html',
  'frequency.html',
  'offer.html',
  'landing.html',
  '807.html',
  'functions.html',
];

test('every public page has viewport, RTL Hebrew declaration and an icon link', () => {
  for (const pageName of pages) {
    const file = path.join(root, pageName);
    assert.ok(fs.existsSync(file), pageName + ' exists');
    const content = fs.readFileSync(file, 'utf8');

    assert.match(content, /<html\s+lang="he"\s+dir="rtl">/i, pageName + ' has lang="he" dir="rtl"');
    assert.match(content, /<meta\s+name="viewport"\s+content="[^"]*width=device-width[^"]*"/i, pageName + ' has mobile viewport');
    assert.match(content, /<link\s+rel="icon"\s+href="[^"]+"\s+type="image\/svg\+xml">/i, pageName + ' has SVG icon link');
  }
});

test('index.html includes mobile layout safeguards for 360px and 390px viewports', () => {
  const content = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  // .tool has min-width: 0 to prevent CSS grid item blowout
  assert.match(content, /\.tool\s*\{[^}]*min-width:0/);

  // .playgrid on mobile uses minmax(0,1fr)
  assert.match(content, /\.playgrid\s*\{[^}]*grid-template-columns:minmax\(0,1fr\)/);

  // .grade-filter-pills wraps to prevent overflowing pills row
  assert.match(content, /\.grade-filter-pills\s*\{[^}]*flex-wrap:wrap/);
  assert.match(content, /id="lessonsGradeFilter"[^>]*flex-wrap:wrap/);
});

test('offer.html and 807.html include overflow protections for narrow mobile viewports', () => {
  const offer = fs.readFileSync(path.join(root, 'offer.html'), 'utf8');
  assert.match(offer, /\.onepager\s+\.urls[^}]*overflow-wrap:anywhere/);

  const h807 = fs.readFileSync(path.join(root, '807.html'), 'utf8');
  assert.match(h807, /input\[type=text\]\{[^}]*min-width:0/);
});

test('index.html never sets an inline button height or width below the 44px touch target', () => {
  const content = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const small = content.match(/min-height:(?:[0-9]|[1-3][0-9]|4[0-3])px/g) || [];
  assert.deepEqual(small, [], 'every min-height on a tap target is at least 44px');
  const narrow = content.match(/<button[^>]*style="(?:[^"]*;)?width:(?:[0-9]|[1-3][0-9]|4[0-3])px/g) || [];
  assert.deepEqual(narrow, [], 'no button is fixed narrower than 44px');
});
