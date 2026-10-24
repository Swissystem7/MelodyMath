// #711: grade ה׳ perimeter, the step before the circle's circumference in
// grade ו׳ (mm-cur-47 → mm-cur-54). Answers are recomputed from the prompt.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const cur = require('../src/lib/curriculum');
const prog = require('../src/lib/curriculum/progression');

const mine = banks.itemsForGrade('ה').filter((it) => it.standard === banks.ST.PERIM5);
const nums = (s) => (s.match(/\d+/g) || []).map(Number);

test('grade ה׳ perimeter has items at every level, tagged to mm-cur-47', () => {
  assert.ok(mine.length >= 6);
  [1, 2, 3].forEach((lv) => assert.ok(mine.some((it) => it.level === lv), 'level ' + lv));
  mine.forEach((it) => {
    const sec = cur.sectionForItem(it);
    assert.ok(sec.verified, it.id);
    assert.equal(sec.topic, cur.topicById('mm-cur-47').topic, it.id);
  });
});

test('perimeter answers hold', () => {
  const ask = (re) => mine.find((it) => re.test(it.prompt));
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  assert.equal(ask(/7, 9 ו־12/).answer, sum([7, 9, 12]));
  assert.equal(ask(/למקבילית צלעות של 8/).answer, 2 * (8 + 5));
  assert.equal(ask(/שווה־צלעות/).answer, 3 * 6);
  assert.equal(ask(/היקף משולש 30/).answer, 30 - 8 - 13);
  assert.equal(ask(/היקף מקבילית 34/).answer, 34 / 2 - 10);
  assert.equal(ask(/שווה־שוקיים/).answer, 9 + 9 + 4);
  const height = ask(/והגובה/);
  assert.deepEqual(nums(height.prompt).slice(0, 3), [12, 5, 12]);
  assert.equal(height.answer, 2 * (12 + 5), 'the height is not a side');
  assert.equal(ask(/משושה/).answer, 42 / 6);
  assert.equal(ask(/12 צלעות/).answer, 12 * 3);
});

test('each side sounds as a length, and the way leads to the circle', () => {
  mine.forEach((it) => {
    assert.equal(banks.mechanismOf(it.music), 'M3', it.id + ' ' + it.music);
    assert.ok(it.musicNote, it.id);
  });
  assert.deepEqual([...new Set(mine.map((it) => it.music))].sort(), ['fillBar', 'polygonToCircleNotes', 'sideNotes']);
  const t = prog.linksForTopic('mm-cur-47');
  assert.ok(t.buildsTo.includes('mm-cur-54'));
  assert.ok(t.prereq.includes('mm-cur-18'), 'grade ב׳ perimeter comes first');
  assert.ok(prog.linksForTopic('mm-cur-54').prereq.includes('mm-cur-47'));
});
