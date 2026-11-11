// MM-734 (stream B): a guided lesson «השלמה לעשר» for mm-cur-3, served via
// MMLessonRegistry from curriculum/grade1.js, and a topicId on every lesson
// (gaps G3/G5 in docs/MM-700/curriculum-gaps.md, PR #951; MM-512).
const test = require('node:test');
const assert = require('node:assert/strict');
const g1 = require('../src/lib/curriculum/grade1');
const L = require('../src/lib/interactiveLessons');
const cur = require('../src/lib/curriculum');

test('every lesson, built-in or registered, has a valid topicId of its own grade', () => {
  const all = L.getAllLessons();
  assert.ok(all.length >= 11);
  all.forEach((l) => {
    assert.ok(cur.isValidTopicId(l.topicId), l.id + ': ' + l.topicId);
    assert.equal(cur.topicById(l.topicId).grade, l.grade, l.id);
  });
});

test('«השלמה לעשר» is a grade א׳ lesson on mm-cur-3, served through the registry', () => {
  assert.ok(globalThis.MMLessonRegistry.includes(g1.lessons[0]));
  const l = L.getLessonById('g1-make-ten');
  assert.ok(l);
  assert.equal(l.grade, 'א');
  assert.equal(l.topicId, 'mm-cur-3');
  assert.ok(L.getLessonsForGrade('א').some((x) => x.id === 'g1-make-ten'));
  assert.equal(l.steps.length, 4);
  assert.match(l.steps[0].body, /תיבה/, 'the music model is the ten-beat bar');
});

test('its check asks for the make-ten split and only that choice is right', () => {
  const quiz = L.getLessonById('g1-make-ten').steps[3];
  assert.equal(L.evaluateStepAnswer('g1-make-ten', 3, 0).correct, true);
  [1, 2, 3].forEach((i) => assert.equal(L.evaluateStepAnswer('g1-make-ten', 3, i).correct, false));
  // 7 + 3 + 2 is 7 + 5 with the 5 split to fill the bar of ten.
  const [a, b, c] = quiz.options[0].split('+').map(Number);
  assert.equal(a + b, 10);
  assert.equal(b + c, 5);
  quiz.options.slice(1).forEach((o) => {
    const parts = o.split('+').map(Number);
    assert.ok(!(parts[0] === 7 && parts[0] + parts[1] === 10 && parts.slice(1).reduce((s, x) => s + x, 0) === 5), o);
  });
});

test('registering grade1.js twice does not add the lesson twice', () => {
  const n = globalThis.MMLessonRegistry.filter((l) => l.id === 'g1-make-ten').length;
  assert.equal(n, 1);
});
