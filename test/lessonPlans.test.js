const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { lessonPlans, lessonPlanForTopic, plansFor, renderLessonPlansHtml } = require('../src/lib/pedagogy');
const { rowsForGrade } = require('../src/lib/curriculum');

test('every lesson plan points at a real curriculum topic of its grade', () => {
  lessonPlans().forEach((plan) => {
    const topics = rowsForGrade(plan.grade).map((r) => r.topic);
    assert.ok(topics.includes(plan.curriculumTopic), plan.id + ': ' + plan.curriculumTopic);
  });
});

test('plan text is Hebrew only, no stray Arabic letters', () => {
  assert.doesNotMatch(JSON.stringify(lessonPlans()), /[؀-ۿ]/);
});

test('lessonPlanForTopic finds by topicId and still by the old plan id', () => {
  const plan = lessonPlans()[1];
  assert.equal(lessonPlanForTopic(plan.topicId), plan);
  assert.equal(lessonPlanForTopic(plan.id), plan);
  assert.equal(lessonPlanForTopic('nope'), undefined);
});

test('plansFor filters by grade and exact topic', () => {
  assert.equal(plansFor('א', '').length, 2);
  assert.deepEqual(plansFor('ב', 'שליטה בכפולות 2, 4, 5, 10').map((p) => p.id), ['3']);
  assert.deepEqual(plansFor('א', 'שליטה בכפולות 2, 4, 5, 10'), []);
  assert.deepEqual(plansFor('ד', ''), []);
});

test('the rendered plan escapes text and says so when there is none', () => {
  assert.match(renderLessonPlansHtml([]), /אין עדיין מערך/);
  const html = renderLessonPlansHtml([{ grade: 'א', curriculumTopic: '<b>x</b>', goals: ['a&b'], steps: ['s'] }]);
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
  assert.match(html, /a&amp;b/);
  assert.match(html, /<ol><li>s<\/li><\/ol>/);
});

test('the teacher tab has a printable lesson-plan card', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /id="lessonCard"/);
  assert.match(html, /id="lessonGrade"/);
  assert.match(html, /id="lessonTopic"/);
  assert.match(html, /body\.print-lesson #lessonCard\{display:block!important\}/);
  assert.match(html, /'print-lesson'\)\}\);/);
});
