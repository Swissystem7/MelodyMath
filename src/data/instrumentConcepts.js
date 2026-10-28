// MelodyMath — how each math concept "lives" in each instrument family
// (Refs #673, #665). Content only: no engine, no UI wiring.
//
// Family ids are the #591/#623 family ids from src/lib/instruments.js
// (FAMILIES) and every `instruments` entry is an existing instrument id from
// that catalogue (INSTRUMENTS), so names and facts are not duplicated here.
// Each line is one short Hebrew sentence for a child: at most 12 words,
// no technical labels and no latin letters.
(function (root) {
  'use strict';

  const FAMILIES = Object.freeze([
    Object.freeze({ id: 'percussion', he: 'תופים', instruments: Object.freeze(['darbuka', 'djembe', 'tabla', 'cajon']) }),
    Object.freeze({ id: 'strings', he: 'מיתרים', instruments: Object.freeze(['oud', 'guitar', 'violin', 'ukulele']) }),
    Object.freeze({ id: 'winds', he: 'כלי נשיפה', instruments: Object.freeze(['recorder', 'shofar', 'panFlute', 'ney']) }),
    Object.freeze({ id: 'keys', he: 'קלידים', instruments: Object.freeze(['piano', 'accordion', 'harmonium']) }),
  ]);

  function c(id, he, example, lines) {
    return Object.freeze({ id, he, example, lines: Object.freeze(lines) });
  }

  const CONCEPTS = Object.freeze([
    c('addition', 'חיבור', '3 + 2', {
      percussion: 'שלוש מכות ועוד שתיים, ביחד חמש מכות על התוף.',
      strings: 'פורטים שלוש פעמים, עוד שתיים, וסופרים חמש.',
      winds: 'שלוש נשיפות קצרות ועוד שתיים הן חמש נשיפות.',
      keys: 'לוחצים שלושה קלידים ועוד שניים, יש חמישה צלילים.',
    }),
    c('subtraction', 'חיסור', '5 − 2', {
      percussion: 'חמש מכות, שתיים נעלמות, ונשארות שלוש מכות.',
      strings: 'חמישה מיתרים מנגנים, משתיקים שניים, שלושה ממשיכים.',
      winds: 'חמש נשיפות, עוצרים שתיים, נשמעות רק שלוש.',
      keys: 'חמש אצבעות על הקלידים, מרימים שתיים, נשארות שלוש.',
    }),
    c('multiplication', 'כפל', '3 × 2', {
      percussion: 'שלוש קבוצות של שתי מכות, ביחד שש מכות.',
      strings: 'פורטים פעמיים, שלוש פעמים ברצף, וסופרים שש.',
      winds: 'שתי נשיפות שוב ושוב, שלוש פעמים, הן שש.',
      keys: 'מנגנים זוג צלילים שלוש פעמים ושומעים שישה צלילים.',
    }),
    c('halves', 'חצאים', '½', {
      percussion: 'מכה ארוכה אחת שווה לשתי מכות קצרות.',
      strings: 'אוחזים באמצע המיתר, וחצי מיתר שר צליל גבוה.',
      winds: 'נשיפה ארוכה אחת מתחלקת לשתי נשיפות חצי.',
      keys: 'צליל ארוך אחד או שני צלילים קצרים, באותו זמן.',
    }),
    c('counting', 'מנייה', '1, 2, 3, 4', {
      percussion: 'מכה אחת לכל מספר: אחת, שתיים, שלוש, ארבע.',
      strings: 'פריטה אחת על המיתר לכל מספר שסופרים.',
      winds: 'נשיפה קצרה לכל מספר, בקצב קבוע ושקט.',
      keys: 'קליד אחד לכל מספר, צועדים ימינה בסדר.',
    }),
    c('patterns', 'סדרות', '2, 4, 6, 8', {
      percussion: 'חזק, חלש, חזק, חלש, ומנחשים מה בא אחר כך.',
      strings: 'קופצים בכל פעם שני מיתרים, והסדרה ממשיכה.',
      winds: 'ארוך, קצר, קצר, וחוזרים שוב על אותה תבנית.',
      keys: 'מדלגים על קליד אחד בכל צעד, שתיים, ארבע, שש.',
    }),
  ]);

  function lineFor(conceptId, familyId) {
    const concept = CONCEPTS.find(function (x) { return x.id === conceptId; });
    return concept ? concept.lines[familyId] || null : null;
  }

  const api = Object.freeze({ FAMILIES, CONCEPTS, lineFor });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_INSTRUMENT_CONCEPTS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
