// MelodyMath — honest coverage of the official א׳–ד׳ programme.
//
// Every row is a topic the Ministry document names. Status is covered,
// partial, or gap. Gaps stay visible. This is not a marketing matrix.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const COVERED = 'covered';
  const PARTIAL = 'partial';
  const GAP = 'gap';

  const STATUS_HE = {
    covered: 'מכוסה',
    partial: 'חלקי',
    gap: 'לא מכוסה',
  };

  const STRAND_HE = {
    numbers: 'מספרים ופעולות',
    fractions: 'שברים',
    geometry: 'גאומטריה',
    measure: 'מדידות',
    data: 'חקר נתונים',
  };

  // Official topics from Newprogramgrade1–4.pdf (read 13.8.2026).
  const MATRIX = [
    { grade: 'א', strand: 'numbers', topic: 'ספירה עד 100 קדימה ואחורה ממספר כלשהו', status: COVERED, note: 'כולל אחורה ודילוגי 2 מ־50 ודילוגי 5' },
    { grade: 'א', strand: 'numbers', topic: 'מנייה עד 100, קיבוץ ל־10', status: COVERED, note: 'קיבוץ לעשרות; אין אומדן פתוח' },
    { grade: 'א', strand: 'numbers', topic: 'ישר המספרים — מיקום מדויק ומקורב עד 100', status: COVERED, note: 'ישר אינטראקטיבי 0–20 ו־0–100' },
    { grade: 'א', strand: 'numbers', topic: 'חיבור וחיסור בתחום 10 ואז 20; פירוקי 10; = משמאל; יותר משני מחוברים', status: COVERED, note: 'תרגול סגור, לא אסטרטגיה נלמדת' },
    { grade: 'א', strand: 'numbers', topic: 'חיבור וחיסור בעשרות שלמות עד 100', status: COVERED, note: '20+60 ודומיהם' },
    { grade: 'א', strand: 'numbers', topic: 'קריאה וכתיבה של מספרים, לוח מאה, שם־מספר', status: GAP, note: 'גל 2' },
    { grade: 'א', strand: 'numbers', topic: 'סדרות דגמים צורניים + יצירת סדרה', status: PARTIAL, note: 'יש דילוג מספרי; אין דגם צורני' },
    { grade: 'א', strand: 'numbers', topic: 'מצבי חיבור/חיסור מחיי יום־יום (איסוף, הוספה, הפרדה, גריעה)', status: PARTIAL, note: 'חלק מהניסוחים מוזיקליים; אין טיפולוגיה מלאה' },
    { grade: 'א', strand: 'geometry', topic: 'מיון מצולעים, קודקוד וצלע, פירוק והרכבה', status: PARTIAL, note: 'מיון לפי צלעות וקודקודים וזווית ישרה; אין פירוק והרכבה' },
    { grade: 'א', strand: 'measure', topic: 'מדידת אורך (מתווך, ס״מ, סרגל)', status: COVERED, note: 'קוביות אורך ואז ס״מ בסרגל מצויר' },
    { grade: 'א', strand: 'measure', topic: 'שעון אנלוגי בשעות שלמות', status: COVERED, note: 'שעון מצויר בשעות שלמות' },
    { grade: 'א', strand: 'data', topic: 'דיאגרמת עמודות ופיקטוגרם', status: GAP, note: 'גל 2' },

    { grade: 'ב', strand: 'numbers', topic: 'מספרים עד 1,000, מבנה עשרוני, זוגי/אי־זוגי', status: PARTIAL, note: 'מאות/עשרות/יחידות כשלושה כלים, זוגי/אי־זוגי בשמיעה, השוואה; אין קריאה וכתיבה של שם־מספר' },
    { grade: 'ב', strand: 'numbers', topic: 'חיבור וחיסור דו־ספרתי במאוזן ובמאונך עד 100', status: PARTIAL, note: 'מאוזן ומאונך, עם וללא מעבר עשרות (תוף = יחידות, בס = עשרות); אין אסטרטגיות חישוב בעל־פה' },
    { grade: 'ב', strand: 'numbers', topic: 'שליטה בכפולות 2, 4, 5, 10', status: COVERED, note: '3, 6, 7, 8, 9 חסומים עד שליטה בליבה' },
    { grade: 'ב', strand: 'numbers', topic: 'חילוק לחלקים ולהכלה על אותם מספרים', status: COVERED, note: 'בלי המונחים הפורמליים לתלמיד' },
    { grade: 'ב', strand: 'geometry', topic: 'פירוק והרכבה של מצולעים; זווית ישרה', status: PARTIAL, note: 'זווית ישרה ומיון מצולעים; אין פירוק והרכבה' },
    { grade: 'ב', strand: 'measure', topic: 'ס״מ, היקף, נפח תיבות, חצאי שעות', status: PARTIAL, note: 'ס״מ בסרגל, היקף, חצאי שעות; אין נפח תיבות' },
    { grade: 'ב', strand: 'data', topic: 'טבלה, עמודות, פיקטוגרם', status: GAP, note: 'גל 2' },

    { grade: 'ג', strand: 'numbers', topic: 'מספרים עד 10,000, מבנה עשרוני', status: PARTIAL, note: 'השוואת תדרים בהרץ וערך המקום עד 10,000; אין עדיין ישר מספרים עד רבבה' },
    { grade: 'ג', strand: 'numbers', topic: 'חיבור/חיסור במאוזן ובמאונך עד רבבה', status: GAP, note: 'גל 2' },
    { grade: 'ג', strand: 'numbers', topic: 'לוח כפל 10×10 (אחרי 2/4/5/10)', status: PARTIAL, note: '3, 6, 7, 8, 9 נפתחים אחרי השער; אין אלגוריתם כפל' },
    { grade: 'ג', strand: 'numbers', topic: 'חילוק עם שארית; כפל/חילוק ב־10, 100, 1,000', status: PARTIAL, note: 'פעימות שנשארות מחוץ לתיבה, תשובה בצורה 3 שארית 2; אין עדיין כפל/חילוק ב־10, 100, 1,000' },
    { grade: 'ג', strand: 'numbers', topic: 'שאלות השוואה כפליות ודו־שלביות', status: PARTIAL, note: 'פי כמה — טמפו ואוקטבות; אין עדיין שאלות דו־שלביות' },
    { grade: 'ג', strand: 'geometry', topic: 'זווית שטוחה/קהה/ישרה/חדה; מיון משולשים', status: COVERED, note: 'סוגי זוויות במעלות ובשעון; משולשים לפי זוויות ולפי צלעות; בלי מדידה במד־זווית' },
    { grade: 'ג', strand: 'measure', topic: 'שטח מלבן; שעות ודקות', status: COVERED, note: 'שטח במשבצות ובסמ״ר; דקות ומשך זמן — בכתב, בלי שעון דקות מצויר' },
    { grade: 'ג', strand: 'data', topic: 'איסוף, ארגון, דיאגרמות', status: GAP, note: 'גל 2' },

    { grade: 'ד', strand: 'numbers', topic: 'מספרים עד מיליון; אלגוריתמים במאונך; סדר פעולות', status: GAP, note: 'גל 2+' },
    { grade: 'ד', strand: 'fractions', topic: 'שבר כחלק משלם — 1/2, 1/4, 1/8 מול תיבה 4/4', status: COVERED, note: 'הטענה הצרה היחידה; אין 1/3, אין השוואה, אין חיבור שברים' },
    { grade: 'ד', strand: 'fractions', topic: 'שבר כחלק מכמות; שמות שונים לשבר; השוואה; חיבור/חיסור שברים', status: GAP, note: 'לא נבנה — «חצי מ־8 = 4» אינו שבר' },
    { grade: 'ד', strand: 'geometry', topic: 'מקבילים, מאונכים, מרובעים, שטח פנים', status: PARTIAL, note: 'מקבילים, מאונכים, מיון מרובעים, פאות ומקצועות של תיבה; אין חישוב שטח פנים' },
    { grade: 'ד', strand: 'measure', topic: 'יחידות אורך; זמן בלוח עברי/לועזי', status: PARTIAL, note: 'מ״מ, ס״מ, מטר, ק״מ; גרם וק״ג; מ״ל וליטר; לוח לועזי; אין לוח עברי' },
    { grade: 'ד', strand: 'data', topic: 'טבלאות ודיאגרמות כולל שברים', status: GAP, note: 'גל 2' },
  ];

  function statusHe(s) {
    return STATUS_HE[s] || s;
  }

  function strandHe(s) {
    if (typeof s !== 'string') return STRAND_HE.numbers;
    return STRAND_HE[s] || s;
  }

  function rowsForGrade(grade) {
    return MATRIX.filter(function (r) { return r.grade === grade; });
  }

  function gapTopicsForGrade(grade) {
    return rowsForGrade(grade).filter(function (r) { return r.status === GAP; });
  }

  function summaryForGrade(grade) {
    const rows = rowsForGrade(grade);
    const out = { grade: grade, total: rows.length, covered: 0, partial: 0, gap: 0 };
    rows.forEach(function (r) { out[r.status] += 1; });
    return out;
  }

  function coverageMatrix() {
    return MATRIX.map(function (r) {
      return {
        grade: r.grade,
        strand: r.strand,
        strandHe: strandHe(r.strand),
        topic: r.topic,
        status: r.status,
        statusHe: statusHe(r.status),
        note: r.note,
      };
    });
  }

  function grades() {
    return ['א', 'ב', 'ג', 'ד'];
  }

  return {
    COVERED: COVERED,
    PARTIAL: PARTIAL,
    GAP: GAP,
    STATUS_HE: STATUS_HE,
    STRAND_HE: STRAND_HE,
    MATRIX: MATRIX,
    statusHe: statusHe,
    strandHe: strandHe,
    rowsForGrade: rowsForGrade,
    summaryForGrade: summaryForGrade,
    coverageMatrix: coverageMatrix,
    grades: grades,
    gapTopicsForGrade: gapTopicsForGrade,
  };
});
