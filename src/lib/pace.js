// What the child is working on, in plain Hebrew for a parent or a teacher,
// and how the sessions actually logged compare with the typical pace.
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
  const DAY = 24 * 60 * 60 * 1000;
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
    ['mm-cur-29', 'כסף — המרה בין שקלים', 'ממירים שקלים לאגורות ואגורות לשקלים, ומחשבים קנייה ועודף.', 2, 4],
    ['mm-cur-30', 'איסוף, ארגון', 'אוספים נתונים, מארגנים אותם ובונים דיאגרמה.', 2, 4],

    ['mm-cur-31', 'עד מיליון', 'קוראים מספרים גדולים, מחשבים במאונך ושומרים על סדר הפעולות.', 4, 6],
    ['mm-cur-32', '1/2, 1/4, 1/8', 'רואים שבר כחלק משלם, מול תיבה של 4/4.', 4, 6, FRACTIONS],
    ['mm-cur-33', 'שבר כחלק מכמות', 'מוצאים שבר מתוך כמות, משווים שברים ומחברים אותם.', 4, 6],
    ['mm-cur-34', 'מקבילים, מאונכים', 'מזהים ישרים מקבילים ומאונכים וממיינים מרובעים.', 3, 5],
    ['mm-cur-35', 'יחידות אורך', 'ממירים יחידות אורך וקוראים תאריך בלוח השנה.', 2, 4],
    ['mm-cur-36', 'חישובי קנייה ועודף', 'מחשבים מחיר כפול כמות ואחר כך עודף.', 2, 3],
    ['mm-cur-37', 'טבלאות ודיאגרמות', 'קוראים טבלאות ודיאגרמות שיש בהן שברים.', 2, 4],

    ['mm-cur-38', 'גדולים ממיליון', 'קוראים, כותבים ומשווים מספרים גדולים ממיליון.', 2, 4],
    ['mm-cur-39', 'ארבע פעולות', 'מחשבים בארבע הפעולות עד מיליון, מעגלים ואומדים.', 3, 5],
    ['mm-cur-40', 'ראשוניים', 'מוצאים מחלקים וכפולות ומזהים מספר ראשוני.', 3, 5],
    ['mm-cur-41', 'הרחבה, צמצום', 'מרחיבים, מצמצמים ומשווים שברים.', 3, 5],
    ['mm-cur-42', 'ייצוג שברים', 'מציגים שבר במודל ועל ישר המספרים ורואים שבר כמנה.', 2, 4],
    ['mm-cur-43', 'שבר מכמות', 'מחשבים שבר מתוך כמות נתונה, ומוצאים גם את השלם.', 2, 4],
    ['mm-cur-44', 'במכנים שונים', 'מחברים ומחסרים שברים במכנים שונים.', 4, 6],
    ['mm-cur-45', 'ערך מקום, השוואה', 'קוראים ומשווים שברים עשרוניים.', 3, 5],
    ['mm-cur-46', 'חיבור וחיסור שברים עשרוניים', 'מחברים ומחסרים שברים עשרוניים.', 2, 4],
    ['mm-cur-47', 'שטח משולש', 'מזהים גובה במשולש ומחשבים שטח משולש ומקבילית.', 3, 5],
    ['mm-cur-48', 'פירמידות', 'סופרים פאות, מקצועות וקודקודים של מנסרות ופירמידות.', 1, 3],
    ['mm-cur-49', 'קריאה ופרשנות של דיאגרמות', 'קוראים דיאגרמה, מוצאים שכיחות ושכיח ומסבירים מה היא מראה.', 2, 4],

    ['mm-cur-50', 'מספרים טבעיים', 'עובדים עם מספרים טבעיים ושומרים על סדר הפעולות.', 3, 5],
    ['mm-cur-51', 'כפל וחילוק שברים', 'מכפילים ומחלקים שברים.', 3, 5],
    ['mm-cur-52', 'כפל וחילוק שברים עשרוניים', 'מכפילים ומחלקים שברים עשרוניים.', 3, 5],
    ['mm-cur-53', 'אחוזים', 'מבינים מה הוא אחוז ומחשבים אחוז מתוך כמות.', 3, 5],
    ['mm-cur-54', 'מעגל ועיגול', 'מזהים רדיוס וקוטר ומחשבים היקף מעגל.', 3, 5],
    ['mm-cur-55', 'מצולעים מורכבים', 'מפרקים מצולע מורכב לצורות מוכרות.', 3, 5],
    ['mm-cur-56', 'נפח', 'מחשבים נפח של תיבה.', 2, 4],
    ['mm-cur-57', 'ממוצע', 'מחשבים ממוצע של כמה מספרים.', 2, 4],
  ];

  const STATUS_HE = { ahead: 'מקדים', on: 'בקצב', behind: 'צריך חיזוק', none: 'טרם התחלנו' };

  const BY_ID = Object.create(null);
  TOPIC_PACE.forEach(function (row) {
    BY_ID[row[0]] = { goal: row[2], weeksMin: row[3], weeksMax: row[4], source: row[5] || EST };
  });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

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

  // Sessions logged on this device, and how many days they span. Days, not
  // whole weeks: a child two days into the first week owes two days of work,
  // not a whole week of it.
  function fromStudent(student, now) {
    const list = (student && student.sessions) || [];
    let count = 0;
    let first = 0;
    for (let i = 0; i < list.length; i++) {
      const sess = list[i];
      if (!sess || typeof sess !== 'object' || sess.started == null) continue;
      const at = Number(sess.started);
      if (!Number.isFinite(at) || at > now) continue;
      count += 1;
      if (!first || at < first) first = at;
    }
    return { sessionsDone: count, daysElapsed: count ? Math.max(1, Math.ceil((now - first) / DAY)) : 0 };
  }

  function whole(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  }

  function line(status, done, expected) {
    if (status === 'none') return 'עוד לא נרשמו מפגשים במכשיר הזה. מתחילים ב־' + SESSIONS_PER_WEEK + ' מפגשים קצרים השבוע.';
    const head = 'נרשמו ' + done + ' מפגשים, והקצב הטיפוסי עד כאן הוא כ־' + expected + '. ';
    if (status === 'ahead') return head + 'אפשר להוסיף אתגר באותו נושא או לעבור לנושא הבא.';
    if (status === 'on') return head + 'זה בתוך הקצב הצפוי לנושא.';
    return head + 'מפגש קצר אחד נוסף השבוע מחזיר את הנושא לטווח.';
  }

  function paceProgress(input) {
    const src = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const pace = topicPace(src.topicId || src.topic || src.row || null);
    if (!pace) {
      return { ok: false, status: 'none', statusHe: STATUS_HE.none, topicId: '', grade: '', topic: '', goal: '',
        weeksRange: '—', sessionsRange: '—', sessionsPerWeek: SESSIONS_PER_WEEK, minutes: MINUTES, source: EST,
        sessionsDone: 0, expectedSessions: 0, sessionsTypical: 0, percent: 0, note: NOTE,
        parentLine: 'אין עדיין נושא פעיל. בוחרים כיתה ומתחילים מנושא אחד.' };
    }
    const now = Number.isFinite(Number(src.now)) ? Number(src.now) : Date.now();
    const derived = fromStudent(src.student, now);
    const done = whole(src.sessionsDone) == null ? derived.sessionsDone : whole(src.sessionsDone);
    const weeksGiven = whole(src.weeksElapsed);
    const days = weeksGiven == null ? derived.daysElapsed : weeksGiven * 7;
    const weeks = days ? Math.max(1, Math.ceil(days / 7)) : 0;
    const expected = Math.min(pace.sessionsMax, Math.max(1, Math.round(SESSIONS_PER_WEEK * days / 7)));
    let status = 'none';
    if (done > 0 || days > 0) {
      const ratio = done / expected;
      status = ratio >= 1.2 ? 'ahead' : (ratio >= 0.7 ? 'on' : 'behind');
    }
    return {
      ok: true, status: status, statusHe: STATUS_HE[status],
      topicId: pace.topicId, grade: pace.grade, topic: pace.topic, goal: pace.goal,
      weeksRange: pace.weeksRange, sessionsRange: pace.sessionsRange,
      sessionsPerWeek: SESSIONS_PER_WEEK, minutes: MINUTES, weeksElapsed: weeks, daysElapsed: days,
      sessionsDone: done, expectedSessions: status === 'none' ? 0 : expected,
      sessionsTypical: pace.sessionsTypical,
      percent: Math.min(100, Math.round(100 * done / pace.sessionsTypical)),
      source: pace.source,
      parentLine: line(status, done, expected),
      note: NOTE,
    };
  }

  function renderPaceMeterHtml(progress) {
    const p = progress && typeof progress === 'object' ? progress : null;
    if (!p || p.ok !== true) return '';
    const max = p.sessionsTypical || 0;
    const now = Math.min(p.sessionsDone, max);
    const text = p.sessionsDone + ' מתוך ' + max + ' מפגשים טיפוסיים';
    return '<section class="mm-plan mm-pace" data-status="' + esc(p.status) + '" data-topic="' + esc(p.topic) + '" dir="rtl">'
      + '<p class="mm-plan-kicker">מה הילד מתרגל עכשיו</p>'
      + '<h3 class="mm-plan-topic">' + esc(p.topic) + '</h3>'
      + '<p class="mm-plan-adult">' + esc(p.goal) + '</p>'
      + '<p class="mm-plan-pace">טווח טיפוסי: ' + esc(p.weeksRange) + ' שבועות, ' + esc(p.sessionsRange)
      + ' מפגשים של ' + p.minutes + ' דקות. מקור: ' + esc(p.source) + '.</p>'
      + '<div class="mm-plan-track" role="progressbar" aria-valuemin="0" aria-valuemax="' + max + '"'
      + ' aria-valuenow="' + now + '" aria-valuetext="' + esc(text) + '"><span style="width:' + p.percent + '%"></span></div>'
      + '<p class="mm-pace-status"><b>' + esc(p.statusHe) + '</b> · ' + esc(p.parentLine) + '</p>'
      + '<p class="mm-plan-note">' + esc(p.note) + '</p></section>';
  }

  return {
    TOPIC_PACE: TOPIC_PACE,
    PACE_STATUS_HE: STATUS_HE,
    SESSIONS_PER_WEEK: SESSIONS_PER_WEEK,
    paceNote: paceNote,
    topicPace: topicPace,
    paceProgress: paceProgress,
    renderPaceMeterHtml: renderPaceMeterHtml,
  };
});
