// #413: after a diagnosis, a personal-plan row is saved through teacherStore
// and comes back for the same child on the next page load. The diagnosis is
// mocked: real diagnostic items from banks.js, answers chosen by the test.
const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/lib/teacherStore');
const banks = require('../src/lib/banks');
const learner = require('../src/lib/learnerPlan');
const { memoryStorage, planKey } = require('../tools/demo-diagnosis-plan');

const CLASS = 'ד-2';

// Logs one 'diag' session where every item of a skill in `miss` is wrong.
function mockDiagnosis(ls, name, grade, miss) {
  store.upsertStudent(CLASS, name, ls);
  store.setStudentGrade(CLASS, name, grade, ls);
  const session = store.startSession(CLASS, name, 'diag', ls);
  banks.diagnosticItems(grade).forEach((q) => {
    const correct = miss.indexOf(q.skill) < 0;
    store.addItem(CLASS, name, session.id, {
      skill: banks.skillHe(q.skill), prompt: q.prompt, answer: q.answer,
      given: correct ? q.answer : '?', correct,
    }, ls);
  });
  store.endSession(CLASS, name, session.id, ls);
  return session;
}

function planRow(plan, savedAt) {
  return {
    grade: plan.grade, branch: plan.branch, topic: plan.topic, gaps: plan.gaps,
    childLine: plan.childLine, adultLine: plan.adultLine, savedAt,
  };
}

function diagnoseAndSave(ls, name, grade, miss) {
  mockDiagnosis(ls, name, grade, miss);
  const student = store.getStudent(CLASS, name, ls);
  const plan = learner.buildLearnerPlan({ grade, student, name });
  const row = planRow(plan, 1000);
  assert.equal(store.saveJson(planKey(CLASS, name), row, ls), true);
  return row;
}

test('a plan row saved after a diagnosis reloads unchanged for that child', () => {
  const ls = memoryStorage();
  const row = diagnoseAndSave(ls, 'נועה', 'ג', ['multiplication', 'division']);
  assert.equal(row.branch, 'weak');
  assert.match(row.topic, /לוח כפל/);
  const raw = ls.getItem(store.jsonKey(planKey(CLASS, 'נועה')));
  assert.ok(raw, 'plan row not written under the namespaced key');
  assert.deepEqual(store.loadJson(planKey(CLASS, 'נועה'), null, ls), row);
});

test('the stored diagnosis rebuilds the same plan after a reload', () => {
  const ls = memoryStorage();
  const row = diagnoseAndSave(ls, 'נועה', 'ג', ['multiplication']);
  const reloaded = store.getStudent(CLASS, 'נועה', ls);
  assert.equal(reloaded.grade, 'ג');
  assert.equal(reloaded.sessions.length, 1);
  assert.equal(reloaded.sessions[0].kind, 'diag');
  assert.ok(reloaded.sessions[0].ended, 'diag session was not closed');
  const rebuilt = learner.buildLearnerPlan({ grade: reloaded.grade, student: reloaded, name: 'נועה' });
  assert.equal(rebuilt.topic, row.topic);
  assert.deepEqual(rebuilt.gaps, row.gaps);
});

test('each child keeps their own plan row', () => {
  const ls = memoryStorage();
  const a = diagnoseAndSave(ls, 'נועה', 'ג', ['multiplication', 'division']);
  const b = diagnoseAndSave(ls, 'איתי', 'ד', ['basic_fractions']);
  assert.notEqual(a.topic, b.topic);
  assert.equal(store.loadJson(planKey(CLASS, 'נועה'), null, ls).topic, a.topic);
  assert.equal(store.loadJson(planKey(CLASS, 'איתי'), null, ls).topic, b.topic);
  assert.equal(store.loadJson(planKey(CLASS, 'מיה'), null, ls), null, 'undiagnosed child got a plan');
  assert.deepEqual(store.listStudents(CLASS, ls).sort(), ['איתי', 'נועה']);
});

test('the same name under another class code has no plan', () => {
  const ls = memoryStorage();
  diagnoseAndSave(ls, 'נועה', 'ג', ['multiplication']);
  assert.equal(store.loadJson(planKey('ה-1', 'נועה'), null, ls), null);
});

test('a re-typed name with extra spaces finds the same plan row', () => {
  const ls = memoryStorage();
  const row = diagnoseAndSave(ls, 'נועה כהן', 'ג', ['division']);
  assert.equal(planKey(' ' + CLASS + ' ', '  נועה   כהן '), planKey(CLASS, 'נועה כהן'));
  assert.deepEqual(store.loadJson(planKey(CLASS, '  נועה   כהן '), null, ls), row);
});

test('a second diagnosis replaces the saved plan row', () => {
  const ls = memoryStorage();
  const first = diagnoseAndSave(ls, 'נועה', 'ג', ['multiplication', 'division']);
  const second = diagnoseAndSave(ls, 'נועה', 'ד', ['basic_fractions']);
  assert.notEqual(first.topic, second.topic);
  assert.deepEqual(store.loadJson(planKey(CLASS, 'נועה'), null, ls), second);
  assert.equal(store.getStudent(CLASS, 'נועה', ls).sessions.length, 2);
});

test('a corrupt plan row falls back without touching the roster', () => {
  const ls = memoryStorage();
  diagnoseAndSave(ls, 'נועה', 'ג', ['multiplication']);
  ls.setItem(store.jsonKey(planKey(CLASS, 'נועה')), '{not json');
  assert.equal(store.loadJson(planKey(CLASS, 'נועה'), null, ls), null);
  assert.equal(store.getStudent(CLASS, 'נועה', ls).sessions.length, 1);
});

test('a plan row written before the mm:v1: prefix still loads', () => {
  const ls = memoryStorage();
  const row = { topic: 'לוח כפל', branch: 'weak', savedAt: 1 };
  ls.setItem(planKey(CLASS, 'נועה'), JSON.stringify(row));
  assert.deepEqual(store.loadJson(planKey(CLASS, 'נועה'), null, ls), row);
});

test('a tablet that cannot write reports the plan as not saved', () => {
  const ls = memoryStorage();
  diagnoseAndSave(ls, 'נועה', 'ג', ['multiplication']);
  const full = Object.assign(memoryStorage(), {
    setItem() { throw new Error('QuotaExceededError'); },
  });
  assert.equal(store.saveJson(planKey(CLASS, 'נועה'), { topic: 'x' }, full), false);
  assert.equal(store.loadJson(planKey(CLASS, 'נועה'), 'none', full), 'none');
});
