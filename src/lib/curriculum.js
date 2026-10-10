// MelodyMath — honest coverage of the official א׳–ו׳ programme.
//
// Every row is a topic the Ministry document names. Status is covered,
// partial, or gap. Gaps stay visible. This is not a marketing matrix.
//
// A row may only read 'covered' when banks.js actually ships tagged items for
// it. banks.js ships א׳–ד׳ only, so every ה׳/ו׳ row below is a gap.
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
    { grade: 'א', strand: 'geometry', topic: 'מיון מצולעים, קודקוד וצלע, פירוק והרכבה', status: GAP, note: 'גל 2' },
    { grade: 'א', strand: 'measure', topic: 'מדידת אורך (מתווך, ס״מ, סרגל)', status: GAP, note: 'גל 2' },
    { grade: 'א', strand: 'measure', topic: 'שעון אנלוגי בשעות שלמות', status: GAP, note: 'גל 2' },
    { grade: 'א', strand: 'data', topic: 'דיאגרמת עמודות ופיקטוגרם', status: GAP, note: 'גל 2' },

    { grade: 'ב', strand: 'numbers', topic: 'מספרים עד 1,000, מבנה עשרוני, זוגי/אי־זוגי', status: GAP, note: 'גל 2' },
    { grade: 'ב', strand: 'numbers', topic: 'חיבור וחיסור דו־ספרתי במאוזן ובמאונך עד 100', status: GAP, note: 'גל 2 — עיקר שעות כיתה ב׳' },
    { grade: 'ב', strand: 'numbers', topic: 'שליטה בכפולות 2, 4, 5, 10', status: COVERED, note: '3, 6, 7, 8, 9 חסומים עד שליטה בליבה' },
    { grade: 'ב', strand: 'numbers', topic: 'חילוק לחלקים ולהכלה על אותם מספרים', status: COVERED, note: 'בלי המונחים הפורמליים לתלמיד' },
    { grade: 'ב', strand: 'geometry', topic: 'פירוק והרכבה של מצולעים; זווית ישרה', status: GAP, note: 'גל 2' },
    { grade: 'ב', strand: 'measure', topic: 'ס״מ, היקף, נפח תיבות, חצאי שעות', status: GAP, note: 'גל 2' },
    { grade: 'ב', strand: 'data', topic: 'טבלה, עמודות, פיקטוגרם', status: GAP, note: 'גל 2' },

    { grade: 'ג', strand: 'numbers', topic: 'מספרים עד 10,000, מבנה עשרוני', status: GAP, note: 'גל 2' },
    { grade: 'ג', strand: 'numbers', topic: 'חיבור/חיסור במאוזן ובמאונך עד רבבה', status: GAP, note: 'גל 2' },
    { grade: 'ג', strand: 'numbers', topic: 'לוח כפל 10×10 (אחרי 2/4/5/10)', status: PARTIAL, note: '3, 6, 7, 8, 9 נפתחים אחרי השער; אין אלגוריתם כפל' },
    { grade: 'ג', strand: 'numbers', topic: 'חילוק עם שארית; כפל/חילוק ב־10, 100, 1,000', status: GAP, note: 'יש חילוק שלם בסיסי בלבד' },
    { grade: 'ג', strand: 'numbers', topic: 'שאלות השוואה כפליות ודו־שלביות', status: GAP, note: 'גל 2' },
    { grade: 'ג', strand: 'geometry', topic: 'זווית שטוחה/קהה/ישרה/חדה; מיון משולשים', status: GAP, note: 'גל 2' },
    { grade: 'ג', strand: 'measure', topic: 'שטח מלבן; שעות ודקות', status: GAP, note: 'גל 2' },
    { grade: 'ג', strand: 'data', topic: 'איסוף, ארגון, דיאגרמות', status: GAP, note: 'גל 2' },

    { grade: 'ד', strand: 'numbers', topic: 'מספרים עד מיליון; אלגוריתמים במאונך; סדר פעולות', status: GAP, note: 'גל 2+' },
    { grade: 'ד', strand: 'fractions', topic: 'שבר כחלק משלם — 1/2, 1/4, 1/8 מול תיבה 4/4', status: COVERED, note: 'הטענה הצרה היחידה; אין 1/3, אין השוואה, אין חיבור שברים' },
    { grade: 'ד', strand: 'fractions', topic: 'שבר כחלק מכמות; שמות שונים לשבר; השוואה; חיבור/חיסור שברים', status: GAP, note: 'לא נבנה — «חצי מ־8 = 4» אינו שבר' },
    { grade: 'ד', strand: 'geometry', topic: 'מקבילים, מאונכים, מרובעים, שטח פנים', status: GAP, note: 'גל 2' },
    { grade: 'ד', strand: 'measure', topic: 'יחידות אורך; זמן בלוח עברי/לועזי', status: GAP, note: 'גל 2' },
    { grade: 'ד', strand: 'data', topic: 'טבלאות ודיאגרמות כולל שברים', status: GAP, note: 'גל 2' },

    // Grades ה׳–ו׳ from Newprogramgrade5.pdf and Newprogramgrade6.pdf, read
    // 7.10.2026; the headers and the hour counts are recorded in
    // docs/CURRICULUM-MUSIC-PLAN.md §2 and §5. No bank exists for these grades
    // yet, so nothing here is covered or partial — the whole programme is a gap.
    { grade: 'ה', strand: 'numbers', topic: 'הכרת המספרים: ראשוניים, פריקים, פירוק לגורמים וסימני התחלקות', status: GAP, note: 'כ־23 ש׳ בתוכנית; אין בנק לכיתה ה׳' },
    { grade: 'ה', strand: 'fractions', topic: 'שברים: הרחבה, צמצום, השוואה, חיבור וחיסור במכנים שונים', status: GAP, note: 'כ־35 ש׳; ב־bar44 יש רק 1/2 · 1/4 · 1/8 מול תיבה אחת — לא מכנים שונים' },
    { grade: 'ה', strand: 'fractions', topic: 'שברים עשרוניים: קריאה, השוואה, חיבור וחיסור', status: GAP, note: 'כ־25 ש׳; אין פריט עשרוני בבנק' },
    { grade: 'ה', strand: 'geometry', topic: 'גאומטריה ומדידות: משולשים, גובה, שטח משולש ושטח מקבילית', status: GAP, note: 'כ־30 ש׳; geometryShapes.js הוא א׳–ג׳ ואינו מחובר לדף' },
    { grade: 'ה', strand: 'data', topic: 'חקר נתונים: טבלאות ודיאגרמות', status: GAP, note: 'כ־12 ש׳; dataViz.js אינו מחובר לדף' },

    { grade: 'ו', strand: 'numbers', topic: 'מספרים טבעיים ו־0; סדר פעולות', status: GAP, note: 'כ־15 ש׳; אין בנק לכיתה ו׳' },
    { grade: 'ו', strand: 'fractions', topic: 'שברים: משמעויות ופעולות — כפל וחילוק שברים', status: GAP, note: 'תחום השברים כ־62 ש׳; אין כפל או חילוק שברים בבנק' },
    { grade: 'ו', strand: 'fractions', topic: 'שברים עשרוניים: כפל וחילוק', status: GAP, note: 'כ־50 ש׳ מתוך תחום השברים' },
    { grade: 'ו', strand: 'fractions', topic: 'אחוזים', status: GAP, note: 'כ־12 ש׳ מתוך תחום השברים' },
    { grade: 'ו', strand: 'geometry', topic: 'גאומטריה ומדידות: מצולעים מורכבים, מעגל ועיגול — היקף ושטח', status: GAP, note: 'כ־29 ש׳ לגאומטריה ולמדידות' },
    { grade: 'ו', strand: 'measure', topic: 'נפח', status: GAP, note: 'בתוך כ־29 ש׳ הגאומטריה והמדידות' },
    { grade: 'ו', strand: 'data', topic: 'ממוצע', status: GAP, note: 'מופיע בקובץ כיתה ו׳; אין חישוב ממוצע בבנק' },
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
    return ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
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
