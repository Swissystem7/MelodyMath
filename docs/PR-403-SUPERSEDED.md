# PR #403 — אין מה למזג, לסגור (Refs #405, Refs #403)

#405 מבקש למזג את `main` לתוך `factory/laptop-agy-playground-rhythm-acc` ולפתור
את הקונפליקטים כדי ש-#403 ייעשה בר-מיזוג. **אין טעם לעשות את זה: התוכן של #403
כבר נחת ב-`master`**, ומיזוג `main` לענף רק ימחזר את פער `master`→`main`.

## מה יש בענף

קומיט אחד מעל `master`, `ca65cb0` (103+/2−): התווית החיה וה-ARIA של מחוון הדיוק
במחולל המקצב ב-`index.html`, ו-`test/playgroundRhythmAccuracy.test.js`.

```
$ node tools/pr-size.js origin/factory/laptop-agy-playground-rhythm-acc origin/main 400 origin/master
מוצג (origin/main...origin/factory/laptop-agy-playground-rhythm-acc): 6770 שורות ב-80 קבצים
אמיתי (origin/main..origin/factory/laptop-agy-playground-rhythm-acc, בקבצי ה-PR): 1123 שורות ב-28 קבצים
כבר ביעד (תוכן זהה): 4878 שורות ב-52 קבצים
של הענף (origin/master...origin/factory/laptop-agy-playground-rhythm-acc): 105 שורות ב-2 קבצים
```

## איפה זה כבר נמצא

#538 (`9a5621e`, Closes #404) העביר את `ca65cb0` ל-`master` לפי
[`PR-403-SPLIT.md`](PR-403-SPLIT.md):

| קובץ | מצב ב-`master` (`c1cb599`) |
| --- | --- |
| `test/playgroundRhythmAccuracy.test.js` | **blob זהה** לענף |
| `index.html` | `#accuracyLabel`, ה-ARIA של `#accuracy`, `aria-live` על `#rhythm`, `updateRhythmAccuracy` והחיווט של `rhythmLevel`/`makeRhythm` — כולם קיימים; שאר השורה בגרסת `master` |

`npm test` על `master`: 810 בדיקות, 809 עוברות, 0 נכשלות (כולל ארבע הבדיקות של
`playgroundRhythmAccuracy`).

## למה לא `git merge origin/main`

הענף נחתך מ-`master` (`3dbb0b4`) ונפתח מול `main`. מיזוג `main` לתוכו היה פותר
קונפליקטים בעשרות קבצים של פער האינטגרציה, ו-#403 עדיין היה מציג מעל 1000 שורות
מול `main` — מעל התקרה של `auto_merger` — בלי להוסיף שום שורה שלא קיימת כבר
ב-`master`. השינוי יגיע ל-`main` (ול-GitHub Pages) בסדרת `sync main <- master`
הבאה, כמו כל שינוי אחר.

## מה שעוד חסר

סגירת #403 היא כתיבה ל-GitHub, שאין לה הרשאה בעץ-העבודה של הסוכן. הטקסט לתגובת
הסגירה:

> נסגר בלי מיזוג. מתוך 6770 השורות המוצגות רק 105 שייכות ל-PR הזה (קומיט אחד,
> `ca65cb0`), והן כבר ב-`master` דרך #538 (Closes #404): הבדיקה בתוכן זהה, וה-ARIA
> והתווית החיה של מחוון הדיוק ב-`index.html`. השאר הוא פער `master`→`main`
> שסדרת `sync main <- master` הבאה תסגור. פירוט ב-`docs/PR-403-SUPERSEDED.md`
> (Refs #405).
