# הקונפליקט של PR #392 מול `master` (Refs #439, Refs #392)

`auto_merger` לא מצליח למזג את PR #392 —
`cursor/melodymath-melodymath-copilot-20261-20261017-063035` → `master`, «fix: In
src/lib/assignment.js, the current code does this: the line `con» — כי GitHub
מדווח על קונפליקט עם `master` ו-update-branch נכשל.

**אין מה לפתור: התיקון של #392 כבר נחת ב-`master` דרך #353, בקוד אחר.** שני
הצדדים החליפו את אותה שורה ב-`normalizeAssignment` והוסיפו פונקציית עזר באותו
מקום, ולכן הקונפליקט. כל פתרון שמשאיר את ה-PR בעל תוכן הוא נסיגה של `master`
או כפילות. הפעולה הנכונה היא לסגור את #392.

## מה ה-PR עושה

קומיט אחד, `7cf9662` (17.10, 06:31), **25 שורות ב-2 קבצים**:

* `src/lib/assignment.js` — מזהה משימה שנבנה מ-`Date.now()` ומ-`Math.random()`
  הופך למזהה יציב: `'a' + assignedAt + slug(title)`, חתוך ל-40 תווים. כשהכותרת
  לא מכילה אותיות לטיניות או ספרות (כותרת בעברית) ה-slug הוא hash של הכותרת.
* `test/assignment.test.js` — טסט אחד: `{ title: 'Test', assignedAt: 1234567890 }`
  נותן `id: 'a1234567890test'`.

## מה כבר ב-`master`

`a4d20da` (#353, 18.10, 00:36) — אותו דוח dev-cycle, אותה כותרת קומיט, מימוש
אחר: `titleSlugForId(title)` משאיר `a-z0-9` ומקודד כל תו אחר בקוד התו שלו
בבסיס 36, ואז `('a' + String(assignedAt) + slug).slice(0, 40)`. אותה צורת
מזהה, אותו חיתוך, ובאותו מקום בקובץ. `master` מכיל גם טסט כמעט זהה,
`createAssignment derives a stable id from title and assignedAt`, עם אותו קלט
ואותו פלט צפוי.

הטסט של #392 עובר כמו שהוא על הקוד של `master` (`951e5be`):

```
$ node -e "console.log(require('./src/lib/assignment.js').createAssignment({title:'Test',assignedAt:1234567890}).id)"
a1234567890test
$ npm test
ℹ tests 779 · pass 778 · fail 0 · skipped 1
```

## איך הקונפליקט נפתר, ולמה אז ה-PR מתרוקן

| קובץ | מצב במיזוג | פתרון |
| --- | --- | --- |
| `src/lib/assignment.js` | קונפליקט: שתי פונקציות עזר שונות ושני ביטויי `id` שונים | הגרסה של `master` |
| `test/assignment.test.js` | בלי קונפליקט (כל צד הוסיף טסט במקום אחר) | הטסט של `master` נשאר; הטסט של ה-PR כפול לו |

למה הגרסה של `master` ב-`assignment.js`: היא כבר בשימוש מאז 18.10, ומזהים
שנשמרו בלי `id` נגזרים ממנה. מעבר ל-hash של #392 היה משנה את המזהה של כל
משימה עם כותרת בעברית, אז אותה משימה שנטענת שוב הייתה מקבלת מזהה אחר. כל
מה שהמימוש של #392 נותן (מזהה יציב, עם `assignedAt` ו-slug, עד 40 תווים) כבר
נמצא בגרסה של `master`, ולכן לא הולך לאיבוד כלום.

אחרי הפתרון הזה נשאר בדיף שלוש-הנקודות רק טסט כפול של 12 שורות. מיזוג שלו
מוסיף ל-`master` רק בדיקה שכבר קיימת בשם אחר.

## למה `tools/pr-size.js` לא תפס את זה

```
$ node tools/pr-size.js origin/cursor/melodymath-melodymath-copilot-20261-20261017-063035 origin/master 400
מוצג (...): 25 שורות ב-2 קבצים
אמיתי (...): 45 שורות ב-2 קבצים
עומד בתקרה: 25 שורות מתוך 400.
```

הכלי משווה blob מול blob, ופה התוכן שונה. אותו תיקון נכתב פעמיים, פעם אחת
ב-#392 ופעם שנייה ב-#353, ולא הועתק. לכן הפסק `superseded` לא חל. על זה לא
מגיבים בשינוי בכלי: זיהוי של «אותו תיקון במילים אחרות» צריך קריאה ולא השוואת
blob-ים.

## מה שעוד חסר

גם הדחיפה לענף של ה-PR וגם סגירת #392 דורשות כתיבה ל-GitHub, ולעץ-העבודה של
הסוכן אין הרשאה לזה. הטקסט לתגובת הסגירה:

> נסגר בלי מיזוג: התיקון כבר ב-`master` דרך #353 (`a4d20da`), שנבנה מאותו דוח
> dev-cycle. מזהה המשימה כבר יציב, `'a' + assignedAt + slug(title)` חתוך ל-40,
> והטסט של ה-PR (`'Test'`, `1234567890` → `a1234567890test`) עובר על `master`
> כמו שהוא. הקונפליקט ב-`src/lib/assignment.js` נפתר לטובת `master`, ואחרי זה
> נשאר רק טסט כפול. האבחון המלא ב-`docs/PR-392-SUPERSEDED.md` (Refs #439).

אם בכל זאת רוצים למזג את #392 ולא לסגור אותו, אלה הפקודות על עותק עם הרשאת
דחיפה:

```
git switch cursor/melodymath-melodymath-copilot-20261-20261017-063035
git merge origin/master
git checkout --theirs src/lib/assignment.js && git add src/lib/assignment.js
npm test && git commit --no-edit && git push
```
