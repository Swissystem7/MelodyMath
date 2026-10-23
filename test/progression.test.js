'use strict';
// #591 owner item 5: every musical-math skill records the later topic it
// prepares for, and the order is never reversed.
const test = require('node:test');
const assert = require('node:assert/strict');
const curriculum = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');
const prog = require('../src/lib/curriculum/progression');

const GRADES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
const FIRST = GRADES[0];
const LAST = GRADES[GRADES.length - 1];
const FILES = [1, 2, 3, 4, 5, 6].map((n) => require('../src/lib/curriculum/grade' + n));

const position = {};
curriculum.MATRIX.forEach((r, i) => { position[r.topicId] = i; });
const row = (id) => curriculum.MATRIX[position[id]];
const g = (id) => GRADES.indexOf(row(id).grade);

// before(a, b): a may be a prereq of b.
function before(a, b) {
  return g(a) < g(b) || (g(a) === g(b) && position[a] < position[b]);
}

test('every topic of the matrix has an entry, and no entry names an unknown topic', () => {
  const ids = curriculum.MATRIX.map((r) => r.topicId);
  assert.deepEqual(ids.filter((id) => !prog.PREREQ[id]), []);
  assert.deepEqual(Object.keys(prog.PREREQ).filter((id) => !(id in position)), []);
  Object.keys(prog.PREREQ).forEach((id) => {
    prog.PREREQ[id][0].forEach((p) => assert.ok(p in position, id + ' → ' + p));
    assert.ok(prog.PREREQ[id][1], id + ' says what carries forward');
  });
});

test('every topic outside grade א׳ has a prereq, every topic outside grade ו׳ builds to a later one', () => {
  const noPrereq = curriculum.MATRIX.filter((r) => r.grade !== FIRST && !prog.linksForTopic(r.topicId).prereq.length);
  const noNext = curriculum.MATRIX.filter((r) => r.grade !== LAST && !prog.linksForTopic(r.topicId).buildsTo.length);
  assert.deepEqual(noPrereq.map((r) => r.topicId), []);
  assert.deepEqual(noNext.map((r) => r.topicId), []);
});

test('a prereq is in an earlier grade or earlier in the same grade (never reversed, never itself)', () => {
  const reversed = [];
  Object.keys(prog.PREREQ).forEach((id) => {
    prog.PREREQ[id][0].forEach((p) => { if (!before(p, id)) reversed.push(p + ' → ' + id); });
  });
  assert.deepEqual(reversed, []);
});

test('buildsTo is exactly prereq read the other way', () => {
  Object.keys(prog.PREREQ).forEach((id) => {
    prog.linksForTopic(id).buildsTo.forEach((n) => assert.ok(prog.PREREQ[n][0].includes(id), id + ' → ' + n));
  });
  assert.equal(prog.linksForTopic('mm-cur-999'), null);
});

test('every music skill of grades א׳-ו׳ has links in the right direction', () => {
  const missing = [];
  FILES.forEach((f) => {
    Object.keys(f.music || {}).forEach((key) => {
      const s = curriculum.sectionForItem({ grade: f.grade, standard: banks.ST[key] });
      const tagged = s && s.topic ? curriculum.MATRIX.find((r) => r.grade === f.grade && r.topic === s.topic) : null;
      const links = prog.linksForSkill(f.grade, key, tagged ? tagged.topicId : null);
      const name = f.grade + ':' + key;
      if (!links) return missing.push(name);
      const here = GRADES.indexOf(f.grade);
      if (links.topicId) assert.equal(row(links.topicId).grade, f.grade, name + ' is placed in its own grade');
      if (f.grade !== FIRST && !links.prereq.length) missing.push(name + ' prereq');
      if (f.grade !== LAST && !links.buildsTo.length) missing.push(name + ' buildsTo');
      links.buildsTo.forEach((n) => assert.ok(g(n) >= here, name + ' builds back to ' + n));
      links.prereq.forEach((p) => assert.ok(g(p) <= here, name + ' needs later ' + p));
    });
  });
  assert.deepEqual(missing, []);
});

test('a skill placed by hand is not one curriculum.js already tags', () => {
  Object.keys(prog.SKILL_TOPIC).forEach((name) => {
    const [grade, key] = name.split(':');
    assert.ok(banks.ST[key], name + ' is a bank standard');
    const s = curriculum.sectionForItem({ grade: grade, standard: banks.ST[key] });
    const own = prog.SKILL_TOPIC[name];
    if (s && s.topic && typeof own === 'string') assert.equal(s.topic, row(own).topic, name + ' disagrees with curriculum.js');
  });
});

// The 14:44 sequencing gaps on #591 that are about order.
test('the sequencing gaps stay closed', () => {
  const edge = (a, b) => assert.ok(prog.PREREQ[b][0].includes(a) && before(a, b), a + ' → ' + b);
  // 5: grade ו׳ builds on the ד׳ order-of-operations and ה׳ prime-factor mechanisms.
  edge('mm-cur-31', 'mm-cur-50');
  edge('mm-cur-40', 'mm-cur-50');
  // 6: place value before two-digit addition (and RM_ORDER agrees).
  edge('mm-cur-13', 'mm-cur-14');
  assert.ok(banks.RM_ORDER.place_value < banks.RM_ORDER.addition);
  // 7: hundred chart before whole tens (א׳), fraction models before equivalence (ה׳); ids kept.
  edge('mm-cur-5', 'mm-cur-4');
  edge('mm-cur-42', 'mm-cur-41');
  assert.match(row('mm-cur-5').topic, /לוח מאה/);
  assert.match(row('mm-cur-42').topic, /ייצוג שברים במודלים/);
  // 8: ג׳ remainder as "out of 4" beats prepares the ד׳ 4/4-bar fractions.
  edge('mm-cur-25', 'mm-cur-32');
  // Same direction in the bank: a grade ו׳ natural-numbers skill sits on topic 50.
  assert.equal(prog.linksForSkill('ו', 'G6_NAT_OPS', 'mm-cur-50').prereq.includes('mm-cur-31'), true);
});
