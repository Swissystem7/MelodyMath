# פיצול PR #485 — לוח מורה: תמונת כיתה ותוכנית אישית (#418, #501)

PR #485 הוא הענף `claude/MelodyMath-418-20261019-112648` (438cefc). מול `origin/master` (176e02e) הוא בקונפליקט, ו-`node tools/pr-size.js origin/claude/MelodyMath-418-20261019-112648 origin/master` מראה 692 שורות מוצגות ו-774 חסרות ביעד — פיצול אמיתי, לא בעיית בסיס.

## מה היה שגוי בפיצול הקודם
`docs/PR-485-SPLIT.md` בענף של #486 (`claude/MelodyMath-486-20261019-145216`) ייחס את #485 לענף מד הקצב (`claude/MelodyMath-484-…`). ה-692 שהוא מצטט הוא הגודל של ענף #418, כך שפוצל הקוד הלא נכון. מד הקצב כבר במאסטר דרך #487 (3afce5e):
- ענף #484: `src/lib/pace.js` זהה ל-master («כבר ביעד (תוכן זהה): 229 שורות»). מיותר.
- ענף #486: גרסה מקוצרת של `pace.js` ו-`test/pace.test.js`; מיזוג שלו ימחק מ-master את `paceProgress` ו-`renderPaceMeterHtml`. מיותר ומזיק.

שני ה-PRs של הענפים האלה (ככל הנראה #488 ו-#489 — לבדוק ב-`gh pr list`) נסגרים בלי מיזוג עם הפניה לכאן. את #485 עצמו סוגרים בלי מיזוג אחרי שחלק 3 נפתח.

## חלק 1 — ה-PR הזה (#501, כ-180 שורות)
שכבת הנתונים, בלי שינוי במסך:
- `src/lib/teacherStore.js`: כיתה לכל תלמיד/ה — `gradeLabel`, `studentGrade`, `setStudentGrade`; `grade` ב-`listClassStudents` וב-`buildClassOverview`; בייבוא, כיתה שנקבעה בטאבלט הזה גוברת וכיתה ריקה מתמלאת.
- `src/lib/learnerPlan.js`: `topGaps` — עד שלושה נושאים חלשים (מתחת ל-80%), החלש קודם, נושא פעם אחת.
- הבדיקות: שלוש ב-`test/teacherStore.test.js` ואחת ב-`test/learnerPlan.test.js`.

## חלק 2 — PR המשך, מעל master אחרי חלק 1 (כ-390 שורות)
מתוך 438cefc, בלי קונפליקט (קבצים חדשים):
- `src/lib/classPicture.js` כמו שהוא.
- `test/classPicture.test.js` בלי הבדיקה של `topGaps` (עברה לחלק 1) ובלי ארבע הבדיקות של המסך: «index.html mounts the class picture…», «printMode clears every other print mode…», «the class picture names no color…», «the plan sheet is not a click target…».
אם המונה עובר 400, להעביר לחלק 3 גם את «a gap or status holding a comma…».

## חלק 3 — המסך (כ-150 שורות, אחרי חלק 2)
הקונפליקטים, ואיך פותרים אותם בלי לאבד את #500 (#497, הפלטה העליזה ו-`src/theme.css`):
- `src/sefirot.css`: משאירים את ה-`:root` של #497 ואת כללי `.mm-pace` של #487 כמו שהם. מוסיפים אחריהם את כללי `#classPicture`, `.class-picture`, `.cp-sheet` ו-`#classPlanSheet:focus` מ-438cefc — כולם על משתנים (`--muted`, `--focus`), בלי צבע קבוע. שורת ה-print הופכת ל-`@media print { .mm-plan, .cp-sheet { break-inside: avoid; } }`.
- `index.html`: לשמור את `<link … src/theme.css>`, `#reportPace`, `paceMeterHtml`, `revealWidget` ו-`<script src="src/lib/pace.js">` של master. להוסיף את `<script src="src/lib/classPicture.js">` אחרי `pace.js`, את `#classPictureCard`, את `renderClassPicture` ושאר הפונקציות, ואת `PRINT_MODES`/`printMode` במקום כל `classList.add('print-…')`.
- `sw.js`: להוסיף `./src/lib/classPicture.js` אחרי `./src/lib/pace.js` ולהעלות את `CACHE` ל-`melodymath-offline-v21`.
- `docs/WORKPLAN.md`: שורות 7 ו-7a מ-438cefc, בלי לגעת בשורות 11/11a של master.
- `src/lib/print.css`, `test/index-ui.test.js`, `test/lessonPlans.test.js` — כמו ב-438cefc, וארבע הבדיקות שהוצאו מחלק 2.

אחרי כל חלק: `npm test` ו-`node tools/pr-size.js <branch> origin/master`.
