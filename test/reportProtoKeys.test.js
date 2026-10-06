const assert = require('node:assert');
const test = require('node:test');
const store = require('../src/lib/teacherStore.js');
const dashboardLogic = require('../src/lib/dashboardLogic.js');

// An imported roster can carry any text in item.skill / item.prompt. When that
// text is a prototype key the report used to look it up on Object.prototype,
// drop it from perSkill / repeatingErrors and leave NaN counters on Object.
function protoStudent() {
  return {
    name: 'רון',
    sessions: [
      {
        id: 's1',
        kind: 'practice',
        started: 1,
        items: [
          { skill: 'constructor', prompt: '__proto__', correct: false, at: 1 },
          { skill: 'constructor', prompt: '__proto__', correct: false, at: 2 },
          { skill: 'constructor', prompt: 'toString', correct: true, at: 3 },
          { skill: 'חיבור', prompt: '1+1', correct: true, at: 4 },
        ],
      },
    ],
  };
}

function assertClean() {
  assert.equal(Object.total, undefined);
  assert.equal(Object.count, undefined);
  assert.equal(({}).total, undefined);
  assert.equal(({}).count, undefined);
  assert.equal(({}).correct, undefined);
}

test('buildReport counts a skill or prompt named like a prototype key', () => {
  const report = store.buildReport(protoStudent());
  const ctor = report.perSkill.find(function (s) { return s.skill === 'constructor'; });
  assert.deepEqual(ctor, { skill: 'constructor', total: 3, correct: 1, accuracy: 1 / 3 });
  assert.equal(report.perSkill.length, 2);
  assert.deepEqual(report.repeatingErrors, [{ prompt: '__proto__', skill: 'constructor', count: 2 }]);
  assert.equal(report.total, 4);
  assert.equal(report.correct, 2);
  assertClean();
});

test('dashboardLogic.buildStudentReport counts prototype-key skills and prompts', () => {
  const report = dashboardLogic.buildStudentReport(protoStudent());
  const ctor = report.perSkill.find(function (s) { return s.skill === 'constructor'; });
  assert.equal(ctor.total, 3);
  assert.equal(ctor.correct, 1);
  assert.equal(report.perSkill.length, 2);
  assert.equal(report.repeatingErrors.length, 1);
  assert.equal(report.repeatingErrors[0].prompt, '__proto__');
  assert.equal(report.repeatingErrors[0].count, 2);
  assertClean();
});

test('a report with ordinary skills is unchanged', () => {
  const report = store.buildReport({
    name: 'דנה',
    sessions: [{ id: 'a', items: [
      { skill: 'כפל', prompt: '3*4', correct: false },
      { skill: 'כפל', prompt: '3*4', correct: false },
      { skill: 'כפל', prompt: '2*5', correct: true },
    ] }],
  });
  assert.deepEqual(report.perSkill, [{ skill: 'כפל', total: 3, correct: 1, accuracy: 1 / 3 }]);
  assert.deepEqual(report.repeatingErrors, [{ prompt: '3*4', skill: 'כפל', count: 2 }]);
  assertClean();
});
