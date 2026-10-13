const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cur = require('../src/lib/curriculum');
const { scriptTags } = require('./helpers/scriptTags');

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
  const scripts = scriptTags(page);
  assert.ok(scripts.some((s) => !s.src && s.body.trim()), 'the page has an inline script');
  scripts.forEach(function (s) {
    if (s.src) vm.runInContext(fs.readFileSync(path.join(root, s.src), 'utf8'), ctx, { filename: s.src });
    else vm.runInContext(s.body, ctx, { filename: 'curriculum.html inline script' });
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
