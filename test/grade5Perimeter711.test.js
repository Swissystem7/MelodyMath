// #711: grade ה׳ perimeter (mm-cur-47) before the ו׳ circle (mm-cur-54),
// solved with sidesFillBar, which extends fillBar. Refs #591 #665.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const cur = require('../src/lib/curriculum');
const prog = require('../src/lib/curriculum/progression');
const g5 = require('../src/lib/curriculum/grade5');

const items = banks.itemsForGrade('ה').filter((it) => it.standard === banks.ST.PERIMETER);

test('grade ה׳ has perimeter items at levels 1, 2 and 3, tagged to a verified row', () => {
  assert.ok(items.length >= 6, items.length + ' items');
  [1, 2, 3].forEach((lv) => assert.ok(items.some((it) => it.level === lv), 'level ' + lv));
  items.forEach((it) => {
    const s = cur.sectionForItem(it);
    assert.ok(s.verified, it.id);
    assert.match(s.topic, /^משולשים, גובה/, it.id);
  });
});

test('perimeter answers are the sum of the sides', () => {
  const ask = (re) => items.find((it) => re.test(it.prompt)).answer;
  assert.equal(ask(/7 ס״מ ו־4 ס״מ/), 7 + 4 + 7 + 4);
  assert.equal(ask(/5, 6 ו־8/), 5 + 6 + 8);
  assert.equal(ask(/משושה/), 6 * 4);
  assert.equal(ask(/מקבילית/), 2 * 9 + 2 * 5);
  assert.equal(ask(/היקף מלבן 30/), 30 / 2 - 9);
  assert.equal(ask(/אותו היקף/), (2 * 10 + 2 * 6) / 4);
});

test('every perimeter item is solved with sidesFillBar, the fillBar (bar) mechanism', () => {
  assert.deepEqual(banks.primaryWays(g5.music.PERIMETER).map(([tag]) => tag), ['sidesFillBar']);
  assert.equal(banks.mechanismOf('sidesFillBar'), banks.mechanismOf('fillBar'));
  items.forEach((it) => {
    assert.equal(it.music, 'sidesFillBar', it.id);
    assert.doesNotMatch(it.musicNote, /\d/, it.id + ': the way names no numbers of an item');
  });
});

test('perimeter leads on to the circle: mm-cur-47 builds to mm-cur-54', () => {
  assert.ok(prog.linksForTopic('mm-cur-47').buildsTo.includes('mm-cur-54'));
  assert.match(prog.linksForTopic('mm-cur-47').carries, /perimeter/);
});

test('ids of the items that were already there stay put', () => {
  assert.deepEqual(banks.diagnosticItems('ה').map((it) => it.id),
    ['ה-fractions-432', 'ה-fractions-434', 'ה-decimals-445', 'ה-decimals-447', 'ה-data-632', 'ה-data-633']);
  const all = banks.itemsForGrade('ה');
  const last = Math.max(...all.filter((it) => it.standard !== banks.ST.PERIMETER).map((it) => +it.id.split('-').pop()));
  items.forEach((it) => assert.ok(+it.id.split('-').pop() > last, it.id + ' is appended last'));
});
