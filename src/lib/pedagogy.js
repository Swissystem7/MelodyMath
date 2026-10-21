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

  const BANKS = (typeof module === 'object' && module.exports)
    ? require('./banks')
    : (typeof globalThis !== 'undefined' ? globalThis : {});

  const STRAND_TO_SKILLS = {
    numbers: ['counting', 'addition', 'subtraction', 'number_line', 'place_value', 'multiplication', 'division', 'word_problems'],
    fractions: ['basic_fractions', 'fractions'],
    decimals: ['decimals', 'percent'],
    geometry: ['geometry'],
    measure: ['measurement'],
    data: ['data'],
  };

  function bankIdsForRow(grade, strand) {
    if (typeof BANKS.itemsForGrade !== 'function') return [];
    const skills = STRAND_TO_SKILLS[strand] || [];
    return BANKS.itemsForGrade(grade)
      .filter(function (it) { return it.strand === strand || skills.indexOf(it.skill) !== -1; })
      .slice(0, 6)
      .map(function (it) { return it.id; });
  }

  // One topic, the same decision as buildLearnerPlan (#428). The four-step
  // list in #383 is this function's name with a different answer; callers
  // here get the card's topic, or the first playable row until that module loads.
  function learnerApi() {
    const g = typeof globalThis !== 'undefined' ? globalThis : {};
    if (typeof g.buildLearnerPlan === 'function') return g;
    if (typeof module === 'object' && module.exports) {
      try { return require('./learnerPlan'); } catch (e) { return null; }
    }
    return null;
  }
  function gradeOf(value) {
    const grades = typeof CUR.grades === 'function' ? CUR.grades() : [];
    const s = value == null ? '' : String(value).trim();
    return grades.indexOf(s) === -1 ? '' : s;
  }
  function perSkillArray(src) {
    const raw = src && src.perSkill;
    if (Array.isArray(raw)) return raw;
    if (!raw || typeof raw !== 'object') return null;
    return Object.keys(raw).map(function (skill) {
      const row = raw[skill] || {};
      return { skill: skill, total: row.total, correct: row.correct };
    });
  }
  function stepFrom(plan, row) {
    const topicRow = row || (CUR.MATRIX || []).filter(function (r) {
      return r.grade === plan.grade && r.topic === plan.topic;
    })[0] || null;
    return {
      order: 1,
      topicId: topicRow ? topicRow.topicId : '',
      curriculumTopic: plan ? plan.topic : (topicRow ? topicRow.topic : ''),
      strand: topicRow ? topicRow.strand : '',
      strandHe: topicRow && CUR.strandHe ? CUR.strandHe(topicRow.strand) : '',
      status: topicRow ? topicRow.status : '',
      statusHe: topicRow && CUR.statusHe ? CUR.statusHe(topicRow.status) : '',
      weeklyTargetItems: plan && plan.paceExpected ? plan.paceExpected : 3,
      bankItemIds: topicRow ? bankIdsForRow(topicRow.grade, topicRow.strand) : [],
      reasonHe: plan && (plan.adultLine || plan.childLine) ? (plan.adultLine || plan.childLine) : '',
    };
  }
  function buildStudentStudyPlan(reportOrStudent, grade) {
    const src = reportOrStudent && typeof reportOrStudent === 'object' && !Array.isArray(reportOrStudent) ? reportOrStudent : {};
    const name = src.name ? String(src.name).trim() : '';
    const api = learnerApi();
    if (api && typeof api.buildLearnerPlan === 'function') {
      const requested = grade != null && String(grade).trim() !== '' ? grade : src.grade;
      const plan = api.buildLearnerPlan({
        grade: requested, name: name, perSkill: perSkillArray(src),
        student: src.sessions ? src : src.student, sessions: src.sessions, now: src.now,
      });
      return {
        studentName: name, grade: plan.grade || '', weeklyGoalHe: plan.adultLine || '',
        steps: plan.ok && plan.topic ? [stepFrom(plan)] : [],
        disclaimerHe: plan.disclaimer || '', learner: plan, source: 'learnerPlan',
      };
    }
    const g = gradeOf(grade) || gradeOf(src.grade);
    const note = 'ספירה במכשיר הזה בלבד. לא ציון ולא אבחון.';
    if (!g) {
      return { studentName: name, grade: '', weeklyGoalHe: '', steps: [], disclaimerHe: note, learner: null, source: 'curriculum' };
    }
    const row = (CUR.rowsForGrade(g) || []).filter(function (r) { return r.status !== CUR.GAP; })[0] || null;
    return {
      studentName: name, grade: g,
      weeklyGoalHe: 'הקצב: 3 מפגשים של 8 דקות השבוע.',
      steps: row ? [stepFrom(null, row)] : [],
      disclaimerHe: note, learner: null, source: 'curriculum',
    };
  }
  function renderStudentStudyPlanHtml(plan) {
    const p = plan && typeof plan === 'object' ? plan : buildStudentStudyPlan({}, 'א');
    const api = learnerApi();
    if (p.learner && api && typeof api.renderLearnerPlanHtml === 'function') return api.renderLearnerPlanHtml(p.learner);
    const step = (p.steps || [])[0];
    return '<article class="mm-plan" dir="rtl"><p class="mm-plan-kicker">תוכנית אחת</p><h2>'
      + escapeHtml(step ? step.curriculumTopic : '') + '</h2><p>' + escapeHtml(p.weeklyGoalHe || '')
      + '</p><p>' + escapeHtml(p.disclaimerHe || '') + '</p></article>';
  }

  return {
    lessonPlans: lessonPlans,
    lessonPlanByTopicId: lessonPlanByTopicId,
    seedLessonPlans: seedLessonPlans,
    lessonPlanForTopic: lessonPlanForTopic,
    plansFor: plansFor,
    renderLessonPlansHtml: renderLessonPlansHtml,
    buildStudentStudyPlan: buildStudentStudyPlan,
    renderStudentStudyPlanHtml: renderStudentStudyPlanHtml,
  };
});
