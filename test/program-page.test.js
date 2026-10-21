const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cur = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');
const core = require('../src/lib/core');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const OFFICIAL = /^https:\/\/(pop|meyda)\.education\.gov\.il\//;

test('the official order lists every verified א׳–ד׳ row once, by page, and only rows with a quote', () => {
  assert.deepEqual(cur.programGrades(), cur.grades().filter((g) => cur.OFFICIAL_ORDER[g]));
  assert.ok(['א', 'ב', 'ג', 'ד', 'ו'].every((g) => cur.programGrades().includes(g)));
  for (const g of cur.programGrades()) {
    const order = cur.OFFICIAL_ORDER[g];
    const verified = cur.rowsForGrade(g).filter((r) => r.verified).map((r) => r.topic);
    assert.deepEqual(order.map((o) => o[0]).slice().sort(), verified.slice().sort(), g);
    order.forEach((o, i) => {
      assert.ok(Number.isInteger(o[1]) && o[1] > 0, o[0]);
      if (i) assert.ok(o[1] >= order[i - 1][1], g + ' pages go forward: ' + o[0]);
    });
  }
});

test('programForGrade keeps every row, puts unverified rows last and links only official pages', () => {
  for (const g of cur.programGrades()) {
    const p = cur.programForGrade(g, banks.itemsForGrade(g));
    assert.equal(p.rows.length, cur.rowsForGrade(g).length, g);
    assert.match(p.pdfUrl, OFFICIAL);
    const firstUnverified = p.rows.findIndex((r) => !r.verified);
    if (firstUnverified >= 0) assert.ok(p.rows.slice(firstUnverified).every((r) => !r.verified), g);
    p.rows.forEach((r) => {
      assert.match(r.sourceUrl, OFFICIAL);
      if (r.verified) assert.ok(r.sourceUrl.endsWith('.pdf#page=' + r.page), r.topic);
      else assert.equal(r.page, null);
      assert.equal(r.exerciseCount, r.skills.reduce((n, s) => n + s.count, 0));
    });
  }
  const b = cur.programForGrade('ב', banks.itemsForGrade('ב'));
  assert.equal(b.rows[b.rows.length - 1].topic, 'כסף — ₪ ואגורות, קנייה ועודף');
});

test('a practice link opens exactly the bank items tagged with that row', () => {
  let linked = 0;
  for (const g of cur.programGrades()) {
    const items = banks.itemsForGrade(g);
    cur.programForGrade(g, items).rows.forEach((r) => {
      const mine = cur.itemsForTopic(r.topicId, items);
      assert.equal(mine.length, r.exerciseCount, r.topic);
      mine.forEach((it) => assert.equal(cur.sectionForItem(it).topic, r.topic));
      linked += mine.length;
    });
  }
  assert.ok(linked > 100, 'most of the bank is reachable from the screen');
  assert.deepEqual(cur.itemsForTopic('nope', banks.allItems()), []);
});

test('program.html renders the chosen grade in order with official and in-app links', () => {
  const els = { programGrades: { innerHTML: '', querySelectorAll: () => [] }, programGrade: { innerHTML: '' } };
  const document = { readyState: 'loading', addEventListener() {}, getElementById: (id) => els[id] || null };
  const ctx = vm.createContext({ document, localStorage: { getItem: () => 'ג' } });
  const html = read('program.html');
  for (const m of html.matchAll(/<script src="([^"]+)"><\/script>/g)) vm.runInContext(read(m[1]), ctx, { filename: m[1] });
  const inline = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
  vm.runInContext(inline, ctx, { filename: 'program.html inline script' });
  const out = els.programGrade.innerHTML;
  const rows = cur.programForGrade('ג', banks.itemsForGrade('ג')).rows;
  assert.equal((out.match(/<li class="topic">/g) || []).length, rows.length);
  let at = -1;
  rows.forEach((r) => { const k = out.indexOf(r.topic); assert.ok(k > at, r.topic); at = k; });
  assert.match(out, /Newprogramgrade3\.pdf#page=\d+/);
  assert.match(out, /href="index\.html\?topic=mm-cur-\d+&amp;skill=/);
  assert.match(out, /לא אומת/);
  assert.equal((els.programGrades.innerHTML.match(/<button/g) || []).length, cur.programGrades().length);
});

test('the screen is in the app navigation and index.html opens ?topic= in the plan loop', () => {
  assert.match(core.siteNavHtml('index.html'), /href="program\.html"/);
  assert.match(core.siteNavHtml('program.html'), /href="program\.html" aria-current="page">תוכנית הלימודים/);
  const index = read('index.html');
  assert.match(index, /class="navcard" href="program\.html"/);
  assert.match(index, /function startTopicPractice\(id,skill\)/);
  assert.match(index, /q\.get\('topic'\)/);
});
