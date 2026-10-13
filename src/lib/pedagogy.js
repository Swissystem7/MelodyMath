// MelodyMath — lesson plans tied to Ministry curriculum rows.
//
// Each plan links one matrix topic to classroom steps so a teacher can show
// how on-screen practice maps to the official programme — not a efficacy claim.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CUR = (typeof module === 'object' && module.exports)
    ? require('./curriculum')
    : (typeof globalThis !== 'undefined' ? globalThis : {});

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

  function goalsForTopic(row) {
    const strand = CUR.strandHe(row.strand);
    return [
      'לקשר תרגול ב־MelodyMath לסעיף «' + row.topic + '» בתוכנית לכיתה ' + row.grade + '׳.',
      'להדגיש תחום «' + strand + '» בלי לטעון כיסוי מלא כשהסטטוס הוא ' + CUR.statusHe(row.status) + '.',
      'לתת למורה ניסוח להצדקת שילוב הכלי בשיעור מול הורים או הנהלה.',
    ];
  }

  function stepsForTopic(row) {
    const statusNote = row.status === CUR.GAP
      ? 'הנושא עדיין לא בבנק — השתמשו בתוכנית כהכנה בלבד.'
      : 'בחרו בבנק פריטים שמתויגים לכיתה ' + row.grade + '׳ ולמיומנות הרלוונטית.';
    return [
      {
        order: 1,
        titleHe: 'מיפוי לתוכנית',
        bodyHe: 'הציגו את שורת התוכנית: «' + row.topic + '». ' + statusNote,
      },
      {
        order: 2,
        titleHe: 'תרגול מונחה',
        bodyHe: '8–12 דקות במצב כיתה או תרגול אישי; המורה מקריאה את המשימה, הילדים עובדים עם הקול או בלי לפי ההתאמה.',
      },
      {
        order: 3,
        titleHe: 'שיקוף וסגירה',
        bodyHe: 'שאלו מה היה קשה; ציינו במפורש מה עדיין לא מכוסה (' + row.note + ').',
      },
    ];
  }

  function lessonPlanForRow(row) {
    return {
      id: 'lesson-' + row.topicId,
      curriculumTopicId: row.topicId,
      topicId: row.topicId,
      curriculumTopic: row.topic,
      titleHe: 'מערך שיעור · כיתה ' + row.grade + '׳ · ' + row.topic,
      grade: row.grade,
      strand: row.strand,
      status: row.status,
      goals: goalsForTopic(row),
      steps: stepsForTopic(row),
    };
  }

  let cachedPlans = null;
  function lessonPlans() {
    if (!cachedPlans) {
      cachedPlans = CUR.MATRIX
        .filter(function (r) { return r.status === CUR.COVERED || r.status === CUR.PARTIAL; })
        .map(lessonPlanForRow);
    }
    return cachedPlans;
  }

  function lessonPlanByTopicId(topicId) {
    const cleanId = (topicId || '').replace(/^lesson-/, '');
    const row = CUR.topicById(cleanId) || CUR.topicById(topicId);
    if (!row || row.status === CUR.GAP) return null;
    return lessonPlanForRow(row);
  }

  function seedLessonPlans() {
    return LESSON_PLANS;
  }

  // Seed plans keep their short ids ('1', '2', ...) or topicId; any other id falls back
  // to the curriculum-generated plans.
  function lessonPlanForTopic(topicId) {
    if (!topicId) return undefined;
    const cleanId = String(topicId).replace(/^lesson-/, '');
    const seed = LESSON_PLANS.find(plan => plan.topicId === topicId || plan.id === topicId || plan.topicId === cleanId);
    if (seed) return seed;
    const fromMatrix = lessonPlans().find(plan => plan.id === topicId || plan.topicId === topicId || plan.curriculumTopicId === cleanId || plan.topicId === cleanId);
    if (fromMatrix) return fromMatrix;
    return undefined;
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
      const li = function (x) {
        const text = typeof x === 'string' ? x : (x && x.titleHe ? x.titleHe + ': ' + x.bodyHe : '');
        return '<li>' + escapeHtml(text) + '</li>';
      };
      return '<article class="lesson-plan">'
        + '<h3>כיתה ' + escapeHtml(plan.grade) + '׳ · ' + escapeHtml(plan.curriculumTopic) + '</h3>'
        + '<h4>מטרות</h4><ul>' + (plan.goals || []).map(function (g) { return '<li>' + escapeHtml(g) + '</li>'; }).join('') + '</ul>'
        + '<h4>מהלך השיעור</h4><ol>' + (plan.steps || []).map(li).join('') + '</ol>'
        + '</article>';
    }).join('');
  }

  return {
    lessonPlans: lessonPlans,
    lessonPlanByTopicId: lessonPlanByTopicId,
    seedLessonPlans: seedLessonPlans,
    lessonPlanForTopic: lessonPlanForTopic,
    plansFor: plansFor,
    renderLessonPlansHtml: renderLessonPlansHtml,
  };
});
