**What**: two separate browser products in one repo — (1) elementary math practice tagged to the Israeli curriculum, (2) Hebrew function-graph sonification. Not a school product, not a Gafn listing, not a funded study.

**For whom**: a student, parent, or מחנכת שילוב who opens a URL. There is no paying buyer today.

**How**: open the [live demo](https://swissystem7.github.io/MelodyMath/) — no install, no account

# MelodyMath

דמו דפדפן בעברית (RTL), בלי התקנה ובלי שרת. הריפו מכיל **שני מוצרים נפרדים**.

> **[תרגול יסודי](https://swissystem7.github.io/MelodyMath/)** · [כיסוי תוכנית](https://swissystem7.github.io/MelodyMath/curriculum.html) · [שומעים פונקציה](https://swissystem7.github.io/MelodyMath/functions.html) · [גדילה ודעיכה · 807](https://swissystem7.github.io/MelodyMath/807.html) · [דף נחיתה](https://swissystem7.github.io/MelodyMath/landing.html) · [הזמן ניסוי כיתתי](https://swissystem7.github.io/MelodyMath/offer.html)

`README.md` הזה הוא מקור האמת. מסמכי האקתון, אימות ישן והערות רכש ישנות יושבים ב־[docs/archive/](docs/archive/INDEX.md).

## שני המוצרים

### 1. תרגול יסודי — `index.html` + `curriculum.html`
**למי:** כיתות א׳–ד׳, הורה, או מחנכת שילוב שפותחת קישור בכיתה קטנה.

בנק **נפרד לכל כיתה**. כל פריט נושא `{כיתה, תחום, סעיף}`. פריט בלי תג לא נכנס.

- **א׳** — מנייה עד 100 (גם אחורה, דילוגי 2 מ־50, דילוגי 5, קיבוץ ל־10); חיבור/חיסור עם פירוקי 10, `=` משמאל, יותר משני מחוברים, עשרות שלמות; ישר מספרים אינטראקטיבי
- **ב׳** — כפל 2/4/5/10; חילוק לחלקים ולהכלה על אותם מספרים. 3/6/7/8/9 **חסומים** עד שיש שליטה בליבה
- **ג׳** — לוח 3/6/7/8/9 נפתח אחרי השער
- **ד׳** — שבר כחלק משלם מול תיבה 4/4: רק \(\frac{1}{2}\), \(\frac{1}{4}\), \(\frac{1}{8}\). תשובה כמו «חצי מ־8 = 4» אינה שבר

[דף הכיסוי](https://swissystem7.github.io/MelodyMath/curriculum.html) מציג לפי כיתה ותחום מה מכוסה ומה לא. גאומטריה, מדידה וחקר נתונים — **לא מכוסים**. זה גל 2.

באותו דף, למחנכת בפיילוט:

- **מצב כיתה** — מפגש 8 דקות מבנק א׳, גופן גדול, בלי הקלדה
- **דוח מורה + לוח כיתה** — רישום מקומי לפי שם/קוד
- **מכתב להורה** ו**תעודת תרגול** — ספירה. בלי «שולט» ובלי טענת יעילות
- **נגישות על הטאבלט** — ניגודיות, אות גדולה, הקראה בעברית, המתנה ארוכה, מצב שקט. זה המוצר, לא תוספת
- **דף עבודה להדפסה** ו**עבודה בלי רשת** אחרי ביקור אחד
- **מקצב אופציונלי** — BPM ידני. נקישה לקצב, לא טענת יעילות

הכל ב־`localStorage` במכשיר. אותו קוד כיתה בטאבלט אחר **לא** מסנכרן.

### 2. סוניפיקציה של גרפים — `functions.html` + `807.html`
**למי:** חטיבה / תיכון. זה לא אותו קהל, ולא חלק מתוכנית א׳–ד׳.

סריקת \(f(x)\) כגובה צליל, נקישה לשורש, שקט מחוץ לתחום, סינוס במצב טון-אמיתי, ומשחק "נחש את הפונקציה". `807.html` מתרגל \(M(t)=M_0\cdot q^t\).

## מה אין כאן
אין backend, אין חשבון, אין תשלום, אין רישום במאגר משרד החינוך, ואין נתוני פיילוט. אין ולו משתמש אחד שאומת ([VALIDATION.md בארכיון](docs/archive/VALIDATION.md), 3.8.2026).

## מה המחקר מצא

מחקר שוק מ־13.8.2026 — [RESEARCH.md](RESEARCH.md) — פסק דין **PARK**. אין כאן טענת מוכנות להגשת מימון.

1. **הנוף כבר תפוס, במחיר אפס או במוצר בשל.** [Desmos Audio Trace](https://help.desmos.com/hc/en-us/articles/37064105800333-Audio-Trace) נותן סוניפיקציה של גרפים **בחינם**. תרגול כפל/חשבון עם מוזיקה נמכר כבר על ידי [Times Tables Rock Stars](https://ttrockstars.com/schools/) ו־[Calcularis](https://constructor.tech/products/learning/calcularis/parents).

2. **הראיות על «קצב → מתמטיקה» דלילות ומעורבות — אסור לצטט אותן כהוכחה שהדמו עובד.** מטא־אנליזה של [Sala & Gobet, 2020](https://pubmed.ncbi.nlm.nih.gov/32728850/) מצאה אפקט אפס לאימון מוזיקה על קוגניציה כששולטים באיכות המחקר. [Ahokas et al.](https://link.springer.com/article/10.1007/s10643-024-01654-4) לא מצאו הבדל מובהק באוריינות מול ביקורת.

3. **אין קונה משלם היום.** [MONETIZATION.md](MONETIZATION.md) לא מצא נתיב תשלום. נתיב האימות היחיד: **מחנכת שילוב אחת**, קבוצה קטנה, **4 שבועות, חינם, בלי טענת יעילות**. [דף הניסוי](https://swissystem7.github.io/MelodyMath/offer.html).

## הפעלה מקומית
פותחים את `index.html` בדפדפן. זהו. כל הדפים טוענים את אותה ליבה (`src/lib/core.js` + המודולים שהוא צריך) — בלי CDN, בלי bundler, ובלי GitHub Actions.

```
npm test
```

או ישירות `node --test`. רץ על הליבה: נרמול תשובות, מיפוי מקצב, תיוג בנקים, שער שליטה בכפל, ישר מספרים, תיבה 4/4, כיסוי תוכנית, נגישות, ויושרת דפים.

אין בדיקת WCAG מול NVDA/VoiceOver בכיתה אמיתית. אין GitHub Actions בריפו.

GitHub Pages מפורסם מענף `main`. אחרי שינוי ב־`master` צריך לעדכן גם את `main` כדי שהדמו החי ישתנה.

---
פרויקט פתוח · Swissystem7
