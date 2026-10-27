'use strict';
// The practice quiz (nextExercise / renderExercise) varies a topic sum.
// The reinforcement plan (rpRender) is a separate call.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const variety = require('../src/lib/exercises/variety.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sliceFn(name) {
  const start = html.indexOf('function ' + name);
  assert.ok(start > 0, name + ' is in index.html');
  const end = html.indexOf('\nfunction ', start + 1);
  assert.ok(end > start, name + ' has an end');
  return html.slice(start, end);
}

test('regular topic practice uses practiceTopicExercise, not only rpRender', () => {
  const next = sliceFn('nextExercise');
  const render = sliceFn('renderExercise');
  const plan = sliceFn('rpRender');
  const start = sliceFn('startTopicPractice');
  assert.match(next, /practiceTopicExercise\(/);
  assert.equal(next.includes('rpRender'), false);
  assert.match(render, /current=nextExercise\(\)/);
  assert.match(plan, /varyTopicExercise\(rmPlanTopic/);
  assert.match(start, /practiceTopic=id/);
  assert.match(start, /topicPracticeItems=items/);
  assert.match(start, /renderExercise\(\)/);
  assert.match(start, /rpRender\(\)/);
});

function regularNext(topicId) {
  const sandbox = {
    practiceTopic: topicId,
    topicPracticeItems: [{ id: 'bank', prompt: 'old', answer: 0, level: 1 }],
    exercises: [{ id: 1, level: 1, prompt: 'music', answer: 3, musicConcept: 'קצב', mathTopic: 'שברים' }],
    history: [],
    current: null,
    chosenLevel: 1,
    seed: 1,
    eligibleExercises: (items) => items,
    rng: () => () => 0,
    MM_VARIETY: variety,
  };
  vm.createContext(sandbox);
  vm.runInContext(
    sliceFn('varyTopicExercise') + '\n' + sliceFn('practiceTopicExercise') + '\n' + sliceFn('nextExercise') + '\nthis.next = nextExercise;',
    sandbox
  );
  return sandbox;
}

const PLACE = [
  ['mm-cur-1', 10, 100],
  ['mm-cur-22', 100, 10000],
  ['mm-cur-31', 100, 1000000],
  ['mm-cur-38', 1000, 10000000],
];

for (const [id, min, max] of PLACE) {
  test('regular practice path keeps ' + id + ' inside ' + min + ' to ' + max, () => {
    const box = regularNext(id);
    assert.deepEqual(variety.getTopicRange(id), { min: min, max: max });
    const seen = [];
    for (let round = 0; round < 100; round++) {
      const ex = box.next();
      assert.equal(typeof ex.answer, 'number', id + ' round ' + round);
      assert.ok(ex.answer >= min && ex.answer <= max, id + ' answer ' + ex.answer);
      assert.equal(ex.topicId, id);
      assert.notEqual(ex.prompt, 'old');
      const combo = ex.numberKey + '|' + ex.instrument + '|' + ex.bpm;
      assert.equal(seen.includes(combo), false, id + ' repeated ' + combo);
      seen.push(combo);
      if (seen.length > 5) seen.shift();
      box.history.push({ id: ex.id, correct: true });
    }
  });
}

test('regular practice without a topic keeps the music exercise', () => {
  const box = regularNext(null);
  box.practiceTopic = null;
  box.topicPracticeItems = null;
  const ex = box.next();
  assert.equal(ex.prompt, 'music');
  assert.equal(ex.answer, 3);
});
