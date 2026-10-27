'use strict';
// The practice quiz (nextExercise / renderExercise) varies a topic sum.
// ?topic= renders that one exercise and does not open the reinforcement plan.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const variety = require('../src/lib/exercises/variety.js');
const curriculum = require('../src/lib/curriculum.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sliceFn(name) {
  const start = html.indexOf('function ' + name);
  assert.ok(start > 0, name + ' is in index.html');
  const end = html.indexOf('\nfunction ', start + 1);
  assert.ok(end > start, name + ' has an end');
  return html.slice(start, end);
}

test('topic practice renders one exercise and leaves the reinforcement plan closed', () => {
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
  assert.equal(start.includes('rpRender('), false);
  assert.doesNotMatch(start, /show\('rmPlan',\s*true\)/);
  assert.match(start, /show\('rmPlan',\s*false\)/);

  const shown = {};
  const rendered = [];
  const sandbox = {
    Date: Date,
    topicById: () => ({ grade: 'א' }),
    isGrade: () => true,
    itemsForTopic: () => [{ id: 'bank', skill: 'counting', prompt: 'plan', answer: 1 }],
    itemsForGrade: () => [],
    saveGrade: () => {},
    rmPlanTopic: null,
    rmVarietySeed: 0,
    practiceTopic: null,
    topicPracticeItems: null,
    history: null,
    current: null,
    answered: false,
    seed: 1,
    show: (id, on) => { shown[id] = on; },
    document: { getElementById: () => null },
    renderExercise: () => { rendered.push('quiz'); },
  };
  vm.createContext(sandbox);
  vm.runInContext(start + '\nthis.ok = startTopicPractice("mm-cur-1");', sandbox);
  assert.equal(sandbox.ok, true);
  assert.deepEqual(rendered, ['quiz']);
  assert.equal(shown.rmPlan, false);
  assert.equal(shown.quiz, true);
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

test('topic practice shows the Hebrew topic name', () => {
  const render = sliceFn('renderExercise');
  assert.match(render, /topicPracticeName\(practiceTopic\)/);
  assert.equal(render.includes('נושא '), false);
  assert.equal(render.includes('mm-cur-'), false);
  const sandbox = { topicById: curriculum.topicById };
  vm.createContext(sandbox);
  vm.runInContext(sliceFn('topicPracticeName') + '\nthis.name = topicPracticeName;', sandbox);
  const he = sandbox.name('mm-cur-22');
  assert.equal(he, 'מספרים עד 10,000, מבנה עשרוני');
  assert.equal(he.includes('mm-cur-'), false);
});

test('the topic quiz no-music check is the last exercise', () => {
  const sandbox = { MM_VARIETY: variety, PLAN_PER_SKILL: 6, rmVarietySeed: 1 };
  vm.createContext(sandbox);
  vm.runInContext(sliceFn('varyTopicExercise') + '\n' + sliceFn('practiceTopicExercise') + '\nthis.one = practiceTopicExercise;', sandbox);
  const flags = [];
  for (let round = 0; round < 10; round++) flags.push(sandbox.one('mm-cur-1', { id: 'bank', prompt: 'old', answer: 0 }, round).noMusic === true);
  assert.equal(flags.indexOf(true), 9);
  assert.equal(flags[5], false);
});

test('a finished topic quiz mounts one no-music check before the summary', () => {
  const check = sliceFn('check');
  assert.match(check, /practiceTopic&&mountTopicMasteryCheck\(\)/);
  assert.match(html, /id="quizMastery"/);
  const mounted = [];
  let finished = 0;
  const sandbox = {
    practiceTopic: 'mm-cur-22',
    topicPracticeItems: [{ id: 'bank', prompt: 'כמה?', answer: 4 }],
    history: [{ id: 'a' }],
    $: (id) => sandbox.els[id],
    els: { quizMastery: { classList: { add() {} } }, answer: {}, check: {} },
    show() {},
    setNumberPlay() {},
    mountMasteryCheck(host, item, opts) { mounted.push({ topicId: opts.topicId, noMusic: item.noMusic, stage: item.musicStage }); sandbox.done = opts.onAnswer; },
    finish() { finished += 1; },
  };
  vm.createContext(sandbox);
  vm.runInContext(sliceFn('mountTopicMasteryCheck') + '\nthis.ok = mountTopicMasteryCheck();', sandbox);
  assert.equal(sandbox.ok, true);
  assert.deepEqual(mounted, [{ topicId: 'mm-cur-22', noMusic: true, stage: 'no_music_check' }]);
  assert.equal(finished, 0);
  sandbox.done('4', true);
  assert.equal(finished, 1);
});

test('regular practice without a topic keeps the music exercise', () => {
  const box = regularNext(null);
  box.practiceTopic = null;
  box.topicPracticeItems = null;
  const ex = box.next();
  assert.equal(ex.prompt, 'music');
  assert.equal(ex.answer, 3);
});
