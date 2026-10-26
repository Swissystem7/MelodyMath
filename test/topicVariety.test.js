'use strict';
// #757 (Refs #752, #741, #665): variety on every curriculum topic, not only
// the practice tab. Built on the #741 engine in exercises/variety.js: same
// exercise type and same main music way per topic; numbers, instrument and
// tempo vary per exercise; no identical consecutive items; numbers stay in
// the #741 topic ranges; the last way round is a check without music (#665).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks');
const curriculum = require('../src/lib/curriculum');
const variety = require('../src/lib/exercises/variety');
const ROUNDS = 20;
const all = banks.allItems();
const sessions = curriculum.MATRIX.map((row) => {
  const s = variety.createTopicSession(row, curriculum.itemsForTopic(row.topicId, all), { totalRounds: ROUNDS });
  const list = [];
  for (let i = 0; i < ROUNDS && s.size; i++) list.push(s.next());
  return { row, s, list };
}).filter((x) => x.s.size);
test('#741 engine: same topic never repeats an exercise twice in a row', () => {
  const session = variety.createVarietySession('multiplication');
  let prev = null;
  for (let r = 0; r < 10; r++) {
    const cur = session.next();
    if (prev) assert.notEqual(cur.numberKey, prev.numberKey);
    assert.equal(cur.exerciseType, 'multiplication');
    assert.ok(cur.bpm >= 80 && cur.bpm <= 130, 'bpm ' + cur.bpm);
    prev = cur;
  }
  assert.equal(variety.getTopicRange('mm-cur-3').max, 20);
  assert.equal(variety.resolveGrade('mm-cur-13'), 'ב');
});
test('every grade א–ו has curriculum topics with variety', () => {
  curriculum.grades().forEach((g) => assert.ok(sessions.some((x) => x.row.grade === g), 'grade ' + g));
  assert.ok(sessions.length >= 40, 'topics with a pool: ' + sessions.length);
});
test('20 per topic: >=3 distinct (number,instrument,tempo), none identical in a row', () => {
  sessions.forEach(({ row, list }) => {
    assert.equal(list.length, ROUNDS, row.topicId);
    const combos = new Set(list.map((v) => [v.numberKey, v.instrument, v.bpm].join('|')));
    assert.ok(combos.size >= 3, row.topicId + ' has ' + combos.size);
    const key = (v) => JSON.stringify([v.numberKey, v.instrument, v.bpm, v.pattern]);
    for (let i = 1; i < list.length; i++) assert.notEqual(key(list[i]), key(list[i - 1]), row.topicId + ' round ' + i);
  });
});
test('numbers stay inside the #741 topic range and the topic grade', () => {
  sessions.forEach(({ row, s, list }) => {
    assert.deepEqual(s.range, variety.TOPIC_RANGES[row.topicId] || variety.GRADE_RANGES[row.grade], row.topicId);
    list.forEach((v) => {
      assert.equal(v.grade, row.grade, row.topicId);
      v.numbers.forEach((n) => assert.ok(n >= 0 && n <= s.range.max, row.topicId + ' ' + n + ' > ' + s.range.max));
    });
  });
});
test('exercise type and main music way stay the same for the whole topic', () => {
  sessions.forEach(({ row, s, list }) => {
    assert.ok(s.exerciseType && s.mainWay, row.topicId);
    list.forEach((v) => {
      assert.equal(v.exerciseType, s.exerciseType, row.topicId);
      assert.equal(v.mainWay, s.mainWay, row.topicId);
      assert.equal(v.item.music, s.mainWay, row.topicId);
    });
  });
});
test('child solves through music; the last way round is a check without it (#665)', () => {
  sessions.forEach(({ row, list }) => {
    list.slice(0, -1).forEach((v) => assert.ok(v.hasMusic && v.instrument && v.bpm, row.topicId));
    const last = list[list.length - 1];
    assert.equal(last.noMusic, Boolean(last.musicNote), row.topicId);
    assert.match(variety.badgeHtml(last), last.noMusic ? /בדיקה בלי מוזיקה/ : /BPM/);
  });
});
test('decorate dresses a picked item and never repeats the previous item', () => {
  const row = curriculum.MATRIX.find((r) => r.topicId === 'mm-cur-14');
  const items = curriculum.itemsForTopic(row.topicId, all);
  const s = variety.createTopicSession(row, items, { totalRounds: 6 });
  assert.ok(s.size > 1);
  let prev = null;
  for (let r = 0; r < 6; r++) {
    const v = s.decorate(items[0], r);
    assert.ok(v && v.item, 'round ' + r);
    if (prev && s.size > 1) assert.notEqual(v.item.id, prev.item.id, 'round ' + r);
    prev = v;
  }
});
test('topic screen the child sees/hears is wired to the variety session', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /<script src="src\/lib\/exercises\/variety\.js"><\/script>/);
  assert.match(html, /createTopicSession\(row,st\.items/);
  assert.match(html, /showTopicVariety\(st,it\)/);
  assert.match(html, /playCountClicks\(groups,item\.bpm\|\|76\)/);
  assert.match(html, /extractNumberPlan\(item,\{bpm:item\.bpm,instrument:item\.instrument\}\)/);
  assert.match(html, /bpm:it&&it\.bpm,instrument:it&&it\.instrument/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/exercises\/variety\.js'/);
});
