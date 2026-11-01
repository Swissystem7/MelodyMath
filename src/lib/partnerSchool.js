// MelodyMath — Partner School Pilot Protocol & Evaluation Module (Refs #17)
// Manages the 4-week structured trial protocol for partner schools and integration classes.
// Zero cloud dependency, honest metrics, no false efficacy claims.

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PartnerSchool = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PILOT_DURATION_WEEKS = 4;
  const RECOMMENDED_MAX_GROUP = 15;

  const PILOT_MILESTONES = [
    {
      week: 1,
      title: 'אבחון בסיס והיכרות',
      sessions: 2,
      durationMinutes: 8,
      goal: 'מדידת pre-check ללא מוזיקה, היכרות קצרה עם הממשק'
    },
    {
      week: 2,
      title: 'תרגול קצבי מונחה',
      sessions: 3,
      durationMinutes: 10,
      goal: 'הפעלת מצב כיתה בקבוצה קטנה (עד 15 תלמידים)'
    },
    {
      week: 3,
      title: 'חיזוק מוקדי קושי',
      sessions: 3,
      durationMinutes: 10,
      goal: 'תרגול מותאם לפי תחומי קושי ומעקב ב-teacherStore'
    },
    {
      week: 4,
      title: 'הערכת התקדמות וסיכום',
      sessions: 2,
      durationMinutes: 8,
      goal: 'מדידת post-check מקבילה והפקת דוח מסכם למנהל/ת'
    }
  ];

  function cleanString(str, maxLen) {
    const s = String(str == null ? '' : str).trim().replace(/\s+/g, ' ');
    return maxLen > 0 ? s.slice(0, maxLen) : s;
  }

  function createPilotPlan(config) {
    const cfg = config && typeof config === 'object' ? config : {};
    const schoolName = cleanString(cfg.schoolName, 80);
    const teacherName = cleanString(cfg.teacherName, 60);
    const grade = cleanString(cfg.grade, 20) || 'א-ג';
    let groupSize = Math.round(Number(cfg.groupSize));
    if (!Number.isFinite(groupSize) || groupSize < 1) groupSize = 5;
    if (groupSize > RECOMMENDED_MAX_GROUP) groupSize = RECOMMENDED_MAX_GROUP;

    return {
      schoolName: schoolName || 'בית ספר שותף',
      teacherName: teacherName || 'מחנכת שילוב',
      grade: grade,
      groupSize: groupSize,
      durationWeeks: PILOT_DURATION_WEEKS,
      createdAt: new Date().toISOString(),
      milestones: PILOT_MILESTONES.map(function (m) {
        return Object.assign({}, m, { completed: false, notes: '' });
      }),
      status: 'active'
    };
  }

  function evaluatePilotOutcomes(preScores, postScores) {
    const pre = Array.isArray(preScores) ? preScores.filter(Number.isFinite) : [];
    const post = Array.isArray(postScores) ? postScores.filter(Number.isFinite) : [];

    const preAvg = pre.length > 0 ? pre.reduce((a, b) => a + b, 0) / pre.length : null;
    const postAvg = post.length > 0 ? post.reduce((a, b) => a + b, 0) / post.length : null;

    let delta = null;
    if (preAvg !== null && postAvg !== null) {
      delta = Math.round((postAvg - preAvg) * 10) / 10;
    }

    return {
      sampleSizePre: pre.length,
      sampleSizePost: post.length,
      preAverage: preAvg !== null ? Math.round(preAvg * 10) / 10 : null,
      postAverage: postAvg !== null ? Math.round(postAvg * 10) / 10 : null,
      deltaAverage: delta,
      completedFullEvaluation: pre.length > 0 && post.length > 0
    };
  }

  function generatePilotSummaryText(plan, evaluation) {
    const p = plan || createPilotPlan();
    const ev = evaluation || evaluatePilotOutcomes([], []);
    const lines = [
      'דוח פיילוט בית ספר שותף — MelodyMath',
      '====================================',
      'מוסד: ' + p.schoolName,
      'מחנכת מובילה: ' + p.teacherName,
      'שכבת גיל: ' + p.grade + ' | גודל קבוצה: ' + p.groupSize + ' תלמידים',
      'משך הפיילוט: ' + p.durationWeeks + ' שבועות',
      ''
    ];

    if (ev.completedFullEvaluation) {
      lines.push('תוצאות הערכת טרום-מול-סיום:');
      lines.push('- ממוצע שאלון פתיחה (Pre-check): ' + ev.preAverage + '%');
      lines.push('- ממוצע שאלון סיום (Post-check): ' + ev.postAverage + '%');
      lines.push('- שינוי ממוצע: ' + (ev.deltaAverage >= 0 ? '+' : '') + ev.deltaAverage + '%');
    } else {
      lines.push('סטטוס הערכה: הפיילוט בעיצומו או שטרם הוזנו נתוני שאלון סיום.');
    }

    lines.push('');
    lines.push('הערה: הנתונים מעובדים באופן מקומי על גבי המכשיר ללא שמירת מידע בענן.');
    return lines.join('\n');
  }

  return {
    PILOT_DURATION_WEEKS: PILOT_DURATION_WEEKS,
    PILOT_MILESTONES: PILOT_MILESTONES,
    createPilotPlan: createPilotPlan,
    evaluatePilotOutcomes: evaluatePilotOutcomes,
    generatePilotSummaryText: generatePilotSummaryText
  };
});
