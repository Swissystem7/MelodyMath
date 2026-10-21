# הקונפליקטים של PR #398 (Refs #399, Refs #398)

ל-PR #398 — `factory/laptop-agy-practice-ui-a11y` → `master`, «fix(ui): practice
tab cancel quiz action, focus management, and WAI-ARIA accessibility (#397)» —
GitHub מדווח על קונפליקט מול `master`, ו-update-branch נכשל, ולכן `auto_merger`
לא יכול למזג אותו.

**אין מה למזג: כל מה ש-#398 מוסיף כבר נמצא ב-`master`.** אם פותרים את הקונפליקטים
בלי לאבד אף התנהגות, העץ שיוצא זהה ל-`master`. כלומר דיף שלוש-הנקודות של ה-PR
מתרוקן. לכן צריך לסגור את #398, לא לדחוף אליו merge.

## מה יש ב-PR #398

קומיט אחד, `9c52c7e` (17.10, 10:46), על `3dbb0b4`: **47 שורות ב-2 קבצים**.

```
$ node tools/pr-size.js origin/factory/laptop-agy-practice-ui-a11y origin/master
מוצג (origin/master...origin/factory/laptop-agy-practice-ui-a11y): 47 שורות ב-2 קבצים
אמיתי (origin/master..origin/factory/laptop-agy-practice-ui-a11y, בקבצי ה-PR): 409 שורות ב-2 קבצים
עומד בתקרה: 47 שורות מתוך 400.
```

הכלי לא מסמן את זה כ-`superseded`, כי `index.html` ב-`master` התקדם מאז בשורות
אחרות, ולכן ה-blob שלו שונה. כאן צריך להשוות שורה מול שורה:

| שינוי ב-#398 | מצב ב-`master` (`a107bd3`) | נחת דרך |
| --- | --- | --- |
| `role="group"` + `aria-label="רמת קושי לתרגול"` על `.levels` | שורה זהה | #511 |
| `role="status" aria-live="polite"` על `#counter` + כפתור `#quizCancel` «ביטול וחזרה» | שורה זהה | #511 |
| `finish()` מעביר פוקוס ל-`#again` | שורה זהה | #511 |
| Enter אחרי בדיקה מתקדם, `#again` ו-`#quizCancel` מחזירים פוקוס ל-`#begin` | שורה זהה | #511 |
| `check()` מעביר פוקוס ל-`#next`, או ל-`#finish` בתרגיל העשירי | אותה התנהגות, בניסוח אחר | #365 |
| `test/practiceUi.test.js` (7 טסטים) | אותם 7 טסטים, ובאחד מהם regex רופף יותר | #511 |

## מאיפה באו הקונפליקטים

* **`index.html`, השורה של `check()`**: ב-18.10, 00:41 #365 הוסיף ל-`master`
  העברת פוקוס בסוף `check()`:
  `if(history.length===10){setTimeout(finish,650);…$('finish').focus();}else if(…)$('next').focus();`.
  #398 ערך את אותה שורה ל-
  `if(history.length<10){…$('next').focus()}else{…$('finish').focus();setTimeout(finish,650)}`.
  שני הניסוחים עושים אותו דבר: `setTimeout` רק מתזמן, ולכן לא משנה אם הפוקוס בא
  לפניו או אחריו.
* **`test/practiceUi.test.js`, add/add**: ב-21.10, 08:37 #511 הוסיף את הקובץ
  ל-`master`. ההבדל היחיד מהגרסה של #398 הוא בטסט של `check()`: ב-`master` הוא
  בודק ששתי הקריאות ל-`focus()` נמצאות בשורת `check()`, ולא נצמד לניסוח אחד.

## הפתרון ולמה הוא ריק

אם משאירים את הגרסה של `master` בשני הקבצים, כל אחת משבע ההתנהגויות של #398 עדיין
שם, ושבעת הטסטים שלו עוברים (הטסט של `check()` בגרסה הרופפת). לבחור בגרסה של #398
ב-`check()` זה רק שינוי ניסוח של שורה, וכדי שהטסט המחמיר שלו יעבור צריך גם להחזיר
את ה-regex הנצמד, שהוא בדיוק מה ש-#511 ריכך. merge כזה לא מוסיף כלום ל-PR: אחרי
`git merge origin/master` לתוך הענף, דיף שלוש-הנקודות שלו מול `master` ריק, ו-PR
ריק לא אמור להתמזג.

## מה שעוד חסר

גם הדחיפה לענף וגם סגירת #398 דורשות כתיבה ל-GitHub, ואין לעץ-העבודה של הסוכן
הרשאה לזה. הטקסט לתגובת הסגירה:

> נסגר בלי מיזוג: כל מה ש-#398 מוסיף כבר ב-`master`. ה-`role="group"` על הרמות,
> ה-live region על המונה, כפתור «ביטול וחזרה», ניהול הפוקוס ב-`finish`/`again`/Enter
> ו-`test/practiceUi.test.js` נחתו ב-#511. העברת הפוקוס ב-`check()` נחתה קודם, ב-#365,
> בניסוח שונה עם אותה התנהגות. משם בא הקונפליקט. merge של `master` לענף מרוקן את
> הדיף. ההסבר המלא ב-`docs/PR-398-SUPERSEDED.md` (Refs #399).
