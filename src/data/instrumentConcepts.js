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

  // Listed in learning order. Ids reuse the catalogue TOPICS ids
  // (instruments.js) where one exists; addition and subtraction are new.
  // `example` is math notation: render it inside an LTR span (mathBidi.js).
  const CONCEPTS = Object.freeze([
    c('counting', 'מנייה', '1, 2, 3, 4', {
      percussion: 'מכה אחת לכל מספר: אחת, שתיים, שלוש, ארבע.',
      strings: 'פריטה אחת על המיתר לכל מספר שסופרים.',
      winds: 'נשיפה קצרה לכל מספר, בקצב קבוע ושקט.',
      keys: 'קליד אחד לכל מספר, צועדים בסדר אחד אחרי השני.',
    }),
    c('patterns', 'דגמים', 'חזק, חלש, חזק, חלש', {
      percussion: 'חזק, חלש, חזק, חלש, ומנחשים מה בא אחר כך.',
      strings: 'פריטה ארוכה, קצרה, ארוכה, קצרה, והדגם חוזר.',
      winds: 'ארוך, קצר, קצר, וחוזרים שוב על אותו דגם.',
      keys: 'צליל נמוך, צליל גבוה, ושוב נמוך וגבוה בתור.',
    }),
    c('addition', 'חיבור', '3 + 2', {
      percussion: 'שלוש מכות ועוד שתיים, ביחד חמש מכות על התוף.',
      strings: 'פורטים שלוש פעמים ועוד פעמיים, וסופרים חמש.',
      winds: 'שלוש נשיפות קצרות ועוד שתיים הן חמש נשיפות.',
      keys: 'לוחצים שלושה קלידים ועוד שניים, יש חמישה צלילים.',
    }),
    c('subtraction', 'חיסור', '5 − 2', {
      percussion: 'חמש מכות, לא מכים שתיים, ונשארות שלוש מכות.',
      strings: 'פורטים חמש פעמים, עוצרים שתיים, ונשמעות רק שלוש.',
      winds: 'חמש נשיפות, עוצרים שתיים, נשמעות רק שלוש.',
      keys: 'חמש אצבעות על הקלידים, מרימים שתיים, נשארות שלוש.',
    }),
    c('multiplication', 'כפל', '3 × 2', {
      percussion: 'שלוש קבוצות של שתי מכות, ביחד שש מכות.',
      strings: 'שלוש פעמים פורטים זוג, וסופרים שש פריטות.',
      winds: 'שתי נשיפות, שלוש פעמים ברצף, הן שש נשיפות.',
      keys: 'מנגנים זוג צלילים שלוש פעמים ושומעים שישה צלילים.',
    }),
    c('fractions', 'חצאים', '½', {
      percussion: 'בזמן של מכה אחת מכים פעמיים, כל מכה היא חצי.',
      strings: 'פריטה ארוכה אחת שווה לשתי פריטות של חצי.',
      winds: 'נשיפה ארוכה אחת מתחלקת לשתי נשיפות קצרות, כל אחת חצי.',
      keys: 'צליל ארוך אחד לוקח זמן כמו שני חצאים קצרים.',
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
