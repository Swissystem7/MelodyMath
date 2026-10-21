# פיצול PR #403 לתקרת ה-auto_merger (Refs #404, Refs #403)

`auto_merger` ממזג רק PR-ים של עד 400 שורות שונות. ל-PR #403 — הענף
`factory/laptop-agy-playground-rhythm-acc` מול `main`, «fix(ui): wire rhythm
generator accuracy slider with live preview and ARIA accessibility (#402)» —
GitHub מציג **6770 שורות ב-80 קבצים**.

**רק 105 מהן שייכות ל-PR.** השאר הוא הפער בין `master` ל-`main`: הענף נחתך
מ-`master` (`3dbb0b4`, #336) אבל נפתח מול `main`.

```
$ node tools/pr-size.js origin/factory/laptop-agy-playground-rhythm-acc origin/main 400 origin/master
מוצג (origin/main...origin/factory/laptop-agy-playground-rhythm-acc): 6770 שורות ב-80 קבצים
אמיתי (origin/main..origin/factory/laptop-agy-playground-rhythm-acc, בקבצי ה-PR): 1123 שורות ב-28 קבצים
כבר ביעד (תוכן זהה): 4878 שורות ב-52 קבצים
של הענף (origin/master...origin/factory/laptop-agy-playground-rhythm-acc): 105 שורות ב-2 קבצים
אין מה לפצל — ה-PR פתוח מול הבסיס הלא נכון: …

$ git log --oneline origin/master..origin/factory/laptop-agy-playground-rhythm-acc
ca65cb0 fix(ui): wire rhythm generator accuracy slider with live preview and ARIA accessibility (#402)
```

## מה באמת יש ב-#403

קומיט אחד, `ca65cb0`, 103+/2−:

- `index.html` — במחולל המקצב בסטודיו: תווית חיה `דיוק אחרון: 70%`
  (`#accuracyLabel`), `aria-valuemin/max/now/valuetext` ו-`aria-label` על
  `#accuracy`, `aria-live="polite"` על `#rhythm`; `updateRhythmAccuracy` מעדכנת
  ערך, תווית ו-ARIA ומרעננת את התצוגה המקדימה בכל הזזה; שינוי קושי מרענן גם
  הוא; `showRhythm` לא נשברת כשאלמנט חסר.
- `test/playgroundRhythmAccuracy.test.js` — 4 בדיקות: המרקאפ, החיווט, הפונקציה
  עצמה ב-`vm` (כולל חיתוך ל-0–100) ובדיקת ניסוח בלי טענות טיפול.

שום דבר מזה עוד לא ב-`master` וגם לא ב-`main` (נבדק ב-21.10 מול `c93f89c`
ו-`8813281`; `git log --all -S accuracyLabel` מוצא רק את `ca65cb0` ואת
`535c3b1` הישן מ-7.10, שלא נחת).

## הפיצול

| חלק | מה | שורות | יעד |
| --- | --- | --- | --- |
| 1 — ה-PR הזה (Closes #404) | `ca65cb0` מועבר כמו שהוא אל `master` של היום: `index.html` ו-`test/playgroundRhythmAccuracy.test.js` | 105 | `master` |
| 2 — אין PR | 6665 השורות האחרות הן פער `master`→`main` ולא תוכן של #403 | — | סדרת `sync main <- master` הבאה |

למה `master` ולא `main`: `main` מוגש ב-GitHub Pages ומקבל את `master` רק דרך
סדרות הסנכרון (#445–#456 האחרונה). PR של 105 שורות מול `main` היה מפצל עוד
יותר את שני הענפים. השינוי יגיע לאתר החי בסנכרון הבא, כמו כל שינוי אחר.

הפורט נעשה ידנית ולא ב-cherry-pick, כי ב-`master` שורת ה-playground השתנתה מאז
`3dbb0b4` (ARIA של `#y` ו-`#singingLine`, footer). רק המחרוזות של מחולל המקצב
הוחלפו; שאר השורה כמו ב-`master`.

## תגובת הסגירה ל-#403

> נסגר בלי מיזוג. מתוך 6770 השורות המוצגות רק 105 שייכות ל-PR הזה (קומיט אחד,
> `ca65cb0`): השאר הוא הפער בין `master` ל-`main`, כי הענף נחתך מ-`master`
> ונפתח מול `main` (`node tools/pr-size.js origin/factory/laptop-agy-playground-rhythm-acc origin/main 400 origin/master`).
> התוכן האמיתי — התווית החיה וה-ARIA של מחוון הדיוק במחולל המקצב, עם 4
> הבדיקות — הועבר כמו שהוא ל-PR החדש מול `master` (Closes #404, 105 שורות).
> את הפער `master`→`main` סוגרת סדרת `sync main <- master` הבאה, לא PR הזה.
> הפירוט ב-`docs/PR-403-SPLIT.md`.
