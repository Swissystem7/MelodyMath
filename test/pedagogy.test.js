const assert = require('node:assert/strict');
const { lessonPlans, lessonPlanForTopic } = require('../src/lib/pedagogy');

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

console.log('All pedagogy tests passed!');