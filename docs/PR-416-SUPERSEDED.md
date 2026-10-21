# הקונפליקטים של PR #416 (Refs #444, Refs #416)

`auto_merger` דיווח ש-PR #416 — `factory/laptop-agy-beat-ui-a11y` → `master`,
«fix(ui): beat mode WAI-ARIA semantics, cancel action, empty state guard, and
focus management» — מתנגש עם `master`, ושעדכון הענף נכשל.

**אין מה לפתור: התוכן של #416 כבר ב-`master`.** הוא נחת שם כ-squash,
`2bdb716` (18.10, 08:02), עשרים דקות אחרי הדחיפה האחרונה לענף (`0ff7441`, 07:43,
המיזוג הקודם של `master` לתוך הענף). מאז `master` המשיך לשנות את `index.html`,
ולכן הענף הישן מתנגש איתו. מיזוג `master` לתוך הענף רק ירוקן את ה-PR; הפעולה
הנכונה היא לסגור את #416, לא למזג אותו.

## הבדיקה

```
$ git log --oneline origin/master..origin/factory/laptop-agy-beat-ui-a11y
0ff7441 Merge master into PR #416: resolve index.html conflicts (auto_merger task)
56c860a fix(ui): beat mode WAI-ARIA semantics, cancel action, empty state guard, and focus management

$ git log --oneline -1 origin/master -- test/beatModeUi.test.js
2bdb716 fix(ui): beat mode WAI-ARIA semantics, cancel action, empty state guard, and focus management (#416)

$ git diff --quiet origin/master origin/factory/laptop-agy-beat-ui-a11y -- test/beatModeUi.test.js && echo TEST_IDENTICAL
TEST_IDENTICAL

$ node tools/pr-size.js origin/factory/laptop-agy-beat-ui-a11y origin/master
מוצג (origin/master...origin/factory/laptop-agy-beat-ui-a11y): 104 שורות ב-2 קבצים
אמיתי (origin/master..origin/factory/laptop-agy-beat-ui-a11y, בקבצי ה-PR): 265 שורות ב-1 קבצים
כבר ביעד (תוכן זהה): 79 שורות ב-1 קבצים
```

שני הקבצים של ה-PR מול `origin/master` (`c1cb599`):

| קובץ | שורות ב-PR | מצב ב-`master` |
| --- | --- | --- |
| `test/beatModeUi.test.js` | 79 | **blob זהה** (#416 = `2bdb716`) |
| `index.html` | 25 | כל השינויים נמצאים, בגרסה חדשה יותר של הקובץ |

ב-`index.html` של `master` נמצאים כל הקטעים של ה-PR: עוטף ה-flex עם הכפתור
`beatCancel` («ביטול וחזרה»), השמירה מפני מאגר ריק ב-`nextBeatQuestion`
(«אין פריטים זמינים בחבילה שנבחרה.»), `aria-label` «תשובה: …» לכל כפתור תשובה,
המיקוד ב-`beatAgain` בסוף `endBeatSession`, והמטפלים של `beatCancel` ו-`beatAgain`
שמחזירים את המיקוד ל-`beatStart`. 265 השורות «האמיתיות» הן ההפך: השינויים
ש-`master` צבר ב-`index.html` אחרי 18.10, שמיזוג הענף כפי שהוא היה מחזיר אחורה.

`npm test` על `master`: 809 עוברים, 0 נכשלים (כולל `beatModeUi.test.js`).

## מה שעוד חסר

סגירת #416 (או מחיקת הענף) דורשת כתיבה ל-GitHub, שאין לה הרשאה בעץ-העבודה של
הסוכן. הטקסט לתגובת הסגירה:

> נסגר בלי מיזוג: התוכן של ה-PR נחת ב-`master` כ-squash `2bdb716` (#416, 18.10).
> `test/beatModeUi.test.js` זהה בייט-בייט, וכל השינויים ב-`index.html` נמצאים
> ב-`master`; הקונפליקט נובע רק משינויים מאוחרים יותר של `master` באותו קובץ.
> האבחון ב-`docs/PR-416-SUPERSEDED.md` (Refs #444).
