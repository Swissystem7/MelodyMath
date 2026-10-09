const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const pedagogy = require('../src/lib/pedagogy.js');
const { escapeHtml } = require('../src/lib/onboard.js');

function lessonPlanSource() {
  const from = indexHtml.indexOf('function lessonPlansForGrade(');
  const to = indexHtml.indexOf("if($('planTopic'))");
  assert.ok(from > 0 && to > from, 'index.html no longer has the lesson-plan card');
  return indexHtml.slice(from, to);
}

// The card follows the grade picker above the tabs, so render() is driven by
// `selectedGrade` and by whatever is already selected in the topic <select>.
function render(grade, selectValue) {
  const pick = { value: selectValue == null ? '' : selectValue, innerHTML: '', disabled: false };
  const box = { innerHTML: '' };
  const ctx = Object.assign({
    $: (id) => ({ planTopic: pick, lessonPlan: box })[id] || null,
    selectedGrade: grade,
    escapeHtml,
    Array,
  }, pedagogy);
  vm.createContext(ctx);
  vm.runInContext(lessonPlanSource() + '\nrenderLessonPlan();', ctx);
  return { pick, box };
}

test('the teacher tab has a lesson-plan card wired to pedagogy.js', () => {
  assert.match(indexHtml, /src\/lib\/pedagogy\.js/);
  assert.match(indexHtml, /id="lessonPlanCard"/);
  assert.match(indexHtml, /id="planTopic"/);
  assert.match(indexHtml, /id="lessonPlan"/);
  const src = lessonPlanSource();
  assert.match(src, /lessonPlans\(\)/);
  assert.match(src, /lessonPlanForTopic\(want\)/);
  // The grade picker repaint is what refreshes the card.
  assert.match(indexHtml, /renderLessonPlan\(\);\n\}/);
});

test('a grade with a plan shows that plan goals and steps', () => {
  const { pick, box } = render('א');
  const first = pedagogy.lessonPlans().filter((p) => p.grade === 'א')[0];
  assert.equal(pick.disabled, false);
  assert.equal(pick.innerHTML.match(/<option /g).length, 2);
  assert.match(pick.innerHTML, new RegExp('value="' + first.id + '" selected'));
  assert.match(box.innerHTML, new RegExp(escapeHtml(first.curriculumTopic)));
  first.goals.forEach((g) => assert.match(box.innerHTML, new RegExp('<li>' + escapeHtml(g) + '</li>')));
  first.steps.forEach((s) => assert.match(box.innerHTML, new RegExp('<li>' + escapeHtml(s) + '</li>')));
  assert.match(box.innerHTML, /<ul class="err-list">/);
  assert.match(box.innerHTML, /<ol class="err-list">/);
});

test('a selected topic survives a repaint instead of snapping back to the first', () => {
  const plans = pedagogy.lessonPlans().filter((p) => p.grade === 'א');
  const { pick, box } = render('א', plans[1].id);
  assert.match(pick.innerHTML, new RegExp('value="' + plans[1].id + '" selected'));
  assert.match(box.innerHTML, new RegExp(escapeHtml(plans[1].curriculumTopic)));
});

test('a grade with no plan says so instead of showing another grade plan', () => {
  // The bank covers א׳ and ב׳ only. ג׳ and ד׳ must not borrow a plan.
  ['ג', 'ד'].forEach((grade) => {
    assert.equal(pedagogy.lessonPlans().filter((p) => p.grade === grade).length, 0);
    const { pick, box } = render(grade);
    assert.equal(pick.disabled, true);
    assert.equal(pick.innerHTML, '');
    assert.match(box.innerHTML, /אין מתווה שיעור לכיתה/);
    assert.match(box.innerHTML, new RegExp(grade));
    pedagogy.lessonPlans().forEach((p) => {
      assert.doesNotMatch(box.innerHTML, new RegExp(escapeHtml(p.curriculumTopic)));
    });
  });
});
