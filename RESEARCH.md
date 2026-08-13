# MelodyMath — מחקר שוק + פסק דין

**תאריך הבדיקה:** 13 באוגוסט 2026  
**מה נבדק בפועל:** דמו חי ב-[swissystem7.github.io/MelodyMath](https://swissystem7.github.io/MelodyMath) ודף הסוניפיקציה [functions.html](https://swissystem7.github.io/MelodyMath/functions.html); ריפו [github.com/Swissystem7/MelodyMath](https://github.com/Swissystem7/MelodyMath) (נוצר 17.7.2026, עודכן 11.8.2026, 0 כוכבים, 0 forks); `README.md`, `VALIDATION.md` (3.8.2026), `HACKATHON.md`, `RESEARCH.md` בריפו; דפי מחיר רשמיים; דפי משרד החינוך על גפ״ן ותוכן דיגיטלי; מאמרים peer-reviewed.  
**כלים:** חיפוש אינטרנט + Jina Reader + GitHub CLI + חיפוש סמנטי ב-X. Reddit CLI ו-Exa לא היו זמינים.  
**כלל:** אין עובדות מומצאות. איפה שאין מקור — כתוב במפורש **לא נמצא מקור**.  
**דדליין שהוצהר בבקשה:** הגשת מימון ב־22 באוגוסט 2026. **לא נמצא קול קורא רשמי שנסגר בדיוק ב־22.8.2026.** החלון הרשמי הקרוב ביותר שאומת: מסלול תנופה של רשות החדשנות — בקשות עד **18.8.2026 בשעה 12:00**, והחלון הבא עד **7.9.2026 בשעה 12:00** ([דף תנופה הרשמי](https://innovationisrael.org.il/programs/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C-%D7%AA%D7%A0%D7%95%D7%A4%D7%94-%D7%A7%D7%A8%D7%9F-%D7%94%D7%94%D7%96%D7%A0%D7%A7/)).

---

## מה המוצר באמת היום (לפני השוק)

הדמו החי הוא אפליקציית דפדפן עברית, בלי התקנה ובלי הרשמה. הוא מורכב **משני מוצרים שונים**:

1. **תרגול יסודי בכיתות א׳–ד׳** — אבחון 10 שאלות במנייה, חיבור, חיסור, כפל ושברים בסיסיים; 35 תרגילים מדורגים; מטרונום ומשוב מוזיקלי; קושי אדפטיבי (שתי תשובות נכונות ברצף מעלות רמה, שתי שגויות מורידות). נתונים ב־`localStorage` בלבד.
2. **מעבדת סוניפיקציה של גרפי פונקציות** (`functions.html`) — מיפוי לוגריתמי של \(f(x)\) לגובה צליל (130–1,046 הרץ), נקישה לשורש, בריחת-צליל לאסימפטוטה, ומשחק "נחש את הפונקציה באוזן". הדף עצמו מבהיר שברוב המצבים זה ייצוג, לא "קול הפונקציה".

אין backend, אין חשבון משתמש, אין כיתה, אין תשלום, אין ניהול מורה מרחוק. הריפו מגדיר את עצמו כתרגול מבוסס-קצב לחינוך מיוחד + סוניפיקציה ([README](https://github.com/Swissystem7/MelodyMath/blob/master/README.md)).

`VALIDATION.md` (3.8.2026) כותב במפורש: **אין ולו משתמש אחד**; קריטריון 30 משתמשים פעילים ב־30 יום מעולם לא הורץ; אין נתוני פיילוט.  
`HACKATHON.md` מציין שהוגש להאקתון MusicTech באפקה/Ono ביוני 2026, ומציע מחיר 49 ₪/שנה למורה ו־299 ₪/שנה לבית ספר — **זה רעיון מחיר, לא מכירה מתועדת**. אותו מסמך מודה שמדד "15–20% שיפור" בדמו הוא **נתון מדמה**.

ב־X לא נמצאה שיחה ציבורית על MelodyMath עצמו (חיפוש סמנטי, 13.8.2026).

---

## 1) מתחרים

שלוש קטגוריות נפרדות, כי MelodyMath טוען לשלוש טענות במקביל: מוזיקה+מתמטיקה, סוניפיקציה של גרפים, וחינוך מיוחד.

### א. EdTech מוזיקה–מתמטיקה

| שם | מה מוכרים | מחיר שפורסם | קישור | הערה מול MelodyMath |
|---|---|---|---|---|
| **Times Tables Rock Stars** | תרגול כפל/חילוק במשחק רוק; אלגוריתם אדפטיבי; דשבורד מורה; נגישות (הקראה, הסתרת טיימר, קורא מסך) | **משפחה:** £7.20 לשנה (עד 3 ילדים) כולל מע״מ. **בית ספר:** US$260 לשנה, תלמידים ומורים ללא הגבלה; תוספי Stats +US$89, Sessions +US$85. ניסיון 4 שבועות. נבדק 13.8.2026 | [ttrockstars.com/families](https://ttrockstars.com/families/), [ttrockstars.com/schools](https://ttrockstars.com/schools/) | המתחרה הקרוב ביותר ל־"תרגול כפל עם מוזיקה". אנגלית, לא עברית. מוצר בשל עם 16,000+ בתי ספר (טענת החברה בדף בתי הספר). |
| **Muzology** | קליפי פופ ללימוד כפל עד פרה־אלגברה, כיתות ג׳–ח׳; חידונים מובנים | **הורים:** ניסיון 7 ימים ואז חודשי/שנתי — **סכום מספרי לא מופיע ב־FAQ**. **בתי ספר:** הצעת מחיר לפי רישום, `pricing@muzology.com` | [muzology.com/faq](https://www.muzology.com/faq), [muzology.com](https://www.muzology.com/) | שירים מלמדים תוכן, לא מטרונום שמתזמן תרגיל. מחקרי החברה עצמה (פיילוט מחוזי, מבחנים בתוך הפלטפורמה) — לא RCT חיצוני עצמאי שאומת כאן. |
| **Make Music Count** | פתרון משוואות → תווים על פסנתר וירטואלי; כיתות ב׳–י״ב | **רשמי להומסקול:** $29.99 לחודש; $79.99 לרבעון; $149.99 לחצי שנה; $299.99 לשנה | [makemusiccount.com/pages/home-schoolers](https://makemusiccount.com/pages/home-schoolers) | מחיר לבית ספר: EdTechImpact טוען מ־$35 לתלמיד (כולל חוברת) — **זה לא מחירון רשמי**. [edtechimpact](https://edtechimpact.com/products/make-music-count/) |
| **NumBots** (אותה חברה כמו TTRS) | חיבור/חיסור וקשרי מספרים | בית ספר: +US$210 אם מצורף ל־TTRS (דף TTRS, 13.8.2026) | [numbots.com](https://numbots.com/), [TTRS schools](https://ttrockstars.com/schools/) | אין קצב כהתערבות ADHD; זה תרגול מספרים. |

**לא נמצא מקור** למתחרה עברי חי שמשלב תרגול מתמטיקה יסודית + מטרונום אדפטיבי + סוניפיקציה של גרפים בחבילה אחת.

### ב. כלי סוניפיקציה של גרפים / נתונים

| שם | מה עושים | מחיר | קישור |
|---|---|---|---|
| **Desmos Audio Trace** | האזנה לגרף: גובה צליל = \(y\), שמאל→ימין = \(x\), סטטי לערכים שליליים, נקישות לחיתוכים; תמיכה בקורא מסך; קיצורי מקלדת; מהירות ועוצמה. עודכן בתיעוד ביוני 2026 | **חינם** | [help.desmos.com — Audio Trace](https://help.desmos.com/hc/en-us/articles/37064105800333-Audio-Trace), [desmos.com/accessibility](https://www.desmos.com/accessibility) |
| **SAS Graphics Accelerator** | הרחבת Chrome: תיאור טקסט, טבלה, וסוניפיקציה אינטראקטיבית לגרפים | **חינם** | [support.sas.com](https://support.sas.com/software/products/graphics-accelerator/), [Chrome Web Store](https://chromewebstore.google.com/detail/sas-graphics-accelerator/ockmipfaiiahknplinepcaogdillgoko) |
| **Highcharts Sonification Studio** | כלי דפדפן להאזנה לתרשימים | חינם לשימוש לא־מסחרי; רישיון Highcharts לשימוש מסחרי ([Georgia Tech, 2021](https://www.cc.gatech.edu/news/649087/new-browser-based-chart-builder-gives-line-graphs-scatterplots-their-own-audio-track)) | [sonification.highcharts.com](https://sonification.highcharts.com/) |
| **MathTrax (NASA)** | תוכנת סוניפיקציה של משוואות וגרפים | חינם (פרויקט NASA) | מצוטט ב־[accessiblegraphics.org](https://accessiblegraphics.org/formats/sonification/); כתובת היסטורית: `prime.jsc.nasa.gov/mathtrax/` — **סטטוס האתר החי ב־2026 לא אומת בביקור ישיר** |
| **Perkins / CITL מדריכי הוראה** | שיעורים איך ללמד Audio Trace לתלמידים עיוורים ולקויי ראייה | חינם | [Perkins](https://www.perkins.org/resource/understanding-desmos-sonification-lessons/), [Illinois CITL](https://citl.illinois.edu/desmos-accessible-graphing-calculator-guide) |

**מה MelodyMath לא עושה מול Desmos:** אין קורא מסך מתועד, אין ניווט מקלדת מלא לנקודות עניין, אין תמיכה במערכת משוואות, אין הטמעה בשיעורי משרד החינוך. הבידול היחיד שניתן לאמת הוא **ממשק עברי + משחק ניחוש**. Desmos עצמו הוא מחשבון חינמי שכבר משמש תלמידים עיוורים ברחבי העולם.

**לא נמצא מקור** לכלי סוניפיקציה של גרפי פונקציות עם ממשק עברי מלא מלבד MelodyMath.

### ג. אפליקציות מתמטיקה לחינוך מיוחד / דיסקלקוליה

| שם | מה מוכרים | מחיר | קישור | ראיות |
|---|---|---|---|---|
| **Calcularis (Constructor)** | אימון אדפטיבי רב־חושי לעיבוד מספרי וחשבון, גילאי 5–11; דגש מוצהר על דיסקלקוליה | **רשמי להורים (13.8.2026):** Essentials $33/חודש ($99 ל־3 חודשים); 6 חודשים $25/חודש ($150); שנתי $20/חודש ($240). ניסיון 3 ימים. **בתי ספר:** אין מחיר בדף — "Talk to us". EdTechImpact (צד ג׳) טוען מ־$125 לתלמיד | [constructor.tech/…/parents](https://constructor.tech/products/learning/calcularis/parents), [Calcularis](https://constructor.tech/products/learning/calcularis) | החברה טוענת 10+ מאמרים peer-reviewed. מאמר נגיש: Kucian et al. על Calcularis 2.0 ב־[Frontiers in Psychology](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.01115/full). **לא נקרא כאן במלואו.** |
| **Dynamo Maths** | איתור + תוכנית התערבות לדיסקלקוליה, כולל IEP | **מחיר רשמי בדף הבית: לא נמצא מספר.** צד ג׳: EdTechImpact — מ־£374.39/שנה; הערכה לתלמיד £29.99+VAT. מפיץ Lended.org.uk: הערכה £14.75, רישיון התערבות £7.99 | [dynamomaths.co.uk](https://dynamomaths.co.uk/), [edtechimpact](https://edtechimpact.com/products/dynamo-maths/), [lended.org.uk](https://www.lended.org.uk/product/dynamo-maths-evidence-based-assessment-and-intervention/) | מוצר אנגלי ותיק ל־SEN. אין גרסה עברית שאומתה. |
| **Reflex (ExploreLearning)** | שטף חיבור/חיסור/כפל/חילוק במשחק | **מחיר רשמי: לא נמצא מקור פומבי** (מכירה לבתי ספר) | [reflex.explorelearning.com](https://reflex.explorelearning.com/) | מופיע בסקירת מורים של Edutopia, ינואר 2025: [edutopia.org](https://www.edutopia.org/article/teacher-tested-math-apps/) |
| **ModMath** | לוח עבודה דיגיטלי במקום עיפרון לדיסגרפיה/דיסקלקוליה | אפליקציה בחנויות; **מחיר מנוי: לא נבדק לעומק בדף רשמי** | [Google Play](https://play.google.com/store/apps/details?id=com.and.modmathinc.com&hl=he) | לא קצב ולא סוניפיקציה — נגישות כתיבה. |
| **אופק / מטח** | סביבת תוכן דיגיטלית עברית: פעילויות, ספרים, דשבורדים; נכנסים עם חשבון משרד החינוך | רכישה דרך מכרז התוכן הדיגיטלי / תקציב תקשוב של בית הספר — **לא מחירון צרכני** | [myofek.cet.ac.il](https://myofek.cet.ac.il/), [בחירת תוכן דיגיטלי תשפ״ז](https://mosdot.education.gov.il/institutes/digital-learning/choosing-digital-content/) | זה "המתחרה החינמי/מסובסד" בכיתה הישראלית. אין קצב ואין סוניפיקציה. |
| **בריינפופ** | סרטונים ופעילויות בעברית, כולל מתמטיקה; כניסה בחשבון משרד החינוך | דרך מכרז תוכן דיגיטלי | נזכר כפעילות מאושרת בפורטלי בתי ספר; דף ספקים: [digital-learning-il](https://digital-learning-il.my.canva.site/) | לא חינוך מיוחד ייעודי. |

**לא נמצא מקור** לאפליקציית דיסקלקוליה עברית מסחרית עם מחיר פומבי ומחקר יעילות ישראלי.

### מה 49 ₪ / 299 ₪ אומרים מול השוק

הרעיון ב־`HACKATHON.md` (49 ₪ למורה, 299 ₪ לבית ספר) זול מ־TTRS לבית ספר (~US$260) וזול בהרבה מ־Calcularis להורה ($240/שנה). זה לא יתרון: בלי דשבורד כיתה, בלי חשבון, בלי ראיות ובלי רישום במאגר — **אין למי לגבות את הסכום**. מול אופק/Desmos המחיר הרלוונטי הוא אפס.

---

## 2) הקונה

שלושה קונים אפשריים נבדקו. רק אחד מהם יכול בכלל לשלם על "תוכנית חינוכית" בבית ספר ישראלי.

### א. הורה (B2C)

- שוק קיים בחו״ל: הורים משלמים £7.20 ל־TTRS, $240 ל־Calcularis, $300 ל־Make Music Count.
- בישראל: **לא נמצא מקור** לסקר תשלום הורים על אפליקציית דיסקלקוליה/קצב-מתמטיקה עברית.
- `VALIDATION.md` של הפרויקט עצמו פוסל את המסלול הזה: "ההורה לא מזהה את הצורך, ואין ערוץ הפצה."
- בלי חנות אפליקציות, בלי מנוי, בלי שימור בין מכשירים — אין מוצר B2C, רק דף ציבורי.

**מסקנה:** הורה אינו קונה ריאלי למוצר כפי שהוא היום.

### ב. בית ספר / מחנכת שילוב (B2B ישיר)

נתונים רשמיים על הביקוש:

- תשפ״ו: **390,750** תלמידים זכאים לחינוך מיוחד, **60% משולבים** בכיתה רגילה ([gov.il, נתוני מערכת החינוך תשפ״ו](https://www.gov.il/he/pages/data-2025)).
- כתבות על הגידול: מ־354 אלף בתשפ״ה ל־391 אלף בתשפ״ו ([כלכליסט, 31.8.2025](https://www.calcalist.co.il/local_news/article/bkpdl2115xl); [שווים, 30.6.2025](https://shavvim.co.il/2025/06/30/%D7%A1%D7%99%D7%9B%D7%95%D7%9D-%D7%A9%D7%A0%D7%94%D7%9C-%D7%AA%D7%A9%D7%A4%D7%94-%D7%9E%D7%A1%D7%A4%D7%A8-%D7%94%D7%AA%D7%9C%D7%9E%D7%99%D7%93%D7%99%D7%9D-%D7%91%D7%97%D7%99%D7%A0%D7%95%D7%9A/)).
- לבתי ספר לחינוך מיוחד יש תקציב גמיש נפרד במערכת גפ״ן בשם **פל״ג** (פדגוגיה לניהול גמיש) — [נוהל פל״ג](https://meyda.education.gov.il/files/mosdot/flexible-management-special-education.pdf), [דף גפ״ן תשפ״ו](https://mosdot.education.gov.il/institutes/budget/gefen/gefen-tashpav/).

החסם: מורה שרוצה "להפעיל תוכנית" בבית ספר חייבת שהתוכנית תהיה במאגר. משרד החינוך כותב במפורש: **"קיים איסור לשלב במוסדות חינוך תוכניות ומענים שאינם רשומים במאגר"** ([פורטל רשויות — ספקי מכרז המאגר](https://pob.education.gov.il/municipal-services/education-volunteering/cooperative-governance/)).

פתיחת URL ציבורי כעזר הוראה חד־פעמי **אינה בהכרח** "הפעלת תוכנית". מכירה, דיווח שעות, או הצגה כמענה בית-ספרי — כן. MelodyMath כפי שהוא (בלי רישום) יכול לשמש רק ככלי וולונטרי של מורה אחת, לא כרכישה.

### ג. גפ״ן — איך הרכש באמת עובד, והאם מפתח יחיד יכול להיכנס

#### מה זה גפ״ן

גפ״ן = **גמישות פדגוגית ניהולית**: תקציב גמיש לבית הספר לרכישת מענים ממאגר משרד החינוך. דף רשמי: [תוכנית גפ״ן תשפ״ו](https://mosdot.education.gov.il/institutes/budget/gefen/gefen-tashpav/), [תקציבי גפ״ן](https://mosdot.education.gov.il/institutes/budget/gefen/).

סכום לתלמיד **לא מצוטט כאן ממקור משרדי עדכני ל־2026**. דוח מרכז המחקר של הכנסת (פברואר 2023) ציין לתשפ״ג סל בית-ספרי של **1,294–1,941 ₪ לתלמיד** ביסודי ובחט״ב, ו־736–1,104 ₪ בעל-יסודי, לפי אשכול ומדד טיפוח ([PDF הכנסת](https://fs.knesset.gov.il/globaldocs/MMM/73dd82e9-5671-ed11-8155-005056aa4246/2_73dd82e9-5671-ed11-8155-005056aa4246_11_19906.pdf)). אתר ספקים פרטי ([mygefen.co.il](https://mygefen.co.il/)) כותב 11,500 ₪ לתלמיד בתשפ״ו — **זה לא מקור משרדי, ולא אומת מול חוזר מנכ״ל**.

#### שני מסלולים

| מסלול | מה זה | מי משלם | מתי פתוח |
|---|---|---|---|
| **לא־מכרזי / "כחול"** | רישום תוכנית במאגר בלי זכייה במכרז | בית הספר **מתקציב בית-ספרי** (תשלומי הורים, עירייה, תרומות) — **לא מתקציב גפ״ן** | פתוח לאורך השנה. הזנה: [apps.education.gov.il/tyhnet](https://apps.education.gov.il/tyhnet/public/#/tochniyot) |
| **מכרזי / "ירוק"** | זכייה במכרז מאגר התוכניות והמענים | בית הספר **מתקציב גפ״ן** | חלון שנתי. האחרון: פורסם 27.11.2025, נפתח להגשה 24.12.2025, **נסגר 3.2.2026**. הבא: **נובמבר–דצמבר 2026** |

מקורות: [pob.education.gov.il — ספקי המאגר](https://pob.education.gov.il/municipal-services/education-volunteering/cooperative-governance/) (רשמי); [mr.gov.il/p/4000549730](https://mr.gov.il/ilgstorefront/he/p/4000549730) (סטטוס: חלף מועד הגשה); [regevslaw.com/gefen-2025-update](https://www.regevslaw.com/gefen-2025-update) (משרד עו״ד; תאריכי 24.12.2025–3.2.2026 והחלון הבא נוב׳–דצמ׳ 2026); [stevetalor.co.il/gefen](https://stevetalor.co.il/gefen/) (יועץ; "הירוק יפתח בנובמבר 2026"); [mygefen.co.il](https://mygefen.co.il/) (קהילת ספקים; פירוט כחול/ירוק).

חשוב: סטיב טלאור כותב ש**אין קשר** בין הכחול לירוק — שני מסלולים נפרדים. mygefen כותב שהכחול הוא שלב ראשוני ושבלי אישור כחול אין ירוק. **שני היועצים סותרים זה את זה.** המקור הרשמי אומר רק שספק **אינו רשאי לרשום אותה תוכנית בשני המסלולים** ([pob.education.gov.il](https://pob.education.gov.il/municipal-services/education-volunteering/cooperative-governance/)).

#### האם מפתח יחיד יכול להירשם?

**כן, אם יש לו עוסק.** **לא, אם הוא אדם פרטי בלי תיק במס הכנסה.**

- mygefen (לא רשמי, אבל מתאר את הנוהג): "אם אין לכם עוסק רשמי (פטור, מורשה, בע״מ, עמותה וכו'), **אינכם יכולים להיות ספקים של גפ״ן**." ([mygefen.co.il](https://mygefen.co.il/))
- VALUE כותבת שליוותה גם **עוסקים מורשים ופטורים** בהגשה ([value-dbl.co.il](https://value-dbl.co.il/%D7%94%D7%9E%D7%93%D7%A8%D7%99%D7%9A-%D7%9C%D7%94%D7%92%D7%A9%D7%94-%D7%9C%D7%9E%D7%9B%D7%A8%D7%96-%D7%9E%D7%90%D7%92%D7%A8-%D7%94%D7%AA%D7%9B%D7%A0%D7%99%D7%95%D7%AA-%D7%95%D7%94%D7%9E%D7%A2%D7%A0/)).
- דרישות נוספות שחוזרות במידעוני המשרד: ביטוח, הצהרה למניעת העסקת עברייני מין, דיווח מפעילים, ומ־תשפ״ז — בחירת מפעיל מאושר בכל דיווח פעילות ([מידעונים בפורטל הרשויות](https://pob.education.gov.il/municipal-services/education-volunteering/cooperative-governance/)).
- **לא נמצא מקור רשמי** שאוסר במפורש על עוסק פטור יחיד. **לא נמצא מקור** שבודק אם ל־Swissystem7 יש עוסק.

#### גפ״ן אינו הערוץ למוצר דיגיטלי טהור

mygefen כותב במפורש את ההבדל הקריטי:

> "תוכניות של מכרז גפ״ן אתם נדרשים להעביר **פעילויות פיזיות בכיתות**. מכרז התוכן הדיגיטלי מתאים למי שמייצר תכנים לימודיים כמו ספרי לימוד ותכנים דיגיטליים ולא מעביר פעילויות בכיתות."  
> מקור: [mygefen.co.il](https://mygefen.co.il/)

EduHub (אפריל 2025) פרסם את מכרז התוכן הדיגיטלי כמכרז **נפרד** מגפ״ן, עם מועד הגשה 26.5.2025 שהוארך ל־9.6.2025: [פוסט EduHub](https://www.facebook.com/EduHubIL/posts/1261050566026284/), מכרז [mr.gov.il/p/4000601044](https://mr.gov.il/ilgstorefront/he/p/4000601044).

ב־2026 מופיע הליך [630430 / 371-2026](https://mr.gov.il/ilgstorefront/he/p/630430) לעדכון רשימת ספקי תוכן דיגיטלי. **לא נבדק כאן מועד הסגירה המדויק של 630430** מעבר לקיום הדף.

בתי ספר בגפ״ן/פל״ג **כבר בוחרים** תוכן דיגיטלי מאושר מתאריך **1.6.2026** ועד **10.7.2027** ([בחירת כלים, סביבות ותוכן דיגיטלי תשפ״ז](https://mosdot.education.gov.il/institutes/digital-learning/choosing-digital-content/)). MelodyMath **אינו** ברשימה. רשימת מוצרים ועלויות רשמית: [קובץ xlsx של המשרד](https://meyda.education.gov.il/files/PortalBaaluyot/POB/rshimat_pritim_280526.xlsx) — **לא נפתח כאן תא־אחר־תא**.

**מסקנת רכש:**  
מפתח יחיד **יכול** להירשם לגפ״ן אם יש לו עוסק + ביטוח + תוכנית שמועברת פיזית בכיתה.  
MelodyMath כפי שהוא (דף דפדפן, בלי מדריך בכיתה) **לא מתאים למכרז הירוק**.  
הערוץ הנכון לכלי דיגיטלי הוא **מכרז התוכן הדיגיטלי**, שחלון 2025 שלו כבר נסגר, ו־MelodyMath אינו ברשימת תשפ״ז.  
המסלול הכחול לא פותח תקציב גפ״ן — רק תקציב בית-ספרי מוגבל, ואחרי רישום במאגר.

### מי באמת הקונה, אם בכלל

| קונה | יכול לשלם היום? | למה כן / לא |
|---|---|---|
| הורה | לא | אין מוצר מנוי, אין ערוץ, אין אמון מותג |
| מחנכת שילוב (שימוש חופשי ב־URL) | שימוש — כן; תשלום — לא | הדמו רץ בלי התקנה. אין תקציב אישי למורה לקנות SaaS לא־רשום |
| מנהל/ת יסודי מתקציב גפ״ן ירוק | לא עד נוב׳ 2026 לפחות | המכרז האחרון נסגר 3.2.2026; מוצר דיגיטלי טהור לא מתאים לסלים |
| מנהל/ת חינוך מיוחד מתקציב פל״ג | תיאורטית אחרי רישום במאגר | פל״ג קיים ([נוהל](https://meyda.education.gov.il/files/mosdot/flexible-management-special-education.pdf)); MelodyMath לא רשום |
| רכש תוכן דיגיטלי משרדי | לא | לא ברשימת הספקים המאושרים לתשפ״ז |

---

## 3) ראיות

שתי טענות מדעיות נפרדות. שתיהן נבדקו בנפרד. **אין לצטט אף אחת מהן כהוכחה ש־MelodyMath עובד.**

### א. קצב → מתמטיקה / ADHD / דיסקלקוליה

#### מה המחקר החזק ביותר אומר על "מוזיקה משפרת מתמטיקה"

Sala & Gobet, *Memory & Cognition* (2020): מטא־אנליזה רב־רמתית, N=6,984, 254 גדלי אפקט, 54 מחקרים.

> "Once the quality of study design is controlled for, the overall effect of music training programs is **null** (ḡ ≈ 0) and highly consistent across studies."  
> אפקט קטן מופיע **רק** במחקרים בלי הקצאה אקראית ובלי ביקורת פעילה (ḡ ≈ 0.200). האימון אינו יעיל **בלי קשר** לסוג המדד (כולל הישגים אקדמיים במתמטיקה), לגיל או למשך האימון.

מקור: [PubMed 32728850](https://pubmed.ncbi.nlm.nih.gov/32728850/), [המאמר](https://link.springer.com/article/10.3758/s13421-020-01060-2).

זו הטענה הרחבה "מוזיקה → קוגניציה/מתמטיקה". MelodyMath מנסה טענה צרה יותר: **אימון קצב** (לא שיעור מוזיקה כללי) כתמיכה בקשב ובעיבוד מספרי.

#### מה המחקר אומר על אימון קצב עצמו

**Ahokas et al., "Rhythm and Reading"** (*Early Childhood Education Journal*, פורסם 21.3.2024, גיליון אפריל 2025):  
תלמידי כיתות א׳–ב׳ (גילאי 6–8), 13 שיעורים פעם בשבוע במשך 3 חודשים, מול קבוצת ביקורת שקיבלה שיעורי מוזיקה **בלי** אימון קצב מוגבר.

- **לא נמצא הבדל מובהק באוריינות** בין הקבוצות.
- שיפור מתון בזיכרון עבודה בקבוצת הניסוי בלבד.
- בניתוח post-hoc: אצל תלמידים שהתחילו כקוראים חלשים היה שיפור אוריינות מובהק בניסוי ולא בביקורת.

מקור: [Springer](https://link.springer.com/article/10.1007/s10643-024-01654-4).  
**זה מחקר על קריאה, לא על מתמטיקה. זה לא ADHD ולא דיסקלקוליה.**

**Ahokas et al., "The Training of Rhythm Skills and Executive Function: A Systematic Review"** (*Music & Science*, 2025):  
מ־15,677 רשומות נכללו **10** מחקרים עם ביקורת פעילה ומדדי תפקודים ניהוליים. **5 מתוך 10** הראו תוצאה מובהקת לטובת ההשערה. המסקנה המפורשת: **"there is a fundamental paucity of studies aiming at testing the benefits of rhythm training on EF."**

לגבי מינון, אחרי שהמחברים כותבים שלא הצליחו לזהות אפקט ברור של כמות החשיפה, הם **מציעים** (לא מוכיחים):

> "when reviewing the studies that did show some significant results, we could suggest that in longitudinal research settings, training should be delivered with a **total exposure of 90–120 min and at least twice a week**."

מקור: [DOI 10.1177/20592043241305922](https://doi.org/10.1177/20592043241305922), עותק פתוח ב־[Cambridge Apollo](https://www.repository.cam.ac.uk/items/29471411-ef86-498f-a0b2-c368e064436c). הציטוט נבדק בעמוד 11 של ה־PDF.

MelodyMath הוא תרגול דפדפן קצר. **הוא לא מספק 90–120 דקות פעמיים בשבוע של אימון קצב מוטורי.** המחקרים שכן הראו אפקט היו בעיקר ריקוד / תנועה לקצב / חינוך מוזיקלי פנים־אל־פנים — לא מטרונום על תרגילי כפל.

#### מה אין

- **לא נמצא מקור** ל־RCT שבודק אפליקציית תרגול מתמטיקה מבוססת-מטרונום אצל ילדים עם ADHD או דיסקלקוליה.
- Poppins (Grossard et al., 2025, *JMIR Serious Games*): מכשיר דיגיטלי של קצב + שפה ל**דיסלקציה**, מחקר חד־זרועי, לא מתמטיקה. [PubMed 40750096](https://pubmed.ncbi.nlm.nih.gov/40750096/).
- Rodriguez et al., 2019, "Numeracy musical training…": n=42, ילדים עם הישג נמוך במתמטיקה. המאמר קיים ([Anales de Psicología](https://revistas.um.es/analesps/article/view/340091)). **הטקסט המלא לא נקרא כאן** — לכן אין כאן דיווח על גודל אפקט או איכות הביקורת.
- Muzology מפרסמת עליות במבחנים **בתוך הפלטפורמה** (לפני/אחרי צפייה בקליפ) — [muzology.com/research](https://www.muzology.com/research). זה לא RCT מול תרגול רגיל.
- Understood.org על דיסקלקוליה: אין תרופה; הוראה רב־חושית עוזרת; טיפול ב־ADHD לא בהכרח משפר מתמטיקה ([understood.org](https://www.understood.org/en/articles/treatment-options-for-dyscalculia)).

**מה מותר לומר בכנות:** קצב נחקר כתמיכה בקשב, באוריינות ובתפקודים ניהוליים; הראיות **דלילות, מעורבות, ותלויות מינון גבוה**. אין בסיס לומר שתרגול כפל עם מטרונום בדפדפן משפר הישגי מתמטיקה אצל ADHD/דיסקלקוליה.

**מה אסור לומר בהגשת מימון:** "מחקרים מוכיחים שאימון קצבי סוגר פערים במתמטיקה בחינוך מיוחד."

### ב. סוניפיקציה כנגישות לגרפים

כאן הראיות **חזקות יותר — אבל לא לטובת MelodyMath כעסק**, אלא לטובת Desmos.

- מיפוי גובה־צליל ↔ גובה על הציר הוא הסטנדרט בתחום. Desmos מתעד אותו במפורש: גובה עולה = שיפוע חיובי, סטטי = \(y\) שלילי, נקישות = חיתוכים ([Audio Trace](https://help.desmos.com/hc/en-us/articles/37064105800333-Audio-Trace), עודכן יוני 2026).
- Perkins School for the Blind מלמדת מורים איך להשתמש ב־Audio Trace עם תלמידים עיוורים ([perkins.org](https://www.perkins.org/resource/understanding-desmos-sonification-lessons/)).
- Accessible Graphics מסכם שסוניפיקציה מאפשרת לתלמידים עיוורים סקירה עצמאית של גרף בלי ציוד יקר, עם \(y\)=גובה צליל ו־\(x\)=זמן ([accessiblegraphics.org](https://accessiblegraphics.org/formats/sonification/)).
- NASA/Chandra משתמשים בסוניפיקציה לקהל עיוור; מחקר משתמשים דיווח על למידה והנאה — זה אסטרונומיה, לא אלגברה כיתתית ([chandra.si.edu/sound](https://chandra.si.edu/sound/)).

**מה אין:**  
- **לא נמצא מקור** שמשווה את MelodyMath ל־Desmos מול תלמידים עיוורים דוברי עברית.  
- **לא נמצא מקור** שמאמת עמידה של MelodyMath ב־WCAG או עבודה עם NVDA/VoiceOver בעברית.  
- `RESEARCH.md` בריפו מודה שהטענה הזו לא אומתה.

סוניפיקציה היא כלי נגישות לגיטימי. **השוק כבר סיפק אותו בחינם, באנגלית, ברמה גבוהה בהרבה.** MelodyMath מוסיף עברית ומשחק ניחוש. זה לא שוק ריק — זה שוק שכבר נכבש במחיר אפס.

### ג. מה המוצר עצמו מדד

כלום. אין פיילוט, אין baseline, אין קבוצת ביקורת, אין אפילו 30 משתמשים (`VALIDATION.md`). מדד ה־15–20% ב־`HACKATHON.md` מסומן שם כנתון מדמה.

---

## 4) הנחת המוות

**ההנחה שאם היא שקרית — המיזם מת.** לא "יהיה קשה". מת.

> **מחנכת שילוב (או בית ספר) תאמץ ותשלם על כלי קצב־מתמטיקה עברי בלי ראיות יעילות, בלי דשבורד כיתה, ובלי רישום במאגר — כי הקצב עצמו הוא מה שמשפר מתמטיקה אצל ADHD/דיסקלקוליה, במינון שאפליקציית תרגול מספקת.**

זו הנחה אחת עם שני מפרקים. שניהם חייבים להיות נכונים.

### מפרק א׳ — המדע: הקצב הקצר משפר מתמטיקה

אם Sala & Gobet צודקים (טרנספר רחוק של אימון מוזיקה = אפס כששולטים באיכות המחקר), ואם Ahokas צודקים (גם אימון קצב ממוקד לא ניצח ביקורת באוריינות; ומינון אפקטיבי מוערך ב־90–120 דקות לפחות פעמיים בשבוע, בעיקר בתנועה) — אז MelodyMath הוא **תרגול כפל עם פסקול**. התרגול עשוי לעזור כמו כל תרגול. הקצב אינו היתרון. בלי היתרון הזה אין סיבה שמורה תעדיף אותו על אופק, על דף עבודה, או על TTRS.

המחקר הקיים **לא מוכיח שההנחה נכונה**. הוא נוטה להפריך אותה במינון ובפורמט של הדמו.

### מפרק ב׳ — הקונה: מישהו ישלם / יאמץ בלי ראיות ובלי מאגר

גם אם הקצב עוזר קצת:

- גפ״ן ירוק סגור עד נובמבר 2026, ואינו מתאים לדיגיטל טהור.
- תוכן דיגיטלי דורש מכרז נפרד; MelodyMath לא ברשימה.
- אסור להפעיל תוכנית לא־רשומה כמענה בית-ספרי.
- אין דשבורד כיתה — המורה לא רואה את התלמידים שלה.
- Calcularis ו־Dynamo כבר מוכרים "דיסקלקוליה" עם ניירות מחקר. Desmos כבר נותן סוניפיקציה בחינם.

אם אף מחנכת לא מוכנה לתת כיתה לחודש **בלי לשלם** — אין מה למכור אחר כך. `VALIDATION.md` כבר ניסח את זה נכון ב־3.8.2026. מאז לא נוספו משתמשים ציבוריים שאפשר לאמת.

### למה זו הנחת המוות ולא "עוד סיכון"

אפשר לתקן UI. אפשר לפתוח עוסק. אפשר לחכות לנובמבר. **אי אפשר לבנות עסק על טענת יעילות שהספרות העדכנית דוחה, ועל ערוץ רכש שהמוצר לא נכנס אליו.** אם ההנחה נכשלת נשאר דמו נחמד ב־GitHub Pages.

### איך בודקים את ההנחה בזול (ולא בהגשת מימון)

פיילוט של 4 שבועות, כיתה אחת של שילוב, מול תרגול רגיל באותם תרגילים בלי מטרונום. מדד: דיוק וזמן בתרגילי כפל/חיבור, לא "האם היה כיף". אם אין הבדל — ההנחה מתה, והמיזם צריך להיגנז או להפוך למשחק עברי בלי טענת חינוך מיוחד.

---

## 5) פסק דין

# PARK

**לא KEEP.** אין קונה משלם, אין ראיות, אין רישום, אין משתמשים, ושני מוצרים מודבקים יחד (יסודי-קצב מול תיכון-סוניפיקציה) עם שני קונים שונים.  
**לא PIVOT עכשיו.** פיבוט אמיתי (סדנה פיזית לגפ״ן, או כלי נגישות עברי ללקויי ראייה מול המרכז לעיוור) הוא מוצר אחר. תשעה ימים לפני דדליין מימון זה לא הזמן להמציא אותו ולהגיש כאילו הוא MelodyMath.

### למה PARK ולא PIVOT

פיבוט היה מתאים אם היה קונה אחד ברור שצריך וריאציה קרובה של מה שכבר בנוי. כאן:

- הסוניפיקציה מפסידה ל־Desmos החינמי.
- הקצב-מתמטיקה מפסיד ל־TTRS/Calcularis/אופק במוצר, ולספרות בטענה המדעית.
- גפ״ן דורש סדנה עם מדריך, לא דף GitHub.

אפשר לחזור לשולחן בנובמבר 2026 **רק אם** יש עוסק, ביטוח, סילבוס של סדנה פנים־אל־פנים, ומורה אחת שכבר הריצה פיילוט. זה לא MelodyMath של היום.

### הקונה הנקוב

**אין קונה משלם היום.**

הקונה *היחיד* שיכול להפוך את ההנחה לבדיקה (לא למכירה) הוא:

**מחנכת שילוב / רכזת חינוך מיוחד בבית ספר יסודי אחד**, שמוכנה לתת קבוצה קטנה ל־4 שבועות של שימוש חופשי ב־URL — בלי חשבונית, בלי גפ״ן, בלי טענת יעילות.

לא הורה. לא מנהל גפ״ן. לא רשות החדשנות. לא "שוק החינוך המיוחד בישראל" (390 אלף תלמידים הם מצבת זכאות, לא ביקוש למוצר הזה).

### הצעד הבא (ולא ההגשה ב־22.8)

1. **לא להגיש בקשת מימון שטוענת** ש־MelodyMath הוא מוצר לחינוך מיוחד עם ערוץ גפ״ן וראיות קצב→מתמטיקה. זו תהיה הגשה לא מדויקת מול המקורות למעלה. מסלול תנופה בכל מקרה מחפש חדשנות טכנולוגית לשוק **גלובלי**, לא דמו עברי ב־Web Audio, ואינו מכיר בהוצאות שכר ([דף תנופה](https://innovationisrael.org.il/programs/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C-%D7%AA%D7%A0%D7%95%D7%A4%D7%94-%D7%A7%D7%A8%D7%9F-%D7%94%D7%94%D7%96%D7%A0%D7%A7/)).
2. **עד סוף השבוע:** שיחה אחת עם מחנכת שילוב. אם אין כיתה — המיזם נשאר PARK. אם יש כיתה — מריצים את מבחן ההנחה (סעיף 4) לפני שכותבים מילה על גפ״ן או על מענק.
3. **לאחד את המוצר.** להפסיק למכור "חינוך מיוחד + סוניפיקציה לחטיבה" כחבילה אחת. אלה שני שווקים.

### מה כן נכון במוצר

הדמו רץ, עברית, בלי התקנה, ויש יושרה פנימית ב־`VALIDATION.md` וב־README לגבי מצב הראיות. זה יותר מרוב דמואים. זה לא שוק, לא רכש, ולא בקשת מימון.

---

## נספח: מקורות מרכזיים לפי סעיף

**המוצר:** [דמו](https://swissystem7.github.io/MelodyMath) · [functions.html](https://swissystem7.github.io/MelodyMath/functions.html) · [README](https://github.com/Swissystem7/MelodyMath/blob/master/README.md) · [VALIDATION.md](https://github.com/Swissystem7/MelodyMath/blob/master/VALIDATION.md) · [HACKATHON.md](https://github.com/Swissystem7/MelodyMath/blob/master/HACKATHON.md)

**מתחרים:** [TTRS families](https://ttrockstars.com/families/) · [TTRS schools](https://ttrockstars.com/schools/) · [Muzology FAQ](https://www.muzology.com/faq) · [Make Music Count](https://makemusiccount.com/pages/home-schoolers) · [Desmos Audio Trace](https://help.desmos.com/hc/en-us/articles/37064105800333-Audio-Trace) · [SAS Accelerator](https://support.sas.com/software/products/graphics-accelerator/) · [Highcharts Sonification Studio](https://sonification.highcharts.com/) · [Calcularis parents](https://constructor.tech/products/learning/calcularis/parents) · [Dynamo](https://dynamomaths.co.uk/) · [אופק מטח](https://myofek.cet.ac.il/)

**קונה / גפ״ן:** [gov.il תשפ״ו](https://www.gov.il/he/pages/data-2025) · [ספקי מאגר גפ״ן](https://pob.education.gov.il/municipal-services/education-volunteering/cooperative-governance/) · [גפ״ן תשפ״ו](https://mosdot.education.gov.il/institutes/budget/gefen/gefen-tashpav/) · [בחירת תוכן דיגיטלי תשפ״ז](https://mosdot.education.gov.il/institutes/digital-learning/choosing-digital-content/) · [מכרז מאגר 4000549730](https://mr.gov.il/ilgstorefront/he/p/4000549730) · [עדכון רגב 2026](https://www.regevslaw.com/gefen-2025-update) · [mygefen](https://mygefen.co.il/) · [נוהל פל״ג](https://meyda.education.gov.il/files/mosdot/flexible-management-special-education.pdf) · [דוח כנסת גפ״ן 2023](https://fs.knesset.gov.il/globaldocs/MMM/73dd82e9-5671-ed11-8155-005056aa4246/2_73dd82e9-5671-ed11-8155-005056aa4246_11_19906.pdf)

**ראיות:** [Sala & Gobet 2020](https://pubmed.ncbi.nlm.nih.gov/32728850/) · [Ahokas Rhythm and Reading](https://link.springer.com/article/10.1007/s10643-024-01654-4) · [Ahokas systematic review 2025](https://doi.org/10.1177/20592043241305922) · [Poppins 2025](https://pubmed.ncbi.nlm.nih.gov/40750096/) · [Understood — dyscalculia](https://www.understood.org/en/articles/treatment-options-for-dyscalculia)

**מימון קרוב:** [מסלול תנופה](https://innovationisrael.org.il/programs/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C-%D7%AA%D7%A0%D7%95%D7%A4%D7%94-%D7%A7%D7%A8%D7%9F-%D7%94%D7%94%D7%96%D7%A0%D7%A7/)
