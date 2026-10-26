// MelodyMath — a short check before and after a music unit (#110).
//
// The evidence for music-math integration is moderate and topic-specific, so
// the app measures instead of claiming. Each unit has two parallel forms: the
// same skill and level in the same slot, different numbers. The check itself
// has no music (plan §10 R4: transfer without music). Results are ordinary
// teacherStore sessions of kind 'check-pre:<unit>' / 'check-post:<unit>', so
// they stay on this device and travel with the roster export like any session.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SKILL_HE = {
    // Grade א
    counting: 'מנייה וזיהוי כמויות',
    addition_10: 'חיבור עד 10',
    subtraction_10: 'חיסור עד 10',
    number_line: 'ישר המספרים',
    // Grade ב
    even_odd: 'זוגי ואי־זוגי',
    tens_calc: 'חישוב בעשרות',
    break_ten: 'פירוק והשלמה לעשרת',
    addsub_100: 'חיבור וחיסור עד 100',
    // Grade ג
    mult_basics: 'כפל כקבוצות שוות',
    div_equal: 'חילוק כחלוקה שווה',
    mult_table: 'לוח הכפל',
    div_inverse: 'קשר כפל וחילוק',
    // Grade ד
    equivalence: 'שברים שקולים',
    compare: 'השוואת שברים',
    addsub: 'חיבור וחיסור שברים',
    whole: 'שלם כשברים',
    // Grade ה
    lcm: 'כפולה משותפת מינימלית',
    factors: 'גורמים ומחלקים',
    primes: 'מספרים ראשוניים',
    mixed_fractions: 'שברים מעורבים',
    // Grade ו
    ratios: 'יחסים והרחבה',
    subtraction_check: 'חיסור',
    place_value_check: 'ערך מקום',
    percents: 'אחוזים וחישוב חלק',
    circle_angles: 'זוויות ומעגל',
    mean_calc: 'ממוצע חשבוני',
  };

  // Slot i of 'pre' and slot i of 'post' are a pair: same skill, same level,
  // same number of choices, different numbers. unitCheck.test.js pins this.
  const UNITS = {
    'count-add-1': {
      he: 'מנייה וחיבור/חיסור עד 10 · כיתה א׳',
      grade: 'א',
      forms: {
        pre: [
          { skill: 'counting', level: 1, prompt: 'כמה הם 3 תפוחים ועוד תפוח אחד?', answer: '4', choices: ['3', '4', '5', '6'] },
          { skill: 'counting', level: 2, prompt: 'איזה מספר בא מיד אחרי 6?', answer: '7', choices: ['5', '7', '8', '9'] },
          { skill: 'addition_10', level: 1, prompt: '2 + 3 = ?', answer: '5', choices: ['4', '5', '6', '7'] },
          { skill: 'addition_10', level: 2, prompt: '4 + 5 = ?', answer: '9', choices: ['7', '8', '9', '10'] },
          { skill: 'subtraction_10', level: 1, prompt: '5 − 2 = ?', answer: '3', choices: ['2', '3', '4', '5'] },
          { skill: 'subtraction_10', level: 2, prompt: '9 − 4 = ?', answer: '5', choices: ['4', '5', '6', '7'] },
          { skill: 'number_line', level: 2, prompt: 'איזה מספר נמצא בדיוק בין 4 ל־6?', answer: '5', choices: ['3', '5', '7', '8'] },
          { skill: 'addition_10', level: 3, prompt: 'כמה חסר ל־8 כדי להגיע ל־10?', answer: '2', choices: ['1', '2', '3', '4'] },
        ],
        post: [
          { skill: 'counting', level: 1, prompt: 'כמה הם 4 כדורים ועוד כדור אחד?', answer: '5', choices: ['4', '5', '6', '7'] },
          { skill: 'counting', level: 2, prompt: 'איזה מספר בא מיד אחרי 7?', answer: '8', choices: ['6', '7', '8', '9'] },
          { skill: 'addition_10', level: 1, prompt: '3 + 4 = ?', answer: '7', choices: ['5', '6', '7', '8'] },
          { skill: 'addition_10', level: 2, prompt: '5 + 3 = ?', answer: '8', choices: ['6', '7', '8', '9'] },
          { skill: 'subtraction_10', level: 1, prompt: '6 − 2 = ?', answer: '4', choices: ['2', '3', '4', '5'] },
          { skill: 'subtraction_10', level: 2, prompt: '8 − 3 = ?', answer: '5', choices: ['3', '4', '5', '6'] },
          { skill: 'number_line', level: 2, prompt: 'איזה מספר נמצא בדיוק בין 6 ל־8?', answer: '7', choices: ['5', '6', '7', '9'] },
          { skill: 'addition_10', level: 3, prompt: 'כמה חסר ל־7 כדי להגיע ל־10?', answer: '3', choices: ['1', '2', '3', '4'] },
        ],
      },
    },
    'even-addsub-2': {
      he: 'זוגי/אי־זוגי ועשרות · כיתה ב׳',
      grade: 'ב',
      forms: {
        pre: [
          { skill: 'even_odd', level: 1, prompt: 'האם המספר 8 הוא זוגי או אי־זוגי?', answer: 'זוגי', choices: ['זוגי', 'אי־זוגי'] },
          { skill: 'even_odd', level: 2, prompt: 'איזה מהמספרים הבאים הוא אי־זוגי?', answer: '15', choices: ['12', '14', '15', '16'] },
          { skill: 'tens_calc', level: 1, prompt: '20 + 30 = ?', answer: '50', choices: ['40', '50', '60', '70'] },
          { skill: 'tens_calc', level: 2, prompt: '70 − 40 = ?', answer: '30', choices: ['20', '30', '40', '50'] },
          { skill: 'break_ten', level: 2, prompt: 'כמה הם 8 + 5 עם השלמה לעשרת?', answer: '13', choices: ['12', '13', '14', '15'] },
          { skill: 'break_ten', level: 3, prompt: '14 − 6 = ?', answer: '8', choices: ['6', '7', '8', '9'] },
          { skill: 'addsub_100', level: 2, prompt: '35 + 20 = ?', answer: '55', choices: ['45', '50', '55', '65'] },
          { skill: 'addsub_100', level: 3, prompt: '48 − 15 = ?', answer: '33', choices: ['23', '31', '33', '35'] },
        ],
        post: [
          { skill: 'even_odd', level: 1, prompt: 'האם המספר 7 הוא זוגי או אי־זוגי?', answer: 'אי־זוגי', choices: ['זוגי', 'אי־זוגי'] },
          { skill: 'even_odd', level: 2, prompt: 'איזה מהמספרים הבאים הוא זוגי?', answer: '18', choices: ['13', '15', '17', '18'] },
          { skill: 'tens_calc', level: 1, prompt: '30 + 40 = ?', answer: '70', choices: ['50', '60', '70', '80'] },
          { skill: 'tens_calc', level: 2, prompt: '80 − 30 = ?', answer: '50', choices: ['30', '40', '50', '60'] },
          { skill: 'break_ten', level: 2, prompt: 'כמה הם 7 + 6 עם השלמה לעשרת?', answer: '13', choices: ['11', '12', '13', '14'] },
          { skill: 'break_ten', level: 3, prompt: '15 − 7 = ?', answer: '8', choices: ['6', '7', '8', '9'] },
          { skill: 'addsub_100', level: 2, prompt: '45 + 30 = ?', answer: '75', choices: ['65', '70', '75', '85'] },
          { skill: 'addsub_100', level: 3, prompt: '59 − 16 = ?', answer: '43', choices: ['33', '41', '43', '45'] },
        ],
      },
    },
    'mult-div-3': {
      he: 'כפל וחילוק · כיתה ג׳',
      grade: 'ג',
      forms: {
        pre: [
          { skill: 'mult_basics', level: 1, prompt: '3 קבוצות של 4 הם:', answer: '12', choices: ['7', '10', '12', '14'] },
          { skill: 'mult_basics', level: 2, prompt: '5 × 6 = ?', answer: '30', choices: ['25', '30', '35', '36'] },
          { skill: 'div_equal', level: 1, prompt: '12 מחולק שווה בשווה ל־3 קבוצות נותן בכל קבוצה:', answer: '4', choices: ['3', '4', '5', '6'] },
          { skill: 'div_equal', level: 2, prompt: '24 ÷ 4 = ?', answer: '6', choices: ['4', '5', '6', '8'] },
          { skill: 'mult_table', level: 2, prompt: '7 × 8 = ?', answer: '56', choices: ['48', '54', '56', '64'] },
          { skill: 'mult_table', level: 3, prompt: '9 × 6 = ?', answer: '54', choices: ['45', '54', '56', '63'] },
          { skill: 'div_inverse', level: 2, prompt: 'אם 6 × 7 = 42, אז 42 ÷ 6 = ?', answer: '7', choices: ['6', '7', '8', '9'] },
          { skill: 'div_inverse', level: 3, prompt: 'איזה מספר כפול 4 שווה 36?', answer: '9', choices: ['7', '8', '9', '12'] },
        ],
        post: [
          { skill: 'mult_basics', level: 1, prompt: '4 קבוצות של 3 הם:', answer: '12', choices: ['7', '9', '12', '15'] },
          { skill: 'mult_basics', level: 2, prompt: '6 × 5 = ?', answer: '30', choices: ['20', '25', '30', '35'] },
          { skill: 'div_equal', level: 1, prompt: '15 מחולק שווה בשווה ל־3 קבוצות נותן בכל קבוצה:', answer: '5', choices: ['3', '4', '5', '6'] },
          { skill: 'div_equal', level: 2, prompt: '28 ÷ 4 = ?', answer: '7', choices: ['5', '6', '7', '8'] },
          { skill: 'mult_table', level: 2, prompt: '6 × 8 = ?', answer: '48', choices: ['42', '46', '48', '54'] },
          { skill: 'mult_table', level: 3, prompt: '8 × 9 = ?', answer: '72', choices: ['63', '72', '74', '81'] },
          { skill: 'div_inverse', level: 2, prompt: 'אם 7 × 6 = 42, אז 42 ÷ 7 = ?', answer: '6', choices: ['5', '6', '7', '8'] },
          { skill: 'div_inverse', level: 3, prompt: 'איזה מספר כפול 5 שווה 45?', answer: '9', choices: ['7', '8', '9', '10'] },
        ],
      },
    },
    'frac-dur-4': {
      he: 'שברים עם משכי צלילים · כיתה ד׳',
      grade: 'ד',
      forms: {
        pre: [
          { skill: 'equivalence', level: 1, prompt: 'כמה רבעים שווים ל־1/2?', answer: '2', choices: ['1', '2', '3', '4'] },
          { skill: 'equivalence', level: 2, prompt: 'כמה שמיניות שוות ל־3/4?', answer: '6', choices: ['3', '4', '6', '8'] },
          { skill: 'compare', level: 1, prompt: 'מה גדול יותר: 3/8 או 5/8?', answer: '5/8', choices: ['3/8', '5/8', 'שווים'] },
          { skill: 'compare', level: 2, prompt: 'מה גדול יותר: 1/3 או 1/5?', answer: '1/3', choices: ['1/3', '1/5', 'שווים'] },
          { skill: 'addsub', level: 1, prompt: '1/8 + 3/8 = ?', answer: '4/8', choices: ['4/8', '4/16', '3/8', '2/8'] },
          { skill: 'addsub', level: 2, prompt: '7/8 − 3/8 = ?', answer: '4/8', choices: ['4/8', '4/16', '10/8', '3/8'] },
          { skill: 'whole', level: 3, prompt: 'כמה רבעים יש ב־2 שלמים?', answer: '8', choices: ['2', '4', '6', '8'] },
          { skill: 'addsub', level: 3, prompt: '1/2 + 1/4 = ?', answer: '3/4', choices: ['3/4', '2/6', '2/4', '1/6'] },
        ],
        post: [
          { skill: 'equivalence', level: 1, prompt: 'כמה שישיות שוות ל־1/3?', answer: '2', choices: ['1', '2', '3', '4'] },
          { skill: 'equivalence', level: 2, prompt: 'כמה תשיעיות שוות ל־2/3?', answer: '6', choices: ['2', '3', '6', '9'] },
          { skill: 'compare', level: 1, prompt: 'מה גדול יותר: 5/6 או 2/6?', answer: '5/6', choices: ['5/6', '2/6', 'שווים'] },
          { skill: 'compare', level: 2, prompt: 'מה גדול יותר: 1/6 או 1/4?', answer: '1/4', choices: ['1/6', '1/4', 'שווים'] },
          { skill: 'addsub', level: 1, prompt: '2/6 + 3/6 = ?', answer: '5/6', choices: ['5/6', '5/12', '4/6', '1/6'] },
          { skill: 'addsub', level: 2, prompt: '5/6 − 1/6 = ?', answer: '4/6', choices: ['4/6', '4/12', '6/6', '1/6'] },
          { skill: 'whole', level: 3, prompt: 'כמה שלישים יש ב־3 שלמים?', answer: '9', choices: ['3', '6', '9', '12'] },
          { skill: 'addsub', level: 3, prompt: '1/3 + 1/6 = ?', answer: '3/6', choices: ['3/6', '2/9', '2/6', '1/9'] },
        ],
      },
    },
    'lcm-poly-5': {
      he: 'כפולות משותפות וגורמים · כיתה ה׳',
      grade: 'ה',
      forms: {
        pre: [
          { skill: 'lcm', level: 1, prompt: 'מהי הכפולה המשותפת המינימלית של 2 ו־3?', answer: '6', choices: ['3', '5', '6', '12'] },
          { skill: 'lcm', level: 2, prompt: 'מהי הכפולה המשותפת המינימלית של 3 ו־4?', answer: '12', choices: ['6', '7', '12', '24'] },
          { skill: 'factors', level: 1, prompt: 'כמה גורמים יש למספר 6 (כולל 1 ועצמו)?', answer: '4', choices: ['2', '3', '4', '6'] },
          { skill: 'factors', level: 2, prompt: 'איזה מהמספרים הבאים הוא גורם של 18?', answer: '6', choices: ['4', '5', '6', '8'] },
          { skill: 'primes', level: 1, prompt: 'איזה מהמספרים הבאים הוא מספר ראשוני?', answer: '7', choices: ['4', '6', '7', '9'] },
          { skill: 'primes', level: 2, prompt: 'האם המספר 9 הוא ראשוני או פריק?', answer: 'פריק', choices: ['ראשוני', 'פריק'] },
          { skill: 'mixed_fractions', level: 2, prompt: 'איך כותבים 7/4 כשבר מעורב?', answer: '1 ו־3/4', choices: ['1 ו־1/4', '1 ו־3/4', '2 ו־1/4', '3 ו־1/4'] },
          // A sum of mixed numbers is worded, not written as «1 ו־1/2 + 2 ו־1/4 = ?»:
          // the connector «ו־» breaks that into two numeric runs and the RTL page
          // then shows «1 ו־1/2 + 2» as one isolated expression (see #96).
          { skill: 'mixed_fractions', level: 3, prompt: 'כמה זה 1 ו־1/2 ועוד 2 ו־1/4?', answer: '3 ו־3/4', choices: ['3 ו־1/2', '3 ו־3/4', '4', '3 ו־2/6'] },
        ],
        post: [
          { skill: 'lcm', level: 1, prompt: 'מהי הכפולה המשותפת המינימלית של 2 ו־5?', answer: '10', choices: ['5', '7', '10', '20'] },
          { skill: 'lcm', level: 2, prompt: 'מהי הכפולה המשותפת המינימלית של 4 ו־6?', answer: '12', choices: ['8', '12', '18', '24'] },
          { skill: 'factors', level: 1, prompt: 'כמה גורמים יש למספר 8 (כולל 1 ועצמו)?', answer: '4', choices: ['2', '3', '4', '8'] },
          { skill: 'factors', level: 2, prompt: 'איזה מהמספרים הבאים הוא גורם של 24?', answer: '8', choices: ['5', '7', '8', '9'] },
          { skill: 'primes', level: 1, prompt: 'מבין המספרים הבאים, מי מהם הוא ראשוני?', answer: '11', choices: ['8', '9', '11', '12'] },
          { skill: 'primes', level: 2, prompt: 'האם המספר 15 הוא ראשוני או פריק?', answer: 'פריק', choices: ['ראשוני', 'פריק'] },
          { skill: 'mixed_fractions', level: 2, prompt: 'איך כותבים 9/4 כשבר מעורב?', answer: '2 ו־1/4', choices: ['1 ו־3/4', '2 ו־1/4', '2 ו־3/4', '3 ו־1/4'] },
          { skill: 'mixed_fractions', level: 3, prompt: 'כמה זה 2 ו־1/2 ועוד 1 ו־1/4?', answer: '3 ו־3/4', choices: ['3 ו־1/2', '3 ו־3/4', '4', '3 ו־2/6'] },
        ],
      },
    },
    'takeaway-place-2': {
      he: 'חיסור וערך מקום · כיתה ב׳',
      grade: 'ב',
      forms: {
        pre: [
          { skill: 'subtraction_check', level: 1, prompt: '9 − 4 = ?', answer: '5', choices: ['4', '5', '6', '7'] },
          { skill: 'subtraction_check', level: 2, prompt: '14 − 6 = ?', answer: '8', choices: ['6', '7', '8', '9'] },
          { skill: 'place_value_check', level: 1, prompt: 'כמה עשרות שלמות יש במספר 30?', answer: '3', choices: ['2', '3', '4', '10'] },
          { skill: 'place_value_check', level: 2, prompt: '47 = כמה עשרות ועוד כמה יחידות? בחרו את מספר העשרות.', answer: '4', choices: ['3', '4', '7', '47'] },
          { skill: 'subtraction_check', level: 3, prompt: '52 − 24 = ?', answer: '28', choices: ['26', '28', '32', '38'] },
          { skill: 'place_value_check', level: 3, prompt: 'איזה מספר גדול יותר: 63 או 36?', answer: '63', choices: ['36', '63', 'שווים'] },
        ],
        post: [
          { skill: 'subtraction_check', level: 1, prompt: '8 − 3 = ?', answer: '5', choices: ['3', '4', '5', '6'] },
          { skill: 'subtraction_check', level: 2, prompt: '15 − 7 = ?', answer: '8', choices: ['6', '7', '8', '9'] },
          { skill: 'place_value_check', level: 1, prompt: 'כמה עשרות שלמות יש במספר 50?', answer: '5', choices: ['3', '4', '5', '10'] },
          { skill: 'place_value_check', level: 2, prompt: '58 = כמה עשרות ועוד כמה יחידות? בחרו את מספר העשרות.', answer: '5', choices: ['4', '5', '8', '58'] },
          { skill: 'subtraction_check', level: 3, prompt: '63 − 35 = ?', answer: '28', choices: ['26', '28', '32', '38'] },
          { skill: 'place_value_check', level: 3, prompt: 'איזה מספר גדול יותר: 71 או 17?', answer: '71', choices: ['17', '71', 'שווים'] },
        ],
      },
    },
    'circle-ratio-6': {
      he: 'יחסים, אחוזים ומעגל · כיתה ו׳',
      grade: 'ו',
      forms: {
        pre: [
          { skill: 'ratios', level: 1, prompt: 'איזה יחס שקול ליחס 2:3?', answer: '4:6', choices: ['3:2', '4:6', '5:6', '6:8'] },
          { skill: 'ratios', level: 2, prompt: 'אם היחס בין אדום לכחול הוא 1:4 ויש 3 אדומים, כמה כחולים יש?', answer: '12', choices: ['7', '8', '12', '16'] },
          { skill: 'percents', level: 1, prompt: 'כמה הם 25% מ־80?', answer: '20', choices: ['15', '20', '25', '40'] },
          { skill: 'percents', level: 2, prompt: 'כמה הם 50% מ־120?', answer: '60', choices: ['50', '60', '70', '80'] },
          { skill: 'circle_angles', level: 1, prompt: 'כמה מעלות יש במעגל שלם?', answer: '360°', choices: ['90°', '180°', '270°', '360°'] },
          { skill: 'circle_angles', level: 2, prompt: 'אם מחלקים מעגל ל־12 גזרות שוות, מה הזווית של כל גזרה?', answer: '30°', choices: ['15°', '20°', '30°', '45°'] },
          { skill: 'mean_calc', level: 2, prompt: 'מה הממוצע של המספרים 10, 20 ו־30?', answer: '20', choices: ['15', '20', '25', '30'] },
          { skill: 'mean_calc', level: 3, prompt: 'מה הממוצע של 4 מדידות: 70, 80, 90 ו־100?', answer: '85', choices: ['80', '85', '90', '95'] },
        ],
        post: [
          { skill: 'ratios', level: 1, prompt: 'איזה יחס שקול ליחס 3:4?', answer: '6:8', choices: ['4:3', '5:8', '6:8', '7:9'] },
          { skill: 'ratios', level: 2, prompt: 'אם היחס בין צהוב לירוק הוא 1:5 ויש 3 צהובים, כמה ירוקים יש?', answer: '15', choices: ['8', '12', '15', '20'] },
          { skill: 'percents', level: 1, prompt: 'כמה הם 25% מ־60?', answer: '15', choices: ['10', '15', '20', '30'] },
          { skill: 'percents', level: 2, prompt: 'כמה הם 50% מ־140?', answer: '70', choices: ['60', '70', '80', '90'] },
          { skill: 'circle_angles', level: 1, prompt: 'כמה מעלות יש בחצי מעגל?', answer: '180°', choices: ['90°', '120°', '180°', '360°'] },
          { skill: 'circle_angles', level: 2, prompt: 'אם מחלקים מעגל ל־6 גזרות שוות, מה הזווית של כל גזרה?', answer: '60°', choices: ['30°', '45°', '60°', '90°'] },
          { skill: 'mean_calc', level: 2, prompt: 'מה הממוצע של המספרים 20, 30 ו־40?', answer: '30', choices: ['25', '30', '35', '40'] },
          { skill: 'mean_calc', level: 3, prompt: 'מה הממוצע של 4 מדידות: 60, 70, 80 ו־90?', answer: '75', choices: ['70', '75', '80', '85'] },
        ],
      },
    },
  };

  const FORMS = ['pre', 'post'];

  const DISCLAIMER = 'השוואה מקומית לפני/אחרי בכיתה אחת, בלי קבוצת השוואה. '
    + 'זה לא מחקר מבוקר, ולא מראה שהיחידה היא שגרמה לשינוי.';

  function listUnits() {
    return Object.keys(UNITS).map(function (id) {
      return { id: id, he: UNITS[id].he, grade: UNITS[id].grade, length: UNITS[id].forms.pre.length };
    });
  }

  function formItems(unitId, form) {
    const unit = Object.prototype.hasOwnProperty.call(UNITS, unitId) ? UNITS[unitId] : null;
    if (!unit || FORMS.indexOf(form) === -1) return [];
    return unit.forms[form].map(function (it, i) {
      return Object.assign({ id: unitId + ':' + form + ':' + (i + 1), pair: i + 1, form: form }, it, {
        choices: it.choices.slice(),
      });
    });
  }

  function kindFor(unitId, form) {
    return 'check-' + form + ':' + unitId;
  }

  function parseKind(kind) {
    const m = /^check-(pre|post):(.+)$/.exec(String(kind == null ? '' : kind));
    if (!m || !Object.prototype.hasOwnProperty.call(UNITS, m[2])) return null;
    return { form: m[1], unitId: m[2] };
  }

  function isCorrect(item, given) {
    if (!item) return false;
    return String(given == null ? '' : given).trim() === String(item.answer);
  }

  function shuffled(list, rng) {
    const roll = typeof rng === 'function' ? rng : Math.random;
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(roll() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  // The latest finished session of this kind. An abandoned check (no `ended`)
  // is not a score; unanswered slots of a finished one count as not correct.
  function latestCheck(student, unitId, form) {
    const kind = kindFor(unitId, form);
    const total = formItems(unitId, form).length;
    let best = null;
    ((student && Array.isArray(student.sessions)) ? student.sessions : []).forEach(function (s) {
      if (!s || s.kind !== kind || !s.ended) return;
      if (!best || Number(s.ended) >= Number(best.ended)) best = s;
    });
    if (!best || !total) return null;
    const items = Array.isArray(best.items) ? best.items : [];
    const correct = Math.min(total, items.filter(function (it) { return it && it.correct; }).length);
    return { correct: correct, total: total, at: best.ended };
  }

  function mean(list) {
    if (!list.length) return null;
    return list.reduce(function (a, b) { return a + b; }, 0) / list.length;
  }

  // students: the roster's students map (or an array of rows). Returns one row
  // per student who took either form, and class means over the n students
  // who took both. Nothing here is a claim; DISCLAIMER goes with every view.
  function checkReport(students, unitId) {
    const rows = (Array.isArray(students) ? students : Object.keys(students || {}).map(function (k) {
      return students[k];
    })).filter(function (s) { return s && typeof s === 'object'; }).map(function (s) {
      const pre = latestCheck(s, unitId, 'pre');
      const post = latestCheck(s, unitId, 'post');
      return {
        name: String(s.name || ''),
        pre: pre,
        post: post,
        change: pre && post ? post.correct - pre.correct : null,
      };
    }).filter(function (r) { return r.pre || r.post; }).sort(function (a, b) {
      return a.name.localeCompare(b.name, 'he');
    });
    const both = rows.filter(function (r) { return r.change != null; });
    return {
      unitId: unitId,
      total: formItems(unitId, 'pre').length,
      rows: rows,
      n: both.length,
      preOnly: rows.filter(function (r) { return r.pre && !r.post; }).length,
      postOnly: rows.filter(function (r) { return r.post && !r.pre; }).length,
      meanPre: mean(both.map(function (r) { return r.pre.correct; })),
      meanPost: mean(both.map(function (r) { return r.post.correct; })),
      disclaimer: DISCLAIMER,
    };
  }

  return {
    UNIT_CHECK_SKILL_HE: SKILL_HE,
    UNIT_CHECK_DISCLAIMER: DISCLAIMER,
    listUnits: listUnits,
    formItems: formItems,
    checkKind: kindFor,
    parseCheckKind: parseKind,
    isCheckCorrect: isCorrect,
    shuffledChoices: shuffled,
    latestCheck: latestCheck,
    checkReport: checkReport,
  };
});
