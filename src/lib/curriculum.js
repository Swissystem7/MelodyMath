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
    { grade: 'א', strand: 'numbers', topic: 'מצבי חיבור/חיסור מחיי יום־יום (איסוף, הוספה, הפרדה, גריעה)', status: COVERED, note: 'איסוף, הוספה, הפרדה, גריעה והשוואה — בניסוחים יומיומיים ומוזיקליים' },
    { grade: 'א', strand: 'geometry', topic: 'מיון מצולעים, קודקוד וצלע, פירוק והרכבה', status: PARTIAL, note: 'מיון לפי צלעות וקודקודים וזווית ישרה; אין פירוק והרכבה' },
    { grade: 'א', strand: 'measure', topic: 'מדידת אורך (מתווך, ס״מ, סרגל)', status: COVERED, note: 'קוביות אורך ואז ס״מ בסרגל מצויר' },
    { grade: 'א', strand: 'measure', topic: 'שעון אנלוגי בשעות שלמות', status: COVERED, note: 'שעון מצויר בשעות שלמות' },
    { grade: 'א', strand: 'measure', topic: 'כסף — מטבעות וסכומים', status: COVERED, note: 'מטבעות של 1, 2, 5 ו־10 ₪, סכום ועודף עד 10 ₪; אין אגורות' },
    { grade: 'א', strand: 'data', topic: 'דיאגרמת עמודות ופיקטוגרם', status: COVERED, note: 'קריאת פיקטוגרם במפתח 1 ודיאגרמת עמודות, כולל הפרש וסכום' },

    { grade: 'ב', strand: 'numbers', topic: 'מספרים עד 1,000, מבנה עשרוני, זוגי/אי־זוגי', status: COVERED, note: 'מאות/עשרות/יחידות, זוגי/אי־זוגי והשוואה; גם בלי מוזיקה. «זוגי או אי־זוגי בשמיעה» — האם המקצב נגמר בזוג שלם (grade2Music)' },
    { grade: 'ב', strand: 'numbers', topic: 'חיבור וחיסור דו־ספרתי במאוזן ובמאונך עד 100', status: COVERED, note: 'במאוזן ובמאונך, עם וללא מעבר עשרות; במאונך היחידות בתוף והעשרות בבס, ופריטה = 10 מכות תוף מול צליל בס אחד (grade2Music)' },
    { grade: 'ב', strand: 'numbers', topic: 'שליטה בכפולות 2, 4, 5, 10', status: COVERED, note: '3, 6, 7, 8, 9 חסומים עד שליטה בליבה; «תיבות × פעמות» עם הדגשה על פעימה ראשונה בכל תיבה (grade2Music)' },
    { grade: 'ב', strand: 'numbers', topic: 'חילוק לחלקים ולהכלה על אותם מספרים', status: COVERED, note: 'בלי המונחים הפורמליים לתלמיד' },
    { grade: 'ב', strand: 'geometry', topic: 'פירוק והרכבה של מצולעים; זווית ישרה', status: PARTIAL, note: 'זווית ישרה ומיון מצולעים; אין פירוק והרכבה' },
    { grade: 'ב', strand: 'measure', topic: 'ס״מ, היקף, חצאי שעות', status: COVERED, note: 'ס״מ בסרגל, היקף מצולע, וחצאי שעות — «חצי שעה = חצי תיבה» עם חצי תיבה חזק וחצי חלש (grade2Music)' },
    { grade: 'ב', strand: 'measure', topic: 'כסף — ₪ ואגורות, קנייה ועודף', status: COVERED, note: 'המרת ₪ לאגורות, מטבעות של 10 ו־50 אגורות ועודף עד 50 ₪' },
    { grade: 'ב', strand: 'measure', topic: 'נפח תיבות — מנייה של קוביות', status: COVERED, note: 'מנייה של קוביות בשכבות, שכבה חסרה, הוספת שכבה והשוואת תיבות. בלי ציור של התיבה, אין מדידה בכלים אמיתיים, ואין קישור מוזיקלי — כך בתוכנית (§5)' },
    { grade: 'ב', strand: 'data', topic: 'טבלה, עמודות, פיקטוגרם', status: COVERED, note: 'קריאת טבלת נתונים, פיקטוגרם ודיאגרמת עמודות' },

    { grade: 'ג', strand: 'numbers', topic: 'מספרים עד 10,000, מבנה עשרוני', status: COVERED, note: 'פריסה עשרונית מלאה, ערך המקום והשוואת תדרים ארבע־ספרתיים עד 10,000' },
    { grade: 'ג', strand: 'numbers', topic: 'חיבור/חיסור במאוזן ובמאונך עד רבבה', status: COVERED, note: 'במאוזן ובמאונך עד 10,000, עם וללא המרה/פריטה' },
    { grade: 'ג', strand: 'numbers', topic: 'לוח כפל 10×10 (אחרי 2/4/5/10)', status: COVERED, note: 'כל עובדות 1–10 × 1–10 בבנק (ב׳ + ג׳), חוק החילוף והפילוג וגורם חסר; 3, 6, 7, 8, 9 נפתחים אחרי השער; לוח 3 נשמע ב־3/4 ולוח 6 ב־6/8. כפל במאונך — כיתה ד׳' },
    { grade: 'ג', strand: 'numbers', topic: 'חילוק עם שארית; כפל/חילוק ב־10, 100, 1,000', status: COVERED, note: 'שארית כפעמות שנשארו מחוץ לתיבה («3 שארית 2») וכפל/חילוק ב־10, 100, 1,000' },
    { grade: 'ג', strand: 'numbers', topic: 'שאלות השוואה כפליות ודו־שלביות', status: COVERED, note: '«פי כמה» בין שני טמפו ותדרים במרחק אוקטבה; שאלות מילוליות דו־שלביות (כפל ואז חיבור/חיסור); «בכמה» מול «פי כמה» על אותם מספרים' },
    { grade: 'ג', strand: 'geometry', topic: 'זווית שטוחה/קהה/ישרה/חדה; מיון משולשים', status: COVERED, note: 'סוגי זוויות במעלות ובשעון; משולשים לפי זוויות ולפי צלעות; בלי מדידה במד־זווית' },
    { grade: 'ג', strand: 'measure', topic: 'שטח מלבן; שעות ודקות', status: COVERED, note: 'שטח במשבצות ובסמ״ר; דקות ומשך זמן — בכתב, בלי שעון דקות מצויר' },
    { grade: 'ג', strand: 'measure', topic: 'יחידות משקל ונפח (ק״ג/גרם, ליטר/מ״ל); כסף', status: COVERED, note: 'המרות בסיסיות וקנייה בשקלים ואגורות; אין שקילה או מדידת נפח בפועל' },
    { grade: 'ג', strand: 'data', topic: 'איסוף, ארגון, דיאגרמות', status: COVERED, note: 'איסוף לטבלה, פיקטוגרם במפתח 2 ודיאגרמת עמודות של כלי נגינה' },

    { grade: 'ד', strand: 'numbers', topic: 'מספרים עד מיליון; אלגוריתמים במאונך; סדר פעולות', status: GAP, note: 'גל 2+' },
    { grade: 'ד', strand: 'fractions', topic: 'שבר כחלק משלם — 1/2, 1/4, 1/8 מול תיבה 4/4', status: COVERED, note: 'הטענה הצרה היחידה; כולל השוואת משכים ושברים שווי ערך' },
    { grade: 'ד', strand: 'fractions', topic: 'שבר כחלק מכמות; שמות שונים לשבר; השוואה; חיבור/חיסור שברים', status: GAP, note: 'לא נבנה — «חצי מ־8 = 4» אינו שבר' },
    { grade: 'ד', strand: 'geometry', topic: 'מקבילים, מאונכים, מרובעים, שטח פנים', status: PARTIAL, note: 'מקבילים, מאונכים, מיון מרובעים, פאות ומקצועות של תיבה; אין חישוב שטח פנים' },
    { grade: 'ד', strand: 'measure', topic: 'יחידות אורך; זמן בלוח עברי/לועזי', status: PARTIAL, note: 'מ״מ, ס״מ, מטר, ק״מ; גרם וק״ג; מ״ל וליטר; לוח לועזי; אין לוח עברי' },
    { grade: 'ד', strand: 'measure', topic: 'כסף — חישובי קנייה ועודף', status: COVERED, note: 'המרת ₪/אגורות, מחיר כפול כמות ועודף מ־100 ו־200 ₪' },
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

  // Official Ministry of Education pages only. Both URLs answered 200 on
  // 21.10.2026; the page links the six PDFs.
  const OFFICIAL_PAGE = 'https://pop.education.gov.il/tchumey_daat/matmatika/yesodi/oraat-math/new-curriculum/';
  const OFFICIAL_PDF = 'https://meyda.education.gov.il/files/Mazkirut_Pedagogit/math/primary-school/math2023/Newprogramgrade';
  const SOURCE_READ = '21.10.2026';
  const UNVERIFIED_HE = 'לא אומת';

  // Verbatim text from Newprogramgrade<n>.pdf for the row's grade (checked
  // 21.10.2026 with pdftotext, whitespace ignored). A row without a quote
  // shows 'לא אומת': for ב׳ the PDF has no אגורות (they are in ג׳), and for
  // ג׳ it has no ק״ג/ליטר.
  const OFFICIAL_QUOTE = {
    'ספירה עד 100 קדימה ואחורה ממספר כלשהו': 'ספירה עד 100 קדימה וספירה אחורה ממספר כלשהו',
    'מנייה עד 100, קיבוץ ל־10': 'ומנייה באמצעות קיבוץ לקבוצות של 10 פריטים',
    'ישר המספרים — מיקום מדויק ומקורב עד 100': 'סידור מספרים על ישר המספרים',
    'חיבור וחיסור בתחום 10 ואז 20; פירוקי 10; = משמאל; יותר משני מחוברים': 'השליטה בפירוקים השונים של המספר 10 לשני מחוברים',
    'חיבור וחיסור בעשרות שלמות עד 100': 'חיבור וחיסור בעשרות שלמות',
    'קריאה וכתיבה של מספרים, לוח מאה, שם־מספר': 'קריאה וכתיבה ושל המספרים הטבעיים עד 100',
    'סדרות דגמים צורניים + יצירת סדרה': 'בסדרות של דגמים חוזרים',
    'מצבי חיבור/חיסור מחיי יום־יום (איסוף, הוספה, הפרדה, גריעה)': "המשמעויות של פעולת החיבור בכיתה א' הן: א. איסוף, ב. הוספה",
    'מיון מצולעים, קודקוד וצלע, פירוק והרכבה': 'פירוק והרכבה של מצולעים',
    'מדידת אורך (מתווך, ס״מ, סרגל)': 'מדידה באמצעות סרגל',
    'שעון אנלוגי בשעות שלמות': 'קריאת שעון מחוגים בשעות שלמות',
    'כסף — מטבעות וסכומים': 'היכרות עם מטבעות ועם שטרות',
    'דיאגרמת עמודות ופיקטוגרם': 'קריאת נתונים המוצגים בפיקטוגרם',
    'מספרים עד 1,000, מבנה עשרוני, זוגי/אי־זוגי': 'קריאה וכתיבה של המספרים עד 1,000 במילים ובספרות',
    'חיבור וחיסור דו־ספרתי במאוזן ובמאונך עד 100': 'חיבור וחיסור במאונך של מספרים דו-ספרתיים',
    'שליטה בכפולות 2, 4, 5, 10': "הכפולות הנלמדות בכיתה ב'",
    'חילוק לחלקים ולהכלה על אותם מספרים': 'חילוק לחלקים וחילוק להכלה',
    'פירוק והרכבה של מצולעים; זווית ישרה': 'מצולעים נתונים לכאלה שיש בהם זווית ישרה',
    'ס״מ, היקף, חצאי שעות': 'קריאת שעון מחוגים בשעות שלמות ובחצאי שעות',
    'נפח תיבות — מנייה של קוביות': 'חישוב מספר הקוביות המרכיבות תיבה',
    'טבלה, עמודות, פיקטוגרם': 'קריאת נתונים מטבלה, איסוף נתונים והצגתם בטבלה',
    'מספרים עד 10,000, מבנה עשרוני': 'הכרת המספרים הטבעיים בתחום הרבבה',
    'חיבור/חיסור במאוזן ובמאונך עד רבבה': 'חיבור וחיסור במאוזן ובמאונך',
    'לוח כפל 10×10 (אחרי 2/4/5/10)': 'השלמה וביסוס הכפולות בלוח הכפל',
    'חילוק עם שארית; כפל/חילוק ב־10, 100, 1,000': 'תרגילי חילוק עם שארית',
    'שאלות השוואה כפליות ודו־שלביות': 'שאלות השוואה כפליות, שאלות דו-שלביות',
    'זווית שטוחה/קהה/ישרה/חדה; מיון משולשים': 'זווית שטוחה, זווית קהה, זווית ישרה וזווית חדה',
    'שטח מלבן; שעות ודקות': 'קריאת שעות ודקות בשעון מחוגים',
    'איסוף, ארגון, דיאגרמות': 'קריאה של נתונים מפיקטוגרם, איסוף נתונים ובנייה של פיקטוגרם',
    'מספרים עד מיליון; אלגוריתמים במאונך; סדר פעולות': 'הכרת המספרים הטבעיים בתחום המיליון',
    'שבר כחלק משלם — 1/2, 1/4, 1/8 מול תיבה 4/4': 'משמעות השבר כחלק משלם',
    'שבר כחלק מכמות; שמות שונים לשבר; השוואה; חיבור/חיסור שברים': 'שמות שונים לשבר',
    'מקבילים, מאונכים, מרובעים, שטח פנים': 'זיהוי וסרטוט של ישרים מקבילים',
    'יחידות אורך; זמן בלוח עברי/לועזי': 'מעבר בין יחידות אורך שונות',
    'כסף — חישובי קנייה ועודף': 'האם הכסף שברשותה יספיק',
    'טבלאות ודיאגרמות כולל שברים': 'קריאת נתונים מטבלה, איסוף נתונים והצגתם בטבלה',
    'ראשוניים ופריקים; פירוק לגורמים; סימני התחלקות': 'מספרים ראשוניים ומספרים פריקים',
    'הרחבה, צמצום והשוואה של שברים': 'צמצום והרחבה של שברים',
    'חיבור וחיסור שברים במכנים שונים': 'חיבור וחיסור שברים ומספרים מעורבים בעלי מכנים זרים',
    'שבר מכמות': 'משמעות השבר כחלק מכמות',
    'שברים עשרוניים: ערך מקום, השוואה, מעבר משבר פשוט': 'הקשר בין ערך הספרה למיקומה במספר',
    'חיבור וחיסור שברים עשרוניים': 'חיבור וחיסור של שברים עשרוניים',
    'משולשים, גובה, שטח משולש ומקבילית': 'חישוב של שטח משולש',
    'קריאה ופרשנות של דיאגרמות': 'דיאגרמת עוגה ודיאגרמת עמודות',
    'מספרים טבעיים ו־0; סדר פעולות': 'סדר פעולות החשבון',
    'כפל וחילוק שברים': 'כפל שברים וכפל מספרים מעורבים',
    'כפל וחילוק שברים עשרוניים': 'כפל שברים עשרוניים',
    'אחוזים': 'אחוז אחד ממספר כלשהו הוא מאית מהמספר',
    'מעגל ועיגול: היקף ושטח': 'היקף מעגל ושטח עיגול',
    'מצולעים מורכבים': 'חישובי שטחים של מצולעים מורכבים',
    'נפח': 'חישובי נפח',
    'ממוצע': 'משמעות המושג ממוצע',
  };

  // Bank standard (banks.js ST text) → start of the row topic, per grade. A
  // pair that is not here gets 'לא אומת' on its tag rather than a guess.
  const STANDARD_TOPIC = {
    'א': {
      'ספירה עד 100 קדימה ממספר כלשהו': 'ספירה עד 100',
      'ספירה אחורה עד 100 ממספר כלשהו': 'ספירה עד 100',
      'ספירת המשך בדילוגים של 2; ספירה אחורה מ־50 בדילוגים של 2': 'ספירה עד 100',
      'ספירת המשך מכל מספר שהוא כפולה של 5 בדילוגים של 5': 'ספירה עד 100',
      'מנייה — התאמת כמות למספר': 'מנייה עד 100',
      'קיבוץ לעשרות; התאמת כמות למספר עד 100': 'מנייה עד 100',
      'סדר המספרים — הבא והקודם': 'מנייה עד 100',
      'ישר המספרים — מיקום מדויק ומקורב; תשתית לחיבור/חיסור': 'ישר המספרים',
      'חיבור בתחום העשר': 'חיבור וחיסור בתחום 10',
      'חיבור בתחום העשרים': 'חיבור וחיסור בתחום 10',
      'חיסור בתחום העשר': 'חיבור וחיסור בתחום 10',
      'חיסור בתחום העשרים': 'חיבור וחיסור בתחום 10',
      'פירוקי 10': 'חיבור וחיסור בתחום 10',
      'סימן השוויון כשוויון בין שני ביטויים': 'חיבור וחיסור בתחום 10',
      'חיבור עם יותר משני מחוברים': 'חיבור וחיסור בתחום 10',
      'חיבור וחיסור בעשרות שלמות עד 100': 'חיבור וחיסור בעשרות',
      'לוח המאה — עשרות ויחידות': 'קריאה וכתיבה',
      'סדרות דגמים צורניים וצליליים': 'סדרות דגמים',
      'שאלת מילים — איסוף (צירוף שתי קבוצות)': 'מצבי חיבור',
      'שאלת מילים — הפרדה (הסרה מקבוצה)': 'מצבי חיבור',
      'שאלת מילים — השוואה בין שתי כמויות': 'מצבי חיבור',
      'מיון מצולעים לפי מספר צלעות וקודקודים': 'מיון מצולעים',
      'מדידת אורך ביחידות מתווכות ואז בס״מ': 'מדידת אורך',
      'קריאת שעון אנלוגי בשעות שלמות': 'שעון אנלוגי',
      'כסף — שקלים ואגורות, קנייה ועודף': 'כסף',
      'קריאת פיקטוגרם': 'דיאגרמת עמודות',
      'קריאת דיאגרמת עמודות': 'דיאגרמת עמודות',
    },
    'ב': {
      'מבנה עשרוני עד 1,000 — מאות/עשרות/יחידות, זוגי/אי־זוגי, השוואה': 'מספרים עד 1,000',
      'חיבור דו־ספרתי במאונך': 'חיבור וחיסור דו־ספרתי',
      'חיסור דו־ספרתי במאונך': 'חיבור וחיסור דו־ספרתי',
      'חיבור דו־ספרתי עד 100, עם וללא מעבר עשרות': 'חיבור וחיסור דו־ספרתי',
      'חיסור דו־ספרתי עד 100, עם וללא מעבר עשרות': 'חיבור וחיסור דו־ספרתי',
      'כפולות 2, 4, 5 ו־10 עד סוף כיתה ב׳': 'שליטה בכפולות',
      'חילוק לחלקים': 'חילוק לחלקים',
      'חילוק להכלה': 'חילוק לחלקים',
      'מיון מצולעים לפי מספר צלעות וקודקודים': 'פירוק והרכבה',
      'זיהוי זווית ישרה': 'פירוק והרכבה',
      'היקף מצולע — סכום אורכי הצלעות': 'ס״מ, היקף',
      'חצאי שעות': 'ס״מ, היקף',
      'קריאת שעון אנלוגי בשעות שלמות': 'ס״מ, היקף',
      'מדידת אורך ביחידות מתווכות ואז בס״מ': 'ס״מ, היקף',
      'כסף — שקלים ואגורות, קנייה ועודף': 'כסף',
      'משקל ונפח — ק״ג וגרם, ליטר ומ״ל, נפח תיבה בקוביות': 'נפח תיבות',
      'קריאת טבלת נתונים': 'טבלה, עמודות',
      'קריאת פיקטוגרם': 'טבלה, עמודות',
      'קריאת דיאגרמת עמודות': 'טבלה, עמודות',
    },
    'ג': {
      'מספרים עד 10,000 — מבנה עשרוני והשוואה': 'מספרים עד 10,000',
      'מספרים עד 10,000 — קריאה, כתיבה והשוואה': 'מספרים עד 10,000',
      'חיבור וחיסור במאוזן ובמאונך עד רבבה': 'חיבור/חיסור',
      'לוח כפל 10×10 אחרי שליטה ב־2/4/5/10': 'לוח כפל',
      'חילוק לחלקים': 'לוח כפל',
      'חילוק להכלה': 'לוח כפל',
      'חילוק עם שארית': 'חילוק עם שארית',
      'כפל וחילוק ב־10, 100 ו־1,000': 'חילוק עם שארית',
      'השוואה כפלית — פי כמה': 'שאלות השוואה',
      'שאלת השוואה כפלית — פי כמה': 'שאלות השוואה',
      'שאלות מילוליות דו־שלביות': 'שאלות השוואה',
      'זווית חדה, ישרה, קהה ושטוחה': 'זווית שטוחה',
      'מיון משולשים לפי זוויות ולפי צלעות': 'זווית שטוחה',
      'שטח מלבן ביחידות ריבועיות': 'שטח מלבן',
      'שטח מלבן — שורות × עמודות': 'שטח מלבן',
      'שעות ודקות; משך זמן': 'שטח מלבן',
      'זמן — המרה בין דקות לשניות': 'שטח מלבן',
      'כסף — שקלים ואגורות, קנייה ועודף': 'יחידות משקל',
      'משקל ונפח — ק״ג וגרם, ליטר ומ״ל, נפח תיבה בקוביות': 'יחידות משקל',
      'קריאת טבלת נתונים': 'איסוף, ארגון',
      'קריאת פיקטוגרם': 'איסוף, ארגון',
      'קריאת דיאגרמת עמודות': 'איסוף, ארגון',
    },
    'ד': {
      'שבר כחלק משלם — 1/2, 1/4, 1/8 מול תיבה 4/4': 'שבר כחלק משלם',
      'ישרים מקבילים וישרים מאונכים': 'מקבילים',
      'מיון מרובעים — ריבוע, מלבן, מעוין, מקבילית, טרפז; אלכסונים': 'מקבילים',
      'תיבה וקובייה — פאות, מקצועות וקודקודים': 'מקבילים',
      'המרת יחידות — אורך, משקל ונפח': 'יחידות אורך',
      'זמן — יממות, שבועות, חודשים ושנים': 'יחידות אורך',
      'כסף — שקלים ואגורות, קנייה ועודף': 'כסף',
    },
    'ה': {
      'מחלקים, מספרים ראשוניים ופריקים': 'ראשוניים',
      'כפולה משותפת קטנה ביותר': 'ראשוניים',
      'שברים שקולים — הרחבה, צמצום והשוואה': 'הרחבה, צמצום',
      'חיבור וחיסור שברים, גם במכנים שונים': 'חיבור וחיסור שברים במכנים',
      'מספרים מעורבים — מעבר לשבר לא אמיתי וחזרה, חיבור וחיסור': 'חיבור וחיסור שברים במכנים',
      'שבר מכמות': 'שבר מכמות',
      'שברים עשרוניים — ערך המקום, השוואה ומעבר משבר פשוט': 'שברים עשרוניים:',
      'חיבור וחיסור שברים עשרוניים': 'חיבור וחיסור שברים עשרוניים',
      'קריאת דיאגרמת עמודות': 'קריאה ופרשנות',
    },
    'ו': {
      'כפל שברים': 'כפל וחילוק שברים',
      'חילוק שברים': 'כפל וחילוק שברים',
      'כפל וחילוק שברים עשרוניים': 'כפל וחילוק שברים עשרוניים',
      'אחוזים — אחוז מכמות, שבר כאחוז, שינוי באחוזים': 'אחוזים',
      'מעגל — רדיוס, קוטר, היקף וזווית מרכזית': 'מעגל ועיגול',
      'ממוצע — סכום הערכים חלקי מספרם': 'ממוצע',
    },
  };

  function gradeNumber(grade) {
    return ['א', 'ב', 'ג', 'ד', 'ה', 'ו'].indexOf(grade) + 1;
  }

  function officialPdf(grade) {
    const n = gradeNumber(grade);
    return n > 0 ? OFFICIAL_PDF + n + '.pdf' : OFFICIAL_PAGE;
  }

  MATRIX.forEach(function (row, index) {
    row.topicId = 'mm-cur-' + index;
    row.quote = OFFICIAL_QUOTE[row.topic] || null;
    row.verified = !!row.quote;
    row.sourceUrl = officialPdf(row.grade);
  });

  // The official section a bank item belongs to, for the tag on the exercise.
  function sectionForItem(item) {
    if (!item || gradeNumber(item.grade) < 1) return null;
    const prefix = (STANDARD_TOPIC[item.grade] || {})[item.standard];
    const row = prefix ? MATRIX.find(function (r) {
      return r.grade === item.grade && r.topic.indexOf(prefix) === 0;
    }) : null;
    return {
      grade: item.grade,
      topic: row ? row.topic : null,
      quote: row ? row.quote : null,
      verified: !!(row && row.verified),
      url: officialPdf(item.grade),
      label: row && row.verified ? row.topic : UNVERIFIED_HE,
    };
  }

  // Share of the grade's rows: covered, partial, and how many are verified.
  function coveragePercent(grade) {
    const s = summaryForGrade(grade);
    const rows = rowsForGrade(grade);
    const pct = function (n) { return s.total ? Math.round(100 * n / s.total) : 0; };
    return {
      grade: grade,
      total: s.total,
      covered: pct(s.covered),
      partial: pct(s.partial),
      gap: pct(s.gap),
      verified: rows.filter(function (r) { return r.verified; }).length,
    };
  }

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
        quote: r.quote,
        verified: r.verified,
        sourceUrl: r.sourceUrl,
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
    OFFICIAL_PAGE: OFFICIAL_PAGE,
    SOURCE_READ: SOURCE_READ,
    UNVERIFIED_HE: UNVERIFIED_HE,
    officialPdf: officialPdf,
    sectionForItem: sectionForItem,
    coveragePercent: coveragePercent,
  };
});
