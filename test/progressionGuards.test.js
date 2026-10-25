'use strict';
// A topic may not sit in an earlier grade than one of its prerequisites, or
// earlier in the same grade than a topic it depends on. A topic with no
// entry in progression.js fails. Every topic also needs a primary musical
// method (a non-optional way in the grade file, mapped through banks.ST
// and curriculum.sectionForItem).
//
// Known failures stay in the maps below and run as todo tests. Do not edit
// progression.js or the grade files to silence a failure here.
// TODO(#724): percents in grade 4 would be earlier than their grade ה
// prerequisites (mm-cur-43, mm-cur-45). On master, אחוזים is mm-cur-53 in
// grade ו, so it is not listed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const curriculum = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');
const prog = require('../src/lib/curriculum/progression');

const GRADES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
const FILES = [1, 2, 3, 4, 5, 6].map((n) => require('../src/lib/curriculum/grade' + n));
const KNOWN_EARLY = {};
const KNOWN_NO_METHOD = {};

const byId = {};
const position = {};
curriculum.MATRIX.forEach((r, i) => { byId[r.topicId] = r; position[r.topicId] = i; });

function gradeOf(id) {
  return GRADES.indexOf(byId[id].grade);
}

function methodsByTopic() {
  const out = {};
  curriculum.MATRIX.forEach((r) => { out[r.topicId] = []; });
  FILES.forEach((f) => {
    Object.keys(f.music || {}).forEach((key) => {
      const standard = banks.ST[key];
      const section = curriculum.sectionForItem({ grade: f.grade, standard: standard });
      const topic = section && section.topic
        ? curriculum.MATRIX.find((r) => r.grade === f.grade && r.topic === section.topic)
        : null;
      if (!topic) return;
      banks.primaryWays(f.music[key]).forEach((w) => {
        if (w[0] && banks.mechanismOf(w[0])) out[topic.topicId].push(w[0]);
      });
    });
  });
  return out;
}

function earlierThanPrereq() {
  const found = [];
  curriculum.MATRIX.forEach((row) => {
    const links = prog.linksForTopic(row.topicId);
    if (!links) {
      found.push(row.topicId + ' is missing from progression.js');
    } else {
      links.prereq.forEach((p) => {
        if (gradeOf(row.topicId) < gradeOf(p)) {
          found.push(row.topicId + ' (' + row.grade + ') before ' + p + ' (' + byId[p].grade + ')');
        }
      });
    }
  });
  return found;
}

function sameGradeBeforeDependency() {
  const found = [];
  curriculum.MATRIX.forEach((row) => {
    const links = prog.linksForTopic(row.topicId);
    if (!links) {
      found.push(row.topicId + ' is missing from progression.js');
    } else {
      links.prereq.forEach((p) => {
        if (byId[p] && byId[p].grade === row.grade && position[row.topicId] < position[p]) {
          found.push(row.topicId + ' appears before prerequisite ' + p + ' in grade ' + row.grade);
        }
      });
    }
  });
  return found;
}

function missingMethod() {
  const methods = methodsByTopic();
  return curriculum.MATRIX.filter((r) => methods[r.topicId].length === 0).map((r) => r.topicId + ' ' + r.grade + ' ' + r.topic);
}

test('no topic is in an earlier grade than one of its prerequisites', () => {
  const early = earlierThanPrereq();
  const unknown = early.filter((line) => !Object.keys(KNOWN_EARLY).some((id) => line.startsWith(id + ' ')));
  assert.deepEqual(unknown, []);
  Object.keys(KNOWN_EARLY).forEach((id) => {
    assert.ok(early.some((line) => line.startsWith(id + ' ')), id + ' is no longer an early-grade violation');
  });
});

test('within one grade, a topic does not appear before a topic it depends on', () => {
  assert.deepEqual(sameGradeBeforeDependency(), []);
});

test('a topic missing from progression.js fails', () => {
  const missing = curriculum.MATRIX
    .filter((row) => !prog.linksForTopic(row.topicId))
    .map((row) => row.topicId);
  assert.deepEqual(missing, []);
});

test('every topic has a primary musical method', () => {
  const missing = missingMethod();
  const unknown = missing.filter((line) => !Object.keys(KNOWN_NO_METHOD).some((id) => line.startsWith(id + ' ')));
  assert.deepEqual(unknown, []);
  Object.keys(KNOWN_NO_METHOD).forEach((id) => {
    assert.ok(missing.some((line) => line.startsWith(id + ' ')), id + ' now has a musical method');
  });
});

const source = fs.readFileSync(path.join(__dirname, 'progressionGuards.test.js'), 'utf8');
Object.entries(Object.assign({}, KNOWN_EARLY, KNOWN_NO_METHOD)).forEach(([id, issue]) => {
  // Fails while the case is still true, and is marked todo so the suite stays
  // green. Remove the id from the map once the data is fixed.
  test('TODO #' + issue + ': ' + id + ' violates the progression rule', { todo: true }, () => {
    assert.match(source, new RegExp('TODO\\(#' + issue + '\\)'));
    const early = earlierThanPrereq().some((line) => line.startsWith(id + ' '));
    const missing = missingMethod().some((line) => line.startsWith(id + ' '));
    assert.equal(early || missing, false, id);
  });
});
