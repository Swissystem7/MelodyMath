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
// order, then the inline script, against a document that has the relevant containers.
// readyState 'loading' keeps core.js from installing the site chrome.
function runPage() {
  const els = {
    sum: { innerHTML: '' },
    tables: { innerHTML: '' },
    'remediation-tables': { innerHTML: '', addEventListener: function () {} },
    'research-cards': { innerHTML: '' },
  };
  const document = {
    readyState: 'loading',
    addEventListener: function () {},
    getElementById: function (id) { return els[id] || null; },
  };
  const ctx = vm.createContext({ document: document });
  const scripts = scriptTags(fs.readFileSync(path.join(root, 'curriculum.html'), 'utf8'));
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

test('curriculum.html enforces minimum 44px touch targets and high-contrast focus outline on sound buttons', () => {
  const freshPage = fs.readFileSync(path.join(root, 'curriculum.html'), 'utf8');
  assert.match(freshPage, /\.sound-btn\s*\{[^}]*min-height:\s*44px/);
  assert.match(freshPage, /\.sound-btn\s*\{[^}]*min-width:\s*44px/);
  assert.match(freshPage, /\.sound-btn:focus-visible\s*\{[^}]*outline:\s*3px\s+solid\s+var\(--ink\)/);
});

test('curriculum.html remediation cards provide accessible sound buttons with topic labels and live status', () => {
  const rem = require('../src/lib/remediation');
  const els = runPage();
  const html = els['remediation-tables'].innerHTML;
  assert.ok(html, 'remediation cards rendered');
  const count = rem.getAllFailurePoints().length;
  const btnMatches = html.match(/<button[^>]*class="sound-btn"/g) || [];
  assert.equal(btnMatches.length, count);
  assert.match(html, /aria-label="השמעת המחשה מוזיקלית:/);
  assert.match(html, /aria-describedby="status-bar44"/);
  assert.match(html, /id="status-bar44"[^>]*role="status"[^>]*aria-live="polite"/);
});

test('curriculum.html wires metroLoop action for multiplication fluency remediation', () => {
  const freshPage = fs.readFileSync(path.join(root, 'curriculum.html'), 'utf8');
  assert.match(freshPage, /action\s*===\s*'metroLoop'/);
  assert.match(freshPage, /לולאת מקצב קבועה לשינון כפולות/);
});

test('curriculum.html shows % covered per grade and an official source link on every row (#525)', () => {
  const els = runPage();
  cur.grades().forEach(function (g) {
    const p = cur.coveragePercent(g);
    assert.ok(els.sum.innerHTML.includes(p.covered + '% מכוסה'), 'grade ' + g + ' percent');
    assert.ok(els.tables.innerHTML.includes('כיתה ' + g + '׳ · ' + p.covered + '% מכוסה'));
  });
  const links = els.tables.innerHTML.match(/href="https:\/\/meyda\.education\.gov\.il\/[^"]+"/g) || [];
  assert.equal(links.length, cur.coverageMatrix().length);
  const unverified = cur.coverageMatrix().filter((r) => !r.verified).length;
  assert.equal((els.tables.innerHTML.match(/class="unverified">לא אומת</g) || []).length, unverified);
});
