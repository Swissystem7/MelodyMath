const test = require('node:test');
const assert = require('node:assert/strict');
const cur = require('../src/lib/curriculum');
const ped = require('../src/lib/pedagogy');

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
