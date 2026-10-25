// MelodyMath — Child-Friendly Hebrew Language Pass (Refs #665, complements #677).
//
// Converts technical, clinical, diagnostic and musical jargon into warm,
// encouraging, accessible Hebrew phrasing appropriate for elementary school children (grades א–ו).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_CHILD_LANGUAGE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Map of adult / technical / clinical terms to friendly child terms.
  const CHILD_MAP = Object.freeze([
    // Diagnostic & clinical jargon
    [/אבחון קליני/g, ''],
    [/אבחון קצר/g, 'משחק היכרות'],
    [/אבחון/g, 'בדיקה קצרה'],
    [/מדגם לפי הכיתה שנבחרה/g, 'שאלות קצרות לכיתה שנבחרה'],
    [/מדגם קצר/g, 'בדיקה קצרה'],
    [/דוח הפערים/g, 'ההתקדמות שלי'],
    [/דוח פערים/g, 'ההתקדמות שלי'],
    [/מוקדי כשל/g, 'נושאים לחיזוק'],
    [/נקודת כשל/g, 'כדאי לחזק'],
    [/הוראה מתקנת/g, 'תרגול מותאם'],
    [/רמת בסיס/g, 'שלב ראשון'],
    [/רמת ביניים/g, 'שלב שני'],

    // Musical & physics jargon
    [/\bBPM\s*בסיום/gi, 'קצב בסיום'],
    [/·\s*\d+\s*BPM/gi, ''],
    [/\bBPM\b/gi, 'קצב'],
    [/\bHz\b/gi, 'צליל'],
    [/גובה על המסך ← תדר/g, 'גובה הצליל'],
    [/מחולל מקצב/g, 'יוצרים מקצב'],
    [/שומעים תדר ויוצרים מקצב/g, 'שומעים צלילים ויוצרים מקצב'],
  ]);

  const FORBIDDEN_CHILD_PATTERNS = Object.freeze([
    /\bM[1-6]\b/,
    /\bBPM\b/i,
    /\bHz\b/i,
    /\bADSR\b/i,
    /\bDOI\b/i,
    /אבחון קליני/,
    /מדגם קצר/,
    /דוח פערים/,
    /מוקדי כשל/,
    /הוראה מתקנת/,
    /טענת יעילות/,
    /ראיות חלשות/,
  ]);

  function simplifyForChild(text) {
    if (!text || typeof text !== 'string') return '';
    let res = text;
    CHILD_MAP.forEach(function (entry) {
      res = res.replace(entry[0], entry[1]);
    });
    // Clean up double spaces or trailing punctuation leftovers
    return res.replace(/\s{2,}/g, ' ').trim();
  }

  function isChildFriendly(text) {
    if (!text || typeof text !== 'string') return true;
    for (let i = 0; i < FORBIDDEN_CHILD_PATTERNS.length; i++) {
      if (FORBIDDEN_CHILD_PATTERNS[i].test(text)) return false;
    }
    return true;
  }

  return {
    CHILD_MAP: CHILD_MAP,
    FORBIDDEN_CHILD_PATTERNS: FORBIDDEN_CHILD_PATTERNS,
    simplifyForChild: simplifyForChild,
    isChildFriendly: isChildFriendly,
  };
});
