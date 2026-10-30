// MelodyMath — Age fit validator for elementary curriculum (Refs #665 req 6).
// Ensures each grade's exercises strictly respect developmental limits and Ministry boundaries,
// banning middle-school concepts (exponents, negative arithmetic, variables/slopes) from elementary school.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_AGE_FIT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const GRADE_LIMITS = Object.freeze({
    'א': { maxNum: 100, maxAnswer: 100, allowFractions: false, allowDecimals: false, allowPercents: false, allowMultDiv: false },
    'ב': { maxNum: 1000, maxAnswer: 1000, allowFractions: false, allowDecimals: false, allowPercents: false, allowMultDiv: true },
    'ג': { maxNum: 10000, maxAnswer: 10000, allowFractions: true, allowDecimals: false, allowPercents: false, allowMultDiv: true },
    'ד': { maxNum: 1000000, maxAnswer: 1000000, allowFractions: true, allowDecimals: false, allowPercents: false, allowMultDiv: true },
    'ה': { maxNum: Infinity, maxAnswer: Infinity, allowFractions: true, allowDecimals: true, allowPercents: false, allowMultDiv: true },
    'ו': { maxNum: Infinity, maxAnswer: Infinity, allowFractions: true, allowDecimals: true, allowPercents: true, allowMultDiv: true },
  });

  const MIDDLE_SCHOOL_PATTERNS = Object.freeze([
    { pattern: /חזקה|חזקות|\b\d+\^\d+\b/, reason: 'חזקות ושורשים שייכים לחטיבת הביניים' },
    { pattern: /שיפוע|פונקציה|פרבולה/, reason: 'פונקציות ושיפועים שייכים לחטיבת הביניים' },
    { pattern: /משוואה|משוואות|\b[xyz]\s*=/, reason: 'אלגברה ומשוואות עם נעלמים פורמליים שייכות לחטיבת הביניים' },
    { pattern: /מספרים שליליים|שלילי|\b-\d+\s*[×*÷]\s*-?\d+/, reason: 'חשבון עם מספרים שליליים שייך לחטיבת הביניים' },
    { pattern: /75:64|45:32|64:45|לפסינג/, reason: 'מונחים מורכבים או יחסי כיוונון שאינם מותאמים לילדים' },
  ]);

  function checkItemAgeFit(item, targetGrade) {
    if (!item) return { valid: false, violations: ['פריט לא מוגדר'] };
    const g = targetGrade || item.grade || 'א';
    const limits = GRADE_LIMITS[g] || GRADE_LIMITS['א'];
    const p = String(item.prompt || '');
    const violations = [];

    // 1. Check for middle school concepts in any elementary item
    MIDDLE_SCHOOL_PATTERNS.forEach(function (rule) {
      if (rule.pattern.test(p)) violations.push(rule.reason);
    });

    // 2. Extract numeric values from prompt (excluding clock times, dates, and ID strings)
    const cleanPrompt = p.replace(/\b\d{1,2}:\d{2}\b/g, '').replace(/mm-cur-\d+/g, '');
    const nums = cleanPrompt.match(/\b\d+(?:,\d{3})*\b/g) || [];
    nums.forEach(function (raw) {
      const val = Number(raw.replace(/,/g, ''));
      if (limits.maxNum !== Infinity && val > limits.maxNum) {
        violations.push('מספר ' + val + ' חורג מתחום כיתה ' + g + ' (מרבי: ' + limits.maxNum + ')');
      }
    });

    // 3. Check answer bounds
    if (typeof item.answer === 'number' && limits.maxAnswer !== Infinity && item.answer > limits.maxAnswer) {
      violations.push('תשובה ' + item.answer + ' חורגת מתחום כיתה ' + g + ' (מרבי: ' + limits.maxAnswer + ')');
    }

    // 4. Fractions check (exclude musical meter / time signature expressions such as 4/4 or 2/4 bar)
    const promptNoMeter = p.replace(/(?:תיבה|תיבות)(?:\s+של)?\s+[23456]\/4/g, '').replace(/\b[23456]\/4\b/g, '');
    if (!limits.allowFractions && /\b\d+\/\d+\b/.test(promptNoMeter)) {
      violations.push('שברים פשוטים אינם מורשים בכיתה ' + g);
    }

    // 5. Decimals check
    if (!limits.allowDecimals && /\b\d+\.\d+\b/.test(p)) {
      violations.push('שברים עשרוניים אינם מורשים בכיתה ' + g);
    }

    // 6. Percentages check
    if (!limits.allowPercents && /%|אחוז/.test(p)) {
      violations.push('אחוזים אינם מורשים בכיתה ' + g);
    }

    // 7. Multiplication/Division operators check (excluding Hebrew colon punctuation)
    if (!limits.allowMultDiv) {
      const hasMult = /[×*]/.test(p);
      const hasDiv = /[÷]|\s+:\s+\d/.test(p);
      if (hasMult || hasDiv) {
        violations.push('כפל וחילוק פורמליים אינם מורשים בכיתה ' + g);
      }
    }

    return {
      valid: violations.length === 0,
      violations: violations,
      grade: g,
    };
  }

  function auditBank(items) {
    const list = Array.isArray(items) ? items : [];
    const flagged = [];
    list.forEach(function (it) {
      const res = checkItemAgeFit(it, it.grade);
      if (!res.valid) {
        flagged.push({ id: it.id, grade: it.grade, prompt: it.prompt, violations: res.violations });
      }
    });
    return {
      total: list.length,
      validCount: list.length - flagged.length,
      flaggedCount: flagged.length,
      flagged: flagged,
      allValid: flagged.length === 0,
    };
  }

  return {
    GRADE_LIMITS: GRADE_LIMITS,
    MIDDLE_SCHOOL_PATTERNS: MIDDLE_SCHOOL_PATTERNS,
    checkItemAgeFit: checkItemAgeFit,
    auditBank: auditBank,
  };
});
