# פיצול PR #205 לקטעים שניתנים למיזוג (Refs #206)

`auto_merger` ממזג רק PR-ים של עד 400 שורות שונות (תוספות + מחיקות).
PR #205 (`agy/interactive-micro-lessons-expansion`, commit `504ca20`) הגיע ל-564 שורות
ולכן נחסם. התוכן שלו — שלושה שיעורים מודרכים חדשים + הקראה בעברית ורמז חזותי —
מפוצל לשלוש מסירות עצמאיות, שכל אחת עומדת בפני עצמה ונכנסת לתקרה.

מקור האמת לקוד שטרם נמסר הוא commit `504ca20` בענף `agy/interactive-micro-lessons-expansion`;
סגירת #205 אינה מוחקת אותו.

## Slice 1 — הקראה בעברית, רמז חזותי ושיעור חילוק (כיתה ג׳) · ✅ ב-PR הזה

~245 שורות. כולל:

- `#stepSpeakBtn` + `speakStepAloud()` — הקראת כותרת וגוף השלב ב-`he-IL` לקוראים מתקשים.
- `armStepPulseHint()` / `clearStepPulseHint()` — פעימה עדינה על כפתור ההמשך אחרי 3.5 שניות
  ללא פעולה. בניגוד ל-#205, הרמז וההקראה נעצרים במעבר שלב וביציאה מהשיעור, ומכובד
  `prefers-reduced-motion`.
- שיעור `division-groups` (חילוק כחלוקה שווה וכפעולה הפוכה לכפל) + `renderDivExplorerUI`
  + פילטר "כיתה ג׳".
- `playGroupedBeats()` — השמעת קבוצות שוות, משותף להדגמה ולמעבדה.

## Slice 2 — שיעור גיאומטריה: גלגל הזמן האוקלידי (כיתה ד׳) · ⬜ טרם נפתח

~190 שורות. מתוך `504ca20`:

- `src/lib/interactiveLessons.js` — אובייקט השיעור `geometry-euclidean`.
- `index.html` — מצב `euclideanPulses` / `euclideanSteps` (גם איפוס ב-`openLesson`),
  הענפים `geoConcept` / `squareDemo` / `euclideanWheel` ב-`renderStepAction`,
  ו-`renderEuclideanWheelUI`.
- מומלץ לחלץ מתוך ההעתקות שב-#205 את `euclideanHits(pulses, steps)` ואת
  `playEuclideanCycle(hits, stepMs)` כדי שההדגמה והמעבדה יחלקו לוגיקה אחת.
- בדיקות: `renderEuclideanWheelUI` ב-`test/index-ui.test.js`, ובדיקת תוכן השיעור
  ב-`test/interactiveLessons.test.js`.

## Slice 3 — שיעור זוגי / אי־זוגי (כיתה ב׳) · ⬜ טרם נפתח

~175 שורות. מתוך `504ca20`:

- `src/lib/interactiveLessons.js` — אובייקט השיעור `even-odd-rhythm`.
- `index.html` — מצב `evenOddCount` (גם איפוס ב-`openLesson`), הענפים `evenOddConcept` /
  `evenOddDemo` / `evenOddExplorer`, ו-`renderEvenOddExplorerUI`.
- שלוש לולאות ההשמעה ב-#205 זהות עד כדי פרמטרים; כדאי לאחד אותן ל-
  `playPairsThenLeftover(count, stepMs)`.
- בדיקות מקבילות ל-Slice 2.

## הערות מיזוג

- שלוש המסירות יוצאות מ-`master` ואינן תלויות זו בזו. שתיהן הראשונות מוסיפות שיעור
  בסוף מערך `LESSONS` באותו עוגן, ולכן המסירה השנייה והשלישית עשויות לדרוש rebase
  קטן אחרי שהראשונה נמזגת — או שימוש ב-`registerLesson()` כדי להימנע מכך לגמרי.
- אין תלות בין ההקראה/הרמז (Slice 1) לשיעורים החדשים; כל שיעור עובד גם בלעדיהם.
