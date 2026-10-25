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
