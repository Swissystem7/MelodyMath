# סטטוס #665 — שש הדרישות

> **הערה:** לא ניתן היה לקרוא את גוף issue #665 בסביבה הזו (הגישה ל־`gh` נחסמה).
> הדרישות שלמטה שוחזרו מתוך commits ובדיקות שמפנים ל־#665 ולתת־המשימות שלו
> (#680, #681, #687, #689, #718, #722, #751, #783, #815, #817). אם הנוסח המקורי שונה, הוא הקובע.

| # | דרישה | איפה זה קיים | מה חסר |
|---|-------|--------------|--------|
| 1 | טקסט קצר לילד (עד 15 מילים בכרטיס, בלי תוויות טכניות, #815) | `test/childLabels.test.js`, `e2e/exercise665Criteria.spec.js` | בדיקת ה־e2e היא Playwright ולא רצה ב־`npm test`; היא מכסה רק את לשונית התרגול המתקן. |
| 2א | צליל תוך שנייה בכל תרגיל (#817) | `src/lib/openCue.js`, `index.html`, `test/openCue.test.js` | הושלם. |
| 2ב | מספר הצלילים = המספרים, עיגול אחד לכל צליל, החלפת עשרת אחרי התשובה (#689, #783) | `src/lib/music/takeAwayTen.js`, `test/takeAwayTenExchange689.test.js`, `test/exerciseLogic665.test.js`, `test/percentMix.test.js` | הושלם. |
| 3 | שיטה מוזיקלית ראשית אחת לכל נושא; כל נושא שומר על הסוג שלו (#687, #751) | `test/sequence-guard.test.js` סעיף 2, `test/variety.test.js` | פערים שמסומנים `test.todo`: כמה תקנים מונים יותר מדרך ראשית אחת (למשל ו׳ FRAC_MUL: noteLength, barFill, tripletShare). |
| 4 | כללי כלים: קורה וגנקוגוי רק בכפולה משותפת, יוקללה רק בשברים, אחוזים רק דרבוקה וארהו | ההגבלות ב־`src/lib/instruments.js`; `test/sequence-guard.test.js` סעיף 3 | **תוקן ב־PR הזה:** `partnerFor` ב־`src/lib/music/grooveGrid.js` החזיר קורה לילד עם כלי הקשה, ו־`PARTNERS` ב־`src/lib/music/loopStack.js` כלל קורה. שניהם עכשיו גיטרה. **עדיין פתוח:** ילד שבוחר קורה בתור "הכלי שלי" שומע אותה בכל מקום — צריך החלטה של בעל המוצר (#717, #775). |
| 5 | ניסיון שני עדין, בלי זמזם ובלי X אדום, תיבת התשובה גבוהה (answerY < 400) (#680, #722) | `src/lib/encouragingFeedback.js`, `test/encouragingFeedback.test.js` | answerY נבדק רק ב־Playwright (`e2e/exercise665Criteria.spec.js`). |
| 6 | בדיקה אחרונה "עכשיו לבד" בלי שום צליל (#681, #718) | `src/lib/masteryCheck.js`, `test/masteryCheck.test.js`, `test/sequence-guard.test.js` סעיף 4 | הושלם. |

**הצעד הבא:** ה־PR הזה מטפל בחלק הנראה לילד של דרישה 4 (קורה ברשת השטח ובשכבות נפח התיבה) ומוסיף לסעיף 3 של `test/sequence-guard.test.js` בדיקה שקורה, גנקוגוי ויוקללה לא נכנסים כשותפים לאף משפחת כלים. אחר כך: החלטה על "הכלי שלי" (#717/#775), ואז סגירת פערי ה־`test.todo` של דרישה 3.
