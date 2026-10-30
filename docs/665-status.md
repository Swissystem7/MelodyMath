# סטטוס #665 — שש הדרישות

הדרישות מצוטטות מגוף ה־issue מילה במילה. כל ראיה נבדקה בקוד הנוכחי של הענף (`grep`, ו־`node --test` על קבצי הבדיקה שמוזכרים כאן, ו־`npm test` מלא: 0 נכשלות, נכון ל־28.10.2026). (Refs #665)

## טבלת מצב

| # | דרישה (ציטוט) | מצב | בקצרה |
|---|---------------|-----|-------|
| 1 | "מסך הילד: התרגיל למעלה, עד 15 מילים בכרטיס. טקסט למורים, ציטוטים ושורות של תוכנית הלימודים עוברים למסך הורה/מורה." | הושלם (חוץ מ־15 מילים) | שורת התקן וקישור תוכנית משרד החינוך הוסרו ממסך הילד ונשארו ב־`program.html` וב־`curriculum.html`. המגבלה של 15 מילים עדיין נאכפת רק בחלק מהתרגילים. |
| 2 | "כל תרגיל משמיע את המספרים שבו (3+2 = 3 תופים נמוכים, הפסקה, 2 תופים גבוהים), ולכל צליל יש עיגול מתאים על המסך. שמע תוך שנייה." | הושלם (בהבדל כלים, לא בגובה) | צליל לכל יחידה, הפסקה בין המחוברים, עיגול לכל צליל, צליל ראשון ב־0 ש׳. ההבדל בין המחוברים הוא בכלי (משפחה אחרת), לא דווקא תוף נמוך/גבוה. |
| 3 | "מגוון סוגי תרגילים: בחירה, גרירה, ישר מספרים, הקשת תשובה, השלמת תבנית ודוגמה פתורה." | חלקי | יש בחירה, ישר מספרים, השלמת תבנית ודוגמה פתורה. הקשת תשובה רק בכמה תרגילים. גרירה חסרה לגמרי. |
| 4 | "משוב מסביר: בתשובה נכונה מתנגנת אנימציה וסולם. בטעות התרגיל מתנגן שוב עם ספירה, מה שחסר מודגש, והילד מקבל ניסיון שני." | חלקי | אנימציה, מנגינת רצף, השמעה חוזרת עם ספירה וניסיון שני קיימים. סולם מלא מתנגן רק בתרגילי explorer. הדגשה של "מה שחסר" לא קיימת במסלול הכללי. |
| 5 | "מעבר הדרגתי: קודם צליל, אחר כך תמונה, אחר כך סמל, ובסוף פתרון בלי צליל." | חלקי | השלבים מוגדרים רק במכונת המצבים. באפליקציה מוצג רק השלב האחרון, "בלי להקה", ושלבי התמונה והסמל לא מוצגים לילד. |
| 6 | „הכותרת "א׳–ד׳" מתוקנת לא׳–ו׳, ופריטים שלא מתאימים לגיל מוסרים.“ | חלקי | הטווח תוקן ל־א׳–ו׳ ב־`index.html`, בסרגל הניווט שמוזרק לכל דף ובשאר הדפים. פריטים לא מתאימים הוצאו מהתרגול הרגיל אבל נשארו ב"אתגר ו׳". |

## ראיות לפי דרישה

### 1. מסך הילד — הושלם (חוץ מ־15 מילים)
- **עד 15 מילים:** `validateExerciseCard`/`countWords` ב־`src/lib/exercises/patternAndWorkedExample.js` (בדיקה: `validation rejects prompts exceeding 15 words or missing standards` ב־`test/patternAndWorkedExample.test.js`). `MAX_WORDS = 15` ב־`src/lib/exercises/explorerBank.js`. בדיקה שעוברת על כל הכרטיסים קיימת רק ב־Playwright (`e2e/exercise665Criteria.spec.js`, `e2e criteria #665: card word counts <= 15 words`) ולא רצה ב־`npm test` (`"test": "node --test"`). חוץ מזה היא בודקת רק את לשונית `#tab-remediation`.
- **התרגיל למעלה:** אין בדיקה ב־`npm test`. ב־Playwright: `e2e criteria #665: practice answerY relative to exercise card top < 400px`.
- **טקסט מורים ותוכנית לימודים הוסרו ממסך הילד:** `setItemTag` ב־`index.html` רק מרוקן ומסתיר את האלמנט (`el.textContent=''; el.hidden=true;`), ולארבעת האלמנטים `rmItemTag`, `rmPlanTag`, `classItemTag` ו־`beatItemTag` יש `hidden` כבר ב־HTML, כך שאין הבהוב לפני הציור הראשון. ה־CSS של `.mm-official` נמחק. נתוני התוכנית נשארו למורה ולהורה ב־`program.html` וב־`curriculum.html`. בדיקה: `index.html hides the curriculum line from every exercise view` ב־`test/curriculumSources.test.js`.
- **מה תוקן:** `test/childLabels.test.js` (התוויות אומרות "צלילים" במקום "מרווחים"), ו־`test/childGradeRange.test.js` (`the child home has no middle-school topic or sonification jargon`).

### 2. המספרים נשמעים — הושלם
- **צליל לכל יחידה והפסקה בין קבוצות:** `extractNumberPlan` ב־`src/components/NumberPlay.js` (`if (gi < counts.length - 1) t += beat`). `voicesFor` דואג שקבוצות סמוכות יהיו ממשפחות כלים שונות (`HZ.drumLow`/`drumHigh` מוגדרים, אבל כרגע הכלי נבחר לפי `ORDER` או לפי הכלי שהילד בחר). בדיקות: `3 + 2: one circle per sound, a beat of rest, two families, sound at 0 (#686)` ב־`test/numberPlay.test.js`, ו־`audio playback scheduling: sound count equals numbers in the exercise` ב־`test/exerciseLogic665.test.js`.
- **עיגול לכל צליל:** `renderHtml` (`np-dot`, `np-gap`) ב־`NumberPlay.js`. `circlesHtml` ב־`src/lib/music/takeAwayTen.js` וב־`src/lib/music/percentMix.js`. בדיקות: `audio playback scheduling: one circle per sound` (`test/exerciseLogic665.test.js`), ו־`takeAwayBeats: one circle per sound, beats disappear one by one` (`test/takeAwayTenExchange689.test.js`).
- **שמע תוך שנייה:** `src/lib/openCue.js`. בדיקות ב־`test/openCue.test.js`: `an item with no music of its own opens with the C5-G5 triangle chime within 1 s`, `autoplay blocked: the sound waits and starts within 1 s of the first tap or key`, `every exercise screen in index.html opens through maybeHear, which routes via openCue`. וגם `audio playback scheduling: first sound scheduled ≤ 1.0 s`.

### 3. סוגי תרגילים — חלקי
| סוג | מצב | ראיה |
|-----|-----|------|
| בחירה | קיים | `.choices`/`.choice` ב־`index.html` (`ppChoices`, `classChoices`, `beatChoices`); כפתורי `pattern-choices` ב־`renderPatternWidget`. |
| גרירה | חסר | אין `draggable`, `dragstart`, `dragover`, `pointermove` או `touchmove` ב־`src/` וב־`index.html`. |
| ישר מספרים | קיים | `src/lib/numberLine.js`; `renderWidget` ב־`index.html` (`item.widget==='numberLine'` → `bindNumberLine`); `test/numberLine.test.js`. |
| הקשת תשובה | חלקי | רק בתרגילים מסוימים: `attachTapButton` ב־`src/lib/exercises/tapTempoMean.js` (ממוצע של ו׳, `test/tapTempoMean.test.js`), שלב `completion` ב־`createWorkedExampleExercise` ("🥁 הקישו להשלמה"), ו־`src/lib/music/beatCounter.js` (חפץ אחד לכל פעימה). אין סוג תרגיל כללי שבו מקישים את התשובה. |
| השלמת תבנית | קיים | `createPatternCompletionExercise`/`renderPatternWidget` (`kind: 'pattern_completion'`), פריט ב־`src/lib/banks.js`, וחיבור ב־`renderWidget`. בדיקות: `the pattern on screen is דו➔מי➔דו➔? and the answer is מי`, `banks include pattern completion and worked example, and index.html wires them`. |
| דוגמה פתורה | קיים | `createWorkedExampleExercise`/`renderWorkedExampleWidget` (`kind: 'worked_example'`). בדיקות: `הקשיבו להדגמה plays 3 drums, 2 bells, then 5`, `הבנתי moves on and does not fill the answer`. |

### 4. משוב מסביר — חלקי
- **אנימציה כשהתשובה נכונה:** `getVisualMathAnimation` ב־`src/lib/encouragingFeedback.js`. `check()` ב־`index.html` מוסיף את `anim.className` ל־`#feedback`, וה־keyframes (`.anim-math-merge` ועוד) נמצאים ב־`src/components/jam.css`. בדיקה: `snapshot: correct-answer visual animation distinguishes operations including division (rule 2)`.
- **סולם כשהתשובה נכונה:** `playStreakMelody`/`streakMelody` ב־`src/lib/musicEngine.js` מנגנים צעד אחד בסולם הפנטטוני לכל תשובה נכונה ברצף (`test/rewardLoop.test.js`: `the streak melody grows one note per right answer, up to 8`). סולם מלא (`SCALE`, `playScale` ב־`explorerBank.js`) מתנגן **רק** בתרגילי explorer (`a miss replays that exercise and opens one second try; a hit plays a scale`).
- **השמעה חוזרת עם ספירה וניסיון שני:** `check()` ב־`index.html` (`!correct&&current&&!current._retryDone` → `maybeHear(current)` ו"בואו נקשיב ונספור יחד שוב"). `submitAnswer`/`startRetry` ב־`encouragingFeedback.js`. בזמן ההשמעה מוצגת ספירה "נשמעו X מתוך Y" (`NumberPlay.js`). בדיקות: `unit: state machine transitions wrong -> hint_replay -> retry on first mistake and triggers replay`, `mistake replays sound via maybeHear for current exercise only`, `core exercise logic: state machine transitions for second try after wrong answer`.
- **מה שחסר מודגש — חסר:** במסלול הכללי הטעות מקבלת רק `visualAnimation: { kind: 'hint_cue' }`, ושום דבר לא מסמן את החלק החסר. סימון כזה (`isMissing`) קיים רק ב־`soundEvents` של השלמת תבנית.

### 5. מעבר הדרגתי — חלקי
- המערך `STAGES = ['sound', 'picture', 'symbol', 'plain']` ו־`recordAttempt` ב־`src/lib/masteryCheck.js` (בדיקה: `topic mastery fades sound -> picture -> symbol -> plain in plural Hebrew`). הם קיימים רק כמכונת מצבים.
- באפליקציה `index.html` קורא רק ל־`mountMasteryCheck`, שמציג את הבדיקה בלי מוזיקה ("עכשיו בלי להקה, רק אתם!"). בתוך `answer()` השלב מוגדר בכוח ל־`'plain'` (`if (topState.currentStage !== 'plain') topState.currentStage = 'plain'`). ב־`index.html` אין התייחסות ל־`'picture'`, ל־`'symbol'` או ל־`STAGE_LABELS_HE`, ולכן אין מסך תמונה ואין מסך סמל.
- מה כן קיים: השלב האחרון בלי צליל (`4: the mastery check fades to a plain (no-music) stage last` ו־`4: the last round of every topic's practice is music-free` ב־`test/sequence-guard.test.js`). בתוך הדוגמה הפתורה יש מעבר מקומי demo → completion → "עכשיו לבד" (`worked example implements fading and restoration of scaffolding on mistake`).

### 6. כותרת א׳–ו׳ ופריטים לא מתאימים — חלקי
- **תוקן ב־`index.html`:** הכותרת, הבאנר והפוטר אומרים "תרגול יסודי א׳–ו׳". בדיקות: `index.html names the range א׳–ו׳ in the title, banner and footer` ו־`index.html renders elementary grade buttons א׳ through ו׳ in #gradePick` (`test/childGradeRange.test.js`). גם `README.md` אומר "כיתות א׳–ו׳".
- **תוקן גם מחוץ ל־`index.html`:** `siteNavHtml` ב־`src/lib/core.js` אומר עכשיו "תרגול א׳–ו׳" (הסרגל מוזרק לכל דף, גם לדף הבית, ומוביל לבחירת הכיתות א׳–ו׳ ב־`#gradePick`). גם `landing.html`, ה־`<title>` והבאנר של `curriculum.html`, `onePagerFacts` ב־`src/lib/offer.js`, ו־`functions.html`/`807.html` ("לא חלק מתרגול א׳–ו׳") עודכנו. בדיקה: `test/gradeRangeNav.test.js`. "א׳–ד׳" נשאר רק בהערות קוד ובנתוני כיסוי של בנק המדידה.
- **פריטים לא מתאימים לגיל:** חזקות, מספרים שליליים והיחסים 75:64, 45:32 ו־64:45 הוצאו מרמות 1–3, אבל נשארו כפריטי `EXTRA` ברמה 4 ("אתגר ו׳ · מעבר לתוכנית"). בדיקות: `exercises in index.html are age-appropriate for elementary school (grades א–ו)` ו־`אתגר ו׳ draws the EXTRA exercises, and a fast tempo is four beats`. הם הועברו לרמת אתגר ולא נמחקו, כלומר זה פחות מ"מוסרים".

## הערה נפרדת: כללי כלים (#740, לא #665)

כללי הכלים ו"שיטה מוזיקלית ראשית אחת לכל נושא" הם דרישות של #740. ה־commits של התיקון מסומנים `Refs #665` כי הבאג (קורה אצל ילד עם כלי הקשה) נמצא בבדיקת #665, אבל הכלל עצמו שייך ל־#740. ב־PR הזה תוקן:
- הפונקציה `partnerFor` ב־`src/lib/music/grooveGrid.js` בוחר עכשיו צ׳רנגו לילד עם כלי הקשה, וג׳מבה לכל ילד אחר. `PARTNERS` ב־`src/lib/music/loopStack.js` הם ג׳מבה, צ׳רנגו וקאנון. בשניהם השותף הוא תמיד ממשפחה אחרת משל הילד, וקורה כבר לא נכנסת לרשת השטח ולשכבות נפח התיבה.
- בדיקות: ב־`test/sequence-guard.test.js`: `3: the area grid and box-volume layers never bring in kora, gankogui or ukulele` ו־`3: area-grid and box-volume partners are chosen by mathTopics, over 2+ families`. ב־`test/grooveGrid.test.js` וב־`test/loopStack.test.js`: `…never shows kora…` ו־`a strings child hears djembe as partner…` / `a strings child stacks djembe layers…`.
- עדיין פתוח: ילד שבחר קורה בתור "הכלי שלי" שומע אותה בכל מקום. זה מחכה להחלטה של בעל המוצר (#717, #775).

**הצעד הבא:** לסגור את דרישה 6 (סרגל הניווט ב־`core.js`, `landing.html`, `curriculum.html`, `offer.js`), ואז את מגבלת 15 המילים בדרישה 1. אחרי זה: לחבר את שלבי התמונה והסמל לאפליקציה (דרישה 5), להוסיף תרגיל גרירה (דרישה 3) ולהדגיש את מה שחסר כשהתשובה שגויה (דרישה 4).
