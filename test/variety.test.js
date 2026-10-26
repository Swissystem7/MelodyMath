'use strict';
// #741 engine (Refs #665), carried here so #757 can build on it: per-topic
// variety with dynamic numbers, instruments and rhythm in the practice tab.
const test = require('node:test');
const assert = require('node:assert/strict');
const variety = require('../src/lib/exercises/variety.js');
const instruments = require('../src/lib/instruments.js');
test('10 rounds of a topic never repeat the same exercise twice in a row', () => {
  ['multiplication', 'division', 'addition', 'subtraction', 'fractions'].forEach((topic) => {
    const s = variety.createVarietySession(topic); let prev = null;
    for (let r = 0; r < 10; r++) { const cur = s.next(); if (prev) { assert.notEqual(cur.prompt, prev.prompt, topic); assert.notEqual(cur.numberKey, prev.numberKey, topic); } prev = cur; }
  });
});
test('same exercise type across rounds; numbers do not repeat within 5', () => {
  const specs = [['multiplication', 'multiplication'], ['division', 'division'], ['counting', 'addition'], ['nextPrev', 'subtraction'], ['fractions', 'fractions']];
  specs.forEach(([topic, type]) => { const s = variety.createVarietySession(topic); for (let r = 0; r < 10; r++) assert.equal(s.next().exerciseType, type, topic); });
  const s = variety.createVarietySession('multiplication'); const win = [];
  for (let r = 0; r < 12; r++) { const ex = s.next(); assert.ok(!win.includes(ex.numberKey), ex.numberKey); win.push(ex.numberKey); if (win.length > 5) win.shift(); }
});
test('instrument comes from instruments.forTopic and varies; tempo 80-130 varies', () => {
  const expected = instruments.forTopic('multiplication').map((x) => x.id);
  assert.ok(expected.length >= 2);
  const s = variety.createVarietySession('multiplication'); const picked = new Set(); const tempos = new Set();
  for (let r = 0; r < 10; r++) { const ex = s.next(); assert.ok(expected.includes(ex.instrument), ex.instrument); picked.add(ex.instrument); assert.ok(ex.bpm >= 80 && ex.bpm <= 130, ex.bpm); tempos.add(ex.bpm); }
  assert.ok(picked.size >= 2); assert.ok(tempos.size >= 3);
});
test('rhythm varies only within one musical method, meter stays 4/4 (Refs #665)', () => {
  const s = variety.createVarietySession('counting'); const methods = new Set(); const subs = new Set();
  for (let r = 0; r < 10; r++) { const ex = s.next(); assert.equal(ex.rhythmPattern.meter, '4/4'); methods.add(ex.rhythmPattern.method); subs.add(ex.rhythmPattern.subdivision); }
  assert.equal(methods.size, 1); assert.ok(subs.size >= 3);
});
test('grades and per-topic ranges: grade-1 topics capped, mm-cur-14 to 100', () => {
  [['mm-cur-0', 'א'], ['mm-cur-12', 'א'], ['mm-cur-13', 'ב'], ['mm-cur-22', 'ג'], ['mm-cur-31', 'ד'], ['mm-cur-38', 'ה'], ['mm-cur-50', 'ו']].forEach(([id, g]) => assert.equal(variety.resolveGrade(id), g, id));
  assert.equal(variety.getTopicRange('mm-cur-3').max, 20);
  assert.equal(variety.getTopicRange('mm-cur-4').max, 100);
  assert.equal(variety.getTopicRange('mm-cur-13').max, 1000);
  const s3 = variety.createVarietySession('mm-cur-3');
  for (let r = 0; r < 10; r++) assert.ok(s3.next().answer <= 20);
  const s14 = variety.createVarietySession('mm-cur-14'); let over = false;
  for (let r = 0; r < 10; r++) { const ex = s14.next(); assert.ok(ex.answer <= 100); if (ex.answer > 20) over = true; }
  assert.ok(over);
});
test('whole tens stay whole tens; grade-1 bounds hold for every type', () => {
  const tens = variety.createVarietySession('mm-cur-4');
  for (let r = 0; r < 10; r++) { const ex = tens.next(); const p = ex.numberKey.split('+').map(Number); assert.ok(p[0] % 10 === 0 && p[1] % 10 === 0); assert.ok(ex.answer <= 100 && ex.answer % 10 === 0); }
  ['addition', 'subtraction', 'multiplication', 'division', 'fractions', 'counting'].forEach((type) => {
    const s = variety.createVarietySession(type, { grade: 'א' });
    for (let r = 0; r < 15; r++) { const ex = s.next(); if (type === 'fractions') assert.ok(Number(ex.answer.split('/')[1]) <= 4); else assert.ok(Math.abs(Number(ex.answer)) <= 20, type + ' ' + ex.answer); }
  });
});
