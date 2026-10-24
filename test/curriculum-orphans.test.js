// Every bank item belongs to one of the MATRIX topics of its own grade (#591).
// An orphan is an item whose standard has no topic in STANDARD_TOPIC for its
// grade, so sectionForItem tags it 'לא אומת' and it never shows on a topic.
const test = require('node:test');
const assert = require('node:assert');
const banks = require('../src/lib/banks');
const curriculum = require('../src/lib/curriculum');

test('no bank item is an orphan: each maps to a verified MATRIX topic of its grade', () => {
  const orphans = banks.allItems().filter((it) => {
    const s = curriculum.sectionForItem(it);
    return !(s && s.verified && s.topic && s.grade === it.grade);
  });
  assert.deepEqual(orphans.map((it) => it.id + ' | ' + it.standard), []);
});

test('every topic an item maps to is a row of the item grade', () => {
  banks.allItems().forEach((it) => {
    const s = curriculum.sectionForItem(it);
    const row = curriculum.rowsForGrade(it.grade).find((r) => r.topic === s.topic);
    assert.ok(row, it.id + ' maps to ' + s.topic);
  });
});

test('ק״ג and ליטר items are not in grade ג׳ (not in its programme) but in ד׳', () => {
  const kgL = /ק״ג|ליטר/;
  assert.deepEqual(banks.itemsForGrade('ג').filter((it) => kgL.test(it.prompt)).map((it) => it.id), []);
  const moved = banks.itemsForGrade('ד').filter((it) => kgL.test(it.prompt));
  assert.ok(moved.length >= 6);
  moved.forEach((it) => assert.strictEqual(curriculum.sectionForItem(it).topic, 'יחידות אורך; זמן בלוח עברי/לועזי'));
});
