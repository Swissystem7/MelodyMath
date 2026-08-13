// MelodyMath — per-grade elementary banks, tagged to the official programme.
//
// An item without {grade, strand, standard} does not ship.
// Banks are split by grade. Multiplication 3/6/7/8/9 is tagged table=3..9
// so mastery.js can keep it closed until 2/4/5/10 are actually mastered.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const GRADES = ['א', 'ב', 'ג', 'ד'];

  const STRAND = {
    NUM: 'מספרים ופעולות',
    FRAC: 'שברים',
  };

  const ST = {
    COUNT_FWD: 'ספירה עד 100 קדימה ממספר כלשהו',
    COUNT_BACK: 'ספירה אחורה עד 100 ממספר כלשהו',
    SKIP2: 'ספירת המשך בדילוגים של 2; ספירה אחורה מ־50 בדילוגים של 2',
    SKIP5: 'ספירת המשך מכל מספר שהוא כפולה של 5 בדילוגים של 5',
    GROUP10: 'קיבוץ לעשרות; התאמת כמות למספר עד 100',
    NEXTPREV: 'סדר המספרים — הבא והקודם',
    COUNT_OBJ: 'מנייה — התאמת כמות למספר',
    DECOMP10: 'פירוקי 10',
    EQ_LEFT: 'סימן השוויון כשוויון בין שני ביטויים',
    MULTIADD: 'חיבור עם יותר משני מחוברים',
    TENS: 'חיבור וחיסור בעשרות שלמות עד 100',
    ADD10: 'חיבור בתחום העשר',
    ADD20: 'חיבור בתחום העשרים',
    SUB10: 'חיסור בתחום העשר',
    SUB20: 'חיסור בתחום העשרים',
    NLINE: 'ישר המספרים — מיקום מדויק ומקורב; תשתית לחיבור/חיסור',
    MUL_B: 'כפולות 2, 4, 5 ו־10 עד סוף כיתה ב׳',
    MUL_C: 'לוח כפל 10×10 אחרי שליטה ב־2/4/5/10',
    DIV_PART: 'חילוק לחלקים',
    DIV_QUOT: 'חילוק להכלה',
    FRAC_BAR: 'שבר כחלק משלם — 1/2, 1/4, 1/8 מול תיבה 4/4',
  };

  const SKILL_HE = {
    counting: 'מנייה',
    addition: 'חיבור',
    subtraction: 'חיסור',
    number_line: 'ישר מספרים',
    multiplication: 'כפל',
    division: 'חילוק',
    basic_fractions: 'שברים — תיבה 4/4',
  };

  const GRADE_SKILLS = {
    'א': ['counting', 'addition', 'subtraction', 'number_line'],
    'ב': ['addition', 'subtraction', 'multiplication', 'division'],
    'ג': ['multiplication', 'division'],
    'ד': ['basic_fractions'],
  };

  const RM_SKILLS = [
    ['counting', SKILL_HE.counting],
    ['addition', SKILL_HE.addition],
    ['subtraction', SKILL_HE.subtraction],
    ['number_line', SKILL_HE.number_line],
    ['multiplication', SKILL_HE.multiplication],
    ['division', SKILL_HE.division],
    ['basic_fractions', SKILL_HE.basic_fractions],
  ];
  const RM_ORDER = {};
  RM_SKILLS.forEach(function (s, i) { RM_ORDER[s[0]] = i; });

  const LEVEL_HE = { 1: 'בסיס', 2: 'ביניים', 3: 'אתגר' };

  function skillHe(k) {
    return SKILL_HE[k] || k;
  }

  function clampLevel(n) {
    const v = Math.round(Number(n));
    if (!Number.isFinite(v)) return 1;
    return Math.min(3, Math.max(1, v));
  }

  function hearOf(raw) {
    if (!Array.isArray(raw) || !raw.length) return null;
    const hear = [];
    for (let i = 0; i < raw.length; i++) {
      const n = Math.round(Number(raw[i]));
      if (!Number.isFinite(n) || n < 1 || n > 12) return null;
      hear.push(n);
    }
    return hear;
  }

  function isShippable(it) {
    if (!it || typeof it !== 'object') return false;
    if (!it.grade || GRADES.indexOf(it.grade) === -1) return false;
    if (!it.strand || !String(it.strand).trim()) return false;
    if (!it.standard || !String(it.standard).trim()) return false;
    if (it.prompt == null || String(it.prompt).trim() === '') return false;
    if (it.answer == null || String(it.answer).trim() === '') return false;
    if (!it.skill || !SKILL_HE[it.skill]) return false;
    return true;
  }

  function I(grade, skill, prompt, answer, hint, extra) {
    extra = extra || {};
    return {
      grade: grade,
      skill: skill,
      strand: extra.strand || STRAND.NUM,
      standard: extra.standard,
      prompt: prompt,
      answer: answer,
      hint: hint,
      hear: extra.hear || null,
      level: extra.level || 1,
      table: extra.table,
      meaning: extra.meaning,
      widget: extra.widget,
      line: extra.line,
      bar: extra.bar,
    };
  }

  function A(prompt, answer, hint, extra) {
    extra = extra || {};
    extra.strand = extra.strand || STRAND.NUM;
    extra.standard = extra.standard || ST.ADD10;
    return I('א', 'addition', prompt, answer, hint, extra);
  }
  function S(prompt, answer, hint, extra) {
    extra = extra || {};
    extra.strand = extra.strand || STRAND.NUM;
    extra.standard = extra.standard || ST.SUB10;
    return I('א', 'subtraction', prompt, answer, hint, extra);
  }

  const RAW = [];

  // ---------- כיתה א׳ · מנייה ----------
  RAW.push(
    I('א', 'counting', 'סְפרו את הפעימות: 🥁🥁🥁🥁🥁 — כמה יש?', 5, 'נגעו בכל תוף פעם אחת וספרו', { standard: ST.COUNT_OBJ, hear: [5], level: 1 }),
    I('א', 'counting', 'כמה תווים בשורה? ♪ ♪ ♪ ♪ ♪ ♪ ♪', 7, 'ספרו אחד-אחד', { standard: ST.COUNT_OBJ, hear: [7], level: 1 }),
    I('א', 'counting', '6, ואז המספר הבא?', 7, 'המספר שבא אחרי 6', { standard: ST.NEXTPREV, level: 1 }),
    I('א', 'counting', 'כמה מחיאות כפיים? 👏👏👏👏👏👏👏👏', 8, 'ספרו כל מחיאה', { standard: ST.COUNT_OBJ, hear: [8], level: 1 }),
    I('א', 'counting', 'כמה נקודות? • • • • • •', 6, 'ספרו כל נקודה', { standard: ST.COUNT_OBJ, hear: [6], level: 1 }),
    I('א', 'counting', '4, ואז המספר הבא?', 5, 'המספר שבא אחרי 4', { standard: ST.NEXTPREV, level: 1 }),
    I('א', 'counting', 'סִפרו: 🥁🥁🥁 — כמה יש?', 3, 'שלושה תופים', { standard: ST.COUNT_OBJ, hear: [3], level: 1 }),
    I('א', 'counting', 'כמה ידיים? ✋✋✋✋✋✋✋✋✋✋', 10, 'ספרו עד 10', { standard: ST.COUNT_OBJ, hear: [10], level: 1 }),
    I('א', 'counting', '2, ואז המספר הבא?', 3, 'אחרי 2 בא 3', { standard: ST.NEXTPREV, level: 1 }),
    I('א', 'counting', 'כמה תופים? 🥁🥁🥁🥁', 4, 'ארבעה תופים', { standard: ST.COUNT_OBJ, hear: [4], level: 1 }),
    I('א', 'counting', '9, ואז המספר הבא?', 10, 'אחרי 9 בא 10', { standard: ST.NEXTPREV, level: 1 }),
    I('א', 'counting', '19, ואז המספר הבא?', 20, 'אחרי 19 בא 20', { standard: ST.COUNT_FWD, level: 2 }),
    I('א', 'counting', '29, ואז המספר הבא?', 30, 'אחרי 29 בא 30', { standard: ST.COUNT_FWD, level: 2 }),
    I('א', 'counting', '49, ואז המספר הבא?', 50, 'אחרי 49 בא 50', { standard: ST.COUNT_FWD, level: 2 }),
    I('א', 'counting', '99, ואז המספר הבא?', 100, 'אחרי 99 בא 100', { standard: ST.COUNT_FWD, level: 2 }),
    I('א', 'counting', 'המספר שלפני 8?', 7, 'לפני 8 בא 7', { standard: ST.NEXTPREV, level: 2 }),
    I('א', 'counting', 'המספר שלפני 20?', 19, 'לפני 20 בא 19', { standard: ST.COUNT_BACK, level: 2 }),
    I('א', 'counting', 'המספר שלפני 50?', 49, 'לפני 50 בא 49', { standard: ST.COUNT_BACK, level: 2 }),
    I('א', 'counting', 'המספר שלפני 100?', 99, 'לפני 100 בא 99', { standard: ST.COUNT_BACK, level: 2 }),
    I('א', 'counting', 'ספירה אחורה: 10, 9, 8, ?', 7, 'יורדים ב־1', { standard: ST.COUNT_BACK, level: 2 }),
    I('א', 'counting', 'ספירה אחורה: 20, 19, 18, ?', 17, 'יורדים ב־1', { standard: ST.COUNT_BACK, level: 2 }),
    I('א', 'counting', 'ספירה אחורה: 73, 72, 71, ?', 70, 'יורדים ב־1 מ־73', { standard: ST.COUNT_BACK, level: 3 }),
    I('א', 'counting', 'ספירה דילוגית: 2, 4, 6, 8, ?', 10, 'מוסיפים 2 בכל פעם', { standard: ST.SKIP2, level: 3 }),
    I('א', 'counting', 'ספירה דילוגית מ־50: 50, 52, 54, ?', 56, 'מ־50 מדלגים 2 קדימה', { standard: ST.SKIP2, level: 3 }),
    I('א', 'counting', 'ספירה אחורה מ־50 בדילוגי 2: 50, 48, 46, ?', 44, 'מ־50 מדלגים 2 אחורה', { standard: ST.SKIP2, level: 3 }),
    I('א', 'counting', 'ספירה דילוגית: 5, 10, 15, ?', 20, 'מוסיפים 5 בכל פעם', { standard: ST.SKIP5, level: 3 }),
    I('א', 'counting', 'ספירה דילוגית: 20, 25, 30, ?', 35, 'מוסיפים 5', { standard: ST.SKIP5, level: 3 }),
    I('א', 'counting', 'ספירה דילוגית: 45, 50, 55, ?', 60, 'מוסיפים 5', { standard: ST.SKIP5, level: 3 }),
    I('א', 'counting', 'ספירה בעשרות: 10, 20, 30, ?', 40, 'מוסיפים 10', { standard: ST.GROUP10, level: 2 }),
    I('א', 'counting', '3 קבוצות של 10 — כמה זה?', 30, 'כל קבוצה היא עשר', { standard: ST.GROUP10, level: 2 }),
    I('א', 'counting', 'כמה קבוצות של 10 יש ב־40?', 4, '40 = 4 עשרות', { standard: ST.GROUP10, level: 2 }),
    I('א', 'counting', 'כמה קבוצות של 10 יש ב־70?', 7, '70 = 7 עשרות', { standard: ST.GROUP10, level: 2 }),
    I('א', 'counting', 'יש 27. כמה נשאר אחרי קיבוץ לעשרות?', 7, '2 עשרות, ו־7 יחידות', { standard: ST.GROUP10, level: 3 }),
    I('א', 'counting', '8 קבוצות של 10 ועוד 4 — כמה זה?', 84, '80 ועוד 4', { standard: ST.GROUP10, level: 3 }),
    I('א', 'counting', 'מ־36, כמה חסר לעשר הבאה?', 4, '36, 37, 38, 39, 40 — ארבעה', { standard: ST.GROUP10, level: 3 })
  );

  // ---------- כיתה א׳ · חיבור ----------
  RAW.push(
    A('3 פעימות תוף ועוד 2 — כמה ביחד?', 5, '3, 4, 5', { hear: [3, 2], level: 1, standard: ST.ADD10 }),
    A('4 תווים ועוד 3 תווים?', 7, 'חברו 4+3', { hear: [4, 3], level: 1, standard: ST.ADD10 }),
    A('5 + 4 = ?', 9, 'התחילו מ-5 והוסיפו 4', { level: 1, standard: ST.ADD10 }),
    A('2 + 3 = ?', 5, '2 ואז עוד 3', { level: 1, standard: ST.ADD10 }),
    A('7 פעימות ועוד 1?', 8, '7+1', { hear: [7, 1], level: 1, standard: ST.ADD10 }),
    A('1 + 8 = ?', 9, 'התחילו מ-1 והוסיפו 8', { level: 1, standard: ST.ADD10 }),
    A('4 + 4 = ?', 8, 'שתי קבוצות של 4', { level: 1, standard: ST.ADD10 }),
    A('9 + 1 = ?', 10, 'משלימים ל-10', { level: 1, standard: ST.DECOMP10 }),
    A('8 + 2 = ?', 10, 'משלימים ל-10', { level: 1, standard: ST.DECOMP10 }),
    A('7 + 3 = ?', 10, 'משלימים ל-10', { level: 1, standard: ST.DECOMP10 }),
    A('6 + 4 = ?', 10, 'פירוק של 10', { level: 1, standard: ST.DECOMP10 }),
    A('5 + 5 = ?', 10, 'פירוק של 10', { hear: [5, 5], level: 1, standard: ST.DECOMP10 }),
    A('1 + 9 = ?', 10, 'פירוק של 10', { level: 1, standard: ST.DECOMP10 }),
    A('3 + 7 = ?', 10, 'פירוק של 10', { level: 1, standard: ST.DECOMP10 }),
    A('4 + 6 = ?', 10, 'פירוק של 10', { level: 1, standard: ST.DECOMP10 }),
    A('6 + 5 = ?', 11, '6 ועוד 4 זה 10, ועוד 1', { level: 2, standard: ST.ADD20 }),
    A('8 + 4 = ?', 12, '8 ועוד 2 זה 10, ועוד 2', { level: 2, standard: ST.ADD20 }),
    A('9 + 6 = ?', 15, '9 ועוד 1 זה 10, ועוד 5', { level: 2, standard: ST.ADD20 }),
    A('7 + 8 = ?', 15, '7+7=14 ועוד 1', { level: 2, standard: ST.ADD20 }),
    A('11 + 5 = ?', 16, 'התחילו מ-11 והוסיפו 5', { level: 2, standard: ST.ADD20 }),
    A('12 + 8 = ?', 20, '12 ועוד 8 משלים ל-20', { level: 2, standard: ST.ADD20 }),
    A('15 + 5 = ?', 20, 'משלימים ל-20', { level: 2, standard: ST.ADD20 }),
    A('10 = 6 + ☐', 4, 'מה משלים את 6 ל-10', { level: 2, standard: ST.EQ_LEFT }),
    A('10 = ☐ + 3', 7, 'מה משלים את 3 ל-10', { level: 2, standard: ST.EQ_LEFT }),
    A('☐ = 4 + 6', 10, 'השוויון מימין ומשמאל אותו דבר', { level: 2, standard: ST.EQ_LEFT }),
    A('7 = 3 + ☐', 4, '3 ועוד כמה זה 7', { level: 2, standard: ST.EQ_LEFT }),
    A('8 = ☐ + 3', 5, 'כמה ועוד 3 זה 8', { level: 2, standard: ST.EQ_LEFT }),
    A('2 + 3 + 4 = ?', 9, 'חברו שניים, ואז את השלישי', { level: 2, standard: ST.MULTIADD }),
    A('1 + 4 + 5 = ?', 10, '1+4=5, ועוד 5 זה 10', { level: 2, standard: ST.MULTIADD }),
    A('3 + 3 + 2 = ?', 8, 'שלושה מחוברים', { level: 2, standard: ST.MULTIADD }),
    A('5 + 2 + 3 = ?', 10, '5+5', { level: 3, standard: ST.MULTIADD }),
    A('4 + 3 + 2 + 1 = ?', 10, 'ארבעה מחוברים שמשלימים ל-10', { level: 3, standard: ST.MULTIADD }),
    A('5 + 5 + 5 = ?', 15, 'שלוש פעמים 5', { level: 3, standard: ST.MULTIADD }),
    A('20 + 60 = ?', 80, '2 עשרות ועוד 6 עשרות', { level: 3, standard: ST.TENS }),
    A('30 + 40 = ?', 70, '3+4 עשרות', { level: 3, standard: ST.TENS }),
    A('50 + 20 = ?', 70, '5+2 עשרות', { level: 3, standard: ST.TENS }),
    A('10 + 80 = ?', 90, 'עשרה ועוד שמונים', { level: 3, standard: ST.TENS }),
    A('70 + 30 = ?', 100, '7+3 עשרות = 10 עשרות', { level: 3, standard: ST.TENS })
  );

  // ---------- כיתה א׳ · חיסור ----------
  RAW.push(
    S('היו 8 פעימות, 2 שתקו. כמה נשמעו?', 6, '8 פחות 2', { hear: [8], level: 1, standard: ST.SUB10 }),
    S('9 תווים, מחקנו 4. כמה נשארו?', 5, 'ספרו אחורה מ-9', { level: 1, standard: ST.SUB10 }),
    S('7 - 3 = ?', 4, 'מ-7 מורידים 3', { level: 1, standard: ST.SUB10 }),
    S('מ-10 מחיאות עצרנו אחרי 6?', 4, '10 פחות 6', { level: 1, standard: ST.SUB10 }),
    S('5 - 2 = ?', 3, 'מ-5 מורידים 2', { level: 1, standard: ST.SUB10 }),
    S('היו 6 פעימות, 1 שתקה. כמה נשמעו?', 5, '6 פחות 1', { hear: [6], level: 1, standard: ST.SUB10 }),
    S('10 - 3 = ?', 7, 'מ-10 מורידים 3', { level: 1, standard: ST.SUB10 }),
    S('8 תווים, מחקנו 8. כמה נשארו?', 0, '8 פחות 8', { level: 1, standard: ST.SUB10 }),
    S('10 - 1 = ?', 9, 'לפני 10', { level: 1, standard: ST.SUB10 }),
    S('9 - 5 = ?', 4, 'מ-9 מורידים 5', { level: 1, standard: ST.SUB10 }),
    S('10 - 7 = ?', 3, 'כמה חסר ל-7 כדי 10', { level: 1, standard: ST.DECOMP10 }),
    S('10 - 4 = ?', 6, 'פירוק של 10', { level: 1, standard: ST.DECOMP10 }),
    S('10 - 8 = ?', 2, 'פירוק של 10', { level: 1, standard: ST.DECOMP10 }),
    S('12 - 2 = ?', 10, 'שתי קפיצות אחורה', { level: 2, standard: ST.SUB20 }),
    S('15 - 5 = ?', 10, 'מ-15 מורידים 5', { level: 2, standard: ST.SUB20 }),
    S('14 - 4 = ?', 10, 'מ-14 מורידים 4', { level: 2, standard: ST.SUB20 }),
    S('11 - 6 = ?', 5, '11 פחות 6', { level: 2, standard: ST.SUB20 }),
    S('13 - 8 = ?', 5, '13 פחות 8', { level: 2, standard: ST.SUB20 }),
    S('20 - 6 = ?', 14, 'מ-20 מורידים 6', { level: 2, standard: ST.SUB20 }),
    S('4 = 6 − ☐', 2, '6 פחות כמה זה 4', { level: 2, standard: ST.EQ_LEFT }),
    S('5 = 9 − ☐', 4, '9 פחות כמה זה 5', { level: 2, standard: ST.EQ_LEFT }),
    S('10 = 12 − ☐', 2, '12 פחות כמה זה 10', { level: 2, standard: ST.EQ_LEFT }),
    S('☐ = 9 − 4', 5, 'השוויון משמאל', { level: 2, standard: ST.EQ_LEFT }),
    S('7 = ☐ − 3', 10, 'איזה מספר פחות 3 זה 7', { level: 3, standard: ST.EQ_LEFT }),
    S('18 - 9 = ?', 9, '18 פחות 9', { level: 3, standard: ST.SUB20 }),
    S('20 - 11 = ?', 9, '20 פחות 10 זה 10, פחות עוד 1', { level: 3, standard: ST.SUB20 }),
    S('17 - 8 = ?', 9, '17 פחות 7 זה 10, פחות עוד 1', { level: 3, standard: ST.SUB20 }),
    S('20 - 20 = ?', 0, 'הכול ירד', { level: 3, standard: ST.SUB20 }),
    S('80 − 20 = ?', 60, '8 עשרות פחות 2 עשרות', { level: 3, standard: ST.TENS }),
    S('90 − 30 = ?', 60, '9 פחות 3 עשרות', { level: 3, standard: ST.TENS }),
    S('70 − 40 = ?', 30, '7 פחות 4 עשרות', { level: 3, standard: ST.TENS }),
    S('100 − 50 = ?', 50, '10 עשרות פחות 5', { level: 3, standard: ST.TENS })
  );

  // ---------- כיתה א׳ · ישר מספרים ----------
  function NL(prompt, answer, hint, line, level) {
    return I('א', 'number_line', prompt, answer, hint, {
      standard: ST.NLINE,
      widget: 'numberLine',
      line: line,
      level: level || 1,
    });
  }
  RAW.push(
    NL('סמנו את 0 על הישר 0–10.', 0, '0 הוא ההתחלה', { min: 0, max: 10, mark: 0 }, 1),
    NL('סמנו את 5 על הישר 0–10.', 5, 'באמצע בין 0 ל-10', { min: 0, max: 10, mark: 5 }, 1),
    NL('סמנו את 10 על הישר 0–10.', 10, 'הסוף של הישר', { min: 0, max: 10, mark: 10 }, 1),
    NL('סמנו את 3 על הישר 0–10.', 3, 'אחרי 2, לפני 4', { min: 0, max: 10, mark: 3 }, 1),
    NL('סמנו את 8 על הישר 0–10.', 8, 'שתיים לפני 10', { min: 0, max: 10, mark: 8 }, 1),
    NL('עמדו על 3. קפצו 4 קדימה. איפה נעצרים?', 7, '3 ועוד 4', { min: 0, max: 20, start: 3 }, 1),
    NL('עמדו על 2. קפצו 5 קדימה. איפה נעצרים?', 7, '2 ועוד 5', { min: 0, max: 20, start: 2 }, 1),
    NL('סמנו את 15 על הישר 0–20.', 15, 'בין 10 ל-20', { min: 0, max: 20, mark: 15 }, 2),
    NL('סמנו את 20 על הישר 0–20.', 20, 'הסוף', { min: 0, max: 20, mark: 20 }, 2),
    NL('עמדו על 8. קפצו 3 אחורה. איפה נעצרים?', 5, '8 פחות 3', { min: 0, max: 20, start: 8 }, 2),
    NL('עמדו על 12. קפצו 5 קדימה. איפה נעצרים?', 17, '12 ועוד 5', { min: 0, max: 20, start: 12 }, 2),
    NL('עמדו על 0. קפצו 10 קדימה. איפה נעצרים?', 10, 'קפיצה של עשר', { min: 0, max: 20, start: 0 }, 2),
    NL('עמדו על 20. קפצו 10 אחורה. איפה נעצרים?', 10, '20 פחות 10', { min: 0, max: 20, start: 20 }, 2),
    NL('סמנו את 50 על הישר 0–100.', 50, 'באמצע בין 0 ל-100', { min: 0, max: 100, step: 5, mark: 50 }, 3),
    NL('סמנו את 100 על הישר 0–100.', 100, 'הסוף', { min: 0, max: 100, step: 5, mark: 100 }, 3),
    NL('עמדו על 40. קפצו 20 קדימה. איפה נעצרים?', 60, '40 ועוד 20', { min: 0, max: 100, step: 5, start: 40 }, 3),
    NL('עמדו על 70. קפצו 30 אחורה. איפה נעצרים?', 40, '70 פחות 30', { min: 0, max: 100, step: 5, start: 70 }, 3),
    NL('עמדו על 25. קפצו 25 קדימה. איפה נעצרים?', 50, 'חצי מ-100', { min: 0, max: 100, step: 5, start: 25 }, 3)
  );

  // ---------- כיתה ב׳ · חיבור / חיסור (עשרות, = משמאל — בלי אלגוריתם דו־ספרתי) ----------
  RAW.push(
    I('ב', 'addition', '40 + 40 = ?', 80, '4+4 עשרות', { standard: ST.TENS, level: 1 }),
    I('ב', 'addition', '60 + 20 = ?', 80, '6+2 עשרות', { standard: ST.TENS, level: 1 }),
    I('ב', 'addition', '50 + 50 = ?', 100, '5+5 עשרות', { standard: ST.TENS, level: 1 }),
    I('ב', 'addition', '10 + 90 = ?', 100, 'עשר ועוד תשעים', { standard: ST.TENS, level: 1 }),
    I('ב', 'addition', '☐ = 20 + 70', 90, 'השוויון משמאל', { standard: ST.EQ_LEFT, level: 2 }),
    I('ב', 'addition', '100 = 40 + ☐', 60, 'מה משלים ל-100 בעשרות', { standard: ST.EQ_LEFT, level: 2 }),
    I('ב', 'addition', '20 + 30 + 10 = ?', 60, 'שלושה מחוברים של עשרות', { standard: ST.MULTIADD, level: 2 }),
    I('ב', 'addition', '10 + 10 + 10 + 10 = ?', 40, 'ארבע עשרות', { standard: ST.MULTIADD, level: 2 }),
    I('ב', 'addition', '25 + 5 = ?', 30, 'משלימים לעשרה הבאה', { standard: ST.ADD20, level: 2 }),
    I('ב', 'addition', '18 + 2 = ?', 20, 'משלימים ל-20', { standard: ST.ADD20, level: 2 }),
    I('ב', 'addition', '6 + 7 + 7 = ?', 20, '6+14', { standard: ST.MULTIADD, level: 3 }),
    I('ב', 'addition', '80 + 20 = ?', 100, '8+2 עשרות', { standard: ST.TENS, level: 3 }),
    I('ב', 'subtraction', '80 − 40 = ?', 40, '8 פחות 4 עשרות', { standard: ST.TENS, level: 1 }),
    I('ב', 'subtraction', '60 − 20 = ?', 40, '6 פחות 2 עשרות', { standard: ST.TENS, level: 1 }),
    I('ב', 'subtraction', '100 − 10 = ?', 90, '10 עשרות פחות 1', { standard: ST.TENS, level: 1 }),
    I('ב', 'subtraction', '50 − 50 = ?', 0, 'הכול ירד', { standard: ST.TENS, level: 1 }),
    I('ב', 'subtraction', '4 = 10 − ☐', 6, '10 פחות כמה זה 4', { standard: ST.EQ_LEFT, level: 2 }),
    I('ב', 'subtraction', '40 = 90 − ☐', 50, '90 פחות כמה זה 40', { standard: ST.EQ_LEFT, level: 2 }),
    I('ב', 'subtraction', '☐ = 70 − 30', 40, 'השוויון משמאל', { standard: ST.EQ_LEFT, level: 2 }),
    I('ב', 'subtraction', '20 = 80 − ☐', 60, '80 פחות כמה זה 20', { standard: ST.EQ_LEFT, level: 2 }),
    I('ב', 'subtraction', '30 − 10 − 10 = ?', 10, 'שתי גריעות', { standard: ST.MULTIADD, level: 3 }),
    I('ב', 'subtraction', '100 − 60 = ?', 40, '10 פחות 6 עשרות', { standard: ST.TENS, level: 3 })
  );

  // ---------- כיתה ב׳ · כפל 2/4/5/10 ----------
  function M2(prompt, answer, hint, table, level) {
    return I('ב', 'multiplication', prompt, answer, hint, { standard: ST.MUL_B, table: table, level: level || 1 });
  }
  RAW.push(
    M2('2 תיבות, בכל אחת 4 פעימות. כמה בסך הכול?', 8, '2 פעמים 4', 2, 1),
    M2('4 × 2 = ?', 8, '4 קבוצות של 2', 2, 1),
    M2('2 × 6 = ?', 12, '2 קבוצות של 6', 2, 1),
    M2('5 × 2 = ?', 10, 'לוח ה-2', 2, 1),
    M2('10 × 2 = ?', 20, 'לוח ה-2', 2, 1),
    M2('6 × 2 = ?', 12, 'לוח ה-2', 2, 1),
    M2('8 × 2 = ?', 16, 'לוח ה-2', 2, 1),
    M2('9 × 2 = ?', 18, 'לוח ה-2', 2, 2),
    M2('7 × 2 = ?', 14, 'לוח ה-2', 2, 2),
    M2('0 × 2 = ?', 0, 'אפס קבוצות', 2, 1),
    M2('1 × 7 = ?', 7, 'קבוצה אחת של 7', 2, 1),
    M2('4 × 5 = ?', 20, '4 קבוצות של 5 — לוח ה-4 או ה-5', 4, 2),
    M2('4 × 4 = ?', 16, '4 קבוצות של 4', 4, 2),
    M2('4 × 10 = ?', 40, 'לוח ה-4', 4, 2),
    M2('3 × 4 = ?', 12, '3 קבוצות של 4 — לוח ה-4', 4, 2),
    M2('6 × 4 = ?', 24, 'לוח ה-4', 4, 2),
    M2('8 × 4 = ?', 32, 'לוח ה-4', 4, 3),
    M2('5 × 5 = ?', 25, 'לוח ה-5', 5, 1),
    M2('5 × 10 = ?', 50, 'לוח ה-5 ולוח ה-10', 5, 1),
    M2('5 × 4 = ?', 20, 'לוח ה-5', 5, 2),
    M2('5 × 6 = ?', 30, 'לוח ה-5', 5, 2),
    M2('5 × 8 = ?', 40, 'לוח ה-5', 5, 3),
    M2('5 × 7 = ?', 35, 'לוח ה-5', 5, 3),
    M2('10 × 3 = ?', 30, 'לוח ה-10', 10, 1),
    M2('10 × 7 = ?', 70, 'לוח ה-10', 10, 1),
    M2('10 × 10 = ?', 100, 'לוח ה-10', 10, 2),
    M2('10 × 4 = ?', 40, 'לוח ה-10', 10, 2),
    M2('10 × 9 = ?', 90, 'לוח ה-10', 10, 2),
    M2('0 × 8 = ?', 0, 'אפס קבוצות', 10, 1)
  );

  // ---------- כיתה ב׳ · חילוק (חלקים / הכלה) על 2/4/5/10 ----------
  function D2(prompt, answer, hint, table, meaning, level) {
    return I('ב', 'division', prompt, answer, hint, {
      standard: meaning === 'quotative' ? ST.DIV_QUOT : ST.DIV_PART,
      table: table,
      meaning: meaning,
      level: level || 1,
    });
  }
  RAW.push(
    D2('10 עוגיות ל־2 ילדים, בשווה. כמה לכל אחד?', 5, 'משתפים ל־2', 2, 'partitive', 1),
    D2('10 עוגיות, 2 בכל צלחת. כמה צלחות?', 5, 'כמה קבוצות של 2 ב־10', 2, 'quotative', 1),
    D2('8 תווים ל־2 ילדים. כמה לכל אחד?', 4, '8 חלקי 2', 2, 'partitive', 1),
    D2('8 תווים, 2 בכל תיבה. כמה תיבות?', 4, 'כמה פעמים 2 ב־8', 2, 'quotative', 1),
    D2('12 ÷ 2 = ?', 6, 'כמה פעמים 2 ב־12', 2, 'quotative', 1),
    D2('20 פעימות ל־4 ילדים. כמה לכל אחד?', 5, 'משתפים ל־4', 4, 'partitive', 2),
    D2('20 פעימות, 4 בכל קבוצה. כמה קבוצות?', 5, 'כמה פעמים 4 ב־20', 4, 'quotative', 2),
    D2('16 ÷ 4 = ?', 4, '4 קבוצות של 4', 4, 'quotative', 2),
    D2('12 עוגיות ל־4 ילדים. כמה לכל אחד?', 3, 'משתפים ל־4', 4, 'partitive', 2),
    D2('12 עוגיות, 4 בכל צלחת. כמה צלחות?', 3, 'כמה קבוצות של 4', 4, 'quotative', 2),
    D2('15 מחיאות ל־5 ילדים. כמה לכל אחד?', 3, 'משתפים ל־5', 5, 'partitive', 1),
    D2('15 מחיאות, 5 בכל שורה. כמה שורות?', 3, 'כמה פעמים 5 ב־15', 5, 'quotative', 1),
    D2('20 ÷ 5 = ?', 4, 'לוח ה-5', 5, 'quotative', 2),
    D2('50 ÷ 5 = ?', 10, 'כמה פעמים 5 ב־50', 5, 'quotative', 3),
    D2('40 תווים ל־10 ילדים. כמה לכל אחד?', 4, 'משתפים ל־10', 10, 'partitive', 2),
    D2('40 תווים, 10 בכל תיבה. כמה תיבות?', 4, 'כמה פעמים 10 ב־40', 10, 'quotative', 2),
    D2('70 ÷ 10 = ?', 7, 'לוח ה-10', 10, 'quotative', 2),
    D2('100 ÷ 10 = ?', 10, '10 עשרות', 10, 'quotative', 3),
    D2('0 ÷ 5 = ?', 0, 'אין מה לחלק', 5, 'partitive', 1),
    D2('8 ÷ 1 = ?', 8, 'קבוצה אחת מקבלת הכול', 2, 'partitive', 1)
  );

  // ---------- כיתה ג׳ · כפל 3/6/7/8/9 (חסום עד שליטת 2/4/5/10) ----------
  function M3(prompt, answer, hint, table, level) {
    return I('ג', 'multiplication', prompt, answer, hint, { standard: ST.MUL_C, table: table, level: level || 2 });
  }
  RAW.push(
    M3('3 × 3 = ?', 9, '3 קבוצות של 3', 3, 1),
    M3('3 × 1 = ?', 3, 'קבוצה אחת של 3', 3, 1),
    M3('3 × 2 = ?', 6, 'שתי קבוצות של 3 — אחרי שהליבה נפתחה', 3, 1),
    M3('5 שורות של 3 תווים?', 15, '5 פעמים 3', 3, 2),
    M3('3 × 6 = ?', 18, 'לוח ה-3', 3, 2),
    M3('7 × 3 = ?', 21, 'לוח ה-3', 3, 2),
    M3('3 × 8 = ?', 24, 'לוח ה-3', 3, 2),
    M3('3 × 9 = ?', 27, 'לוח ה-3', 3, 3),
    M3('6 × 3 = ?', 18, 'לוח ה-6', 6, 2),
    M3('6 × 6 = ?', 36, 'לוח ה-6', 6, 3),
    M3('6 × 7 = ?', 42, 'לוח ה-6', 6, 3),
    M3('6 × 9 = ?', 54, 'לוח ה-6', 6, 3),
    M3('8 × 6 = ?', 48, 'לוח ה-6', 6, 3),
    M3('7 × 7 = ?', 49, 'לוח ה-7', 7, 3),
    M3('7 × 8 = ?', 56, '7×8', 7, 3),
    M3('7 × 9 = ?', 63, 'לוח ה-7', 7, 3),
    M3('8 × 8 = ?', 64, 'לוח ה-8', 8, 3),
    M3('8 × 9 = ?', 72, 'לוח ה-8', 8, 3),
    M3('9 × 9 = ?', 81, 'לוח ה-9', 9, 3),
    M3('9 × 4 = ?', 36, 'לוח ה-9 — 9×4 נפתח רק אחרי הליבה', 9, 2),
    M3('9 × 6 = ?', 54, 'לוח ה-9', 9, 3)
  );

  function D3(prompt, answer, hint, table, meaning, level) {
    return I('ג', 'division', prompt, answer, hint, {
      standard: meaning === 'quotative' ? ST.DIV_QUOT : ST.DIV_PART,
      table: table,
      meaning: meaning,
      level: level || 2,
    });
  }
  RAW.push(
    D3('18 עוגיות ל־3 ילדים. כמה לכל אחד?', 6, 'משתפים ל־3', 3, 'partitive', 1),
    D3('18 עוגיות, 3 בכל צלחת. כמה צלחות?', 6, 'כמה פעמים 3 ב־18', 3, 'quotative', 1),
    D3('21 ÷ 7 = ?', 3, 'לוח ה-7', 7, 'quotative', 2),
    D3('24 ÷ 8 = ?', 3, 'לוח ה-8', 8, 'quotative', 2),
    D3('27 ÷ 9 = ?', 3, 'לוח ה-9', 9, 'quotative', 2),
    D3('36 ÷ 6 = ?', 6, 'לוח ה-6', 6, 'quotative', 2),
    D3('49 ÷ 7 = ?', 7, '7×7', 7, 'quotative', 3),
    D3('56 ÷ 7 = ?', 8, '7×8', 7, 'quotative', 3),
    D3('64 ÷ 8 = ?', 8, '8×8', 8, 'quotative', 3),
    D3('81 ÷ 9 = ?', 9, '9×9', 9, 'quotative', 3),
    D3('27 תווים ל־3 ילדים. כמה לכל אחד?', 9, 'משתפים ל־3', 3, 'partitive', 2),
    D3('32 פעימות, 8 בכל קבוצה. כמה קבוצות?', 4, 'חילוק להכלה', 8, 'quotative', 2)
  );

  // ---------- כיתה ד׳ · שברים מול תיבה 4/4 ----------
  function F(prompt, answer, hint, bar, level) {
    return I('ד', 'basic_fractions', prompt, answer, hint, {
      strand: STRAND.FRAC,
      standard: ST.FRAC_BAR,
      widget: 'bar44',
      bar: bar || null,
      level: level || 1,
    });
  }
  RAW.push(
    F('תיבה 4/4 מלאה לגמרי. איזה חלק מהתיבה זה? כתבו שבר (1).', '1', 'ארבעה רבעים = שלם', { filled: 8 }, 1),
    F('חצי תיבה 4/4 מלא. איזה שבר זה?', '1/2', '4 שמיניות מתוך 8 = חצי', { filled: 4 }, 1),
    F('רבע תיבה 4/4 מלא. איזה שבר זה?', '1/4', 'פעימה אחת מתוך ארבע', { filled: 2 }, 1),
    F('שמינית תיבה 4/4 מלאה. איזה שבר זה?', '1/8', 'תא אחד מתוך שמונה', { filled: 1 }, 1),
    F('בתיבה 4/4, כמה רבעים ממלאים את כל התיבה?', 4, 'כל פעימה היא רבע', { filled: 8 }, 1),
    F('בתיבה 4/4, כמה שמיניות ממלאות את כל התיבה?', 8, 'כל פעימה = 2 שמיניות', { filled: 8 }, 1),
    F('בתיבה 4/4, כמה חצאים ממלאים את כל התיבה?', 2, 'חצי + חצי = שלם', { filled: 8 }, 1),
    F('שני רבעים של תיבה 4/4 — איזה שבר זה?', '1/2', '1/4 + 1/4 = 1/2', { filled: 4 }, 2),
    F('ארבע שמיניות של תיבה 4/4 — איזה שבר זה?', '1/2', '4/8 = 1/2', { filled: 4 }, 2),
    F('שתי שמיניות של תיבה 4/4 — איזה שבר זה?', '1/4', '2/8 = 1/4', { filled: 2 }, 2),
    F('1/4 + 1/4 = ? (כתבו שבר)', '1/2', 'שני רבעים = חצי תיבה', { filled: 4 }, 2),
    F('1/8 + 1/8 = ? (כתבו שבר)', '1/4', 'שתי שמיניות = רבע', { filled: 2 }, 2),
    F('1/2 + 1/4 = ? כמה רבעים מלאים בתיבה?', 3, 'חצי = 2 רבעים, ועוד 1', { filled: 6 }, 3),
    F('שלושה רבעים של תיבה 4/4 — כמה שמיניות זה?', 6, 'כל רבע = 2 שמיניות', { filled: 6 }, 3),
    F('כמה שמיניות יש בחצי תיבה 4/4?', 4, 'חצי מ-8 שמיניות', { filled: 4 }, 2),
    F('כמה שמיניות יש ברבע תיבה 4/4?', 2, 'רבע מ-8 שמיניות', { filled: 2 }, 2),
    F('תיבה ריקה. איזה שבר מלא? (0)', 0, 'שום שמינית לא מלאה', { filled: 0 }, 1),
    F('1/2 + 1/2 = כמה תיבות 4/4 שלמות?', 1, 'שני חצאים = שלם אחד', { filled: 8 }, 2)
  );

  const SHIPPED = [];
  RAW.forEach(function (raw, i) {
    if (!isShippable(raw)) return;
    const it = {
      id: raw.grade + '-' + raw.skill + '-' + i,
      skill: raw.skill,
      he: skillHe(raw.skill),
      grade: raw.grade,
      strand: String(raw.strand).trim(),
      standard: String(raw.standard).trim(),
      prompt: raw.prompt,
      answer: raw.answer,
      hint: raw.hint || '',
      hear: hearOf(raw.hear),
      level: clampLevel(raw.level),
    };
    if (raw.table != null) it.table = raw.table;
    if (raw.meaning) it.meaning = raw.meaning;
    if (raw.widget) it.widget = raw.widget;
    if (raw.line) it.line = raw.line;
    if (raw.bar) it.bar = raw.bar;
    SHIPPED.push(it);
  });

  function allItems() {
    return SHIPPED.slice();
  }

  function itemsForGrade(grade) {
    return SHIPPED.filter(function (it) { return it.grade === grade; });
  }

  function rowsOf(skill, grade) {
    return SHIPPED.filter(function (it) {
      if (it.skill !== skill) return false;
      if (grade && it.grade !== grade) return false;
      return true;
    });
  }

  function itemsAtLevel(skill, level, grade) {
    const want = clampLevel(level);
    return rowsOf(skill, grade).filter(function (it) { return it.level === want; });
  }

  function skillsForGrade(grade) {
    return (GRADE_SKILLS[grade] || []).slice();
  }

  function diagnosticItems(grade) {
    const g = grade && GRADE_SKILLS[grade] ? grade : 'א';
    return skillsForGrade(g).flatMap(function (skill) {
      return rowsOf(skill, g).slice(0, 2);
    });
  }

  function classItems() {
    return SHIPPED.filter(function (it) {
      return it.grade === 'א' && ['counting', 'addition', 'subtraction', 'number_line'].indexOf(it.skill) !== -1;
    });
  }

  function practiceItems(skills, grade) {
    const want = Array.isArray(skills) && skills.length ? skills : null;
    return SHIPPED.filter(function (it) {
      if (grade && it.grade !== grade) return false;
      if (want && want.indexOf(it.skill) === -1) return false;
      return true;
    });
  }

  function coreFactItems() {
    return SHIPPED.filter(function (it) {
      return (it.skill === 'multiplication' || it.skill === 'division')
        && (it.table === 2 || it.table === 4 || it.table === 5 || it.table === 10);
    });
  }

  function skillGrade(k) {
    const grades = GRADES.filter(function (g) {
      return (GRADE_SKILLS[g] || []).indexOf(k) !== -1;
    });
    if (!grades.length) return '';
    if (grades.length === 1) return grades[0] + '׳';
    return grades[0] + '׳–' + grades[grades.length - 1] + '׳';
  }

  function levelHe(n) {
    return LEVEL_HE[n] || LEVEL_HE[1];
  }

  function coverage() {
    const out = {};
    RM_SKILLS.forEach(function (pair) {
      const skill = pair[0];
      const rows = rowsOf(skill);
      const byLevel = { 1: 0, 2: 0, 3: 0 };
      rows.forEach(function (it) { byLevel[it.level] += 1; });
      out[skill] = { total: rows.length, byLevel: byLevel, grade: skillGrade(skill) };
    });
    return out;
  }

  function coverageByGrade() {
    const out = {};
    GRADES.forEach(function (g) {
      out[g] = {};
      skillsForGrade(g).forEach(function (skill) {
        const rows = rowsOf(skill, g);
        const byLevel = { 1: 0, 2: 0, 3: 0 };
        rows.forEach(function (it) { byLevel[it.level] += 1; });
        out[g][skill] = { total: rows.length, byLevel: byLevel, he: skillHe(skill) };
      });
    });
    return out;
  }

  const SKILL_GRADE = {};
  RM_SKILLS.forEach(function (pair) {
    SKILL_GRADE[pair[0]] = skillGrade(pair[0]);
  });

  // Compact dump kept so older callers that read RM_BANK[skill] still see prompts.
  const RM_BANK = {};
  RM_SKILLS.forEach(function (pair) {
    RM_BANK[pair[0]] = rowsOf(pair[0]).map(function (it) {
      return [it.prompt, it.answer, it.hint, it.hear, it.level];
    });
  });

  return {
    GRADES: GRADES,
    GRADE_SKILLS: GRADE_SKILLS,
    STRAND: STRAND,
    ST: ST,
    SKILL_HE: SKILL_HE,
    RM_SKILLS: RM_SKILLS,
    RM_ORDER: RM_ORDER,
    RM_BANK: RM_BANK,
    SKILL_GRADE: SKILL_GRADE,
    LEVEL_HE: LEVEL_HE,
    skillHe: skillHe,
    skillGrade: skillGrade,
    levelHe: levelHe,
    clampLevel: clampLevel,
    hearOf: hearOf,
    isShippable: isShippable,
    allItems: allItems,
    itemsForGrade: itemsForGrade,
    rowsOf: rowsOf,
    itemsAtLevel: itemsAtLevel,
    skillsForGrade: skillsForGrade,
    diagnosticItems: diagnosticItems,
    classItems: classItems,
    practiceItems: practiceItems,
    coreFactItems: coreFactItems,
    coverage: coverage,
    coverageByGrade: coverageByGrade,
  };
});
