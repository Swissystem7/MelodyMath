// MelodyMath — Interactive Guided Lessons Engine (הוראה מפורשת ומודרכת)
//
// Structured pedagogical units breaking down core math concepts into:
// 1. Conceptual introduction with musical analogies (Concept)
// 2. Auditory and visual demonstration (Listen & See)
// 3. Hands-on interactive manipulatives (Explore)
// 4. Guided scaffolding check with feedback (Check)
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  const LESSONS = [
    {
      id: 'fractions-intro',
      title: 'מהו שבר? חלק מתוך שלם',
      grade: 'ד',
      strand: 'שברים',
      icon: '🥧',
      summary: 'הבנת השבר כמשך זמן וחלוקת שלם באמצעות תיבה מוזיקלית ורבעים.',
      steps: [
        {
          title: 'מה זה שלם?',
          body: 'שלם (1) מייצג יחידה אחת מלאה. במוזיקה, תיבה שלמה של 4/4 נמשכת 4 פעימות מלאות. כל עוד התיבה מלאה — יש לנו שלם אחד.',
          actionType: 'wholeSound',
          actionLabel: 'השמיעו שלם (תיבה שלמה) 🎵'
        },
        {
          title: 'איך שלם מתחלק לחצאים ולרבעים?',
          body: 'אם נחלק את השלם לשני חלקים שווים — כל חלק הוא חצי (1/2). אם נחלק ל-4 חלקים שווים — כל חלק הוא רבע (1/4). שמינית (1/8) היא חצי מרבע! האוזן שומעת מיד ששמינית נמשכת בדיוק חצי מזמן הרבע.',
          actionType: 'quartersSound',
          actionLabel: 'השמיעו 4 רבעים במקצב 🥁'
        },
        {
          title: 'התנסות: הרכבת שלם מקוביות שבר',
          body: 'בנו תיבה שלמה של 1: הוסיפו חצאים (1/2), רבעים (1/4) ושמיניות (1/8) עד שתגיעו בדיוק ל-1 שלם.',
          actionType: 'builder'
        },
        {
          title: 'בדיקת הבנה מודרכת',
          body: 'כמה רבעים (1/4) צריך לחבר יחד כדי לקבל חצי (1/2)?',
          options: ['1 רבע', '2 רבעים', '4 רבעים', '8 רבעים'],
          correctIndex: 1,
          explanation: 'שני רבעים שווים בדיוק לחצי: 1/4 + 1/4 = 2/4 = 1/2.'
        }
      ]
    },
    {
      id: 'multiplication-groups',
      title: 'כפל כקבוצות שוות ומקצב חוזר',
      grade: 'ב',
      strand: 'כפל וחילוק',
      icon: '🔁',
      summary: 'חיבור חוזר של קבוצות שוות מוסבר כפעימות קצב חוזרות.',
      steps: [
        {
          title: 'מה זה כפל?',
          body: 'כפל הוא קיצור של חיבור חוזר. כשאנחנו כותבים 3 × 4, הכוונה היא ל-3 קבוצות שבכל אחת יש 4 פריטים: 4 + 4 + 4 = 12 פריטים בסך הכל.',
          actionType: 'multConcept',
          actionLabel: 'השמיעו 3 קבוצות של 4 🥁'
        },
        {
          title: 'שמיעת הכפל כמקצב',
          body: 'במוזיקה, 3 קבוצות של 4 הן 3 תיבות של 4 רבעים. פעימת הבס בהתחלת כל קבוצה מדגישה את ראש הקבוצה, וכך המוח סופר בקלות קבוצות שלמות!',
          actionType: 'multAccent',
          actionLabel: 'השמיעו עם הדגשת עוגן לקבוצה 🎵'
        },
        {
          title: 'התנסות: חקרו את לוח הכפל',
          body: 'בחרו כמות קבוצות וגודל קבוצה כדי לשמוע את רצף הנקישות ולראות את המערך המספרי.',
          actionType: 'multExplorer'
        },
        {
          title: 'בדיקת הבנה מודרכת',
          body: 'אם נתופף 4 קבוצות שבכל אחת 5 פעימות, כמה פעימות נשמע בסך הכל?',
          options: ['9 פעימות', '15 פעימות', '20 פעימות', '25 פעימות'],
          correctIndex: 2,
          explanation: '4 קבוצות של 5 הן: 5 + 5 + 5 + 5 = 20 פעימות (4 × 5 = 20).'
        }
      ]
    },
    {
      id: 'place-value-regrouping',
      title: 'מבנה עשרוני: עשרות ואחדות',
      grade: 'א',
      strand: 'מבנה עשרוני',
      icon: '🔟',
      summary: 'פירוק מספר לעשרות ויחידות עם הדגשת צליל בס עמוק לעשרת ונקישה לאחדות.',
      steps: [
        {
          title: 'מהי עשרת?',
          body: 'בשיטה העשרונית, כשיש לנו 10 יחידות בודדות, אנחנו מאגדים אותן לחבילה אחת גדולה שנקראת עשרת (10). המספר 14 הוא עשרת אחת (10) ועוד 4 אחדות בודדות.',
          actionType: 'tensConcept',
          actionLabel: 'השמיעו עשרת אחת (בס) + 4 אחדות 🔔'
        },
        {
          title: 'הבדל בצליל: עשרת מול אחדות',
          body: 'צליל בס נמוך ועמוק מייצג קבוצת עשרת שלמה. צליל פעמון קל מייצג אחדות בודדות. השמיעה מבדילה מיד בין עשרות כבדות לאחדות קלות!',
          actionType: 'tensSound',
          actionLabel: 'השמיעו את ההבדל בצלילים 🎹'
        },
        {
          title: 'התנסות: הרכבת מספר מעשרות ואחדות',
          body: 'שלבו עשרות ואחדות וגלו איזה מספר נוצר (למשל: 3 עשרות ו-5 אחדות = 35).',
          actionType: 'tensBuilder'
        },
        {
          title: 'בדיקת הבנה מודרכת',
          body: 'איזה מספר מורכב מ־3 עשרות ו־7 אחדות?',
          options: ['10', '37', '73', '307'],
          correctIndex: 1,
          explanation: '3 עשרות הן 30, ועוד 7 אחדות = 37.'
        }
      ]
    },
    {
      id: 'number-line-jumps',
      title: 'ישר המספרים ודילוגים',
      grade: 'א',
      strand: 'ישר מספרים',
      icon: '📏',
      summary: 'תנועה במרחב הציר: ימינה מגדיל את המספר ומעלה את התדר, שמאלה מקטין.',
      steps: [
        {
          title: 'הכיוון על הישר',
          body: 'ישר המספרים הולך משמאל לימין. ככל שמתקדמים ימינה — המספר גדל! במוזיקה, ככל שעולים ימינה על הישר — גובה הצליל עולה בהתאמה.',
          actionType: 'lineConcept',
          actionLabel: 'השמיעו טיפוס על הישר 📈'
        },
        {
          title: 'קפיצות ודילוגים על הישר',
          body: 'אפשר לצעוד על הישר בצעדים של 1, בדילוגים של 2, או בקפיצות של 5 ו-10. כל קפיצה יוצרת מרווח מוזיקלי קבוע וצפוי!',
          actionType: 'lineJumps',
          actionLabel: 'השמיעו קפיצות של 2 🎵'
        },
        {
          title: 'התנסות: קפצו על הישר',
          body: 'בחרו גודל צעד (1, 2 או 5) וצעדו על הישר כדי לראות ולשמוע את המספרים בדרך.',
          actionType: 'lineExplorer'
        },
        {
          title: 'בדיקת הבנה מודרכת',
          body: 'אם מתחילים במספר 6 וקופצים 3 פעמים בדילוגים של 2, לאיזה מספר נגיע?',
          options: ['8', '11', '12', '14'],
          correctIndex: 2,
          explanation: 'מתחילים ב-6: קפיצה ראשונה 8, קפיצה שנייה 10, קפיצה שלישית 12 (6 + 2 + 2 + 2 = 12).'
        }
      ]
    },
    {
      id: 'division-groups',
      title: 'חילוק כחלוקה שווה וכפעולה הפוכה לכפל',
      grade: 'ג',
      strand: 'כפל וחילוק',
      icon: '➗',
      summary: 'מגלים איך מחלקים מקצב לקבוצות שוות ואיך כפל מחזיר אותנו לשלם.',
      steps: [
        {
          title: 'מחלקים את המקצב בשווה',
          body: 'חילוק הוא חלוקה לקבוצות שוות. אם ניקח 12 פעימות ונחלק אותן בין 3 נגנים, כל נגן ינגן בדיוק 4 פעימות (12 ÷ 3 = 4)!',
          actionType: 'divConcept',
          actionLabel: 'השמיעו 12 פעימות ב-3 קבוצות שוות 🥁'
        },
        {
          title: 'חילוק וכפל – חברים הפוכים',
          body: 'חילוק מפרק לקבוצות, וכפל מחבר אותן בחזרה! 12 לחלק ל-3 שווה 4, ו-3 קבוצות של 4 פעימות הן בדיוק 12 (3 × 4 = 12).',
          actionType: 'divInverse',
          actionLabel: 'השמיעו כפל שמחזיר את המקצב השלם 🎵'
        },
        {
          title: 'התנסות: מעבדת החלוקה והמקצבים',
          body: 'בחרו מספר פעימות (8, 12 או 16) וחלקו אותן לקבוצות שוות כדי לשמוע את כלי הנגינה.',
          actionType: 'divExplorer'
        },
        {
          title: 'בדיקת הבנה מודרכת',
          body: 'למתופף יש 12 נקישות תוף והוא מחלק אותן שווה בשווה ל-4 תיבות נגינה. כמה נקישות יהיו בכל תיבה?',
          options: ['2 נקישות', '3 נקישות', '4 נקישות', '6 נקישות'],
          correctIndex: 1,
          explanation: 'מצוין! 12 לחלק ל-4 זה 3. כפל מוכיח את זה: 4 כפול 3 שווה בדיוק 12.'
        }
      ]
    },
    {
      id: 'geometry-euclidean',
      title: 'גיאומטריה של הזמן: מקצבים ומצולעים',
      grade: 'ד',
      strand: 'גיאומטריה',
      icon: '⭕',
      summary: 'מגלים איך מצולעים על מעגל הזמן יוצרים מקצבים מוזיקליים עשירים ומאוזנים.',
      steps: [
        {
          title: 'מעגל, זמן ומצולעים',
          body: 'כשאנחנו מניחים צלילים במרווחים שווים סביב מעגל פעימות, נוצר מצולע משוכלל (כמו משולש או ריבוע) ונוצר מקצב מושלם!',
          actionType: 'geoConcept',
          actionLabel: 'השמיעו מצולע פעימות על מעגל 🥁'
        },
        {
          title: 'ריבוע של 4 מתוך 16',
          body: 'על מעגל של 16 פעימות נסמן 4 נקודות במרחק שווה. קיבלנו ריבוע גיאומטרי ומקצב שחוזר כל 4 פעימות בהרמוניה.',
          actionType: 'squareDemo',
          actionLabel: 'השמיעו מקצב ריבוע (4 מתוך 16) 🎵'
        },
        {
          title: 'התנסות: גלגל הזמן האוקלידי',
          body: 'שנו את מספר הפעימות על הגלגל וצפו במצולע שנוצר ובמקצב המיוחד שהוא מנגן.',
          actionType: 'euclideanWheel'
        },
        {
          title: 'בדיקת הבנה מודרכת',
          body: 'במעגל מקצב של 12 פעימות, אם נציב 3 צלילים במרווחים שווים לחלוטין (כל 4 פעימות צליל), איזו צורה גיאומטרית נקבל?',
          options: ['משולש שווה צלעות', 'ריבוע', 'משושה משוכלל', 'טרפז'],
          correctIndex: 0,
          explanation: 'נכון מאוד! 3 נקודות במרחקים שווים על מעגל יוצרות משולש שווה צלעות, שמשמיע מקצב תלת-פעמתי יציב.'
        }
      ]
    },
    {
      id: 'even-odd-rhythm',
      title: 'זוגי ואי־זוגי: צעדים בזוגות מול צליל בודד',
      grade: 'ב',
      strand: 'מספרים ופעולות',
      icon: '👥',
      summary: 'לומדים לזהות מספרים זוגיים ואי-זוגיים בעזרת צעדים בצמדים וצליל שנשאר לבד.',
      steps: [
        {
          title: 'מי בזוג ומי לבד?',
          body: 'מספר זוגי הוא מספר שבו כל הצלילים מוצאים בן זוג בצמד (2, 4, 6). במספר אי-זוגי, תמיד נשאר צליל אחד בודד ללא זוג!',
          actionType: 'evenOddConcept',
          actionLabel: 'השמיעו צמדים מול צליל בודד 🔔'
        },
        {
          title: 'שומעים את ההבדל בין 6 ל-7',
          body: 'ב-6 נקישות שומעים 3 זוגות שלמים. ב-7 נקישות שומעים 3 זוגות ועוד נקישה אחת בודדת בסוף – זהו מספר אי-זוגי!',
          actionType: 'evenOddDemo',
          actionLabel: 'השמיעו הבדל בין 6 ל-7 🎵'
        },
        {
          title: 'התנסות: חוקר הזוגי והאי-זוגי',
          body: 'בחרו כמות צלילים, סדרו אותם בזוגות ובדקו האם כולם מצאו חבר לצמד או שנשאר צליל בודד.',
          actionType: 'evenOddExplorer'
        },
        {
          title: 'בדיקת הבנה מודרכת',
          body: 'ניגנו 9 צלילים וסידרנו אותם בזוגות של שניים. מה יקרה?',
          options: [
            'כל 9 הצלילים יסתדרו בזוגות ללא שארית',
            'נקבל 4 זוגות וצליל אחד יישאר בודד (מספר אי-זוגי)',
            'נקבל 3 זוגות ו-3 צלילים יישארו בודדים',
            'אף צליל לא ימצא זוג'
          ],
          correctIndex: 1,
          explanation: 'בול! 9 הוא מספר אי-זוגי: יש בו 4 זוגות (8 צלילים) ועוד צליל אחד בודד שאין לו חבר לצמד.'
        }
      ]
    }
  ];

  function getAllLessons() {
    return LESSONS;
  }

  function getLessonById(id) {
    if (!id) return null;
    return LESSONS.find(function (l) { return l.id === id; }) || null;
  }

  function getLessonsForGrade(grade) {
    if (!grade) return LESSONS;
    return LESSONS.filter(function (l) { return l.grade === grade; });
  }

  function evaluateStepAnswer(lessonId, stepIndex, chosenIndex) {
    const lesson = getLessonById(lessonId);
    if (!lesson) return { valid: false, error: 'lesson_not_found' };
    const step = lesson.steps[stepIndex];
    if (!step || !Array.isArray(step.options)) return { valid: false, error: 'step_not_quiz' };
    const correct = Number(chosenIndex) === step.correctIndex;
    return {
      valid: true,
      correct: correct,
      correctIndex: step.correctIndex,
      explanation: step.explanation || ''
    };
  }

  function registerLesson(lesson) {
    if (!lesson || typeof lesson !== 'object') return false;
    if (!lesson.id || !lesson.title || !lesson.grade || !Array.isArray(lesson.steps)) return false;
    const existingIdx = LESSONS.findIndex(function (l) { return l.id === lesson.id; });
    if (existingIdx >= 0) {
      LESSONS[existingIdx] = lesson;
    } else {
      LESSONS.push(lesson);
    }
    return true;
  }

  return {
    LESSONS,
    getAllLessons,
    getLessonById,
    getLessonsForGrade,
    evaluateStepAnswer,
    registerLesson
  };
});
