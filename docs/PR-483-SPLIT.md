# פיצול PR #483 (#484)

auto_merger דחה את #483 (`claude/MelodyMath-482-20261019-144438`, «מד קצב» ל-#482) כי הציג 488 שורות. מול `origin/master` המקומי (74a91f2) הענף הוא 396 שורות ב-6 קבצים, כך שייתכן שהבסיס ב-GitHub זז או שנדחף אליו commit נוסף — כדאי להריץ `node tools/pr-size.js origin/claude/MelodyMath-482-20261019-144438 origin/master` אחרי `git fetch` לפני שמפצלים עוד.

## חלק 1 — ה-PR הזה (#484)
`src/lib/pace.js` (מטרה להורה וטווח טיפוסי לכל 54 הנושאים, `paceProgress`, `renderPaceMeterHtml`), `test/pace.test.js`, טעינה ב-`index.html` ו-precache ב-`sw.js`. עומד בפני עצמו: הספרייה נטענת בדף, נבדקת, ומתאימה לטווחים של `learnerPlan.js`.

## חלק 2 — PR המשך, מעל master אחרי חלק 1 (~30 שורות)
מתוך 1ad00c2 ב-#483:
- `index.html`: `<div id="reportPace">` בדוח המורה, הפונקציה `paceMeterHtml(student,name)`, והמד בראש `renderTeacherReport` ו-`renderParentLetter`.
- `src/sefirot.css`: כללי `.mm-pace` ו-`.mm-pace-status` (שלושת המצבים).
- `docs/WORKPLAN.md`: שורה 11a ועקרון השקיפות (#422, #425).
- `test/pace.test.js`: הבדיקה «the report and letter carry the meter».

כששני החלקים פתוחים, סוגרים את #483 בלי מיזוג עם הערה שמפנה אליהם.
