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
