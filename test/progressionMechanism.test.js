'use strict';
// #591 dosage rule 4 (owner 23.10 15:54): one consistent musical method per
// topic, carried and built on across grades, recorded in the prereq/buildsTo
// data (curriculum/progression.js, third field of PREREQ).
const test = require('node:test');
const assert = require('node:assert/strict');
const curriculum = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');
const prog = require('../src/lib/curriculum/progression');

const FILES = [1, 2, 3, 4, 5, 6].map((n) => require('../src/lib/curriculum/grade' + n));
const { primary: STRONG } = banks.MUSIC_DOSAGE;

// topicId → Set of the primary mechanisms of its music skills, from the data.
function fromData() {
  const out = {};
  FILES.forEach((f) => Object.keys(f.music).forEach((key) => {
    const s = curriculum.sectionForItem({ grade: f.grade, standard: banks.ST[key] });
    const tagged = s && s.topic ? curriculum.MATRIX.find((r) => r.grade === f.grade && r.topic === s.topic) : null;
    const links = prog.linksForSkill(f.grade, key, tagged ? tagged.topicId : null);
    if (!links || !links.topicId) return;
    const m = banks.mechanismOf(banks.primaryWays(f.music[key])[0][0]);
    (out[links.topicId] = out[links.topicId] || new Set()).add(m);
  }));
  return out;
}

test('every topic records the primary mechanisms its music skills use, all strong', () => {
  const data = fromData();
  curriculum.MATRIX.forEach((r) => {
    const rec = prog.linksForTopic(r.topicId).mechanisms;
    assert.ok(Array.isArray(rec) && rec.length, r.topicId + ' records no mechanism');
    rec.forEach((m) => assert.ok(STRONG.includes(m), r.topicId + ' ' + m));
    assert.deepEqual(rec, [...(data[r.topicId] || [])].sort(), r.topicId + ' ' + r.topic);
  });
});

test('a topic keeps the method of its prereqs or builds on it, never a new one from nowhere', () => {
  const on = prog.MECHANISM_BUILDS_ON;
  assert.deepEqual(Object.keys(on).sort(), [...STRONG].sort());
  const wrong = [];
  curriculum.MATRIX.forEach((r) => {
    const links = prog.linksForTopic(r.topicId);
    if (!links.prereq.length) return;
    const before = new Set(links.prereq.flatMap((p) => prog.linksForTopic(p).mechanisms));
    links.mechanisms.forEach((m) => {
      if (!before.has(m) && !on[m].some((b) => before.has(b))) wrong.push(r.topicId + ' ' + m + ' ← ' + [...before].join(','));
    });
  });
  assert.deepEqual(wrong, []);
});

test('the main lines stay on one method from grade to grade', () => {
  const only = (id, m) => assert.deepEqual(prog.linksForTopic(id).mechanisms, [m], id);
  // fractions ד׳ → ה׳ → ו׳: note durations in a bar
  ['mm-cur-32', 'mm-cur-33', 'mm-cur-42', 'mm-cur-41', 'mm-cur-43', 'mm-cur-44', 'mm-cur-51'].forEach((id) => only(id, 'M3'));
  // decimals and percent build on the same bar
  ['mm-cur-45', 'mm-cur-46', 'mm-cur-52', 'mm-cur-53'].forEach((id) => only(id, 'M3'));
  // multiplication and division ב׳ → ג׳ → ה׳: accented, grouped beats
  ['mm-cur-15', 'mm-cur-16', 'mm-cur-24', 'mm-cur-25', 'mm-cur-26', 'mm-cur-40'].forEach((id) => only(id, 'M2'));
  // place value and big numbers ב׳ → ו׳: accent levels of ten
  ['mm-cur-13', 'mm-cur-22', 'mm-cur-31', 'mm-cur-38', 'mm-cur-50'].forEach((id) => only(id, 'M2'));
  // patterns start on M6 and counting on M1
  only('mm-cur-6', 'M6');
  only('mm-cur-2', 'M1');
});
