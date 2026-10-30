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
  assert.ok(!ids.some((id) => id.startsWith('ב:')), 'every ב׳ row has a quote');
  // אגורות are in the ג׳ PDF, not the ב׳ one; the ב׳ items drill the ב׳
  // money row as a lead-in (#591), so they link to that row.
  const agorot = banks.itemsForGrade('ב').filter((it) => it.standard === banks.ST.MONEY);
  assert.ok(agorot.length > 0 && agorot.every((it) => cur.sectionForItem(it).topic.startsWith('כסף')));
  assert.ok(!ids.some((id) => id.startsWith('ג:')), 'every ג׳ row has a quote');
  // ק״ג/ליטר are not in the ג׳ PDF: those items moved to ד׳ (#591).
  const kg = banks.itemsForGrade('ג').filter((it) => it.standard === banks.ST.MASS_VOL);
  assert.equal(kg.length, 0);
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

// #665 req 1: the curriculum line belongs to program.html / curriculum.html,
// never to the child's exercise screen.
test('index.html hides the curriculum line from every exercise view', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const fn = html.match(/function setItemTag\(el,it\)\{[^\n]*\}/);
  assert.ok(fn, 'setItemTag not found');
  assert.ok(!fn[0].includes('משרד החינוך'), fn[0]);
  assert.ok(!fn[0].includes('mm-official'), fn[0]);
  assert.match(fn[0], /el\.hidden=true/);
  ['rmItemTag', 'rmPlanTag', 'classItemTag', 'beatItemTag'].forEach(function (id) {
    assert.match(html, new RegExp('<p id="' + id + '" class="item-tag" hidden>'), id);
  });
});

test('#665 req 1: exercise screen shows no curriculum line to the child', () => {
  const vm = require('node:vm');
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const setTag = html.match(/function setItemTag\(el,it\)\{[^\n]*\}/);
  assert.ok(setTag, 'setItemTag not found in index.html');
  const children = [];
  const record = function (c) { children.push(c); return c; };
  const el = { textContent: 'stale', hidden: false, innerHTML: '', appendChild: record };
  const sandbox = {
    sectionForItem: cur.sectionForItem,
    document: { createElement: function (tag) { return { tag: tag, setAttribute: function () {}, appendChild: record }; } },
  };
  vm.runInNewContext(setTag[0] + '\nthis.setItemTag = setItemTag;', sandbox);
  // Items the old code would have tagged with a Ministry section and link.
  const items = banks.allItems().filter(function (it) { return cur.sectionForItem(it); });
  assert.ok(items.length > 0, 'need at least one item with an official section');
  items.slice(0, 5).forEach(function (it) {
    sandbox.setItemTag(el, it);
    assert.equal(el.textContent, '');
    assert.equal(el.hidden, true);
    assert.equal(children.length, 0);
    assert.doesNotMatch(el.textContent + el.innerHTML, /משרד החינוך|תוכנית|תכנית|כיתה/);
  });
  assert.doesNotThrow(function () { sandbox.setItemTag(null, items[0]); });
  // The teacher/parent view keeps the curriculum.
  const program = fs.readFileSync(path.join(root, 'program.html'), 'utf8');
  assert.match(program, /תוכנית הלימודים במתמטיקה של משרד החינוך/);
  assert.match(program, /<script src="src\/lib\/curriculum\.js"><\/script>/);
});
