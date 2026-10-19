// What the child is working on, in plain Hebrew for a parent or a teacher,
// and the typical pace for it: a goal and a range of weeks per curriculum topic.
// A range is typical, never a promise. No claim that rhythm improves math.
// Research frame: Perplexity A1-MelodyMath-AdaptivePlan §4 (expected pace per topic).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CUR = (typeof module === 'object' && module.exports)
    ? require('./curriculum')
    : (typeof globalThis !== 'undefined' ? globalThis : {});
  const SESSIONS_PER_WEEK = 3;
  const MINUTES = 8;
  const EST = 'הערכה';
  const FRACTIONS = 'Azaryahu et al. 2020 (12 מפגשים)';
  const NOTE = 'טווח טיפוסי ולא הבטחה. הספירה היא של מפגשים במכשיר הזה בלבד. אין טענה שהקצב משפר מתמטיקה.';

  // [topicId, anchor inside the curriculum topic, parent goal, weeks min, weeks max, source]
  // The anchor is checked against curriculum.js in the tests, so a reordered
  // matrix fails loudly instead of handing a topic somebody else's goal.
  const TOPIC_PACE = [
    ['mm-cur-0', 'ספירה עד 100', 'סופרים עד 100 קדימה ואחורה, מכל מספר שמתחילים בו.', 2, 4],
    ['mm-cur-1', 'מנייה עד 100', 'מונים כמות גדולה בקבוצות של עשר, לא אחד־אחד.', 2, 4],
    ['mm-cur-2', 'ישר המספרים', 'מוצאים מקום של מספר על הישר, גם בערך.', 2, 3],
    ['mm-cur-3', 'בתחום 10', 'מחברים ומחסרים עד 10 ואחר כך עד 20, כולל פירוקי 10.', 3, 5],
    ['mm-cur-4', 'בעשרות שלמות', 'מחברים ומחסרים עשרות שלמות עד 100.', 2, 3],
    ['mm-cur-5', 'לוח מאה', 'קוראים וכותבים מספרים ומוצאים אותם בלוח המאה.', 2, 3],
    ['mm-cur-6', 'סדרות דגמים', 'ממשיכים דגם שחוזר ואחר כך בונים דגם חדש.', 1, 3],
    ['mm-cur-7', 'מצבי חיבור', 'מתרגמים סיפור מהיום־יום לתרגיל חיבור או חיסור.', 2, 4],
    ['mm-cur-8', 'מיון מצולעים', 'ממיינים צורות לפי צלעות וקודקודים.', 2, 3],
    ['mm-cur-9', 'מדידת אורך', 'מודדים אורך בקוביות ואחר כך בסנטימטרים עם סרגל.', 2, 3],
    ['mm-cur-10', 'שעון אנלוגי', 'קוראים שעון בשעות שלמות.', 1, 3],
    ['mm-cur-11', 'מטבעות וסכומים', 'מזהים מטבעות ומחשבים סכום קטן.', 2, 3],
    ['mm-cur-12', 'דיאגרמת עמודות ופיקטוגרם', 'קוראים דיאגרמת עמודות ופיקטוגרם.', 2, 3],

    ['mm-cur-13', 'עד 1,000', 'קוראים מספרים עד 1,000 ומזהים מאות, עשרות ויחידות.', 3, 5],
    ['mm-cur-14', 'דו־ספרתי', 'מחברים ומחסרים דו־ספרתי, גם כשיש מעבר עשרת.', 3, 5],
    ['mm-cur-15', 'כפולות 2', 'יודעים בעל פה את לוחות 2, 4, 5 ו־10.', 2, 3],
    ['mm-cur-16', 'חילוק לחלקים', 'מחלקים כמות לקבוצות שוות.', 2, 4],
    ['mm-cur-17', 'פירוק והרכבה של מצולעים', 'מרכיבים ומפרקים צורות ומזהים זווית ישרה.', 2, 3],
    ['mm-cur-18', 'היקף', 'מודדים בסנטימטרים, מחשבים היקף וקוראים חצאי שעות.', 2, 4],
    ['mm-cur-19', 'אגורות', 'מחשבים קנייה ועודף בשקלים ובאגורות.', 2, 3],
    ['mm-cur-20', 'נפח תיבות', 'סופרים קוביות כדי למצוא נפח של תיבה.', 2, 3],
    ['mm-cur-21', 'טבלה, עמודות', 'קוראים טבלה, דיאגרמת עמודות ופיקטוגרם.', 2, 3],

    ['mm-cur-22', 'עד 10,000', 'קוראים מספרים עד 10,000 ומבינים את ערך המקום.', 3, 5],
    ['mm-cur-23', 'עד רבבה', 'מחברים ומחסרים במאונך עד עשרת אלפים.', 3, 5],
    ['mm-cur-24', 'לוח כפל', 'משלימים את לוח הכפל עד 10 כפול 10.', 4, 8],
    ['mm-cur-25', 'שארית', 'מחלקים עם שארית ומכפילים ב־10, ב־100 וב־1,000.', 2, 4],
    ['mm-cur-26', 'השוואה כפליות', 'פותרים שאלות «פי כמה» ושאלות בשני שלבים.', 3, 5],
    ['mm-cur-27', 'מיון משולשים', 'מזהים סוגי זוויות וממיינים משולשים.', 2, 4],
    ['mm-cur-28', 'שטח מלבן', 'מחשבים שטח מלבן וקוראים שעות ודקות.', 2, 4],
    ['mm-cur-29', 'יחידות משקל ונפח', 'ממירים ק״ג וגרם, ליטר ומ״ל, ומחשבים קנייה.', 2, 4],
    ['mm-cur-30', 'איסוף, ארגון', 'אוספים נתונים, מארגנים אותם ובונים דיאגרמה.', 2, 4],

    ['mm-cur-31', 'עד מיליון', 'קוראים מספרים גדולים, מחשבים במאונך ושומרים על סדר הפעולות.', 4, 6],
    ['mm-cur-32', '1/2, 1/4, 1/8', 'רואים שבר כחלק משלם, מול תיבה של 4/4.', 4, 6, FRACTIONS],
    ['mm-cur-33', 'שבר כחלק מכמות', 'מוצאים שבר מתוך כמות, משווים שברים ומחברים אותם.', 4, 6],
    ['mm-cur-34', 'מקבילים, מאונכים', 'מזהים ישרים מקבילים ומאונכים וממיינים מרובעים.', 3, 5],
    ['mm-cur-35', 'יחידות אורך', 'ממירים יחידות אורך וקוראים תאריך בלוח השנה.', 2, 4],
    ['mm-cur-36', 'חישובי קנייה ועודף', 'מחשבים מחיר כפול כמות ואחר כך עודף.', 2, 3],
    ['mm-cur-37', 'טבלאות ודיאגרמות', 'קוראים טבלאות ודיאגרמות שיש בהן שברים.', 2, 4],

    ['mm-cur-38', 'ראשוניים', 'מוצאים מחלקים וכפולות ומזהים מספר ראשוני.', 3, 5],
    ['mm-cur-39', 'הרחבה, צמצום', 'מרחיבים, מצמצמים ומשווים שברים.', 3, 5],
    ['mm-cur-40', 'במכנים שונים', 'מחברים ומחסרים שברים במכנים שונים.', 4, 6],
    ['mm-cur-41', 'שבר מכמות', 'מחשבים שבר מתוך כמות נתונה.', 2, 4],
    ['mm-cur-42', 'ערך מקום, השוואה', 'קוראים ומשווים שברים עשרוניים.', 3, 5],
    ['mm-cur-43', 'חיבור וחיסור שברים עשרוניים', 'מחברים ומחסרים שברים עשרוניים.', 2, 4],
    ['mm-cur-44', 'שטח משולש', 'מזהים גובה במשולש ומחשבים שטח משולש ומקבילית.', 3, 5],
    ['mm-cur-45', 'קריאה ופרשנות של דיאגרמות', 'קוראים דיאגרמה ומסבירים מה היא מראה.', 2, 4],

    ['mm-cur-46', 'מספרים טבעיים', 'עובדים עם מספרים טבעיים ושומרים על סדר הפעולות.', 3, 5],
    ['mm-cur-47', 'כפל וחילוק שברים', 'מכפילים ומחלקים שברים.', 3, 5],
    ['mm-cur-48', 'כפל וחילוק שברים עשרוניים', 'מכפילים ומחלקים שברים עשרוניים.', 3, 5],
    ['mm-cur-49', 'אחוזים', 'מבינים מה הוא אחוז ומחשבים אחוז מתוך כמות.', 3, 5],
    ['mm-cur-50', 'מעגל ועיגול', 'מזהים רדיוס וקוטר ומחשבים היקף מעגל.', 3, 5],
    ['mm-cur-51', 'מצולעים מורכבים', 'מפרקים מצולע מורכב לצורות מוכרות.', 3, 5],
    ['mm-cur-52', 'נפח', 'מחשבים נפח של תיבה.', 2, 4],
    ['mm-cur-53', 'ממוצע', 'מחשבים ממוצע של כמה מספרים.', 2, 4],
  ];

  const BY_ID = Object.create(null);
  TOPIC_PACE.forEach(function (row) {
    BY_ID[row[0]] = { goal: row[2], weeksMin: row[3], weeksMax: row[4], source: row[5] || EST };
  });

  function paceNote() {
    return NOTE;
  }

  // Accepts a topicId, the exact curriculum topic text, or a row that carries
  // either. Nothing fuzzy: two ו׳ topics differ only by one trailing word.
  function rowFor(ref) {
    let key = ref;
    if (key && typeof key === 'object') key = key.topicId || key.topic || '';
    key = String(key == null ? '' : key);
    if (!key) return null;
    const matrix = CUR.MATRIX || [];
    let byText = null;
    for (let i = 0; i < matrix.length; i++) {
      if (matrix[i].topicId === key) return matrix[i];
      if (!byText && matrix[i].topic === key) byText = matrix[i];
    }
    return byText;
  }

  function topicPace(ref) {
    const row = rowFor(ref);
    const entry = row ? BY_ID[row.topicId] : null;
    if (!entry) return null;
    const sessionsMin = entry.weeksMin * SESSIONS_PER_WEEK;
    const sessionsMax = entry.weeksMax * SESSIONS_PER_WEEK;
    return {
      topicId: row.topicId, grade: row.grade, topic: row.topic, coverage: row.status,
      goal: entry.goal, weeksMin: entry.weeksMin, weeksMax: entry.weeksMax,
      weeksRange: entry.weeksMin + '–' + entry.weeksMax,
      sessionsPerWeek: SESSIONS_PER_WEEK, minutes: MINUTES,
      sessionsMin: sessionsMin, sessionsMax: sessionsMax,
      sessionsRange: sessionsMin + '–' + sessionsMax,
      sessionsTypical: Math.round((sessionsMin + sessionsMax) / 2),
      source: entry.source,
    };
  }

  return {
    TOPIC_PACE: TOPIC_PACE,
    SESSIONS_PER_WEEK: SESSIONS_PER_WEEK,
    paceNote: paceNote,
    topicPace: topicPace,
  };
});
