(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  // Mock lesson plan data based on curriculum topics
  const LESSON_PLANS = [
    {
      id: '1',
      topicId: 'א-מספרים-ספירה עד 100 קדימה ואחורה ממספר כלשהו',
      goals: ['לספור עד 100 קדימה ואחורה', 'להתחיל ממספר כלשהו ולספור ממנו'],
      steps: [
        'הצגת ישר המספרים עד 100',
        'אימון ספירה קדימה ואחורה',
        'שימוש במשחקים לתרגול'
      ],
      curriculumTopic: 'ספירה עד 100 קדימה ואחורה ממספר כלשהו',
      grade: 'א',
      strand: 'numbers'
    },
    {
      id: '2',
      topicId: 'א-מספרים-מנייה עד 100, קיבוץ ל־10',
      goals: ['למנות עד 100', 'לקבץ ל־10'],
      steps: [
        'שימוש בדמויות לתרגול קיבוץ',
        'הצגת טבלאות קיבוץ',
        'אימון עם חפצים מוחשיים'
      ],
      curriculumTopic: 'מנייה עד 100, קיבוץ ל־10',
      grade: 'א',
      strand: 'numbers'
    },
    {
      id: '3',
      topicId: 'ב-מספרים-שליטה בכפולות 2, 4, 5, 10',
      goals: ['לשלוט בכפולות 2, 4, 5, 10', 'לבחון את תכונות הכפל'],
      steps: [
        'הצגת טבלאות כפל',
        'אימון עם מוזיקה',
        'שימוש במשחקים לתרגול'
      ],
      curriculumTopic: 'שליטה בכפולות 2, 4, 5, 10',
      grade: 'ב',
      strand: 'numbers'
    }
  ];

  function lessonPlans() {
    return LESSON_PLANS;
  }

  // Older callers pass the plan id ('1'); the curriculum key is the topicId.
  function lessonPlanForTopic(topicId) {
    return LESSON_PLANS.find(plan => plan.topicId === topicId)
      || LESSON_PLANS.find(plan => plan.id === topicId);
  }

  // Plans for one grade, optionally for one curriculum topic (the exact topic
  // string from curriculum.js). An empty topic means every plan in the grade.
  function plansFor(grade, topic) {
    return LESSON_PLANS.filter(plan => plan.grade === grade && (!topic || plan.curriculumTopic === topic));
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function renderLessonPlansHtml(plans) {
    const list = Array.isArray(plans) ? plans : [];
    if (!list.length) return '<p class="note">אין עדיין מערך שיעור לנושא הזה.</p>';
    return list.map(function (plan) {
      const li = function (x) { return '<li>' + escapeHtml(x) + '</li>'; };
      return '<article class="lesson-plan">'
        + '<h3>כיתה ' + escapeHtml(plan.grade) + '׳ · ' + escapeHtml(plan.curriculumTopic) + '</h3>'
        + '<h4>מטרות</h4><ul>' + (plan.goals || []).map(li).join('') + '</ul>'
        + '<h4>מהלך השיעור</h4><ol>' + (plan.steps || []).map(li).join('') + '</ol>'
        + '</article>';
    }).join('');
  }

  return {
    lessonPlans: lessonPlans,
    lessonPlanForTopic: lessonPlanForTopic,
    plansFor: plansFor,
    renderLessonPlansHtml: renderLessonPlansHtml
  };
});
