const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cur = require('../src/lib/curriculum');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'curriculum.html'), 'utf8');

// [tag, src, body] for every <script> in the page, found with indexOf instead of
// a tag regexp (CodeQL js/bad-tag-filter).
function scriptTags(html) {
  const out = [];
  const lower = html.toLowerCase();
  let at = lower.indexOf('<script');
  while (at !== -1) {
    const open = lower.indexOf('>', at);
    const close = lower.indexOf('</script', open);
    if (open === -1 || close === -1) break;
    const tag = html.slice(at, open + 1);
    const src = /src="([^"]+)"/.exec(tag);
    out.push([tag, src ? src[1] : undefined, html.slice(open + 1, close)]);
    at = lower.indexOf('<script', close);
  }
  return out;
}

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
