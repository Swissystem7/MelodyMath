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
    { grade: 'א', strand: 'numbers', topic: 'ספירה עד 100 קדימה ואחורה ממספר כלשהו', status: COVERED, note: 'כולל אחורה ודילוגי 2 מ־50 ודילוגי 5; «ספור את הפעמות» — המטרונום מדגיש כל פעמה n בדילוגי 2/5/10 (grade1Music)' },
    { grade: 'א', strand: 'numbers', topic: 'מנייה עד 100, קיבוץ ל־10', status: COVERED, note: 'קיבוץ לעשרות; אין אומדן פתוח' },
    { grade: 'א', strand: 'numbers', topic: 'ישר המספרים — מיקום מדויק ומקורב עד 100', status: COVERED, note: 'ישר אינטראקטיבי 0–20 ו־0–100; כל קפיצה היא צעד בסולם וקפיצה של 10 היא אוקטבה (numberLine)' },
    { grade: 'א', strand: 'numbers', topic: 'חיבור וחיסור בתחום 10 ואז 20; פירוקי 10; = משמאל; יותר משני מחוברים', status: COVERED, note: 'תרגול סגור, לא אסטרטגיה נלמדת' },
    { grade: 'א', strand: 'numbers', topic: 'חיבור וחיסור בעשרות שלמות עד 100', status: COVERED, note: '20+60 ודומיהם' },
    { grade: 'א', strand: 'numbers', topic: 'קריאה וכתיבה של מספרים, לוח מאה, שם־מספר', status: COVERED, note: 'לוח מאה עם צלילי עשרות ויחידות (grade1Music)' },
    { grade: 'א', strand: 'numbers', topic: 'סדרות דגמים צורניים + יצירת סדרה', status: COVERED, note: 'סדרות צליליות וצורניות AB, AAB, ABC (grade1Music)' },
    { grade: 'א', strand: 'numbers', topic: 'מצבי חיבור/חיסור מחיי יום־יום (איסוף, הוספה, הפרדה, גריעה)', status: PARTIAL, note: 'חלק מהניסוחים מוזיקליים; אין טיפולוגיה מלאה' },
    { grade: 'א', strand: 'geometry', topic: 'מיון מצולעים, קודקוד וצלע, פירוק והרכבה', status: PARTIAL, note: 'מיון לפי צלעות וקודקודים וזווית ישרה; אין פירוק והרכבה' },
    { grade: 'א', strand: 'measure', topic: 'מדידת אורך (מתווך, ס״מ, סרגל)', status: COVERED, note: 'קוביות אורך ואז ס״מ בסרגל מצויר' },
    { grade: 'א', strand: 'measure', topic: 'שעון אנלוגי בשעות שלמות', status: COVERED, note: 'שעון מצויר בשעות שלמות' },
    { grade: 'א', strand: 'data', topic: 'דיאגרמת עמודות ופיקטוגרם', status: GAP, note: 'גל 2' },

    { grade: 'ב', strand: 'numbers', topic: 'מספרים עד 1,000, מבנה עשרוני, זוגי/אי־זוגי', status: COVERED, note: 'מאות/עשרות/יחידות, זוגי/אי־זוגי והשוואה; גם בלי מוזיקה. «זוגי או אי־זוגי בשמיעה» — האם המקצב נגמר בזוג שלם (grade2Music)' },
    { grade: 'ב', strand: 'numbers', topic: 'חיבור וחיסור דו־ספרתי במאוזן ובמאונך עד 100', status: COVERED, note: 'במאוזן ובמאונך, עם וללא מעבר עשרות; במאונך היחידות בתוף והעשרות בבס, ופריטה = 10 מכות תוף מול צליל בס אחד (grade2Music)' },
    { grade: 'ב', strand: 'numbers', topic: 'שליטה בכפולות 2, 4, 5, 10', status: COVERED, note: '3, 6, 7, 8, 9 חסומים עד שליטה בליבה; «תיבות × פעמות» עם הדגשה על פעימה ראשונה בכל תיבה (grade2Music)' },
    { grade: 'ב', strand: 'numbers', topic: 'חילוק לחלקים ולהכלה על אותם מספרים', status: COVERED, note: 'בלי המונחים הפורמליים לתלמיד' },
    { grade: 'ב', strand: 'geometry', topic: 'פירוק והרכבה של מצולעים; זווית ישרה', status: PARTIAL, note: 'זווית ישרה ומיון מצולעים; אין פירוק והרכבה' },
    { grade: 'ב', strand: 'measure', topic: 'ס״מ, היקף, חצאי שעות', status: COVERED, note: 'ס״מ בסרגל, היקף מצולע, וחצאי שעות — «חצי שעה = חצי תיבה» עם חצי תיבה חזק וחצי חלש (grade2Music)' },
    { grade: 'ב', strand: 'measure', topic: 'נפח תיבות — מנייה של קוביות', status: GAP, note: 'אין בבנק; לפי התוכנית (§5) הנושא הזה לא מקבל קישור מוזיקלי' },
    { grade: 'ב', strand: 'data', topic: 'טבלה, עמודות, פיקטוגרם', status: PARTIAL, note: 'קריאת פיקטוגרם ודיאגרמת עמודות; אין טבלה' },

    { grade: 'ג', strand: 'numbers', topic: 'מספרים עד 10,000, מבנה עשרוני', status: PARTIAL, note: 'השוואת שני תדרים ארבע־ספרתיים ומקום האלפים; אין פריסה מלאה של המבנה העשרוני' },
    { grade: 'ג', strand: 'numbers', topic: 'חיבור/חיסור במאוזן ובמאונך עד רבבה', status: GAP, note: 'גל 2' },
    { grade: 'ג', strand: 'numbers', topic: 'לוח כפל 10×10 (אחרי 2/4/5/10)', status: PARTIAL, note: '3, 6, 7, 8, 9 נפתחים אחרי השער; לוח 3 נשמע ב־3/4 ולוח 6 ב־6/8; אין אלגוריתם כפל' },
    { grade: 'ג', strand: 'numbers', topic: 'חילוק עם שארית; כפל/חילוק ב־10, 100, 1,000', status: PARTIAL, note: 'שארית כפעמות שנשארו מחוץ לתיבה, בתשובה «3 שארית 2»; אין ×÷ ב־10/100/1,000' },
    { grade: 'ג', strand: 'numbers', topic: 'שאלות השוואה כפליות ודו־שלביות', status: PARTIAL, note: '«פי כמה» בין שני טמפו ובין שני תדרים במרחק אוקטבה; אין שאלות דו־שלביות' },
    { grade: 'ג', strand: 'geometry', topic: 'זווית שטוחה/קהה/ישרה/חדה; מיון משולשים', status: COVERED, note: 'סוגי זוויות במעלות ובשעון; משולשים לפי זוויות ולפי צלעות; בלי מדידה במד־זווית' },
    { grade: 'ג', strand: 'measure', topic: 'שטח מלבן; שעות ודקות', status: COVERED, note: 'שטח במשבצות ובסמ״ר; דקות ומשך זמן — בכתב, בלי שעון דקות מצויר' },
    { grade: 'ג', strand: 'data', topic: 'איסוף, ארגון, דיאגרמות', status: GAP, note: 'גל 2' },

    { grade: 'ד', strand: 'numbers', topic: 'מספרים עד מיליון; אלגוריתמים במאונך; סדר פעולות', status: GAP, note: 'גל 2+' },
    { grade: 'ד', strand: 'fractions', topic: 'שבר כחלק משלם — 1/2, 1/4, 1/8 מול תיבה 4/4', status: COVERED, note: 'הטענה הצרה היחידה; כולל השוואת משכים ושברים שווי ערך' },
    { grade: 'ד', strand: 'fractions', topic: 'שבר כחלק מכמות; שמות שונים לשבר; השוואה; חיבור/חיסור שברים', status: GAP, note: 'לא נבנה — «חצי מ־8 = 4» אינו שבר' },
    { grade: 'ד', strand: 'geometry', topic: 'מקבילים, מאונכים, מרובעים, שטח פנים', status: PARTIAL, note: 'מקבילים, מאונכים, מיון מרובעים, פאות ומקצועות של תיבה; אין חישוב שטח פנים' },
    { grade: 'ד', strand: 'measure', topic: 'יחידות אורך; זמן בלוח עברי/לועזי', status: PARTIAL, note: 'מ״מ, ס״מ, מטר, ק״מ; גרם וק״ג; מ״ל וליטר; לוח לועזי; אין לוח עברי' },
    { grade: 'ד', strand: 'data', topic: 'טבלאות ודיאגרמות כולל שברים', status: GAP, note: 'גל 2' },

    // ה׳–ו׳: topic headings from Newprogramgrade5.pdf / Newprogramgrade6.pdf
    // (read 7.10.2026, docs/CURRICULUM-MUSIC-PLAN.md §2). Status is what the
    // ה/ו bank holds now; a music-only item does not make a topic covered (R4).
    { grade: 'ה', strand: 'numbers', topic: 'ראשוניים ופריקים; פירוק לגורמים; סימני התחלקות', status: PARTIAL, note: 'מחלקים וכפולה משותפת דרך משקלים ותופים שנפגשים; אין המונחים ראשוני/פריק, אין פירוק לגורמים ואין סימני התחלקות' },
    { grade: 'ה', strand: 'fractions', topic: 'הרחבה, צמצום והשוואה של שברים', status: COVERED, note: 'הרחבה, צמצום עד הסוף, השוואה במכנים שונים — גם בלי מוזיקה' },
    { grade: 'ה', strand: 'fractions', topic: 'חיבור וחיסור שברים במכנים שונים', status: COVERED, note: 'תרגילים בלי מוזיקה ותיבה מעורבת (1/4 + 1/8 + 1/16); מספרים מעורבים — מעבר לשבר לא אמיתי וחזרה, השוואה וחיבור/חיסור בניסוח מילולי' },
    { grade: 'ה', strand: 'fractions', topic: 'שבר מכמות', status: COVERED, note: '3 פריטים בלבד, כולם בלי מוזיקה' },
    { grade: 'ה', strand: 'decimals', topic: 'שברים עשרוניים: ערך מקום, השוואה, מעבר משבר פשוט', status: COVERED, note: 'עשיריות ומאיות; שניות לפעימה (60/BPM) כהקשר מוזיקלי' },
    { grade: 'ה', strand: 'decimals', topic: 'חיבור וחיסור שברים עשרוניים', status: COVERED, note: 'כולל שאלת עודף בשקלים; אין חיבור במאונך' },
    { grade: 'ה', strand: 'geometry', topic: 'משולשים, גובה, שטח משולש ומקבילית', status: GAP, note: 'אין פריטי גאומטריה לכיתה ה׳ בבנק' },
    { grade: 'ה', strand: 'data', topic: 'קריאה ופרשנות של דיאגרמות', status: PARTIAL, note: 'קריאת דיאגרמת עמודות של תדרים בהרץ בלבד; אין איסוף, ארגון או בניית דיאגרמה' },

    { grade: 'ו', strand: 'numbers', topic: 'מספרים טבעיים ו־0; סדר פעולות', status: GAP, note: 'אין פריטים לכיתה ו׳ בתחום' },
    { grade: 'ו', strand: 'fractions', topic: 'כפל וחילוק שברים', status: COVERED, note: 'תרגילים בלי מוזיקה; תו מנוקד ×3/2, שלישייה ×2/3, כמה שמיניות בחצי' },
    { grade: 'ו', strand: 'decimals', topic: 'כפל וחילוק שברים עשרוניים', status: COVERED, note: 'כפל וחילוק ב־10/100, עשרוני בעשרוני; יחסי תדרים (440 × 1.5)' },
    { grade: 'ו', strand: 'decimals', topic: 'אחוזים', status: COVERED, note: 'משמעות האחוז (1% = 1/100, השלם = 100%), אחוז מכמות ב־10%/25%/50%, שבר לאחוז, עלייה וירידה באחוזים (מחיר וטמפו)' },
    { grade: 'ו', strand: 'geometry', topic: 'מעגל ועיגול: היקף ושטח', status: PARTIAL, note: 'רדיוס, קוטר, היקף ומעלות במעגל הקווינטות; אין שטח עיגול' },
    { grade: 'ו', strand: 'geometry', topic: 'מצולעים מורכבים', status: GAP, note: 'אין בבנק' },
    { grade: 'ו', strand: 'measure', topic: 'נפח', status: GAP, note: 'אין בבנק' },
    { grade: 'ו', strand: 'data', topic: 'ממוצע', status: PARTIAL, note: '4 פריטים בלבד: BPM ממוצע מהקשות ואורך ממוצע של שירים' },
  ];

  MATRIX.forEach(function (row, index) {
    row.topicId = 'mm-cur-' + index;
  });

  function isValidTopicId(id) {
    if (typeof id !== 'string' || !id) return false;
    return MATRIX.some(function (r) { return r.topicId === id; });
  }

  function topicById(id) {
    if (!isValidTopicId(id)) return null;
    return MATRIX.find(function (r) { return r.topicId === id; }) || null;
  }

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
        topicId: r.topicId,
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
    isValidTopicId: isValidTopicId,
    topicById: topicById,
    gapTopicsForGrade: gapTopicsForGrade,
  };
});
