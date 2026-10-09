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
      goals: ['לספר עד 100 קדימה ואחורה', 'לבחור מספר כלשהו ולחזור ממנו'],
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
      goals: ['למיין עד 100', 'לקבץ ל־10'],
      steps: [
        'שימוש בדמויות לתרגול קיבוץ',
        'הצגת טבלאות קיבוץ',
        'אימון עם חפצים מلمוס'
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

  function lessonPlans() {
    return CUR.MATRIX
      .filter(function (r) { return r.status === CUR.COVERED || r.status === CUR.PARTIAL; })
      .map(lessonPlanForRow);
  }

  function lessonPlanByTopicId(topicId) {
    const row = CUR.topicById(topicId);
    if (!row || row.status === CUR.GAP) return null;
    return lessonPlanForRow(row);
  }

  function seedLessonPlans() {
    return LESSON_PLANS;
  }

  // Seed plans keep their short ids ('1', '2', ...); any other id falls back
  // to the curriculum-generated plans.
  function lessonPlanForTopic(topicId) {
    return LESSON_PLANS.find(plan => plan.id === topicId) || lessonPlanByTopicId(topicId);
  }

  return {
    lessonPlans: lessonPlans,
    lessonPlanByTopicId: lessonPlanByTopicId,
    seedLessonPlans: seedLessonPlans,
    lessonPlanForTopic: lessonPlanForTopic,
  };
});
