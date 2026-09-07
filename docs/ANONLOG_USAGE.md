# anonLog — שימוש

מודול: `src/lib/anonLog.js`  
**No PII.** נשמרים רק: `ts`, `exerciseId`, `correct`, `durationMs`.

## טעינה

```js
// Node / בדיקות
const anon = require('../src/lib/anonLog');

// דפדפן (אחרי script tag) — ה־API על globalThis
```

## קריאות עיקריות

```js
// רשום אירוע תרגול (אפשר להעביר storage מדומה בבדיקות)
anon.record({
  exerciseId: 'add-3',
  correct: true,
  durationMs: 1200,
  // אל תעבירו name / email / phone / nationalId / classCode — יוסרו
}, localStorage);

const rows = anon.exportEvents(localStorage);
const summary = anon.summarize(localStorage);
// summary.anonymous === true, summary.pii === false

anon.clear(localStorage);
```

## ניקוי ידני

```js
const cleaned = anon.stripPii(rawObject);
const ev = anon.normalizeEvent(rawObject); // תמיד ארבעה שדות בלבד
```

## אסור

- לא לשמור שם תלמיד, אימייל, טלפון, ת״ז, כתובת, או קוד כיתה בלוג האנונימי.
- מצב כיתה עם שמות מקומיים הוא אחסון נפרד — לא דרך anonLog.

## logAttempt (UI helper)

```js
// מועדף מה־UI — לא מעביר prompt/given/answer/name
anon.logAttempt({
  id: 'add-3',       // או exerciseId / skill / kind
  correct: true,
  durationMs: 1200,
}, localStorage);
```

ב־`index.html`, `logTeacherItem` קורא תמיד ל־`logAttempt(item)` קודם (נתיב אנונימי), ואז ל־teacherStore אם יש סשן מורה.

## צ׳ק־ליסט חיבור UI

- [x] טעינת `src/lib/anonLog.js` ב־`index.html` לפני `teacherStore.js`
- [x] `logTeacherItem` → `logAttempt` (anon path) ואז roster מורה
- [x] precache ב־`sw.js` ל־`./src/lib/anonLog.js`
