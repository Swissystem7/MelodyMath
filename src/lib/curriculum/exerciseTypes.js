// MelodyMath — Ministry exercise types classification and verification (Refs #665 req 3).
//
// Every curriculum topic in grades 1-6 must feature diverse exercise types
// (missing addend, compare, word problem, number line, direct calculation, representation),
// with at least 3 distinct types per topic.
(function (root, factory) {
  const api = factory(
    (root && root.MM_CURRICULUM) || (typeof require === 'function' ? require('./../curriculum.js') : null),
    (root && root.MM_BANKS) || (typeof require === 'function' ? require('./../banks.js') : null)
  );
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_EXERCISE_TYPES = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (curriculum, banks) {
  'use strict';

  const EXERCISE_TYPES = Object.freeze([
    'direct',
    'missing_addend',
    'compare',
    'word_problem',
    'number_line',
    'representation',
  ]);

  const TYPE_NAMES_HE = Object.freeze({
    direct: 'חישוב ישיר ומנייה',
    missing_addend: 'מחובר/איבר חסר',
    compare: 'השוואה',
    word_problem: 'שאלת מילים',
    number_line: 'ישר המספרים',
    representation: 'ייצוג ומודל',
  });

  // Supplementary exercise types data ensuring >= 3 types for every curriculum topic.
  const GRADE_DATA = Object.freeze({
    'א': [
      // Topic 0: ספירה עד 100 קדימה ואחורה ממספר כלשהו (mm-cur-0)
      { topicId: 'mm-cur-0', topic: 'ספירה עד 100 קדימה ואחורה ממספר כלשהו', prompt: 'ספירה קדימה: 48, 49, ☐, 51. מהו המספר החסר?', answer: 50, hint: 'המספר שבא אחרי 49 ולפני 51', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-0', topic: 'ספירה עד 100 קדימה ואחורה ממספר כלשהו', prompt: 'השוו בין המספרים: 34 ☐ 43 (כתבו < או >)', answer: '<', hint: '34 קטן מ־43', exerciseType: 'compare' },
      { topicId: 'mm-cur-0', topic: 'ספירה עד 100 קדימה ואחורה ממספר כלשהו', prompt: 'בספירה קדימה מ־10 בדילוגים של 5, איזה מספר בא אחרי 15?', answer: 20, hint: '15 ועוד 5', exerciseType: 'number_line' },

      // Topic 1: מנייה עד 100, קיבוץ ל־10 (mm-cur-1)
      { topicId: 'mm-cur-1', topic: 'מנייה עד 100, קיבוץ ל־10', prompt: 'מה מכיל יותר פריטים: 3 קבוצות של 10 או 25 יחידות?', answer: '3 קבוצות של 10', hint: '3 קבוצות של 10 הן 30, ו־30 גדול מ־25', exerciseType: 'compare' },
      { topicId: 'mm-cur-1', topic: 'מנייה עד 100, קיבוץ ל־10', prompt: 'בכיתה סדרו 2 קבוצות של 10 טושים ועוד 4 טושים בודדים. כמה טושים בסך הכל?', answer: 24, hint: '2 עשרות ו־4 יחידות', exerciseType: 'word_problem' },

      // Topic 2: ישר המספרים — מיקום מדויק ומקורב עד 100 (mm-cur-2)
      { topicId: 'mm-cur-2', topic: 'ישר המספרים — מיקום מדויק ומקורב עד 100', prompt: 'על ישר המספרים מ־0 עד 20: 14, ☐, 16. איזה מספר נמצא באמצע?', answer: 15, hint: 'המספר בין 14 ל־16', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-2', topic: 'ישר המספרים — מיקום מדויק ומקורב עד 100', prompt: 'על ישר המספרים, איזה מספר קרוב יותר ל־20: 19 או 12?', answer: 19, hint: '19 במרחק 1 מ־20, ו־12 במרחק 8', exerciseType: 'compare' },
      { topicId: 'mm-cur-2', topic: 'ישר המספרים — מיקום מדויק ומקורב עד 100', prompt: 'ארנב קפץ על ישר המספרים מ־0 עד 10, ואז עוד 5 צעדים קדימה. על איזה מספר נחת?', answer: 15, hint: '10 ועוד 5', exerciseType: 'word_problem' },

      // Topic 4: קריאה וכתיבה של מספרים, לוח מאה, שם־מספר (mm-cur-5)
      { topicId: 'mm-cur-5', topic: 'קריאה וכתיבה של מספרים, לוח מאה, שם־מספר', prompt: 'בלוח המאה: שורה אחת מתחת ל־25 נמצא המספר ☐', answer: 35, hint: 'ירידה של שורה בלוח המאה מוסיפה 10', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-5', topic: 'קריאה וכתיבה של מספרים, לוח מאה, שם־מספר', prompt: 'איזה מספר גדול יותר: 4 עשרות ו־2 יחידות, או 2 עשרות ו־4 יחידות?', answer: 42, hint: '42 לעומת 24', exerciseType: 'compare' },
      { topicId: 'mm-cur-5', topic: 'קריאה וכתיבה של מספרים, לוח מאה, שם־מספר', prompt: 'שירה חיפשה בלוח המאה מספר ששם־המספר שלו הוא "שלושים ושבע". מהו המספר בספרות?', answer: 37, hint: '3 עשרות ו־7 יחידות', exerciseType: 'word_problem' },

      // Topic 5: חיבור וחיסור בעשרות שלמות עד 100 (mm-cur-4)
      { topicId: 'mm-cur-4', topic: 'חיבור וחיסור בעשרות שלמות עד 100', prompt: 'במחסן היו 40 כדורים והוסיפו עוד 30 כדורים. כמה כדורים במחסן בסך הכל?', answer: 70, hint: '40 ועוד 30 הם 7 עשרות', exerciseType: 'word_problem' },
      { topicId: 'mm-cur-4', topic: 'חיבור וחיסור בעשרות שלמות עד 100', prompt: 'על ישר המספרים, קפיצה של 30 קדימה מהמספר 20 מגיעה למספר:', answer: 50, hint: '20 ועוד 30', exerciseType: 'number_line' },

      // Topic 6: סדרות דגמים צורניים + יצירת סדרה (mm-cur-6)
      { topicId: 'mm-cur-6', topic: 'סדרות דגמים צורניים + יצירת סדרה', prompt: 'השלימו את הדגם: 🥁, 👏, 🥁, 👏, ☐. מה הצליל הבא?', answer: '🥁', hint: 'הדגם חוזר: תוף ואז כף', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-6', topic: 'סדרות דגמים צורניים + יצירת סדרה', prompt: 'נועם מתופף דגם קבוע של שני צלילים: נקישה ומחיאה. איזה צליל יהיה במקום השישי?', answer: 'מחיאה', hint: 'מקומות זוגיים הם מחיאה', exerciseType: 'word_problem' },
      { topicId: 'mm-cur-6', topic: 'סדרות דגמים צורניים + יצירת סדרה', prompt: 'כמה פעמים מופיע הצליל 🥁 בדגם: 🥁, 👏, 🥁, 👏, 🥁?', answer: 3, hint: 'ספרו כמה תופים יש בדגם', exerciseType: 'direct' },

      // Topic 7: מצבי חיבור/חיסור מחיי יום־יום (mm-cur-7)
      { topicId: 'mm-cur-7', topic: 'מצבי חיבור/חיסור מחיי יום־יום (איסוף, הוספה, הפרדה, גריעה)', prompt: 'לתמר 8 בלונים ולאסף 5 בלונים. בכמה בלונים יש לתמר יותר מלאסף?', answer: 3, hint: '8 פחות 5', exerciseType: 'compare' },
      { topicId: 'mm-cur-7', topic: 'מצבי חיבור/חיסור מחיי יום־יום (איסוף, הוספה, הפרדה, גריעה)', prompt: 'לדנה היו 6 תפוחים. כמה תפוחים חסרים לה כדי שיהיו לה 10 תפוחים?', answer: 4, hint: '6 ועוד ☐ שווה 10', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-7', topic: 'מצבי חיבור/חיסור מחיי יום־יום (איסוף, הוספה, הפרדה, גריעה)', prompt: 'בגינה פרחו 4 רקפות והצטרפו עוד 5 כלניות. כמה פרחים פרחו בסך הכל?', answer: 9, hint: '4 ועוד 5', exerciseType: 'direct' },

      // Topic 8: מיון מצולעים, קודקוד וצלע, פירוק והרכבה (mm-cur-8)
      { topicId: 'mm-cur-8', topic: 'מיון מצולעים, קודקוד וצלע, פירוק והרכבה', prompt: 'למי יש יותר קודקודים: למשולש או למרובע?', answer: 'מרובע', hint: 'למשולש 3 ולמרובע 4', exerciseType: 'compare' },
      { topicId: 'mm-cur-8', topic: 'מיון מצולעים, קודקוד וצלע, פירוק והרכבה', prompt: 'למצולע מסוים יש 3 קודקודים. כמה צלעות יש לו? (השלימו: ☐ צלעות)', answer: 3, hint: 'בכל מצולע מספר הצלעות שווה למספר הקודקודים', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-8', topic: 'מיון מצולעים, קודקוד וצלע, פירוק והרכבה', prompt: 'שירה בנתה מסגרת של משולש מ־3 קיסמים, ואז מסגרת של ריבוע מ־4 קיסמים. כמה קיסמים השתמשה בסך הכל?', answer: 7, hint: '3 ועוד 4', exerciseType: 'word_problem' },

      // Topic 9: מדידת אורך (מתווך, ס״מ, סרגל) (mm-cur-9)
      { topicId: 'mm-cur-9', topic: 'מדידת אורך (מתווך, ס״מ, סרגל)', prompt: 'עיפרון באורך 12 ס״מ ומחק באורך 4 ס״מ. בכמה ס״מ העיפרון ארוך מהמחק?', answer: 8, hint: '12 פחות 4', exerciseType: 'compare' },
      { topicId: 'mm-cur-9', topic: 'מדידת אורך (מתווך, ס״מ, סרגל)', prompt: 'סרט באורך 6 ס״מ חובר לסרט נוסף והאורך הכולל הוא 10 ס״מ. מה אורך הסרט השני בס״מ?', answer: 4, hint: '6 ועוד ☐ שווה 10', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-9', topic: 'מדידת אורך (מתווך, ס״מ, סרגל)', prompt: 'יונתן מדד שולחן באורך 5 מחברות ומדף באורך 3 מחברות. מה אורך שניהם יחד במחברות?', answer: 8, hint: '5 ועוד 3', exerciseType: 'word_problem' },

      // Topic 10: שעון אנלוגי בשעות שלמות (mm-cur-10)
      { topicId: 'mm-cur-10', topic: 'שעון אנלוגי בשעות שלמות', prompt: 'איזו שעה מאוחרת יותר ביום: השעה 3:00 או השעה 5:00?', answer: '5:00', hint: '5 מאוחר מ־3', exerciseType: 'compare' },
      { topicId: 'mm-cur-10', topic: 'שעון אנלוגי בשעות שלמות', prompt: 'השעה עכשיו 2:00. בעוד כמה שעות תהיה השעה 6:00?', answer: 4, hint: '2 ועוד ☐ שווה 6', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-10', topic: 'שעון אנלוגי בשעות שלמות', prompt: 'ההצגה החלה בשעה 4:00 ונמשכה שעה אחת שלמה. באיזו שעה הסתיימה ההצגה?', answer: '5:00', hint: '4 ועוד 1', exerciseType: 'word_problem' },

      // Topic 11: כסף — מטבעות וסכומים (mm-cur-11)
      { topicId: 'mm-cur-11', topic: 'כסף — מטבעות וסכומים', prompt: 'מה שווה יותר: מטבע אחד של 10 ₪ או מטבע אחד של 5 ₪?', answer: '10 ₪', hint: '10 גדול מ־5', exerciseType: 'compare' },
      { topicId: 'mm-cur-11', topic: 'כסף — מטבעות וסכומים', prompt: 'מחברת עולה 10 ₪. לאילן יש 7 ₪. כמה שקלים חסרים לו?', answer: 3, hint: '7 ועוד ☐ שווה 10', exerciseType: 'missing_addend' },

      // Topic 12: דיאגרמת עמודות ופיקטוגרם (mm-cur-12)
      { topicId: 'mm-cur-12', topic: 'דיאגרמת עמודות ופיקטוגרם', prompt: 'בדיאגרמת הכיתה: 6 ילדים בחרו בתוף ו־4 בחרו בחליל. בכמה ילדים יותר בחרו בתוף?', answer: 2, hint: '6 פחות 4', exerciseType: 'compare' },
      { topicId: 'mm-cur-12', topic: 'דיאגרמת עמודות ופיקטוגרם', prompt: 'בדיאגרמה סך כל המשתתפים הוא 10 ילדים. אם 7 בחרו פסנתר, כמה ילדים בחרו כינור?', answer: 3, hint: '7 ועוד ☐ שווה 10', exerciseType: 'missing_addend' },
    ],
    'ב': [
      // Topic 0: מספרים עד 1,000, מבנה עשרוני, זוגי/אי־זוגי (mm-cur-13)
      { topicId: 'mm-cur-13', topic: 'מספרים עד 1,000, מבנה עשרוני, זוגי/אי־זוגי', prompt: 'בספרייה יש 3 מאות, 4 עשרות ו־5 ספרים בודדים. כמה ספרים בסך הכל?', answer: 345, hint: '300 + 40 + 5', exerciseType: 'word_problem' },

      // Topic 2: שליטה בכפולות 2, 4, 5, 10 (mm-cur-15)
      { topicId: 'mm-cur-15', topic: 'שליטה בכפולות 2, 4, 5, 10', prompt: '4 × ☐ = 20. מהו המספר החסר?', answer: 5, hint: 'כמה פעמים 4 נכנס ב־20?', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-15', topic: 'שליטה בכפולות 2, 4, 5, 10', prompt: 'בכל מארז יש 5 פעמונים. כמה פעמונים יש ב־4 מארזים כאלה?', answer: 20, hint: '4 פעמים 5', exerciseType: 'word_problem' },
      { topicId: 'mm-cur-15', topic: 'שליטה בכפולות 2, 4, 5, 10', prompt: 'על ישר המספרים מ־0, כמה קפיצות של 4 נדרשות כדי להגיע ל־12?', answer: 3, hint: '12 לחלק ל־4', exerciseType: 'number_line' },

      // Topic 3: חילוק לחלקים ולהכלה על אותם מספרים (mm-cur-16)
      { topicId: 'mm-cur-16', topic: 'חילוק לחלקים ולהכלה על אותם מספרים', prompt: '18 : ☐ = 9. מהו המספר החסר?', answer: 2, hint: '18 לחלק למה שווה 9?', exerciseType: 'missing_addend' },

      // Topic 4: פירוק והרכבה של מצולעים; זווית ישרה (mm-cur-17)
      { topicId: 'mm-cur-17', topic: 'פירוק והרכבה של מצולעים; זווית ישרה', prompt: 'במלבן יש 4 זוויות ישרות. אם נספרו 3 זוויות, כמה זוויות נותרו לספור? (☐)', answer: 1, hint: '4 פחות 3', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-17', topic: 'פירוק והרכבה של מצולעים; זווית ישרה', prompt: 'דני חיבר שני משולשים ישרי־זווית ויצר מלבן. כמה זוויות ישרות יש במלבן שנוצר?', answer: 4, hint: 'בכל מלבן יש 4 זוויות ישרות', exerciseType: 'word_problem' },

      // Topic 5: ס״מ, היקף, חצאי שעות (mm-cur-18)
      { topicId: 'mm-cur-18', topic: 'ס״מ, היקף, חצאי שעות', prompt: 'היקף משולש שווה־צלעות הוא 15 ס״מ. מה אורך כל צלע בס״מ? (☐)', answer: 5, hint: '15 לחלק ל־3', exerciseType: 'missing_addend' },

      // Topic 6: כסף — סכום בשטרות ובמטבעות, קנייה ועודף (mm-cur-19)
      { topicId: 'mm-cur-19', topic: 'כסף — סכום בשטרות ובמטבעות, קנייה ועודף', prompt: 'מה שווה יותר: שטר של 50 ₪ או 4 מטבעות של 10 ₪?', answer: '50 ₪', hint: '50 גדול מ־40', exerciseType: 'compare' },

      // Topic 7: נפח תיבות — מנייה של קוביות (mm-cur-20)
      { topicId: 'mm-cur-20', topic: 'נפח תיבות — מנייה של קוביות', prompt: 'בתיבה יש 2 שכבות של 6 קוביות, סך הכל 12. אם נוסיף עוד שכבה של ☐ קוביות יהיו 18 קוביות?', answer: 6, hint: 'כל שכבה זהה לשכבות האחרות', exerciseType: 'missing_addend' },
    ],
    'ג': [
      // Topic 0: מספרים עד 10,000, מבנה עשרוני (mm-cur-22)
      { topicId: 'mm-cur-22', topic: 'מספרים עד 10,000, מבנה עשרוני', prompt: 'בספרייה יש 4 אלפים, 2 מאות ועוד 5 ספרים. כמה ספרים בסך הכל?', answer: 4205, hint: '4000 + 200 + 5', exerciseType: 'word_problem' },

      // Topic 1: חיבור/חיסור במאוזן ובמאונך עד רבבה (mm-cur-23)
      { topicId: 'mm-cur-23', topic: 'חיבור/חיסור במאוזן ובמאונך עד רבבה', prompt: 'במשחק היו 3,200 צופים והצטרפו עוד 800 צופים. כמה צופים יש עכשיו בסך הכל?', answer: 4000, hint: '3,200 ועוד 800', exerciseType: 'word_problem' },

      // Topic 3: חילוק עם שארית; כפל/חילוק ב־10, 100, 1,000 (mm-cur-25)
      { topicId: 'mm-cur-25', topic: 'חילוק עם שארית; כפל/חילוק ב־10, 100, 1,000', prompt: '23 : 5 = 4 (שארית ☐). מהי השארית?', answer: 3, hint: '5 כפול 4 שווה 20, ו־23 פחות 20 שווה 3', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-25', topic: 'חילוק עם שארית; כפל/חילוק ב־10, 100, 1,000', prompt: '250 : 10 = ?', answer: 25, hint: 'חילוק ב־10 מוריד אפס אחד', exerciseType: 'direct' },
      { topicId: 'mm-cur-25', topic: 'חילוק עם שארית; כפל/חילוק ב־10, 100, 1,000', prompt: '70 × ☐ = 700. מהו המספר החסר?', answer: 10, hint: 'כמה פעמים 70 נכנס ב־700?', exerciseType: 'missing_addend' },

      // Topic 4: שאלות השוואה כפליות ודו־שלביות (mm-cur-26)
      { topicId: 'mm-cur-26', topic: 'שאלות השוואה כפליות ודו־שלביות', prompt: 'השוו: פי 4 מ־6 ☐ פי 3 מ־8 (כתבו <, > או =)', answer: '=', hint: '4×6=24 ו־3×8=24', exerciseType: 'compare' },
      { topicId: 'mm-cur-26', topic: 'שאלות השוואה כפליות ודו־שלביות', prompt: 'המספר 35 גדול פי 5 מהמספר ☐. מהו המספר?', answer: 7, hint: '35 לחלק ל־5', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-26', topic: 'שאלות השוואה כפליות ודו־שלביות', prompt: 'כמה הוא פי 6 מ־8?', answer: 48, hint: '6 כפול 8', exerciseType: 'direct' },

      // Topic 6: שטח מלבן; שעות ודקות (mm-cur-28)
      { topicId: 'mm-cur-28', topic: 'שטח מלבן; שעות ודקות', prompt: 'שטח מלבן הוא 24 סמ״ר. אם אורך צלע אחת הוא 6 ס״מ, מה אורך הצלע השנייה? (☐ ס״מ)', answer: 4, hint: '24 לחלק ל־6', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-28', topic: 'שטח מלבן; שעות ודקות', prompt: 'השוו: שטח מלבן 4×5 ס״מ ☐ שטח מלבן 3×7 ס״מ (כתבו < או >)', answer: '<', hint: '20 סמ״ר לעומת 21 סמ״ר', exerciseType: 'compare' },
      { topicId: 'mm-cur-28', topic: 'שטח מלבן; שעות ודקות', prompt: 'שירה תפרה שטיח מלבני באורך 5 מטרים וברוחב 3 מטרים. מה שטח השטיח במ״ר?', answer: 15, hint: '5 כפול 3', exerciseType: 'word_problem' },

      // Topic 7: כסף — המרה בין שקלים לאגורות ולעשרות אגורות (mm-cur-29)
      { topicId: 'mm-cur-29', topic: 'כסף — המרה בין שקלים לאגורות ולעשרות אגורות', prompt: 'מה שווה יותר: 500 אגורות או 6 שקלים?', answer: '6 שקלים', hint: '500 אגורות הן 5 שקלים', exerciseType: 'compare' },
    ],
    'ד': [
      { topicId: 'mm-cur-32', topic: 'שבר כחלק משלם — 1/2, 1/4, 1/8 מול תיבה 4/4', prompt: 'השוו: איזה תו ממלא יותר חלק מתיבה: 1/2 או 3/8? (כתבו > או <)', answer: '>', hint: '1/2 שווה 4/8, ו־4/8 גדול מ־3/8', exerciseType: 'compare' },
      { topicId: 'mm-cur-32', topic: 'שבר כחלק משלם — 1/2, 1/4, 1/8 מול תיבה 4/4', prompt: 'יונתן ניגן חצי תיבה ודניאל ניגן רבע תיבה. איזה חלק מהתיבה נשאר ריק?', answer: '1/4', hint: '1 פחות (1/2 + 1/4)', exerciseType: 'word_problem' },
      { topicId: 'mm-cur-32', topic: 'שבר כחלק משלם — 1/2, 1/4, 1/8 מול תיבה 4/4', prompt: 'על ישר מקצב מ־0 עד 1 שלם: באיזו נקודה בדיוק באמצע נמצא תו חצי?', answer: '1/2', hint: 'חצי הדרך מ־0 ל־1', exerciseType: 'number_line' },
      { topicId: 'mm-cur-34', topic: 'מקבילים, מאונכים, מרובעים, שטח פנים', prompt: 'למלבן היקף של 30 ס״מ ואורך צלע אחת 10 ס״מ. מה אורך הצלע השנייה? (☐ ס״מ)', answer: 5, hint: '30 חלקי 2 פחות 10', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-34', topic: 'מקבילים, מאונכים, מרובעים, שטח פנים', prompt: 'בגינה מלבנית באורך 8 מטרים וברוחב 5 מטרים הקימו גדר. מה שטח הגינה במ״ר?', answer: 40, hint: '8 כפול 5', exerciseType: 'word_problem' },
      { topicId: 'mm-cur-34', topic: 'מקבילים, מאונכים, מרובעים, שטח פנים', prompt: 'באיזה מרובע כל 4 הצלעות שוות, וכל הזוויות ישרות? (ריבוע או מעוין)', answer: 'ריבוע', hint: 'מרובע משוכלל בעל 4 זוויות ישרות', exerciseType: 'representation' },
      { topicId: 'mm-cur-35', topic: 'יחידות אורך; זמן בלוח עברי/לועזי', prompt: 'השוו: מה ארוך יותר: 2 ק״מ או 1,800 מטרים?', answer: '2 ק״מ', hint: '2 ק״מ הם 2,000 מטרים', exerciseType: 'compare' },
      { topicId: 'mm-cur-35', topic: 'יחידות אורך; זמן בלוח עברי/לועזי', prompt: 'השלימו: 3 מטרים ו־40 ס״מ = ☐ ס״מ', answer: 340, hint: '3 מטרים הם 300 ס״מ ועוד 40', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-35', topic: 'יחידות אורך; זמן בלוח עברי/לועזי', prompt: 'על ציר זמן: האימון התחיל ב־14:00 ונמשך שעה וחצי. באיזו שעה הסתיים?', answer: '15:30', hint: '14:00 ועוד שעה וחצי', exerciseType: 'number_line' },
      { topicId: 'mm-cur-36', topic: 'כסף — חישובי קנייה ועודף', prompt: 'השוו: מה עולה יותר: 4 מחברות ב־12 ש״ח כל אחת, או תיק ב־50 ש״ח?', answer: 'תיק ב־50 ש״ח', hint: '4 כפול 12 הם 48 שקלים', exerciseType: 'compare' },
      { topicId: 'mm-cur-36', topic: 'כסף — חישובי קנייה ועודף', prompt: 'נועה קנתה ספר ב־35 שקלים ושילמה בשטר של 50 שקלים. כמה עודף קיבלה? (☐ שקלים)', answer: 15, hint: '50 פחות 35', exerciseType: 'missing_addend' },
    ],
    'ה': [
      { topicId: 'mm-cur-41', topic: 'הרחבה, צמצום והשוואה של שברים', prompt: 'הרחיבו את השבר פי 3: 2/5 = ☐/15 (מהו המונה החסר?)', answer: 6, hint: 'כופלים את המונה 2 פי 3', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-41', topic: 'הרחבה, צמצום והשוואה של שברים', prompt: 'יואב צמצם את השבר 12/16 וקיבל 3/4. באיזה מספר חילק את המונה והמכנה?', answer: 4, hint: '12 לחלק ל־3 שווה 4', exerciseType: 'word_problem' },

      { topicId: 'mm-cur-45', topic: 'שברים עשרוניים: ערך מקום, השוואה, מעבר משבר פשוט', prompt: 'השלימו למספר שלם: 0.7 + ☐ = 1', answer: '0.3', hint: '10 עשיריות פחות 7 עשיריות', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-45', topic: 'שברים עשרוניים: ערך מקום, השוואה, מעבר משבר פשוט', prompt: 'בקבוק מכיל 0.75 ליטר מים. כמה ליטרים חסרים כדי להגיע ל־1 ליטר שלם?', answer: '0.25', hint: '1 פחות 0.75', exerciseType: 'word_problem' },
      { topicId: 'mm-cur-45', topic: 'שברים עשרוניים: ערך מקום, השוואה, מעבר משבר פשוט', prompt: 'על ישר המספרים בין 0 ל־1: איזה שבר עשרוני נמצא בדיוק באמצע?', answer: '0.5', hint: 'חצי הדרך מ־0 ל־1 כעשרוני', exerciseType: 'number_line' },

      { topicId: 'mm-cur-47', topic: 'משולשים, גובה, שטח משולש ומקבילית', prompt: 'שטח משולש הוא 20 סמ״ר ואורך בסיסו 8 ס״מ. מה גובה המשולש? (☐ ס״מ)', answer: 5, hint: '20 כפול 2 חלקי 8', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-47', topic: 'משולשים, גובה, שטח משולש ומקבילית', prompt: 'דני בנה עפיפון בצורת מקבילית עם בסיס באורך 10 ס״מ וגובה 6 ס״מ. מה שטח העפיפון בסמ״ר?', answer: 60, hint: 'בסיס כפול גובה: 10 כפול 6', exerciseType: 'word_problem' },
      { topicId: 'mm-cur-47', topic: 'משולשים, גובה, שטח משולש ומקבילית', prompt: 'באיזה משולש כל שלוש הזוויות חדות? (חד־זוויות / ישר־זווית / קהה־זווית)', answer: 'חד־זוויות', hint: 'משולש שבו כל הזוויות קטנות מ־90 מעלות', exerciseType: 'representation' },

      { topicId: 'mm-cur-48', topic: 'גופים: פירמידות ישרות ומנסרות ישרות — פריסות, פאות, קודקודים ומקצועות', prompt: 'לפירמידה מרובעת יש 5 קודקודים ו־5 פאות. כמה מקצועות יש לה? (☐ מקצועות)', answer: 8, hint: '4 מקצועות בסיס ועוד 4 צדדיים', exerciseType: 'missing_addend' },
      { topicId: 'mm-cur-48', topic: 'גופים: פירמידות ישרות ומנסרות ישרות — פריסות, פאות, קודקודים ומקצועות', prompt: 'השוו: למי יש יותר פאות — למנסרה משולשת או לפירמידה משולשת?', answer: 'למנסרה משולשת', hint: 'למנסרה משולשת 5 פאות, לפירמידה משולשת 4', exerciseType: 'compare' },
      { topicId: 'mm-cur-48', topic: 'גופים: פירמידות ישרות ומנסרות ישרות — פריסות, פאות, קודקודים ומקצועות', prompt: 'נגר בנה מנסרה משושה מעץ. כמה קודקודים יש למנסרה המשושה בסך הכל?', answer: 12, hint: '6 קודקודים בבסיס העליון ו־6 בתחתון', exerciseType: 'word_problem' },
    ]
  });

  function classifyExerciseType(it) {
    if (!it || typeof it !== 'object') return 'direct';
    if (it.exerciseType && EXERCISE_TYPES.includes(it.exerciseType)) return it.exerciseType;

    const p = String(it.prompt || '');
    if (it.wordType || it.skill === 'word_problems' || /היו|נשארו|קנינו|לכיתה|ספרים|תפוחים|מדבקות|בסלסילה|על המדף|ילדים|בלונים|שילם|חסכה|עודף/.test(p)) {
      return 'word_problem';
    }
    if (it.widget === 'numberLine' || it.line || it.skill === 'number_line' || /ישר המספרים|קפיצ/.test(p)) {
      return 'number_line';
    }
    if (/☐|\?.*\+|\+.*\?|חסר|השלם|מחובר/.test(p)) {
      return 'missing_addend';
    }
    if (/[><=]|השוו|גדול|קטן|שווה|בכמה|פי כמה|לעומת|מול|האם.*שווים|יותר.*מ|פחות.*מ/.test(p)) {
      return 'compare';
    }
    if (it.chart || it.clock || it.ruler || /לוח המאה|סדרות|דגם|צורות|מצולע|שעון|סרגל|מדיד|מטבע|פיקטוגרם|דיאגרמ/.test(p)) {
      return 'representation';
    }
    return 'direct';
  }

  function itemsForTopic(grade, topicIdentifier, providedItems) {
    const list = Array.isArray(providedItems) ? providedItems : (banks && banks.itemsForGrade ? banks.itemsForGrade(grade) : []);
    const supp = (GRADE_DATA[grade] || []).filter(function (it) {
      return it.topicId === topicIdentifier || it.topic === topicIdentifier;
    });

    const curr = curriculum || (typeof globalThis !== 'undefined' && globalThis.MM_CURRICULUM);
    if (!curr || !curr.MATRIX) return supp;

    const targetRow = curr.MATRIX.find(function (r) {
      return r.grade === grade && (r.topicId === topicIdentifier || r.topic === topicIdentifier);
    });
    if (!targetRow) return supp;

    const matchedBank = list.filter(function (it) {
      const s = curr.sectionForItem(it);
      return s && s.topic === targetRow.topic;
    });

    return matchedBank.concat(supp);
  }

  function typesForTopic(grade, topicIdentifier, providedItems) {
    const tItems = itemsForTopic(grade, topicIdentifier, providedItems);
    const set = new Set();
    tItems.forEach(function (it) {
      set.add(classifyExerciseType(it));
    });
    return Array.from(set);
  }

  function allExercisesForGrade(grade, providedItems) {
    const list = Array.isArray(providedItems) ? providedItems : (banks && banks.itemsForGrade ? banks.itemsForGrade(grade) : []);
    return list.concat(GRADE_DATA[grade] || []);
  }

  function verifyGradeTopics(grade, providedItems) {
    const curr = curriculum || (typeof globalThis !== 'undefined' && globalThis.MM_CURRICULUM);
    if (!curr || !curr.MATRIX) return { grade: grade, allPass: false, topics: [] };

    const gradeRows = curr.MATRIX.filter(function (r) { return r.grade === grade; });
    let allPass = true;
    const results = gradeRows.map(function (row) {
      const types = typesForTopic(grade, row.topicId || row.topic, providedItems);
      const pass = types.length >= 3;
      if (!pass) allPass = false;
      return {
        topicId: row.topicId,
        topic: row.topic,
        types: types,
        count: types.length,
        pass: pass,
      };
    });

    return {
      grade: grade,
      allPass: allPass,
      totalTopics: gradeRows.length,
      passedTopics: results.filter(function (r) { return r.pass; }).length,
      topics: results,
    };
  }

  return {
    EXERCISE_TYPES: EXERCISE_TYPES,
    TYPE_NAMES_HE: TYPE_NAMES_HE,
    GRADE_DATA: GRADE_DATA,
    classifyExerciseType: classifyExerciseType,
    itemsForTopic: itemsForTopic,
    typesForTopic: typesForTopic,
    allExercisesForGrade: allExercisesForGrade,
    verifyGradeTopics: verifyGradeTopics,
  };
});
