# פתרון הקונפליקטים של PR #433 (Refs #434, Refs #433)

`auto_merger` לא מצליח למזג את PR #433 — `cursor/plan-one-source-fd55` → `master`,
«feat(plan): make the study-plan builder one topic from the learner plan» —
כי GitHub מדווח על קונפליקטים ו-update-branch נכשל.

**הפתרון הנכון של שני הקונפליקטים הוא הצד של `master`, ואחריו ה-PR ריק.**
כל מה ש-#433 מוסיף כבר נמצא ב-`master`, בגרסה רחבה יותר. לכן הפעולה הנכונה היא
לסגור את #433 בלי מיזוג.

## מה יש ב-PR #433

```
$ node tools/pr-size.js origin/cursor/plan-one-source-fd55 origin/master
מוצג (origin/master...origin/cursor/plan-one-source-fd55): 134 שורות ב-2 קבצים
אמיתי (origin/master..origin/cursor/plan-one-source-fd55, בקבצי ה-PR): 83 שורות ב-2 קבצים
```

קומיט אחד, `8d356f9`, מעל נקודת הפיצול `51d1c86` (#341): 82 שורות
ב-`src/lib/pedagogy.js` ו-52 ב-`test/pedagogy.test.js`. הכלי לא מסמן אותו
`superseded`, כי הקבצים ב-`master` אינם blob זהה — הם **על-קבוצה** שלו.

## מה `master` כבר מחזיק

הקוד נחת ב-`master` ב-`3e8a19e` (#514, Closes #509, 21.10):

| | PR #433 | `master` (`cbbd14f`) |
| --- | --- | --- |
| `learnerApi`, `gradeOf`, `perSkillArray` | ✔ | ✔ זהה שורה-שורה |
| `stepFrom` | ✔ | ✔ ועוד `bankItemIds` (`bankIdsForRow`, `STRAND_TO_SKILLS`) |
| `buildStudentStudyPlan`, `renderStudentStudyPlanHtml` + export | ✔ | ✔ זהה שורה-שורה |
| טסט: דחייה ל-`buildLearnerPlan` גלובלי | ✔ | ✔ זהה, כטסט נפרד |
| טסט: נפילה לשורה הראשונה בתוכנית הלימודים | ✔ | ✔ עם הסרה מפורשת של `learnerPlan` מה-cache |
| טסט: אותו נושא כמו `buildLearnerPlan` ב-א–ג | — | ✔ |

## למה לא לקחת את הצד של ה-PR

1. **`pedagogy.js`:** הצד של ה-PR זהה לצד של `master` חוץ משורה אחת —
   `bankItemIds` ב-`stepFrom` — ולכן לקחת אותו היה **מוחק** את הקישור לפריטי
   הבנק שנוסף ב-#514.
2. **`pedagogy.test.js`:** הטסט של ה-PR נכשל על `master`. הוא מצפה ל-
   `source: 'curriculum'` כשאין `buildLearnerPlan` גלובלי, אבל ב-`master` קיים
   `src/lib/learnerPlan.js`, ו-`learnerApi()` טוען אותו דרך `require`:

   ```
   $ node test/_pr433_tmp.test.js   # הטסט של ה-PR מול הקוד של master
   actual: 'learnerPlan', expected: 'curriculum'
   ```

   `master` מכסה את אותו מקרה כמו שצריך: הוא מרוקן את `learnerPlan` ב-
   `require.cache` לפני הבדיקה.

לכן כוונת ה-PR — «נושא אחד, אותה החלטה כמו `buildLearnerPlan`» — כבר מקוימת
ב-`master` במלואה, ולא נשמטת ממנה אף שורה.

## המיזוג עצמו

לביצוע על הענף של ה-PR (בלי force push):

```
git switch cursor/plan-one-source-fd55
git merge origin/master
git checkout --theirs src/lib/pedagogy.js test/pedagogy.test.js
git add src/lib/pedagogy.js test/pedagogy.test.js
git commit --no-edit
npm test
git push origin cursor/plan-one-source-fd55
```

בבדיקה על `master` (`cbbd14f`): `npm test` — 762 טסטים, 761 עוברים, 0 נכשלים,
1 מדולג. אחרי הדחיפה ה-PR יהיה בר-מיזוג, אבל דיף שלוש-הנקודות שלו ריק.

## מה שעוד חסר

עץ-העבודה של הסוכן לא מקבל הרשאה ל-`git merge` ולדחיפה לענף זר, ולכן הפקודות
למעלה לא הורצו כאן. הטקסט לתגובת הסגירה של #433:

> נסגר בלי מיזוג: כל השינוי כבר ב-`master` דרך #514 (`3e8a19e`). הפונקציות
> `buildStudentStudyPlan`/`renderStudentStudyPlanHtml` זהות שורה-שורה, ו-`master`
> מוסיף עליהן `bankItemIds`. פתרון הקונפליקטים הוא הצד של `master` בשני
> הקבצים, ואחריו ה-PR ריק. הטסט של ה-PR גם נכשל על `master` (`source` הוא
> `learnerPlan` כי `learnerPlan.js` קיים). פירוט ב-`docs/PR-433-SUPERSEDED.md`
> (Refs #434).
