# PR #401 כבר נמצא ב-`master` (Refs #441, Refs #401)

`auto_merger` פתח את #441: «לפתור את קונפליקטי המיזוג של PR #401» —
`factory/laptop-agy-playground-y-freq` → `master`, «wire screen Y frequency
slider in playground with ARIA and test coverage (#400)». GitHub מדווח על
קונפליקט, ו-update-branch נכשל.

**אין קונפליקט לפתור: #401 כבר נמזג ל-`master` כ-squash, `343a045`
(18.10, 08:02).** כל שורה שה-PR מוסיף נמצאת ב-`master`. מיזוג `master` לתוך
הענף רק יאמץ את גרסת `master`, ואז הדיף של ה-PR יהיה ריק. לכן הפעולה הנכונה
היא לסגור את #401 (אם הוא עדיין פתוח) ואת #441, בלי לדחוף לענף.

## מה באמת יש ב-PR #401

```
$ node tools/pr-size.js origin/factory/laptop-agy-playground-y-freq origin/master
origin/factory/laptop-agy-playground-y-freq → origin/master
מוצג (origin/master...origin/factory/laptop-agy-playground-y-freq): 97 שורות ב-2 קבצים
אמיתי (origin/master..origin/factory/laptop-agy-playground-y-freq, בקבצי ה-PR): 261 שורות ב-1 קבצים
כבר ביעד (תוכן זהה): 92 שורות ב-1 קבצים
עומד בתקרה: 97 שורות מתוך 400.
```

הבדיקה מול `origin/master` (`951e5be`), שורה אחר שורה:

| קובץ | מה ה-PR מוסיף | מצב ב-`master` |
| --- | --- | --- |
| `test/playgroundYFreq.test.js` | 92 שורות, קובץ חדש | **blob זהה** |
| `index.html` — `let yAudioThrottle`, `updateYFreq`, חיבור `oninput` | 3 שורות | זהות מילה במילה (שורות 487–489) |
| `index.html` — `<input id="y">` עם `aria-valuenow`, `aria-valuetext="50% · 370 Hz"`, `aria-label` | שורה אחת | המאפיינים קיימים (שורה 430) |

השורה היחידה שאינה זהה היא שורת `<section id="playground">`. ב-`index.html` היא
שורה אחת ארוכה, ו-12 קומיטים ב-`master` אחרי `343a045` שינו בה דברים אחרים. זה
מקור הקונפליקט שמדווח ב-GitHub. התוספת של #401 עצמה נמצאת בה.

## למה GitHub רואה קונפליקט

```
4795f02 18.10 07:43 Merge master into PR #401: resolve index.html conflicts
5c2e35a 18.10 01:11 feat(grade1): ... (#432)          ← נקודת הפיצול
343a045 18.10 08:02 fix(ui): wire screen Y frequency slider ... (#400) (#401)
```

* **18.10, 07:43** — הענף מוזג עם `master` (`5c2e35a`) ונפתרו בו קונפליקטים.
* **18.10, 08:02** — #401 נמזג כ-squash, `343a045`. הענף לא נמחק.
* מאז, `master` המשיך לשנות את שורת ה-`<section>`. מול נקודת הפיצול, שני הצדדים
  שינו את אותה שורה בצורה שונה (הענף רק את מאפייני ה-`<input id="y">`, ו-`master`
  את אלה ועוד), ולכן המיזוג נעצר. פתרון נכון לוקח את הגרסה של `master` כמו שהיא,
  ואז לא נשאר בענף שום שינוי.

## לא נשמט דבר

הדרישה ב-#441 היא «לשמור על כוונת ה-PR ולא להשמיט דבר». כוונת ה-PR — מחוון
Y מחובר, עם ARIA ועם `test/playgroundYFreq.test.js` — כבר רצה ב-`master`
ומכוסה ב-`npm test` (778 עוברים, 0 נכשלים). דחיפת קומיט מיזוג לענף לא תשנה
את `master` בכלום.

## מה שעוד חסר

סגירת #401 ו-#441 היא כתיבה ל-GitHub, ואין לסוכן הרשאה לעשות אותה מתוך
עץ-העבודה. הטקסט לתגובת הסגירה:

> נסגר בלי מיזוג: #401 כבר נמזג ל-`master` כ-squash ב-`343a045` (18.10).
> `test/playgroundYFreq.test.js` נמצא ב-`master` בתוכן זהה בייט-בייט, ו-4
> השורות שה-PR שינה ב-`index.html` (`updateYFreq`, `yAudioThrottle`, חיבור
> `oninput` ומאפייני ARIA של `<input id="y">`) נמצאות שם. הקונפליקט בא משורת
> `<section id="playground">` הארוכה, ש-`master` המשיך לשנות אחרי ה-squash.
> פתרון שלוקח את הגרסה של `master` משאיר את ה-PR ריק. פירוט מלא ב-
> `docs/PR-401-SUPERSEDED.md` (Refs #441).
