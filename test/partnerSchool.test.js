const { test } = require('node:test');
const assert = require('node:assert/strict');
const PartnerSchool = require('../src/lib/partnerSchool.js');

test('PartnerSchool exports expected protocol constants and methods', () => {
  assert.equal(PartnerSchool.PILOT_DURATION_WEEKS, 4);
  assert.equal(PartnerSchool.PILOT_MILESTONES.length, 4);
  assert.equal(typeof PartnerSchool.createPilotPlan, 'function');
  assert.equal(typeof PartnerSchool.evaluatePilotOutcomes, 'function');
  assert.equal(typeof PartnerSchool.generatePilotSummaryText, 'function');
});

test('createPilotPlan sanitizes input and builds 4-week milestones', () => {
  const plan = PartnerSchool.createPilotPlan({
    schoolName: '  בית ספר אילנות  ',
    teacherName: 'מיכל כהן',
    groupSize: 10,
    grade: 'ב'
  });

  assert.equal(plan.schoolName, 'בית ספר אילנות');
  assert.equal(plan.teacherName, 'מיכל כהן');
  assert.equal(plan.groupSize, 10);
  assert.equal(plan.grade, 'ב');
  assert.equal(plan.durationWeeks, 4);
  assert.equal(plan.milestones.length, 4);
  assert.equal(plan.milestones[0].week, 1);
  assert.equal(plan.milestones[0].completed, false);
});

test('createPilotPlan bounds group size reasonably', () => {
  const smallPlan = PartnerSchool.createPilotPlan({ groupSize: -5 });
  assert.equal(smallPlan.groupSize, 5);

  const largePlan = PartnerSchool.createPilotPlan({ groupSize: 50 });
  assert.equal(largePlan.groupSize, 15);
});

test('evaluatePilotOutcomes calculates pre/post average and delta', () => {
  const pre = [60, 70, 80];
  const post = [75, 85, 95];
  const outcomes = PartnerSchool.evaluatePilotOutcomes(pre, post);

  assert.equal(outcomes.completedFullEvaluation, true);
  assert.equal(outcomes.preAverage, 70);
  assert.equal(outcomes.postAverage, 85);
  assert.equal(outcomes.deltaAverage, 15);
});

test('generatePilotSummaryText formats report in Hebrew without false claims', () => {
  const plan = PartnerSchool.createPilotPlan({ schoolName: 'בית ספר גולדה', teacherName: 'דנה' });
  const outcomes = PartnerSchool.evaluatePilotOutcomes([70], [80]);
  const text = PartnerSchool.generatePilotSummaryText(plan, outcomes);

  assert.match(text, /בית ספר גולדה/);
  assert.match(text, /ממוצע שאלון פתיחה/);
  assert.match(text, /\+10%/);
  assert.match(text, /באופן מקומי/);
});
