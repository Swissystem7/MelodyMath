// MelodyMath — Vendor Portfolio & Ministry Readiness Audit Module (Refs #18)
// Formalizes compliance checklist and self-audit for Ministry of Education digital content catalog.
// Pure local JS, zero dependencies.

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VendorPortfolio = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VENDOR_REQUIREMENTS = [
    {
      id: 'privacy_zero_backend',
      category: 'privacy',
      title: 'הגנת פרטיות ואפס איסוף מידע בענן',
      description: 'כל המידע נשמר מקומית במכשיר בלבד (localStorage), ללא משלוח שמות או ציונים לשרת ענן',
      mandatory: true
    },
    {
      id: 'accessibility_is5568_aa',
      category: 'accessibility',
      title: 'תקן נגישות ישראלי 5568 רמה AA',
      description: 'תמיכה מלאה בהקראת מסך, ניגודיות גבוהה, אזורי מגע מינימליים של 44/48 פיקסלים והתאמה לתנועה מופחתת',
      mandatory: true
    },
    {
      id: 'curriculum_mapping',
      category: 'pedagogy',
      title: 'מיפוי תוכנית לימודים תשפ"ד וראמ"ה',
      description: 'בנק תרגילים ופעילויות ממופה ומותאם לשכבות א-ו עם דגש על מוקדי קושי מאובחנים',
      mandatory: true
    },
    {
      id: 'no_paywall_honesty',
      category: 'ethics',
      title: 'היעדר מודל נעילה מסחרי (Honesty Rule)',
      description: 'איסור על התניית תוכן בתוכן או הבטחות שווא לימודיות בממשק התלמיד',
      mandatory: true
    },
    {
      id: 'licensed_assets',
      category: 'legal',
      title: 'רישוי קבצים וצלילים',
      description: 'כל קובצי המוזיקה, הגופנים והסמלים תחת רישיונות פתוחים או מקוריים מתועדים',
      mandatory: true
    }
  ];

  function getVendorPortfolioChecklist() {
    return VENDOR_REQUIREMENTS.map(function (req) {
      return Object.assign({}, req);
    });
  }

  function auditVendorReadiness(state) {
    const s = state && typeof state === 'object' ? state : {};
    const checks = VENDOR_REQUIREMENTS.map(function (req) {
      const isPassed = Boolean(s[req.id]);
      return {
        id: req.id,
        category: req.category,
        title: req.title,
        passed: isPassed,
        mandatory: req.mandatory
      };
    });

    const passedMandatory = checks.filter(function (c) {
      return c.mandatory && c.passed;
    }).length;
    const totalMandatory = checks.filter(function (c) {
      return c.mandatory;
    }).length;

    const readinessScore = totalMandatory > 0 ? Math.round((passedMandatory / totalMandatory) * 100) : 0;
    const isReady = readinessScore === 100;

    return {
      checks: checks,
      passedMandatory: passedMandatory,
      totalMandatory: totalMandatory,
      readinessScore: readinessScore,
      isReadyForSubmission: isReady,
      auditTimestamp: new Date().toISOString()
    };
  }

  function formatVendorSummaryText(audit) {
    const a = audit || auditVendorReadiness({});
    const lines = [
      'תיק ספק — מבדק מוכנות למכרז תוכן דיגיטלי (MelodyMath)',
      '====================================================',
      'ציון מוכנות דרישות סף: ' + a.readinessScore + '%',
      'סטטוס הגשה: ' + (a.isReadyForSubmission ? 'מוכן להגשה' : 'נדרשת השלמת דרישות חובה'),
      '',
      'פירוט דרישות סף:'
    ];

    a.checks.forEach(function (c) {
      const mark = c.passed ? '[V]' : '[X]';
      lines.push(mark + ' ' + c.title + ' (' + c.category + ')');
    });

    return lines.join('\n');
  }

  return {
    VENDOR_REQUIREMENTS: VENDOR_REQUIREMENTS,
    getVendorPortfolioChecklist: getVendorPortfolioChecklist,
    auditVendorReadiness: auditVendorReadiness,
    formatVendorSummaryText: formatVendorSummaryText
  };
});
