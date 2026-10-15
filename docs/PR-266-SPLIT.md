# פיצול PR #266 לשני PR-ים של עד 400 שורות (Refs #268)

`auto_merger` ממזג PR-ים של עד 400 שורות משתנות. PR #266 (סנכרון התוכן של #150
אל `master`, Refs #264) הגיע ל-448 שורות — 437 הוספות ו-11 מחיקות ב-12 קבצים.
התוכן נחתך לשניים לפי תפקיד, ולא לפי קבצים: שכבת הפנייה בפני עצמה, והעותק
לפרויקט במכתב ההצעה בפני עצמו.

## PR א׳ — `CONTACT` אחד, טופס פיילוט, ובלוק פנייה בשלושת הדפים (‏374 שורות)

זה מה שמסופק בענף הזה. הוא עומד בפני עצמו: אחרי המיזוג יש בדיוק מקום אחד
בריפו שמחזיק ערכי קשר, ובלוק «פנייה לפרויקט» נטען ב-`index.html` (שאלת הסיום
של שבוע 4), ב-`landing.html` וב-`offer.html`.

| קובץ | שורות | מה |
| --- | --- | --- |
| `src/lib/contact.js` | 92 | `CONTACT` (email + טופס Google של הבעלים), `contactChannels`, `renderContactHtml`, `mountContactBlocks` |
| `test/contact.test.js` | 125 | 10 בדיקות: email ריק מסתיר את ה-mailto, `form` לא-https חוזר לטופס גיטהאב, כל דף עם `data-mm-contact` טוען `contact.js` ומגדיר `.mm-contact-links`, `contact.js` נטען לפני `offer.js`, ו-`mountContactBlocks` ממלא כל בלוק עם ה-subject שלו (‏document מדומה — זה החלק שרץ רק בדפדפן) |
| `.github/ISSUE_TEMPLATE/pilot.yml` | 60 | טופס פנייה ציבורי בעברית, בלי שדות טלפון/דוא״ל/שם ילד |
| `offer.html` | 10 | מקטע `#contactSec` + CSS + תג ה-script |
| `src/lib/offer.js` | 8 | הכתובת נקראת מ-`contact.js` במקום קבוע מקומי. ההתנהגות לא משתנה — אותה כתובת בדיוק |
| `index.html` | 5 | CSS של הבלוק, בלוק אחרי שאלת שבוע 4, תג script |
| `landing.html` | 4 | CSS של הבלוק + בלוק במקטע «צור קשר» |
| `README.md` | 2 | «פנייה לפרויקט»: מה זה `CONTACT.form` ומה קורה כשמרוקנים אותו |
| `sw.js` | 1 | `contact.js` ל-`ASSETS` (ה-`CACHE` כבר v15) |
| `docs/PR-266-SPLIT.md` | 71 | המסמך הזה |

`npm test`: 471 בדיקות, 470 עוברות, 0 נכשלות, 1 מדולגת (קו הבסיס ב-`master`:
461 בדיקות, 0 נכשלות). נבדק גם בלי דפדפן, ב-`vm` עם `document` מדומה:
`contact.js` ממלא את הבלוק מעצמו, מפרסם `globalThis.projectEmail`, ו-`offer.js`
שנטען אחריו מקבל ממנו את אותה כתובת בדיוק — כלומר `offer.html` לא משנה
התנהגות ב-PR הזה.

## PR ב׳ — «שלחו עותק לפרויקט» במכתב ההצעה (‏כ-96 שורות)

נשאר לפתוח. התוכן הוא בדיוק ההפרש שבין הענף הזה לבין
`claude/MelodyMath-264-20261014-133552`:

| קובץ | שורות | מה |
| --- | --- | --- |
| `test/offer.test.js` | 29 | בלי כתובת מנהל/ת המכתב לא ממוען בשקט לפרויקט; עותק יוצא רק כשמסמנים; `normalizeTrialRequest` מקבל `'yes'`/`'on'` |
| `test/safeMailHref.test.js` | 29 | `safeMailHref` שומר `mailto:` ומפיל כל סכימה אחרת; המכתב לא עובר escape ל-HTML |
| `offer.html` | 24 | תיבת הסימון `#copyProject` + הסבר, שורת הרמז החדשה, והסתרת השורה כש-`CONTACT.email` ריק |
| `src/lib/offer.js` | 12 | `to` ריק נשאר ריק (היום הוא נופל בשקט לכתובת הפרויקט), ו-`cc` מקבל את הפרויקט רק לפי הסימון |
| `README.md` | 1 | משפט אחד בסוף «פנייה לפרויקט»: העותק יוצא רק אם המחנכת מסמנת |

```sh
git switch -c split/offer-copy-opt-in master   # אחרי שה-PR הראשון נכנס
git checkout claude/MelodyMath-264-20261014-133552 -- \
  test/offer.test.js test/safeMailHref.test.js offer.html src/lib/offer.js
# README.md: להוסיף רק את המשפט האחרון של השורה שבענף
```

**הסדר חשוב.** `test/offer.test.js` קורא
`require('../src/lib/contact').projectEmail()`, ולכן PR ב׳ ירוק רק אחרי שPR א׳
נכנס. אין קונפליקט תוכן בין השניים: ההאנק של PR א׳ ב-`src/lib/offer.js` הוא
שורה 11 (מקור הכתובת), וההאנקים של PR ב׳ הם שורות 52 ו-177 ואילך.

נבדק: העץ של PR א׳ + PR ב׳ מריץ `node --test` עם 476 בדיקות, 475 עוברות,
0 נכשלות — כלומר בדיוק מה ש-#266 הריץ. הפיצול לא מוריד תוכן.

## מה #266 נשא ולא נכנס לכאן

`docs/PR-263-SYNC.md` (66 שורות) היה פירוט יישוב הקונפליקטים של #263. הוא לא
חלק מאף אחת משתי השכבות, ומה שחייב לשרוד ממנו הוא צעד אחד: גם אחרי שכל התוכן
של #150 נמצא ב-`master`, `main` עדיין לא אב קדמון שלו, ולכן #263 ימשיך להיות
מסומן CONFLICTING. הקומיט שמסדר את הייחוס (ולא נוגע בתוכן) הוא:

```sh
git merge -s ours --no-ff origin/main   # מוסיף את main כהורה, העץ נשאר
git diff HEAD@{1} HEAD                  # חייב לצאת ריק, אחרת לא ממשיכים
```
