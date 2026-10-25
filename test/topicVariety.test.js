'use strict';
// #757: variety on every curriculum topic (grades א׳–ו׳), not only the
// practice tab. Same type and same main way per topic; numbers, instrument,
// tempo and pattern change; never the same exercise twice in a row; numbers
// stay in the topic range of #741; the last round of a way item has no music (#665).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks');
const curriculum = require('../src/lib/curriculum');
const variety = require('../src/lib/exercises/topicVariety');

const ROUNDS = 20;
const all = banks.allItems();
const sessions = curriculum.MATRIX.map((row) => {
  const s = variety.createTopicSession(row, curriculum.itemsForTopic(row.topicId, all), { totalRounds: ROUNDS });
  const list = [];
  for (let i = 0; i < ROUNDS && s.size; i++) list.push(s.next());
  return { row, s, list };
}).filter((x) => x.s.size);

test('every grade א׳–ו׳ has curriculum topics with variety', () => {
  curriculum.grades().forEach((g) => assert.ok(sessions.some((x) => x.row.grade === g), 'grade ' + g));
});

test('20 exercises per topic: >= 3 distinct (number, instrument, tempo), none identical in a row', () => {
  sessions.forEach(({ row, list }) => {
    assert.equal(list.length, ROUNDS, row.topicId);
    const combos = new Set(list.map((v) => [v.numberKey, v.instrument, v.bpm].join('|')));
    assert.ok(combos.size >= 3, row.topicId + ' has ' + combos.size + ' combos');
    const key = (v) => JSON.stringify([v.numberKey, v.instrument, v.bpm, v.pattern]);
    for (let i = 1; i < list.length; i++) assert.notEqual(key(list[i]), key(list[i - 1]), row.topicId + ' round ' + i);
  });
});

test('numbers stay inside the topic range of #741', () => {
  sessions.forEach(({ row, s, list }) => {
    assert.deepEqual(s.range, variety.TOPIC_RANGES[row.topicId] || variety.GRADE_RANGES[row.grade], row.topicId);
    list.forEach((v) => v.numbers.forEach((n) => assert.ok(n >= 0 && n <= s.range.max, row.topicId + ' ' + n + ' > ' + s.range.max)));
    list.forEach((v) => assert.equal(v.grade, row.grade, row.topicId));
  });
});

test('type and main music way stay the same for the whole topic', () => {
  sessions.forEach(({ row, s, list }) => {
    assert.ok(s.exerciseType && s.mainWay, row.topicId);
    list.forEach((v) => {
      assert.equal(v.exerciseType, s.exerciseType, row.topicId);
      assert.equal(v.mainWay, s.mainWay, row.topicId);
      assert.equal(v.item.music, s.mainWay, row.topicId);
    });
  });
});

test('the child solves through music and the last way round is a check without music (#665)', () => {
  sessions.forEach(({ row, list }) => {
    list.slice(0, -1).forEach((v) => assert.ok(v.hasMusic && v.instrument && v.bpm, row.topicId));
    const last = list[list.length - 1];
    assert.equal(last.noMusic, Boolean(last.musicNote), row.topicId);
    assert.match(variety.badgeHtml(last), last.noMusic ? /בדיקה בלי מוזיקה/ : /BPM/);
  });
});

test('instruments are timbres of the topic, never a weak optional way', () => {
  ['multiplication', 'fractions', 'addition', 'geometry'].forEach((skill) => {
    const list = variety.instrumentsFor(skill);
    assert.ok(list.length >= 1, skill);
    list.forEach((x) => assert.ok(!x.optional, skill + ' ' + x.id));
  });
});

test('the plan loop of index.html?topic= shows the round variety', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /<script src="src\/lib\/exercises\/topicVariety\.js"><\/script>/);
  assert.match(html, /MM_TOPIC_VARIETY\.createTopicSession\(row,st\.items/);
  assert.match(html, /showTopicVariety\(st,it\)/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/exercises\/topicVariety\.js'/);
});
