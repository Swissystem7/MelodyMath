// #525: every curriculum row and exercise tag points at an official Ministry
// of Education page, and a mapping without a verified quote says 'לא אומת'.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cur = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');

const OFFICIAL = /^https:\/\/(pop|meyda)\.education\.gov\.il\//;

test('the official page and every row source are Ministry of Education URLs', () => {
  assert.match(cur.OFFICIAL_PAGE, /^https:\/\/pop\.education\.gov\.il\//);
  cur.coverageMatrix().forEach(function (r) {
    assert.match(r.sourceUrl, OFFICIAL, r.topic);
    assert.ok(r.sourceUrl.endsWith('Newprogramgrade' + (cur.grades().indexOf(r.grade) + 1) + '.pdf'), r.topic);
  });
});

test('a row is verified only when it carries a quote from the official PDF', () => {
  cur.coverageMatrix().forEach(function (r) {
    assert.equal(r.verified, typeof r.quote === 'string' && r.quote.length > 0, r.topic);
  });
  // Not found in the grade's PDF on 21.10.2026 — must stay unverified.
  const ids = cur.coverageMatrix().filter((r) => !r.verified).map((r) => r.grade + ':' + r.topic);
  assert.ok(ids.includes('ב:כסף — ₪ ואגורות, קנייה ועודף'));
  assert.ok(ids.some((id) => id.startsWith('ג:יחידות משקל ונפח')));
});

test('every bank item gets an official tag; unmapped or unverified says לא אומת', () => {
  banks.allItems().forEach(function (it) {
    const s = cur.sectionForItem(it);
    assert.ok(s, it.prompt);
    assert.match(s.url, OFFICIAL);
    if (s.verified) assert.equal(s.label, s.topic);
    else assert.equal(s.label, cur.UNVERIFIED_HE);
  });
  assert.equal(cur.sectionForItem(null), null);
});

test('a mapped standard resolves to a row of the same grade', () => {
  const seen = new Set();
  banks.allItems().forEach(function (it) {
    const s = cur.sectionForItem(it);
    if (s.topic) seen.add(it.grade + '|' + s.topic);
  });
  seen.forEach(function (k) {
    const [g, topic] = k.split('|');
    assert.ok(cur.rowsForGrade(g).some((r) => r.topic === topic), k);
  });
  assert.ok(seen.size >= 40, 'most rows are reachable from an exercise');
});

test('coveragePercent adds up and matches the row counts', () => {
  cur.grades().forEach(function (g) {
    const p = cur.coveragePercent(g);
    const s = cur.summaryForGrade(g);
    assert.equal(p.total, s.total);
    assert.equal(p.covered, Math.round(100 * s.covered / s.total));
    assert.ok(Math.abs(p.covered + p.partial + p.gap - 100) <= 2, g);
    assert.ok(p.verified <= p.total);
  });
});

test('index.html shows the official tag on every exercise view, display only', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  ['rmItemTag', 'rmPlanTag', 'classItemTag', 'beatItemTag'].forEach(function (id) {
    assert.ok(html.includes("setItemTag($('" + id + "')"), id);
  });
  assert.match(html, /function setItemTag\(el,it\)/);
  assert.match(html, /לפי תוכנית משרד החינוך: /);
  assert.match(html, /rel='noopener'/);
});
