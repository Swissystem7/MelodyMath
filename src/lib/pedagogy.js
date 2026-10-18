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

  const STUDY_PLAN_DISCLAIMER = 'תוכנית זו מסדרת סדר תרגול מומלץ מתוך סעיפי משרד החינוך לפי התשובות שנרשמו בטאבלט זה, ואינה אבחון או הצהרה על שליטה בחומר.';

  function extractPerSkill(reportOrStudent) {
    const src = reportOrStudent && typeof reportOrStudent === 'object' ? reportOrStudent : {};
    if (src.perSkill && typeof src.perSkill === 'object') return src.perSkill;
    const map = {};
    const sessions = Array.isArray(src.sessions) ? src.sessions : [];
    sessions.forEach(function (s) {
      if (!s || !Array.isArray(s.items)) return;
      s.items.forEach(function (it) {
        if (!it || !it.skill) return;
        if (!map[it.skill]) map[it.skill] = { total: 0, correct: 0, accuracy: 0 };
        map[it.skill].total += 1;
        if (it.correct) map[it.skill].correct += 1;
        map[it.skill].accuracy = map[it.skill].correct / map[it.skill].total;
      });
    });
    return map;
  }

  function bankIdsForRow(grade, strand) {
    if (typeof BANKS.itemsForGrade !== 'function') return [];
    const skills = STRAND_TO_SKILLS[strand] || [];
    return BANKS.itemsForGrade(grade)
      .filter(function (it) { return it.strand === strand || skills.indexOf(it.skill) !== -1; })
      .slice(0, 6)
      .map(function (it) { return it.id; });
  }

  // Builds a personalized study plan for one student and grade (א׳–ו׳) from
  // diagnostic / pre-post / practice history, prioritizing curriculum rows in
  // strands where accuracy is below 80% or not yet practiced (#357).
  function buildStudentStudyPlan(reportOrStudent, grade) {
    const src = reportOrStudent && typeof reportOrStudent === 'object' ? reportOrStudent : {};
    const validGrades = typeof CUR.grades === 'function' ? CUR.grades() : ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
    const g = validGrades.indexOf(grade) !== -1 ? grade : (validGrades.indexOf(src.grade) !== -1 ? src.grade : 'א');
    const perSkill = extractPerSkill(src);
    const rows = (typeof CUR.rowsForGrade === 'function' ? CUR.rowsForGrade(g) : [])
      .filter(function (r) { return r.status === CUR.COVERED || r.status === CUR.PARTIAL; });

    const scored = rows.map(function (row, idx) {
      const skills = STRAND_TO_SKILLS[row.strand] || [];
      let total = 0;
      let correct = 0;
      skills.forEach(function (sk) {
        const st = perSkill[sk];
        if (st && st.total > 0) {
          total += Number(st.total) || 0;
          correct += Number(st.correct) || 0;
        }
      });
      const accuracy = total > 0 ? correct / total : null;
      const priority = accuracy == null ? 0.5 : accuracy;
      return {
        row: row,
        idx: idx,
        accuracy: accuracy,
        priority: priority,
        needsFocus: accuracy == null || accuracy < 0.8,
      };
    });

    scored.sort(function (a, b) {
      if (a.needsFocus !== b.needsFocus) return a.needsFocus ? -1 : 1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.idx - b.idx;
    });

    const steps = scored.slice(0, 4).map(function (entry, i) {
      const r = entry.row;
      const ids = bankIdsForRow(g, r.strand);
      return {
        order: i + 1,
        topicId: r.topicId,
        curriculumTopic: r.topic,
        strand: r.strand,
        strandHe: CUR.strandHe(r.strand),
        status: r.status,
        statusHe: CUR.statusHe(r.status),
        accuracy: entry.accuracy,
        weeklyTargetItems: entry.accuracy != null && entry.accuracy < 0.6 ? 8 : 6,
        bankItemIds: ids,
        reasonHe: entry.accuracy == null
          ? 'טרם תורגל בטאבלט זה — מומלץ לפתוח באבחון קצר וב־6 פריטי בסיס'
          : ('דיוק נוכחי בתחום: ' + Math.round(entry.accuracy * 100) + '% — מומלץ תרגול מדורג עם רמז קולי/חזותי'),
      };
    });

    return {
      studentName: src.name ? String(src.name).trim() : '',
      grade: g,
      weeklyGoalHe: 'יעד שבועי מומלץ: 2–3 מפגשי תרגול קצרים (8–10 דקות) לפי הסדר שלהלן.',
      steps: steps,
      disclaimerHe: STUDY_PLAN_DISCLAIMER,
    };
  }

  function renderStudentStudyPlanHtml(plan) {
    const p = plan && typeof plan === 'object' ? plan : buildStudentStudyPlan({}, 'א');
    const who = p.studentName ? ('עבור ' + escapeHtml(p.studentName) + ' · ') : '';
    const items = (p.steps || []).map(function (st) {
      return '<li>'
        + '<strong>שלב ' + Number(st.order || 1) + ' — ' + escapeHtml(st.curriculumTopic) + '</strong> '
        + '<span class="tag">(' + escapeHtml(st.strandHe) + ' · ' + escapeHtml(st.statusHe) + ')</span>'
        + '<div>' + escapeHtml(st.reasonHe) + ' · יעד שבועי: ' + Number(st.weeklyTargetItems || 6) + ' פריטים'
        + (st.bankItemIds && st.bankItemIds.length ? ' · דוגמאות בבנק: <bdi dir="ltr">' + escapeHtml(st.bankItemIds.slice(0, 3).join(', ')) + '</bdi>' : '')
        + '</div>'
        + '</li>';
    }).join('');
    return '<section class="study-plan" dir="rtl">'
      + '<h3>תוכנית תרגול אישית · ' + who + 'כיתה ' + escapeHtml(p.grade) + '׳</h3>'
      + '<p class="study-plan-goal">' + escapeHtml(p.weeklyGoalHe || '') + '</p>'
      + (items ? '<ol class="study-plan-steps">' + items + '</ol>' : '<p class="note">אין סעיפים זמינים לכיתה זו.</p>')
      + '<p class="sheet-note">' + escapeHtml(p.disclaimerHe || STUDY_PLAN_DISCLAIMER) + '</p>'
      + '</section>';
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
