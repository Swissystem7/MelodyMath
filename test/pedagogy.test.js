const test = require('node:test');
const assert = require('node:assert/strict');
const cur = require('../src/lib/curriculum');
const ped = require('../src/lib/pedagogy');
const { lessonPlans, lessonPlanForTopic } = ped;

test('lessonPlans returns structured plans linked to valid curriculum topic IDs', () => {
  const plans = ped.lessonPlans();
  assert.ok(plans.length >= 8, 'expect a bank of plans for covered and partial topics');
  plans.forEach(function (plan) {
    assert.ok(typeof plan.id === 'string' && plan.id.length > 0);
    assert.ok(typeof plan.curriculumTopicId === 'string');
    assert.ok(cur.isValidTopicId(plan.curriculumTopicId), plan.curriculumTopicId);
    assert.ok(Array.isArray(plan.goals) && plan.goals.length >= 1, plan.id);
    plan.goals.forEach(function (g) {
      assert.ok(typeof g === 'string' && g.trim().length > 0);
    });
    assert.ok(Array.isArray(plan.steps) && plan.steps.length >= 2, plan.id);
    plan.steps.forEach(function (step, i) {
      assert.equal(typeof step.order, 'number');
      assert.ok(typeof step.titleHe === 'string' && step.titleHe.length > 0);
      assert.ok(typeof step.bodyHe === 'string' && step.bodyHe.length > 0);
    });
    const row = cur.topicById(plan.curriculumTopicId);
    assert.ok(row);
    assert.notEqual(row.status, cur.GAP);
  });
  assert.ok(plans.some(function (p) {
    const r = cur.topicById(p.curriculumTopicId);
    return r.grade === 'א' && /ספירה עד 100/.test(r.topic);
  }));
  assert.ok(plans.some(function (p) {
    const r = cur.topicById(p.curriculumTopicId);
    return r.grade === 'ד' && r.strand === 'fractions' && r.status === cur.COVERED;
  }));
  assert.equal(ped.lessonPlanByTopicId('mm-cur-not-real'), null);
});

// Test that lessonPlans returns a list of lesson plans
assert.ok(Array.isArray(lessonPlans()), 'lessonPlans should return an array');

// Test that each lesson plan has required properties
const plans = lessonPlans();
assert.ok(plans.length > 0, 'There should be at least one lesson plan');

plans.forEach(plan => {
  assert.ok(plan.id, 'Each plan should have an id');
  assert.ok(plan.topicId, 'Each plan should have a topicId');
  assert.ok(Array.isArray(plan.goals), 'Each plan should have goals as an array');
  assert.ok(Array.isArray(plan.steps), 'Each plan should have steps as an array');
  assert.ok(plan.curriculumTopic, 'Each plan should have a curriculum topic');
  assert.ok(plan.grade, 'Each plan should have a grade');
  assert.ok(plan.strand, 'Each plan should have a strand');
});

// Test that lessonPlanForTopic returns the correct plan for a given topicId
const testTopicId = '1';
const foundPlan = lessonPlanForTopic(testTopicId);
assert.ok(foundPlan, 'lessonPlanForTopic should find a plan for the given topicId');
assert.equal(foundPlan.id, testTopicId, 'The returned plan should match the requested topicId');

test('buildStudentStudyPlan is one topic, and defers to buildLearnerPlan when it is loaded', () => {
  ['א', 'ב', 'ג'].forEach((grade) => {
    const plan = ped.buildStudentStudyPlan({ name: 'נועה' }, grade);
    assert.equal(plan.source, 'curriculum');
    assert.equal(plan.steps.length, 1, grade);
    assert.equal(plan.steps[0].order, 1);
    assert.equal(plan.grade, grade);
    assert.equal(plan.studentName, 'נועה');
    assert.match(plan.weeklyGoalHe, /3 מפגשים/);
    const html = ped.renderStudentStudyPlanHtml(plan);
    assert.match(html, /תוכנית אחת/);
    assert.match(html, /dir="rtl"/);
    assert.doesNotMatch(html, /שליטה|יעילות|טיפול/);
  });
  assert.match(ped.buildStudentStudyPlan({}, 'א').steps[0].curriculumTopic, /ספירה עד 100/);
  const bad = ped.buildStudentStudyPlan({}, 'constructor');
  assert.equal(bad.steps.length, 0);
  assert.equal(bad.grade, '');

  const seen = [];
  globalThis.buildLearnerPlan = function (input) {
    seen.push(input);
    return {
      ok: true, branch: 'weak', grade: input.grade, topic: 'לוח כפל',
      adultLine: 'הקצב: 3 מפגשים של 8 דקות השבוע.', paceExpected: 3,
      childLine: 'היום: לוח כפל.', disclaimer: 'ספירה במכשיר הזה בלבד.',
    };
  };
  globalThis.renderLearnerPlanHtml = function (plan) {
    return '<article class="mm-plan" data-topic="' + plan.topic + '" dir="rtl">תוכנית אחת</article>';
  };
  try {
    const delegated = ped.buildStudentStudyPlan({
      name: 'נועה',
      perSkill: { multiplication: { total: 5, correct: 1 } },
    }, 'ג');
    assert.equal(delegated.source, 'learnerPlan');
    assert.equal(delegated.steps.length, 1);
    assert.equal(delegated.steps[0].curriculumTopic, 'לוח כפל');
    assert.equal(delegated.steps[0].weeklyTargetItems, 3);
    assert.ok(Array.isArray(seen[0].perSkill));
    assert.equal(seen[0].perSkill[0].skill, 'multiplication');
    assert.equal(seen[0].perSkill[0].total, 5);
    const html = ped.renderStudentStudyPlanHtml(delegated);
    assert.match(html, /data-topic="לוח כפל"/);
    assert.doesNotMatch(html, /שליטה|יעילות/);
  } finally {
    delete globalThis.buildLearnerPlan;
    delete globalThis.renderLearnerPlanHtml;
  }
});

console.log('All pedagogy tests passed!');
