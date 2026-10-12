const test = require('node:test');
const assert = require('node:assert/strict');
const {
  LESSONS,
  getAllLessons,
  getLessonById,
  getLessonsForGrade,
  evaluateStepAnswer
} = require('../src/lib/interactiveLessons');

test('interactive lessons engine provides structured curriculum lessons', () => {
  const lessons = getAllLessons();
  assert.ok(Array.isArray(lessons));
  assert.ok(lessons.length >= 4);

  lessons.forEach((l) => {
    assert.ok(l.id, 'lesson missing id');
    assert.ok(l.title, 'lesson missing title');
    assert.ok(l.grade, 'lesson missing grade');
    assert.ok(l.icon, 'lesson missing icon');
    assert.ok(Array.isArray(l.steps) && l.steps.length === 4, `${l.id} should have 4 steps`);

    // Verify step 4 is a scaffolded understanding check
    const quizStep = l.steps[3];
    assert.ok(Array.isArray(quizStep.options) && quizStep.options.length >= 2);
    assert.ok(quizStep.correctIndex >= 0 && quizStep.correctIndex < quizStep.options.length);
    assert.ok(quizStep.explanation.length > 5);
  });
});

test('getLessonById retrieves lesson or null', () => {
  const frac = getLessonById('fractions-intro');
  assert.ok(frac);
  assert.equal(frac.id, 'fractions-intro');
  assert.equal(getLessonById('non-existent'), null);
  assert.equal(getLessonById(null), null);
});

test('division lesson teaches equal groups and the inverse of multiplication', () => {
  const div = getLessonById('division-groups');
  assert.ok(div, 'division-groups lesson should be registered');
  assert.equal(div.grade, 'ג');
  assert.equal(div.strand, 'כפל וחילוק');
  assert.deepEqual(
    div.steps.slice(0, 3).map((s) => s.actionType),
    ['divConcept', 'divInverse', 'divExplorer']
  );

  const check = evaluateStepAnswer('division-groups', 3, 1);
  assert.equal(check.correct, true);
  assert.match(check.explanation, /12 לחלק ל-4/);
  assert.equal(evaluateStepAnswer('division-groups', 3, 2).correct, false);
});

test('getLessonsForGrade filters lessons accurately', () => {
  const gradeD = getLessonsForGrade('ד');
  assert.ok(gradeD.length >= 1);
  assert.ok(gradeD.every((l) => l.grade === 'ד'));

  const all = getLessonsForGrade(null);
  assert.equal(all.length, LESSONS.length);
});

test('evaluateStepAnswer grades choices and provides explanations', () => {
  const correct = evaluateStepAnswer('fractions-intro', 3, 1);
  assert.equal(correct.valid, true);
  assert.equal(correct.correct, true);
  assert.ok(correct.explanation.includes('שני רבעים'));

  const wrong = evaluateStepAnswer('fractions-intro', 3, 0);
  assert.equal(wrong.valid, true);
  assert.equal(wrong.correct, false);

  const invalid = evaluateStepAnswer('unknown', 3, 0);
  assert.equal(invalid.valid, false);

  const nonQuiz = evaluateStepAnswer('fractions-intro', 0, 0);
  assert.equal(nonQuiz.valid, false);
});

test('interactive lessons strictly avoid false efficacy claims', () => {
  const text = JSON.stringify(LESSONS);
  assert.doesNotMatch(text, /סוגרים פערים/);
  assert.doesNotMatch(text, /הילד שולט/);
  assert.doesNotMatch(text, /מחקרים מוכיחים/);
  assert.doesNotMatch(text, /טיפול/);
  assert.doesNotMatch(text, /ADHD|דיסקלקול/i);
});

test('registerLesson adds and updates modular learning content dynamically', () => {
  const { registerLesson } = require('../src/lib/interactiveLessons');
  assert.equal(typeof registerLesson, 'function');

  const customLesson = {
    id: 'test-custom-geometry',
    title: 'מקצבים אוקלידיים ומעגלי זמן',
    grade: 'ד',
    strand: 'גיאומטריה',
    icon: '⭕',
    summary: 'חלוקה שווה של זמן ומצולעים',
    steps: [
      { title: 'מעגל הזמן', body: 'הסבר', actionType: 'circleDemo' },
      { title: 'הדגמה', body: 'הדגמה', actionType: 'circleAudio' },
      { title: 'חקר', body: 'התנסות', actionType: 'euclideanWheel' },
      { title: 'בדיקה', body: 'שאלה', options: ['א', 'ב'], correctIndex: 0, explanation: 'נכון' }
    ]
  };

  const ok = registerLesson(customLesson);
  assert.equal(ok, true);
  assert.equal(getLessonById('test-custom-geometry').title, 'מקצבים אוקלידיים ומעגלי זמן');

  // Rejection of invalid structure
  assert.equal(registerLesson(null), false);
  assert.equal(registerLesson({ id: 'broken' }), false);
});

