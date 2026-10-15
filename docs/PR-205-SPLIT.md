# פיצול PR #205 לקטעים שניתנים למיזוג (Refs #206)

`auto_merger` ממזג רק PR-ים של עד 400 שורות שונות (תוספות + מחיקות).
PR #205 (`agy/interactive-micro-lessons-expansion`, commit `504ca20`) הגיע ל-564 שורות
ולכן נחסם. התוכן שלו — שלושה שיעורים מודרכים חדשים + הקראה בעברית ורמז חזותי —
פוצל לשלוש מסירות עצמאיות, שכל אחת עומדת בפני עצמה ונכנסת לתקרה.

## מה קרה בפועל

בסופו של דבר PR #205 נמזג ל-`master` במלואו בקומיט `6bec9fe`, במקביל לעבודה על
Slice 1 ב-#206. לכן שלושת השיעורים (`division-groups`, `geometry-euclidean`,
`even-odd-rhythm`) כבר ב-`master`, וה-Slices 2–3 שתוכננו כאן אינם נדרשים עוד.
מה שנשאר ייחודי ל-#206 הוא השיפורים ללוגיקה המשותפת, והם מוחלים על גרסת `master`
במסירה הזאת (Refs #210).

המסמך נשמר כתיעוד של ההחלטה ושל השיפורים, כדי שלא תהיה כפילות עבודה בעתיד.

## Slice 1 — הקראה בעברית, רמז חזותי ושיעור חילוק (כיתה ג׳) · ✅ נמסר

~245 שורות. כולל:

- `#stepSpeakBtn` + `speakStepAloud()` — הקראת כותרת וגוף השלב ב-`he-IL` לקוראים מתקשים.
- `armStepPulseHint()` / `clearStepPulseHint()` — פעימה עדינה על כפתור ההמשך אחרי 3.5 שניות
  ללא פעולה. בניגוד ל-#205, הרמז וההקראה נעצרים במעבר שלב וביציאה מהשיעור, ומכובד
  `prefers-reduced-motion`.
- שיעור `division-groups` (חילוק כחלוקה שווה וכפעולה הפוכה לכפל) + `renderDivExplorerUI`
  + פילטר "כיתה ג׳".
- `playGroupedBeats()` — השמעת קבוצות שוות, משותף להדגמה ולמעבדה.

## Slice 2 — שיעור גיאומטריה: גלגל הזמן האוקלידי (כיתה ד׳) · ✅ ב-`master` דרך #205

השיעור `geometry-euclidean`, המצב `euclideanPulses` / `euclideanSteps`, הענפים
`geoConcept` / `squareDemo` / `euclideanWheel` ו-`renderEuclideanWheelUI` כבר ב-`master`.

שיפור שטרם בוצע ונשאר פתוח: לחלץ מתוך `renderEuclideanWheelUI` את
`euclideanHits(pulses, steps)` ואת `playEuclideanCycle(hits, stepMs)` כדי שההדגמה
והמעבדה יחלקו לוגיקה אחת.

## Slice 3 — שיעור זוגי / אי־זוגי (כיתה ב׳) · ✅ ב-`master` דרך #205

השיעור `even-odd-rhythm`, המצב `evenOddCount`, הענפים `evenOddConcept` /
`evenOddDemo` / `evenOddExplorer` ו-`renderEvenOddExplorerUI` כבר ב-`master`.

שיפור שטרם בוצע ונשאר פתוח: שלוש לולאות ההשמעה זהות עד כדי פרמטרים; כדאי לאחד
אותן ל-`playPairsThenLeftover(count, stepMs)`.

## הערות מיזוג

- שלוש המסירות תוכננו לצאת מ-`master` ובלי תלות זו בזו, אך שתי הראשונות מוסיפות
  שיעור בסוף מערך `LESSONS` באותו עוגן — ובפועל זה בדיוק מה שיצר את ההתנגשות בין
  #206 ל-`master`. לתוכן חדש עדיף להשתמש ב-`registerLesson()` כדי להימנע מכך לגמרי.
- אין תלות בין ההקראה/הרמז (Slice 1) לשיעורים החדשים; כל שיעור עובד גם בלעדיהם.
