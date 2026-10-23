// MelodyMath — the OLD (2006, תשס"ו) Ministry programme next to the new one
// for grades ד׳–ו׳ (#591). In תשפ"ז pupils of ד׳–ו׳ still learn by the 2006
// programme: «תלמידי כיתות ד'-ו' ימשיכו בשנת הלימודים תשפ"ז ללמוד על פי
// התוכנית משנת 2006» (mafmar_yesodi_tashpaz.pdf, page 2). The new-programme
// mapping stays in curriculum.js; this file only adds the second one.
//
// Source: «תכנית לימודים במתמטיקה לכיתות א-ו בכל המגזרים», ירושלים התשס"ו
// 2006 (mavo1.pdf is its title page), one PDF per grade, linked from the
// official «תוכנית לימודים לבית הספר היסודי» page. Read 23.10.2026 with
// pdftotext; tools/verify-old-program-quotes.js re-checks every quote.
//
// Each app row of ד׳–ו׳ (curriculum.js MATRIX, grade6.js rows) gets `old`:
// where the 2006 programme teaches the same thing — in which grade, under
// which heading, a verbatim `quote` and the PDF `page` it is on. The old
// grade can differ from the app grade: primes are ד׳ in 2006 and ה׳ in the
// new programme, the mean is ה׳ in 2006 and ו׳ in the new one. A row the
// 2006 text does not name has `old: []` and `unverified: true` (shown as
// 'לא אומת') — no quote is made up.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_OLD_PROGRAM = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const PAGE = 'https://pop.education.gov.il/tchumey_daat/matmatika/yesodi/oraat-math/tohnit-limudim/';
  const PDF = 'https://meyda.education.gov.il/files/mazkirut_pedagogit/matematika/tochnyotlemud/kita';
  const TITLE_PDF = 'https://meyda.education.gov.il/files/mazkirut_pedagogit/matematika/tochnyotlemud/mavo1.pdf';
  const STILL_OLD_PDF = 'https://meyda.education.gov.il/files/Mazkirut_Pedagogit/math/primary-school/math2025/mafmar_yesodi_tashpaz.pdf';
  const STILL_OLD_QUOTE = "תלמידי כיתות ד'-ו' ימשיכו בשנת הלימודים תשפ\"ז ללמוד על פי התוכנית משנת";
  const STILL_OLD_PAGE = 2;
  const SOURCE_READ = '23.10.2026';
  const UNVERIFIED_HE = 'לא אומת';
  const GRADES = ['ד', 'ה', 'ו'];

  // [old grade, heading in the 2006 PDF, verbatim quote, PDF page]
  function o(grade, section, quote, page) {
    return { grade: grade, section: section, quote: quote, page: page };
  }

  const MAP = [
    // ד׳
    { grade: 'ד', topic: 'מספרים עד מיליון; אלגוריתמים במאונך; סדר פעולות', old: [
      o('ד', 'ב. המספרים הטבעיים עד מיליון', 'המספרים הטבעיים עד מיליון', 1),
      o('ד', 'ד. פעולות החשבון', 'כפל במאונך (בגורם רב-ספרתי)', 1),
      o('ד', 'ד. פעולות החשבון', 'סדר הפעולות והשימוש בסוגריים', 1),
      o('ד', 'ד. פעולות החשבון', 'סימני התחלקות ב', 1)] },
    { grade: 'ד', topic: 'כסף — חישובי קנייה ועודף', old: [
      o('ד', 'ד. פעולות החשבון — שאלות כוללות (אינטגרטיביות)', 'כמה כסף נשאר להוצאות אחרות', 12),
      o('ג', 'ג. פעולות החשבון בתחום הרבבה — שאלות השוואה כפליות (דוגמה)', 'כמה עודף הוא קיבל', 14)],
      note: 'ב־2006 אין לכסף נושא משלו בד׳: הוא מופיע רק בדוגמאות של שאלות כוללות, ועודף — בדוגמה של ג׳' },
    { grade: 'ד', topic: 'שבר כחלק משלם — 1/2, 1/4, 1/8 מול תיבה 4/4', old: [
      o('ד', 'א. השבר הפשוט', 'הכרת השבר הפשוט', 1),
      o('ד', 'א. השבר הפשוט', 'השבר כחלק מהשלם', 2)] },
    { grade: 'ד', topic: 'שבר כחלק מכמות; שמות שונים לשבר; השוואה; חיבור/חיסור שברים', old: [
      o('ד', 'א. השבר הפשוט', 'השבר כחלק של כמות', 2),
      o('ד', 'שליטה ויכולת ביצוע', 'מציאת שמות שונים לשבר', 20),
      o('ד', 'שליטה ויכולת ביצוע', 'השוואת שברים במקרים פשוטים', 20),
      o('ד', 'א. השבר הפשוט', 'פעולות בשברים (היכרות ראשונה)', 1)] },
    { grade: 'ד', topic: 'מקבילים, מאונכים, מרובעים, שטח פנים', old: [
      o('ג', 'ו. מדידות וגאומטרייה', 'ישרים מקבילים', 17),
      o('ד', 'ו. צורות וגופים', 'מצולעים, אלכסון', 1),
      o('ד', 'ו. צורות וגופים', 'ריבוע ומלבן', 1),
      o('ד', 'ח. מדידות', 'נפח תיבה, שטח פנים', 1)],
      note: 'מקבילים ומאונכים נלמדים ב־2006 כבר בג׳; ניתוח ומיון מרובעים — בה׳' },
    { grade: 'ד', topic: 'יחידות אורך; זמן בלוח עברי/לועזי', old: [
      o('ג', 'א. מדידות אורך', 'מעבר בין יחידות האורך', 18),
      o('ד', 'ח. מדידות', 'לוח השנה וחישובי זמן', 1),
      o('ד', 'ח. מדידות', 'כולל חישובים בלוח העברי', 19)],
      note: 'ב־2006 המעבר בין יחידות אורך הוא נושא של ג׳' },
    { grade: 'ד', topic: 'טבלאות ודיאגרמות כולל שברים', old: [
      o('ד', 'ה. חקר נתונים וניתוח סיכויים', 'דיאגרמות מוטות ועמודות', 15),
      o('ד', 'ה. חקר נתונים וניתוח סיכויים', 'דיאגרמת עמודות כפולה', 15)],
      note: 'דיאגרמת עוגה אינה בתוכנית 2006 של ד׳' },

    // ה׳
    { grade: 'ה', topic: 'מספרים גדולים ממיליון ו־0: מבנה עשרוני, קריאה, כתיבה והשוואה', old: [
      o('ה', 'ב. פעולות חשבון במספרים טבעיים', 'פיתוח תחושה למספרים גדולים', 1)],
      note: 'ב־2006 התחום המפורש נגמר במיליון (ד׳); מעליו יש רק «תחושה למספרים גדולים»' },
    { grade: 'ה', topic: 'ארבע פעולות החשבון עד מיליון; עיגול ואומדן', old: [
      o('ה', 'ב. פעולות חשבון במספרים טבעיים', 'חילוק במספר דו-ספרתי', 1),
      o('ה', 'ב. פעולות חשבון במספרים טבעיים', 'אומדן תוצאות של פעולות', 1),
      o('ג', 'ג. פעולות החשבון בתחום הרבבה — עיגול מספרים ואומדן', 'עיגול מספרים', 9)] },
    { grade: 'ה', topic: 'ראשוניים ופריקים; פירוק לגורמים; סימני התחלקות', old: [
      o('ד', 'ד. פעולות החשבון', 'מספרים ראשוניים ופריקים', 1),
      o('ד', 'ד. פעולות החשבון', 'סימני התחלקות ב', 1)],
      note: 'ב־2006 זה נושא של ד׳: תלמיד ה׳ בתשפ"ז כבר פגש אותו' },
    { grade: 'ה', topic: 'ייצוג שברים במודלים ועל ישר המספרים; השבר כמנה; חלק משלם', old: [
      o('ה', 'א. שברים פשוטים ושברים עשרוניים', 'משמעויות השבר הפשוט', 1),
      o('ו', 'א. שברים', 'שבר כמנת חילוק', 1)],
      note: 'השבר כמנה הוא ב־2006 נושא של ו׳' },
    { grade: 'ה', topic: 'הרחבה, צמצום והשוואה של שברים', old: [
      o('ה', 'א. שברים פשוטים ושברים עשרוניים', 'צמצום והרחבה', 1)] },
    { grade: 'ה', topic: 'שבר מכמות', old: [
      o('ד', 'א. השבר הפשוט', 'השבר כחלק של כמות', 2),
      o('ו', 'א. שברים', 'חלק של כמות, מציאת ערך החלק', 1)] },
    { grade: 'ה', topic: 'חיבור וחיסור שברים במכנים שונים', old: [
      o('ה', 'א. שברים פשוטים ושברים עשרוניים', 'חיבור וחיסור שברים, השוואת שברים', 1)] },
    { grade: 'ה', topic: 'שברים עשרוניים: ערך מקום, השוואה, מעבר משבר פשוט', old: [
      o('ה', 'א. שברים פשוטים ושברים עשרוניים', 'משמעות השבר העשרוני', 1),
      o('ה', 'א. שברים פשוטים ושברים עשרוניים', 'מעבר משבר פשוט לשבר עשרוני', 1)] },
    { grade: 'ה', topic: 'חיבור וחיסור שברים עשרוניים', old: [
      o('ה', 'א. שברים פשוטים ושברים עשרוניים', 'חיבור וחיסור שברים עשרוניים והשוואתם', 1)] },
    { grade: 'ה', topic: 'משולשים, גובה, שטח משולש ומקבילית', old: [
      o('ה', 'ה. מדידות שטחים', 'חישובי שטחים של מצולעים', 18),
      o('ה', 'שליטה ויכולת ביצוע', 'בנייה וזיהוי של גובה במשולשים', 20)] },
    { grade: 'ה', topic: 'גופים: פירמידות ישרות ומנסרות ישרות — תכונות ופריסות', old: [
      o('ו', 'ט. גופים', 'הכרת המנסרה הישרה והפירמידה', 20)],
      note: 'ב־2006 מנסרות ופירמידות הן נושא של ו׳' },
    { grade: 'ה', topic: 'קריאה ופרשנות של דיאגרמות; שכיחות ושכיח', old: [
      o('ה', 'ג. חקר נתונים, ממוצע', 'טבלאות של שכיחות יחסית', 13),
      o('ו', 'ח. חקר נתונים וניתוח סיכויים', 'השכיח, השכיח לעומת הממוצע', 19)],
      note: 'השכיח הוא ב־2006 נושא של ו׳' },

    // ו׳
    { grade: 'ו', topic: 'מספרים טבעיים ו־0; סדר פעולות', old: [
      o('ו', 'ו. מספרים ופעולות - הרחבה והעמקה', 'ייערך סיכום של פעולות החשבון, סדר הפעולות וחוקי הפעולות', 14),
      o('ד', 'ב. המספרים הטבעיים עד מיליון', 'שיטת האלף-בית', 1)] },
    { grade: 'ו', topic: 'כפל וחילוק שברים', old: [
      o('ו', 'א. שברים', 'כפל שבר בשבר, כולל מספרים מעורבים', 1),
      o('ו', 'א. שברים', 'חילוק שברים פשוטים', 1)] },
    { grade: 'ו', topic: 'כפל וחילוק שברים עשרוניים', old: [
      o('ו', 'א. שברים', 'כפל שברים עשרוניים', 1),
      o('ו', 'א. שברים', 'חילוק שברים עשרוניים', 1)] },
    { grade: 'ו', topic: 'אחוזים', old: [
      o('ו', 'ב. אחוזים', 'אחוז הוא שם אחר למאית', 9)] },
    { grade: 'ו', topic: 'מעגל ועיגול: היקף ושטח', old: [
      o('ו', 'י. מדידות', 'מקובל לבטא את היקף המעגל', 21),
      o('ו', 'י. מדידות', 'שטח העיגול', 22)] },
    { grade: 'ו', topic: 'מצולעים מורכבים', old: [
      o('ה', 'שליטה ויכולת ביצוע', 'מציאת שטח והיקף של צורות מורכבות', 20)],
      note: 'ב־2006 שטח והיקף של צורות מורכבות הם ברשימת השליטה של ה׳' },
    { grade: 'ו', topic: 'נפח', old: [
      o('ד', 'ח. מדידות', 'נפח תיבה, שטח פנים', 1),
      o('ו', 'י. מדידות', 'חישובי נפחים', 1)] },
    { grade: 'ו', topic: 'ממוצע', old: [
      o('ה', 'ג. חקר נתונים, ממוצע', 'חישוב ממוצע', 13),
      o('ה', 'ג. חקר נתונים, ממוצע', 'תכונות הממוצע', 13)],
      note: 'ב־2006 הממוצע הוא נושא של ה׳' },
    { grade: 'ו', topic: 'קריאה והצגה של נתונים', old: [
      o('ו', 'ח. חקר נתונים וניתוח סיכויים', 'שכיחות, שכיחות יחסית', 19),
      o('ד', 'ה. חקר נתונים וניתוח סיכויים', 'דיאגרמות מוטות ועמודות', 15)] },
  ];

  // Headings the 2006 programme teaches in ד׳–ו׳ that no app row covers.
  const OLD_ONLY = [
    o('ד', 'ד. פעולות החשבון — חזקות', 'החזקה תילמד ככתיב מקוצר לכפל חוזר', 15),
    o('ד', 'ה. חקר נתונים וניתוח סיכויים', 'ניתוח סיכויים', 1),
    o('ה', 'ד. מצולעים', 'ריצוף במצולעים משוכללים חופפים', 1),
    o('ו', 'ג. יחס', 'יחס - הגדרת היחס ותכונותיו', 11),
    o('ו', 'ד. מידות עשרוניות', 'מידות עשרוניות', 1),
    o('ו', 'ה. קנה מידה', 'קנה מידה', 1),
    o('ו', 'א. שברים', 'שבר עשרוני מחזורי', 1),
    o('ו', 'ט. גופים', 'הכרת הגליל והחרוט', 20),
    o('ו', 'ט. גופים', 'גופים משוכללים', 1),
    o('ו', 'ו. מספרים ופעולות - הרחבה והעמקה', 'המספרים המכוונים', 14),
  ];

  function pdfUrl(grade) {
    const n = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'].indexOf(grade) + 1;
    return n > 0 ? PDF + n + '.pdf' : PAGE;
  }

  function withLinks(e) {
    return Object.assign({}, e, { url: pdfUrl(e.grade) + '#page=' + e.page });
  }

  MAP.forEach(function (r) { r.unverified = !(r.old && r.old.length); });

  // The 2006 entry of one app row, or null when the row is not in ד׳–ו׳.
  function forTopic(grade, topic) {
    const r = MAP.find(function (m) { return m.grade === grade && m.topic === topic; });
    if (!r) return null;
    return {
      grade: r.grade,
      topic: r.topic,
      verified: !r.unverified,
      label: r.unverified ? UNVERIFIED_HE : r.old.map(function (e) { return e.grade + '׳ ' + e.section; }).join(' · '),
      oldGrades: r.old.map(function (e) { return e.grade; }).filter(function (g, i, a) { return a.indexOf(g) === i; }),
      old: r.old.map(withLinks),
      note: r.note || '',
    };
  }

  function rowsForGrade(grade) {
    return MAP.filter(function (m) { return m.grade === grade; }).map(function (m) { return forTopic(m.grade, m.topic); });
  }

  // Every quote with the PDF it must be found in (for the verify tool).
  function allQuotes() {
    const out = [];
    MAP.forEach(function (r) { r.old.forEach(function (e) { out.push(Object.assign({ topic: r.topic }, withLinks(e))); }); });
    OLD_ONLY.forEach(function (e) { out.push(Object.assign({ topic: null }, withLinks(e))); });
    return out;
  }

  return {
    GRADES: GRADES,
    MAP: MAP,
    OLD_ONLY: OLD_ONLY,
    PAGE: PAGE,
    TITLE_PDF: TITLE_PDF,
    STILL_OLD_PDF: STILL_OLD_PDF,
    STILL_OLD_QUOTE: STILL_OLD_QUOTE,
    STILL_OLD_PAGE: STILL_OLD_PAGE,
    SOURCE_READ: SOURCE_READ,
    UNVERIFIED_HE: UNVERIFIED_HE,
    pdfUrl: pdfUrl,
    forTopic: forTopic,
    rowsForGrade: rowsForGrade,
    allQuotes: allQuotes,
  };
});
