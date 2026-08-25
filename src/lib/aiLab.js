(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MelodyMathAILab = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var scenarios = [
    {
      id: 'verify-arithmetic',
      skill: 'בדיקת תשובה',
      prompt: 'כמה הם 7 כפול 8?',
      answer: 'התשובה היא 54, כי 7 כפול 8 קרוב ל־50.',
      choices: ['נכון', 'צריך לבדוק', 'אי אפשר לדעת'],
      correct: 1,
      explanation: 'בודקים בחישוב או בטבלה: 7 × 8 = 56. תשובה בטוחה בעצמה עדיין יכולה להיות שגויה.'
    },
    {
      id: 'better-prompt',
      skill: 'שיפור prompt',
      prompt: 'איזו בקשה תעזור יותר ללמוד שברים?',
      answer: 'בחרו את הבקשה המדויקת והבטוחה יותר.',
      choices: [
        'תלמד אותי שברים',
        'הסבר לי חצי ורבע בעזרת פיצה, תן דוגמה אחת ואז שאלה, ואל תגלה מיד את התשובה',
        'תן את כל התשובות'
      ],
      correct: 1,
      explanation: 'בקשה טובה מגדירה נושא, דרך הסבר, מספר דוגמאות ומה לא לעשות.'
    },
    {
      id: 'private-data',
      skill: 'שמירה על פרטיות',
      prompt: 'עוזר AI מבקש שם מלא, כתובת ובית ספר כדי להכין תרגיל. מה עושים?',
      answer: 'בחרו את הפעולה הבטוחה.',
      choices: ['שולחים הכול', 'שולחים רק כתובת', 'לא שולחים פרטים אישיים ומבקשים תרגיל כללי'],
      correct: 2,
      explanation: 'לא צריך פרטים אישיים כדי לקבל תרגיל מתמטי. מבקשים דוגמה כללית.'
    },
    {
      id: 'unknown-source',
      skill: 'מקור וראיה',
      prompt: 'ה־AI אומר: “מחקר הוכיח שמוזיקה מכפילה הצלחה במתמטיקה”, בלי קישור. מה חסר?',
      answer: 'בחרו את הבדיקה המתאימה.',
      choices: ['כלום, AI תמיד יודע', 'מקור אמין והסבר מה באמת נבדק', 'עוד סימן קריאה'],
      correct: 1,
      explanation: 'טענה מחקרית דורשת מקור שאפשר לפתוח ולבדוק. גם אז בודקים מה המחקר באמת מדד.'
    }
  ];

  function getScenario(index) {
    return scenarios[index] || null;
  }

  function evaluate(index, choiceIndex) {
    var scenario = getScenario(index);
    if (!scenario) return { ok: false, reason: 'missing-scenario' };
    var correct = Number(choiceIndex) === scenario.correct;
    return { ok: true, correct: correct, explanation: scenario.explanation };
  }

  function summarize(results) {
    var correct = results.filter(function (value) { return value === true; }).length;
    var total = scenarios.length;
    return {
      correct: correct,
      total: total,
      passed: correct >= 3,
      message: correct >= 3
        ? 'זיהיתם לפחות שלושה כללי זהב: לבדוק, לדייק, לשמור פרטיות ולבקש מקור.'
        : 'כדאי לנסות שוב ולנמק: מה אפשר לבדוק, מה חסר, ואיזה פרט לא צריך למסור?'
    };
  }

  return { scenarios: scenarios, getScenario: getScenario, evaluate: evaluate, summarize: summarize };
});
