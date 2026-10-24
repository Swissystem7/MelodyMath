# PR #407 כבר נמצא ב-`master` (Refs #442, Refs #407)

`auto_merger` פתח את #442: «לפתור את קונפליקטי המיזוג של PR #407» —
`factory/laptop-agy-singing-line-presets` → `master`, «wire singing number line
fraction presets with aria-pressed, slider ARIA semantics, and touch targets
(#406)». GitHub מדווח על קונפליקט, ו-update-branch נכשל.

**אין קונפליקט לפתור: #407 כבר נמזג ל-`master` כ-squash, `b625e2a`
(18.10, 08:32).** כל שורה שה-PR מוסיף נמצאת ב-`master`. מיזוג `master` לתוך
הענף רק יאמץ את גרסת `master`, ואז הדיף של ה-PR יהיה ריק. לכן הפעולה הנכונה
היא לסגור את #407 (אם הוא עדיין פתוח) ואת #442, בלי לדחוף לענף.

## מה באמת יש ב-PR #407

```
$ node tools/pr-size.js origin/factory/laptop-agy-singing-line-presets origin/master
origin/factory/laptop-agy-singing-line-presets → origin/master
מוצג (origin/master...origin/factory/laptop-agy-singing-line-presets): 142 שורות ב-2 קבצים
אמיתי (origin/master..origin/factory/laptop-agy-singing-line-presets, בקבצי ה-PR): 220 שורות ב-1 קבצים
כבר ביעד (תוכן זהה): 132 שורות ב-1 קבצים
עומד בתקרה: 142 שורות מתוך 400.
```

הבדיקה מול `origin/master` (`c1cb599`), שורה אחר שורה:

| קובץ | מה ה-PR מוסיף | מצב ב-`master` |
| --- | --- | --- |
| `test/singingLineUi.test.js` | 132 שורות, קובץ חדש | **blob זהה** (`71cfdeb`) |
| `index.html` — כללי CSS של `.nl-control` ו-`.nl-keys` (גובה מגע 44–48px, `aria-pressed`, `focus-visible`) | 6 שורות | זהות מילה במילה (שורות 148–153) |
| `index.html` — `updateSingingLine` שמעדכן `aria-valuenow`/`aria-valuetext` ואת `aria-pressed` של כפתורי השבר | שורה אחת | זהה מילה במילה (שורה 497) |
| `index.html` — `<input id="singingLine">` עם `aria-label`, וקבוצת `.nl-keys` עם `role="group"` ו-`aria-pressed` | שורה אחת | המאפיינים קיימים (שורה 431) |

השורה היחידה שאינה זהה היא שורת `<section id="playground">`. ב-`index.html` היא
שורה אחת ארוכה, ו-11 קומיטים ב-`master` אחרי `b625e2a` שינו את הקובץ, חלקם
בשורה הזאת (למשל מחוון `accuracy` ותצוגת `rhythm`). זה מקור הקונפליקט שמדווח
ב-GitHub. התוספת של #407 עצמה נמצאת בה.

## למה GitHub רואה קונפליקט

```
3eedc7d 18.10 08:03 Merge master into PR #407: resolve index.html after #396/#401/#408/#416 landed
2bdb716 18.10 08:02 fix(ui): beat mode WAI-ARIA semantics ... (#416)   ← נקודת הפיצול
b625e2a 18.10 08:32 fix(ui): wire singing number line fraction presets ... (#406) (#407)
```

* **18.10, 08:03** — הענף מוזג עם `master` (`2bdb716`) ונפתרו בו קונפליקטים.
* **18.10, 08:32** — #407 נמזג כ-squash, `b625e2a`. הענף לא נמחק.
* מאז, `master` המשיך לשנות את שורת ה-`<section>`. מול נקודת הפיצול, שני הצדדים
  שינו את אותה שורה בצורה שונה, ולכן המיזוג נעצר. פתרון נכון לוקח את הגרסה של
  `master` כמו שהיא, ואז לא נשאר בענף שום שינוי.

## לא נשמט דבר

הדרישה ב-#442 היא «לשמור על כוונת ה-PR ולא להשמיט דבר». כוונת ה-PR — כפתורי
השבר של ישר המספרים המנגן עם `aria-pressed`, ARIA למחוון, יעדי מגע ו-
`test/singingLineUi.test.js` — כבר רצה ב-`master` ומכוסה ב-`npm test` (809
עוברים, 0 נכשלים, 1 מדולג). דחיפת קומיט מיזוג לענף לא תשנה את `master` בכלום.

## מה שעוד חסר

סגירת #407 ו-#442 היא כתיבה ל-GitHub, ואין לסוכן הרשאה לעשות אותה מתוך
עץ-העבודה. הטקסט לתגובת הסגירה:

> נסגר בלי מיזוג: #407 כבר נמזג ל-`master` כ-squash ב-`b625e2a` (18.10).
> `test/singingLineUi.test.js` נמצא ב-`master` בתוכן זהה בייט-בייט, ו-8
> השורות שה-PR שינה ב-`index.html` (כללי ה-CSS של `.nl-control`/`.nl-keys`,
> `updateSingingLine` ומאפייני ה-ARIA של המחוון וכפתורי השבר) נמצאות שם.
> הקונפליקט בא משורת `<section id="playground">` הארוכה, ש-`master` המשיך
> לשנות אחרי ה-squash. פתרון שלוקח את הגרסה של `master` משאיר את ה-PR ריק.
> פירוט מלא ב-`docs/PR-407-SUPERSEDED.md` (Refs #442).
