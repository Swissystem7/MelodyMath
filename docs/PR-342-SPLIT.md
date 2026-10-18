# פיצול PR #342 לתקרת ה-auto_merger (Refs #344, Refs #342)

`auto_merger` ממזג רק PR-ים של עד 400 שורות שונות (תוספות + מחיקות). ל-PR #342
— `factory/laptop-agy-unitcheck-cancel-a11y` → `main` — GitHub מציג **6717
שורות ב-79 קבצים**, ולכן הוא נחסם.

6717 מתוכן **6667 אינן שלו**.

## מה באמת יש ב-PR #342

```
$ node tools/pr-size.js origin/factory/laptop-agy-unitcheck-cancel-a11y origin/main 400 origin/master
origin/factory/laptop-agy-unitcheck-cancel-a11y → origin/main
מוצג (origin/main...origin/factory/laptop-agy-unitcheck-cancel-a11y): 6717 שורות ב-79 קבצים
אמיתי (origin/main..origin/factory/laptop-agy-unitcheck-cancel-a11y):  1573 שורות ב-26 קבצים
של הענף (origin/master...origin/factory/laptop-agy-unitcheck-cancel-a11y): 50 שורות ב-2 קבצים
אין מה לפצל — ה-PR פתוח מול הבסיס הלא נכון: הענף עצמו מוסיף 50 שורות, אבל הוא גורר עוד 1523 שורות של פער בין ענפי האינטגרציה. להפנות אותו לבסיס שממנו נחתך, ולסנכרן את הפער בנפרד.
```

שלוש ספירות, שלושה דברים שונים:

| מה נמדד | פקודה | שורות | קבצים |
| --- | --- | --- | --- |
| מה ש-GitHub וה-auto_merger מודדים | `git diff --shortstat origin/main...<branch>` | **6717** | 79 |
| מה שבאמת חסר ב-`main` | `git diff --shortstat origin/main..<branch>` | **1573** | 26 |
| מה שהענף עצמו הוסיף | `git diff --shortstat origin/master...<branch>` | **50** | 2 |

הענף נחתך מעל `master` אבל ה-PR פתוח מול `main`, ולכן הוא גורר איתו את כל הפער
בין שני ענפי האינטגרציה. הקומיט היחיד שלו, `21d01ba`, נוגע בשני קבצים:
`check.html` ו-`test/unitCheck.test.js`.

זו **מלכודת שלישית** אחרי שתי אלה שכבר תועדו —
[`PR-300-SPLIT.md`](PR-300-SPLIT.md) ו-[`PR-305-SPLIT.md`](PR-305-SPLIT.md)
תיארו ענף מעל ענף שנחת כ-squash, ושם גם דיף שתי-הנקודות היה קטן. כאן גם הוא
גדול, ולכן נוסף ל-`tools/pr-size.js` ארגומנט רביעי: בסיס החיתוך.

## הקומיט של #342 הוא גרסה מיושנת של #339

הענף נחתך לפני ש-#339 ו-#340 נחתו ב-`master`, והוא בונה מחדש חלק מאותה עבודה.
שלושה שינויים בו הם **נסיגה** ממה שכבר ב-`master`:

| מה שהענף עושה | למה זה נסיגה |
| --- | --- |
| מוחק את `$('report').classList.add('hidden')` ואת `.remove('hidden')` | זו בדיוק בידוד הדוח מהריצה שנחת ב-#339: בלעדיו הדוח של הכיתה נשאר על המסך תוך כדי בדיקה של תלמיד/ה |
| משנה את מזהה הכפתור `quizCancel` ל-`cancelQuiz` ואת התווית ל״ביטול בדיקה וחזרה״ | שינוי שם בלבד, ששובר את המבחן הקיים של #339 |
| מחליף את המבחן `check.html provides cancel quiz action and reciprocal navigation` | מאבד את הבדיקות ההדדיות מול `index.html` |

מה שבו **באמת חדש** מעל `master` הוא שמונה שיפורי נגישות ו-UX קטנים, וכולם
נחתו ב-PR הזה (ראו למטה) בלי שלוש הנסיגות.

## ההחלטה: #342 אינו PR לפיצול

* **50 השורות שלו** נחתו ישירות מעל `master` ב-PR של #344, בלי הנסיגות של
  #339/#340: קישור ל-`curriculum.html`, `aria-live` על הסטטוס,
  `role="group"` על כפתורי התשובה, `<caption>` ו-`scope="col"` בטבלת הדוח,
  החזרת פוקוס לטופס בסיום ובביטול, שמירה על `if (!run) return` בביטול, רענון
  הדוח בשינוי קוד כיתה או יחידה, ו-Enter בשדות הטופס.
* **1523 השורות הנותרות** הן פער `master` → `main`, שהוא העבודה של #263 ולא
  של #342. מי שרוצה אותן ב-`main` מפצל אותן לפי הטבלה למטה.

לכן #342 נסגר כ-superseded, לא מפוצל.

## הפער `master` → `main`: שבע מסירות ירוקות

1637 שורות ב-27 קבצים (1573 מהן ב-#342; ההפרש הוא #340, שהענף נחתך לפניו).
החלוקה הבאה נבדקה בפועל: כל מסירה נבנתה מעל `main` והורצה בה `node --test`,
והיא ירוקה גם לבדה וגם מצטברת. `main` היום: **557 מבחנים, 0 נכשלים, 1 דילוג**.

| # | מסירה | קבצים | שורות | מבחנים אחרי |
| --- | --- | --- | --- | --- |
| A | כלי מדידת גודל PR | `tools/pr-size.js`, `test/prSize.test.js`, `AGENTS.md` | 179 | 562 ✅ |
| B | מסמכי הפיצול | `docs/PR-300-SPLIT.md`, `docs/PR-305-SPLIT.md`, `docs/PR-263-SPLIT.md`, `docs/ISSUE-102-SLICES.md` | 358 | 562 ✅ |
| C | דפים ו-UI | `index.html`, `check.html`, `sw.js`, `offer.html`, `src/lib/unitCheck.js`, `test/index-ui.test.js`, `test/unitCheck.test.js`, `test/mobileSmoke.test.js`, `test/safeMailHref.test.js`, `README.md` | 193 | 564 ✅ |
| D | ציר המספרים | `src/lib/numberLine.js` | 48 | 564 ✅ |
| E | מוזיקה כיתה א׳ | `src/lib/grade1Music.js`, `test/grade1Music.test.js` | 399 | 569 ✅ |
| F | בנק המדידה | `src/lib/banks.js`, `src/lib/measure.js`, `test/measurementBank.test.js` | 255 | 572 ✅ |
| G | מספרים מעורבים | `src/lib/adaptive.js`, `src/lib/curriculum.js`, `test/mixedFractions.test.js`, `test/grade3Music.test.js` | 205 | 584 ✅ |

סך הכול 1637, וה-HEAD אחרי G זהה ל-`master`: 584 מבחנים, 0 נכשלים, 1 דילוג.

### התלויות שמחייבות את הסדר הזה

הפיצול המתבקש לפי קובץ **אדום**, ולכן הסדר כאן אינו שרירותי:

* `test/grade1Music.test.js` דורש ש-`src/lib/numberLine.js` כבר יהיה ב-`main`
  (״the number line scale is delegated to numberLine.js, not forked״), ואילו
  `src/lib/grade1Music.js` לבדו מפיל שלושה מבחנים קיימים. שתי המסירות הכרחיות
  ובסדר הזה — D לפני E — כי D+E ביחד הן 447, מעל התקרה.
* `src/lib/banks.js` לבדו מפיל את `test/measurementBank.test.js` הקיים, ולכן F
  חייבת לכלול גם את `src/lib/measure.js` וגם את המבחן.
* `test/mixedFractions.test.js` נשען על `banks.js` (F), על `adaptive.js`
  (`parseMixedNumber`), על `curriculum.js` ועל `src/lib/unitCheck.js` (C). לכן G
  אחרונה. F+G ביחד הן 460, מעל התקרה, ולכן הן נשארות שתיים.

### איך לשחזר את הבדיקה

אין צורך ב-`git merge` ואין צורך ברשת — בונים עץ מ-`origin/main` ומחליפים בו רק
את הקבצים של המסירה מ-`origin/master`, ומריצים שם `node --test`:

```sh
git show origin/main:<path>     # הבסיס
git show origin/master:<path>   # מה שהמסירה מביאה
```
