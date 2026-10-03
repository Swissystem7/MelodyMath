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

  return {
    lessonPlans: lessonPlans,
    lessonPlanByTopicId: lessonPlanByTopicId,
  };
});
