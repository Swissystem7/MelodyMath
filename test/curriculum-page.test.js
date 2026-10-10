const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cur = require('../src/lib/curriculum');
const bidi = require('../src/lib/mathBidi');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'curriculum.html'), 'utf8');

// Run curriculum.html's scripts the way the browser does: every <script src> in
// order, then the inline script, against a document that only has #sum and #tables.
// readyState 'loading' keeps core.js from installing the site chrome.
function runPage() {
  const els = { sum: { innerHTML: '' }, tables: { innerHTML: '' } };
  const document = {
    readyState: 'loading',
    addEventListener: function () {},
    getElementById: function (id) { return els[id] || null; },
  };
  const ctx = vm.createContext({ document: document });
  const scripts = Array.from(page.matchAll(/<script(?:\s+src="([^"]+)")?\s*>([\s\S]*?)<\/script>/g));
  assert.ok(scripts.some((m) => !m[1] && m[2].trim()), 'the page has an inline script');
  scripts.forEach(function (m) {
    if (m[1]) vm.runInContext(fs.readFileSync(path.join(root, m[1]), 'utf8'), ctx, { filename: m[1] });
    else vm.runInContext(m[2], ctx, { filename: 'curriculum.html inline script' });
  });
  return els;
}

test('curriculum.html page script runs without throwing and renders every matrix row', () => {
  let els;
  assert.doesNotThrow(() => { els = runPage(); });
  assert.equal((els.sum.innerHTML.match(/class="stat"/g) || []).length, cur.grades().length);
  assert.equal((els.tables.innerHTML.match(/<section class="grade-block">/g) || []).length, cur.grades().length);
  assert.equal((els.tables.innerHTML.match(/<tr><td>/g) || []).length, cur.coverageMatrix().length);
  assert.match(els.tables.innerHTML, /class="st-gap"/);
  assert.match(els.tables.innerHTML, /class="st-covered"/);
});

test('the page renders a block and every topic header for כיתה ה׳ and כיתה ו׳', () => {
  const html = runPage().tables.innerHTML;
  ['ה', 'ו'].forEach((g) => {
    assert.match(html, new RegExp('<h2>כיתה ' + g + '׳</h2>'), 'no block for כיתה ' + g + '׳');
    const rows = cur.coverageMatrix().filter((r) => r.grade === g);
    assert.ok(rows.length >= 5, 'כיתה ' + g + '׳ has only ' + rows.length + ' rows');
    rows.forEach((r) => {
      assert.ok(html.indexOf('<td>' + bidi.mathHtml(r.topic) + '</td>') !== -1, 'topic header missing from the page: ' + r.topic);
      assert.ok(html.indexOf('>' + r.statusHe + '</td>') !== -1, 'status missing for ' + r.topic);
    });
  });
  // No bank ships for ה׳–ו׳, so the per-grade bank line must say so out loud.
  assert.match(html, /בבנק עכשיו: אין/);
});

test('expressions in the table are isolated LTR, so none renders mirrored (#93)', () => {
  const html = runPage().tables.innerHTML;
  assert.match(page, /\.math-ltr\{[^}]*unicode-bidi:isolate/);
  assert.match(page, /src="src\/lib\/mathBidi\.js"/);
  // Every maths run the matrix holds has to come out inside an isolate: a bare
  // "8 = 4" in an RTL cell reads "4 = 8".
  cur.MATRIX.forEach((r) => {
    [r.topic, r.note].forEach((text) => {
      bidi.mathRuns(text).forEach((run) => {
        assert.ok(
          html.indexOf('<span class="math-ltr" dir="ltr">' + run + '</span>') !== -1,
          'unisolated expression "' + run + '" in: ' + text
        );
      });
    });
  });
});

test('each table sits in a scrollable, labelled region so 360px never scrolls the page', () => {
  const html = runPage().tables.innerHTML;
  const regions = html.match(/<div class="table-scroll"[^>]*>/g) || [];
  assert.equal(regions.length, cur.grades().length);
  regions.forEach((open) => {
    assert.match(open, /role="region"/);
    assert.match(open, /tabindex="0"/);
    assert.match(open, /aria-label="[^"]+"/);
  });
  assert.equal((html.match(/<\/table><\/div>/g) || []).length, cur.grades().length);
  // Sighted users get the same hint the aria-label gives a screen reader.
  assert.equal((html.match(/class="note scroll-hint"/g) || []).length, cur.grades().length);
  assert.match(page, /@media\(max-width:620px\)\{\.scroll-hint\{display:block\}\}/);
  // The box scrolls, not the document: overflow-x on the wrapper plus a table
  // min-width wider than a phone.
  assert.match(page, /\.table-scroll\{[^}]*overflow-x:auto/);
  assert.match(page, /\.table-scroll\{[^}]*max-width:100%/);
  assert.match(page, /\.cov-table\{[^}]*min-width:/);
  // The caption is screen-reader-only, so the class has to exist on this page.
  assert.match(page, /\.sr-only\{[^}]*clip:rect\(0,0,0,0\)/);
  // The one interactive target on the page clears 44px.
  assert.match(page, /\.mm-skip\{[^}]*min-height:44px/);
});
