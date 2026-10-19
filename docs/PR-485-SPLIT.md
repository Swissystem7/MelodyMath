# פיצול PR #485 (#486)

auto_merger דחה את #485 (`claude/MelodyMath-484-20261019-144831`, חלק 1 של הפיצול של #483) כי הציג 692 שורות. מול `origin/master` המקומי (74a91f2) הענף הוא 384 שורות ב-5 קבצים (`node tools/pr-size.js origin/claude/MelodyMath-484-20261019-144831 origin/master`), ומול `origin/main` הוא 11279. אף אחד מהם הוא לא 692, ולכן לא ברור מה auto_merger סופר. כדי שלא יהיה תלוי בזה, כל חלק כאן קטן בהרבה מ-400.

## חלק 1 — ה-PR הזה (#486, כ-210 שורות)
`src/lib/pace.js` עם הטבלה בלבד: מטרה להורה וטווח שבועות טיפוסי לכל 54 הנושאים (`TOPIC_PACE`, `topicPace`, `paceNote`). הבדיקות ב-`test/pace.test.js`: כל נושא ב-`curriculum.js` מכוסה פעם אחת והעוגן שלו נמצא בטקסט הנושא, אין חיפוש מעורפל, הטווחים זהים לאלה של `learnerPlan.js`, והמודול נטען ב-`index.html` ונשמר ב-`sw.js`. עומד בפני עצמו: מקור אחד לטווח של כל נושא, שבודק את `learnerPlan.js`.

## חלק 2 — PR המשך, מעל master אחרי חלק 1 (כ-170 שורות)
מתוך 0404805 ב-#485:
- `src/lib/pace.js`: `STATUS_HE`, `esc`, `fromStudent`, `whole`, `line`, `paceProgress`, `renderPaceMeterHtml`, הקבוע `DAY` והייצוא של `PACE_STATUS_HE`, `paceProgress` ו-`renderPaceMeterHtml`. ההערה בראש הקובץ חוזרת ל-«how the sessions actually logged compare with the typical pace».
- `test/pace.test.js`: `DAY`, `NOW`, `student()` וארבע הבדיקות «progress against pace…», «a child who only started today…», «sessions come from the device log…», «the meter is a labelled progressbar…». הבדיקה «the plan card and the pace table agree…» חוזרת לשם «…the pace meter agree…».

## חלק 3 — מה שנשאר מ-#483 (כ-30 שורות, אחרי חלק 2)
כפי שמתואר ב-`docs/PR-483-SPLIT.md` ב-#485: `<div id="reportPace">` ו-`paceMeterHtml` ב-`index.html`, כללי `.mm-pace` ב-`src/sefirot.css`, שורה 11a ב-`docs/WORKPLAN.md` והבדיקה «the report and letter carry the meter».

כשחלק 1 וחלק 2 פתוחים, סוגרים את #485 בלי מיזוג עם הערה שמפנה אליהם.
