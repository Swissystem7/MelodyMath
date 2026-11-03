// MM-601 pilot — the "למה זה עובד" panel for teachers and adults.
//
// No new research. Every claim, number and link below is taken from what the
// repo already says: docs/research/MM-503-music.md (PR #949, table §2: E1, E2,
// E4, E5, E11) and docs/RESEARCH.md (the Courey 2012 and Azaryahu 2020 entries).
// Each claim says what the evidence shows AND what it does not show.
// MelodyMath itself has not been tested in a trial (MM-503 "כלל כנות").
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MMPilotResearch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CLAIMS = Object.freeze([
    Object.freeze({
      id: 'integration',
      title: 'המוזיקה כאן היא הייצוג של החשבון, לא קישוט',
      shows: 'מטא־אנליזה של 55 מחקרים (1975–2022) מצאה אפקט קטן עד בינוני למוזיקה בלימוד מתמטיקה, ואפקט גדול יותר בשיעורים שמשלבים מתמטיקה ומוזיקה — במיוחד אצל ילדים צעירים ובחשבון בסיסי.',
      limits: 'המחקרים במטא־אנליזה לא סוננו לפי איכות, ויש בה מעט מחקרים לכל תת־קבוצה. היא לא בדקה את MelodyMath.',
      source: 'Akın 2023, Educational Studies',
      url: 'https://doi.org/10.1080/03055698.2023.2216826'
    }),
    Object.freeze({
      id: 'no-far-transfer',
      title: 'לא טוענים ש"מוזיקה מחכימה"',
      shows: 'במחקרים איכותיים (הקצאה אקראית וקבוצת ביקורת פעילה), האפקט של אימון מוזיקלי כללי על קוגניציה ועל הישגים הוא אפס בקירוב (54 מחקרים, N=6,984).',
      limits: 'זה עוסק באימון מוזיקלי כללי, לא בשיעור שבו המבנה המוזיקלי הוא התרגיל עצמו. לכן ההדגמה מלמדת חשבון דרך מוזיקה, ולא מבטיחה שיפור כללי.',
      source: 'Sala & Gobet 2020, Memory & Cognition',
      url: 'https://pubmed.ncbi.nlm.nih.gov/32728850/'
    }),
    Object.freeze({
      id: 'fractions-melody',
      title: 'שברים כמשכי תווים — הראיה הספציפית החזקה ביותר',
      shows: 'בשלוש כיתות ד׳ בישראל (12 שיעורים), שיעורי MusiMath — קצב בתוך מנגינה — שיפרו שברים שתורגלו וגם שברים שלא תורגלו, לעומת שיעור רגיל, והיתרון נשמר אחרי 3 ו־6 חודשים. קצב בלבד הראה רק מגמה. לכן תרגיל השברים כאן מנגן מנגינה, לא רק מקצב.',
      limits: 'מחקר קטן (3 כיתות) של תוכנית בת 12 שיעורים. תרגיל אחד בהדגמה הוא לא אותה התערבות.',
      source: 'Azaryahu, Courey, Elkoshi & Adi‑Japha 2020, Developmental Science',
      url: 'https://doi.org/10.1111/desc.12882'
    }),
    Object.freeze({
      id: 'fractions-grade3',
      title: 'שלם, חצי ורבע דרך תווים כבר בכיתה ג׳',
      shows: 'שישה שבועות בכיתה ג׳: שלם, חצי, רבע ושמינית נלמדו דרך ערכי תווים, מחיאות כפיים ותיבה (Academic Music). זה הבסיס לתרגיל "חצי תיבה בקצב".',
      limits: 'גם כאן מדובר בתוכנית של שבועות עם נגינה ומחיאות פעילות, לא בהאזנה לתרגיל בודד בדפדפן.',
      source: 'Courey, Balogh, Siker & Paik 2012, Educational Studies in Mathematics 81(2)',
      url: 'https://doi.org/10.1007/s10649-012-9395-9'
    }),
    Object.freeze({
      id: 'coherence',
      title: 'כל צליל נושא מידע מתמטי — ואין מוזיקת רקע',
      shows: 'בניסויי למידה במולטימדיה, הוספת מוזיקת רקע וצלילים לא רלוונטיים פגעה בזכירה ובהעברה (אפקט הקוהרנטיות). לכן בהדגמה כל צליל הוא כמות, חיבור, חיסור או משך — וכל תרגיל עובד גם בלי צליל, עם אותה תמונה ואותו כיתוב.',
      limits: 'אלה ניסויים על חומרי למידה במולטימדיה, לא על MelodyMath ולא על ילדים בכיתות א׳–ג׳ דווקא.',
      source: 'Moreno & Mayer 2000, Journal of Educational Psychology 92(1)',
      url: null
    })
  ]);

  const HONESTY = 'MelodyMath עצמו עוד לא נבדק בניסוי. המחקרים כאן בדקו שיטות דומות, בדרך כלל לאורך שבועות של שיעורים — הם מסבירים למה בנינו כך, ואינם הוכחה שהכלי עובד.';
  const FROM = 'המקורות כפי שהם מופיעים במאגר: docs/research/MM-503-music.md (PR #949) ו־docs/RESEARCH.md.';

  return { CLAIMS: CLAIMS, HONESTY: HONESTY, FROM: FROM };
});
