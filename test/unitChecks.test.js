const test = require('node:test');
const assert = require('node:assert/strict');
const unit = require('../src/lib/unitChecks');
const store = require('../src/lib/teacherStore');

function memory() {
  const m = Object.create(null);
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
  };
}

test('grade ד׳ fractions pre and post forms are parallel-tagged with 6–8 items and matched levels', () => {
  const v = unit.validateUnitParallelForms(unit.UNIT_ID);
  assert.equal(v.ok, true);
  assert.ok(v.n >= 6 && v.n <= 8);
  assert.equal(v.parallelForm, unit.PARALLEL_TAG);
  const pre = unit.getUnitForm(unit.UNIT_ID, 'pre').items;
  const post = unit.getUnitForm(unit.UNIT_ID, 'post').items;
  assert.equal(pre.length, post.length);
  pre.forEach((it) => {
    assert.equal(it.parallelForm, unit.PARALLEL_TAG);
    assert.equal(it.formPhase, 'pre');
    assert.equal(it.formId, 'pre-a');
  });
  post.forEach((it) => {
    assert.equal(it.parallelForm, unit.PARALLEL_TAG);
    assert.equal(it.formPhase, 'post');
    assert.equal(it.formId, 'post-b');
  });
  assert.equal(unit.parallelDifficultyMatch(pre, post), true);
});

test('parallel level histogram fails when forms are unbalanced', () => {
  const pre = [{ level: 1 }, { level: 2 }];
  const post = [{ level: 1 }, { level: 1 }];
  assert.equal(unit.parallelDifficultyMatch(pre, post), false);
});

test('scoreForm counts answers with fraction aliases', () => {
  const form = unit.getUnitForm(unit.UNIT_ID, 'pre');
  const answers = form.items.map((it) => it.answer);
  answers[1] = '½';
  const scored = unit.scoreForm(form, answers);
  assert.equal(scored.correct, form.items.length);
  assert.equal(scored.total, form.items.length);
});

test('recordUnitCheck stores pre and post locally and the class overview aggregates n', () => {
  const ls = memory();
  store.upsertStudent('ד׳', 'רועי', ls);
  const preForm = unit.getUnitForm(unit.UNIT_ID, 'pre');
  const postForm = unit.getUnitForm(unit.UNIT_ID, 'post');
  const preAnswers = preForm.items.map((it) => it.answer);
  preAnswers[0] = '0';
  const pre = store.recordUnitCheck('ד׳', 'רועי', unit.UNIT_ID, 'pre', { answers: preAnswers }, ls);
  assert.ok(pre);
  assert.equal(pre.total, preForm.items.length);
  assert.equal(pre.correct, preForm.items.length - 1);
  const postAnswers = postForm.items.map((it) => it.answer);
  const post = store.recordUnitCheck('ד׳', 'רועי', unit.UNIT_ID, 'post', { answers: postAnswers }, ls);
  assert.equal(post.correct, postForm.items.length);
  const studentRep = store.buildStudentUnitMeasureReport(store.getStudent('ד׳', 'רועי', ls), unit.UNIT_ID);
  assert.equal(studentRep.pre.n, preForm.items.length);
  assert.equal(studentRep.post.n, postForm.items.length);
  store.upsertStudent('ד׳', 'מיה', ls);
  store.recordUnitCheck('ד׳', 'מיה', unit.UNIT_ID, 'pre', { answers: preForm.items.map((it) => it.answer) }, ls);
  const overview = store.buildClassUnitMeasureOverview('ד׳', unit.UNIT_ID, ls);
  assert.equal(overview.classTotals.preN, 2);
  assert.equal(overview.classTotals.postN, 1);
  assert.match(overview.disclaimer, /לא ניסוי מבוקר/);
  assert.doesNotMatch(overview.disclaimer, /יעילות|משפר/);
});

test('render helpers include the honest disclaimer and LTR math', () => {
  const html = unit.renderStudentUnitMeasureHtml({
    titleHe: 'בדיקה',
    pre: { correct: 5, total: 7, n: 7 },
    post: { correct: 6, total: 7, n: 7 },
    disclaimer: unit.DISCLAIMER,
  });
  assert.match(html, /לא ניסוי מבוקר/);
  assert.match(html, /<bdi dir="ltr">5\/7<\/bdi>/);
  const classHtml = unit.renderClassUnitMeasureHtml({
    titleHe: 'כיתה',
    students: [{ name: 'א', pre: { correct: 1, total: 7, n: 7 }, post: { correct: 0, total: 0, n: 0 } }],
    classTotals: { preCorrect: 1, preTotal: 7, preN: 1, postCorrect: 0, postTotal: 0, postN: 0 },
    disclaimer: unit.DISCLAIMER,
  });
  assert.match(classHtml, /unit-measure-table/);
});
