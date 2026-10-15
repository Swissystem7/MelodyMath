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
  const GRADES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];

  const STRAND = {
    NUM: 'מספרים ופעולות',
    FRAC: 'שברים',
    GEO: 'גאומטריה',
    MEASURE: 'מדידות',
    DATA: 'חקר נתונים',
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
    ADD2D: 'חיבור דו־ספרתי עד 100, עם וללא מעבר עשרות',
    SUB2D: 'חיסור דו־ספרתי עד 100, עם וללא מעבר עשרות',
    VERT_ADD: 'חיבור דו־ספרתי במאונך',
    VERT_SUB: 'חיסור דו־ספרתי במאונך',
    PLACE_VALUE: 'מבנה עשרוני עד 1,000 — מאות/עשרות/יחידות, זוגי/אי־זוגי, השוואה',
    WORD_COLLECT: 'שאלת מילים — איסוף (צירוף שתי קבוצות)',
    WORD_REMOVE: 'שאלת מילים — הפרדה (הסרה מקבוצה)',
    WORD_COMPARE: 'שאלת מילים — השוואה בין שתי כמויות',
    GEO_SORT: 'מיון מצולעים לפי מספר צלעות וקודקודים',
    RIGHT_ANGLE: 'זיהוי זווית ישרה',
    ANGLE_KINDS: 'זווית חדה, ישרה, קהה ושטוחה',
    TRI_SORT: 'מיון משולשים לפי זוויות ולפי צלעות',
    PARALLEL: 'ישרים מקבילים וישרים מאונכים',
    QUAD_SORT: 'מיון מרובעים — ריבוע, מלבן, מעוין, מקבילית, טרפז; אלכסונים',
    BOX: 'תיבה וקובייה — פאות, מקצועות וקודקודים',
    LENGTH: 'מדידת אורך ביחידות מתווכות ואז בס״מ',
    CLOCK: 'קריאת שעון אנלוגי בשעות שלמות',
    HALF_HOUR: 'חצאי שעות',
    PERIMETER: 'היקף מצולע — סכום אורכי הצלעות',
    MINUTES: 'שעות ודקות; משך זמן',
    AREA: 'שטח מלבן ביחידות ריבועיות',
    UNITS: 'המרת יחידות — אורך, משקל ונפח',
    CALENDAR: 'זמן — יממות, שבועות, חודשים ושנים',
    PICTOGRAM: 'קריאת פיקטוגרם',
    BARCHART: 'קריאת דיאגרמת עמודות',
    TABLE: 'קריאת טבלת נתונים',
    FRAC_EQUIV: 'שברים שקולים — הרחבה, צמצום והשוואה',
    FRAC_ADD: 'חיבור וחיסור שברים, גם במכנים שונים',
    FRAC_OF: 'שבר מכמות',
    DEC_PLACE: 'שברים עשרוניים — ערך המקום, השוואה ומעבר משבר פשוט',
    DEC_ADD: 'חיבור וחיסור שברים עשרוניים',
    FRAC_MUL: 'כפל שברים',
    FRAC_DIV: 'חילוק שברים',
    DEC_MUL: 'כפל וחילוק שברים עשרוניים',
    PERCENT: 'אחוזים — אחוז מכמות, שבר כאחוז, שינוי באחוזים',
    DIV_REM: 'חילוק עם שארית',
    MUL_COMPARE: 'השוואה כפלית — פי כמה',
    NUM_10K: 'מספרים עד 10,000 — מבנה עשרוני והשוואה',
  };

  const SKILL_HE = {
    counting: 'מנייה',
    addition: 'חיבור',
    subtraction: 'חיסור',
    number_line: 'ישר מספרים',
    multiplication: 'כפל',
    division: 'חילוק',
    basic_fractions: 'שברים — תיבה 4/4',
    word_problems: 'שאלות מילוליות',
    place_value: 'מבנה עשרוני',
    geometry: 'גאומטריה',
    measurement: 'מדידה',
    data: 'נתונים',
    fractions: 'שברים',
    decimals: 'שברים עשרוניים',
    percent: 'אחוזים',
  };

  const GRADE_SKILLS = {
    'א': ['counting', 'addition', 'subtraction', 'number_line', 'word_problems', 'measurement', 'geometry', 'data'],
    'ב': ['addition', 'subtraction', 'multiplication', 'division', 'place_value', 'word_problems', 'geometry', 'measurement', 'data'],
    'ג': ['multiplication', 'division', 'geometry', 'measurement'],
    'ד': ['basic_fractions', 'geometry', 'measurement'],
    'ה': ['fractions', 'decimals'],
    'ו': ['fractions', 'decimals', 'percent'],
  };

  const RM_SKILLS = [
    ['counting', SKILL_HE.counting],
    ['addition', SKILL_HE.addition],
    ['subtraction', SKILL_HE.subtraction],
    ['number_line', SKILL_HE.number_line],
    ['word_problems', SKILL_HE.word_problems],
    ['place_value', SKILL_HE.place_value],
    ['multiplication', SKILL_HE.multiplication],
    ['division', SKILL_HE.division],
    ['measurement', SKILL_HE.measurement],
    ['geometry', SKILL_HE.geometry],
    ['data', SKILL_HE.data],
    ['basic_fractions', SKILL_HE.basic_fractions],
    ['fractions', SKILL_HE.fractions],
    ['decimals', SKILL_HE.decimals],
    ['percent', SKILL_HE.percent],
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
      wordType: extra.wordType,
      ruler: extra.ruler,
      clock: extra.clock,
      chart: extra.chart,
      vert: extra.vert,
      music: extra.music,
      grid: extra.grid,
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

  // ---------- כיתה א׳ · שאלות מילוליות (איסוף / הפרדה / השוואה) ----------
  function WP(grade, wordType, prompt, answer, hint, level) {
    const standard = wordType === 'remove' ? ST.WORD_REMOVE
      : wordType === 'compare' ? ST.WORD_COMPARE
      : ST.WORD_COLLECT;
    return I(grade, 'word_problems', prompt, answer, hint, { standard: standard, wordType: wordType, level: level || 1 });
  }
  RAW.push(
    WP('א', 'collect', 'לדנה 3 מדבקות. אמא נתנה לה עוד 2. כמה מדבקות יש לדנה?', 5, 'מצרפים את שתי הקבוצות', 1),
    WP('א', 'collect', 'בכיתה 4 ילדים משחקים בחוץ, ועוד 3 הצטרפו. כמה ילדים משחקים עכשיו?', 7, 'הצטרפות = חיבור', 1),
    WP('א', 'remove', 'ליואב היו 8 עוגיות. הוא אכל 3. כמה עוגיות נשארו?', 5, 'מסירים מהקבוצה', 1),
    WP('א', 'remove', 'על העץ ישבו 9 ציפורים. 4 עפו. כמה נשארו?', 5, 'הפרדה = חיסור', 1),
    WP('א', 'compare', 'לנועה 6 בלונים ולתום 4 בלונים. בכמה יותר בלונים לנועה?', 2, 'משווים בין שתי כמויות', 2),
    WP('א', 'compare', 'בכיתה א׳1 יש 20 תלמידים ובכיתה א׳2 יש 17. בכמה יותר תלמידים בא׳1?', 3, 'ההפרש בין שתי הכמויות', 2),
    WP('א', 'collect', 'בקופסה 5 עפרונות כחולים ו־6 אדומים. כמה עפרונות בסך הכול?', 11, 'שתי קבוצות מצטרפות לאחת', 2),
    WP('א', 'remove', 'היו 15 ילדים בגן שעשועים. 6 הלכו הביתה. כמה נשארו?', 9, 'הסרה מהכמות המקורית', 2),
    WP('א', 'compare', 'לגדי 12 קלפים ולרון 8 קלפים. כמה קלפים צריך רון כדי שיהיו לו כמו לגדי?', 4, 'ההפרש הוא התוספת הדרושה', 3),
    WP('א', 'collect', 'קבוצה אחת אספה 14 בקבוקים וקבוצה שנייה אספה 9. כמה בקבוקים בסך הכול?', 23, 'איסוף של שתי קבוצות גדולות', 3),
    WP('א', 'remove', 'היו 30 עפרונות בקלמר הכיתה. חילקו 12 לתלמידים. כמה נשארו בקלמר?', 18, 'הפרדה עם מספרים גדולים יותר', 3),
    WP('א', 'compare', 'באוטובוס אחד 25 נוסעים ובאוטובוס שני 19. בכמה יותר נוסעים באוטובוס הראשון?', 6, 'השוואה בין מספרים דו־ספרתיים', 3)
  );

  // ---------- כיתה ב׳ · שאלות מילוליות (מספרים גדולים יותר) ----------
  RAW.push(
    WP('ב', 'collect', 'בספרייה הושאלו 45 ספרים בבוקר ועוד 30 אחר הצהריים. כמה ספרים הושאלו בסך הכול?', 75, 'מצרפים את שני החלקים', 1),
    WP('ב', 'collect', 'במלאי החנות 60 עטים כחולים ו־25 שחורים. כמה עטים יש בסך הכול?', 85, 'איסוף של שתי קבוצות', 1),
    WP('ב', 'remove', 'בקופה הייתה יתרה של 90 שקלים. קנו ציוד ב־35 שקלים. כמה נשאר?', 55, 'מסירים את הסכום שהוצא', 1),
    WP('ב', 'remove', 'היו 120 כרטיסים למופע. נמכרו 45. כמה כרטיסים נשארו?', 75, 'הפרדה ממאגר גדול יותר', 1),
    WP('ב', 'compare', 'בכפר א׳ 240 תושבים ובכפר ב׳ 180. בכמה יותר תושבים יש בכפר א׳?', 60, 'ההפרש בין שתי הכמויות', 2),
    WP('ב', 'compare', 'מחיר תיק 85 שקלים ומחיר ילקוט 63 שקלים. בכמה התיק יקר יותר?', 22, 'חיסור כדי למצוא את ההפרש', 2),
    WP('ב', 'collect', 'בטיול השתתפו 130 תלמידי כיתה ד׳ ו־95 תלמידי כיתה ה׳. כמה תלמידים השתתפו בסך הכול?', 225, 'חיבור דו־ספרתי עם מעבר מאה', 2),
    WP('ב', 'remove', 'היו 300 כיסאות באולם. הוציאו 145 לצורך אירוע אחר. כמה כיסאות נשארו?', 155, 'הפרדה עם מעבר מאות', 2),
    WP('ב', 'compare', 'קבוצה א׳ אספה 310 נקודות וקבוצה ב׳ אספה 275. בכמה יותר נקודות אספה קבוצה א׳?', 35, 'השוואה בין תוצאות משחק', 3),
    WP('ב', 'collect', 'בהצגה הראשונה נכחו 180 צופים, ובשנייה 215. כמה צופים נכחו בסך הכול בשתי ההצגות?', 395, 'חיבור של שני מספרים תלת־ספרתיים', 3),
    WP('ב', 'remove', 'היו 500 כרטיסי הגרלה. חולקו 260 כרטיסים. כמה כרטיסים נשארו?', 240, 'הפרדה ממספר תלת־ספרתי', 3),
    WP('ב', 'compare', 'בית ספר א׳ מונה 410 תלמידים ובית ספר ב׳ מונה 365. בכמה יותר תלמידים יש בבית ספר א׳?', 45, 'השוואה בין שני מספרים תלת־ספרתיים', 3)
  );

  // ---------- כיתה ב׳ · חיבור/חיסור דו־ספרתי מלא, כולל מאונך ----------
  function VA(prompt, answer, hint, a, b, level) {
    return I('ב', 'addition', prompt, answer, hint, { standard: ST.ADD2D, level: level || 1 });
  }
  function VS(prompt, answer, hint, a, b, level) {
    return I('ב', 'subtraction', prompt, answer, hint, { standard: ST.SUB2D, level: level || 1 });
  }
  function VAV(prompt, answer, hint, a, b, level) {
    return I('ב', 'addition', prompt, answer, hint, {
      standard: ST.VERT_ADD, widget: 'vertical', vert: { a: a, b: b, op: '+' }, level: level || 1,
    });
  }
  function VSV(prompt, answer, hint, a, b, level) {
    return I('ב', 'subtraction', prompt, answer, hint, {
      standard: ST.VERT_SUB, widget: 'vertical', vert: { a: a, b: b, op: '-' }, level: level || 1,
    });
  }
  RAW.push(
    VA('34 + 25 = ?', 59, 'חיבור דו־ספרתי ללא מעבר עשרות', 34, 25, 1),
    VA('42 + 17 = ?', 59, 'חיבור דו־ספרתי עם מעבר עשרות', 42, 17, 2),
    VA('28 + 46 = ?', 74, 'חיבור דו־ספרתי עם מעבר עשרות', 28, 46, 2),
    VA('55 + 38 = ?', 93, 'חיבור דו־ספרתי עם מעבר עשרות', 55, 38, 3),
    VS('58 − 23 = ?', 35, 'חיסור דו־ספרתי ללא הלוואה', 58, 23, 1),
    VS('62 − 27 = ?', 35, 'חיסור דו־ספרתי עם הלוואה', 62, 27, 2),
    VS('81 − 39 = ?', 42, 'חיסור דו־ספרתי עם הלוואה', 81, 39, 2),
    VS('93 − 48 = ?', 45, 'חיסור דו־ספרתי עם הלוואה', 93, 48, 3),
    VAV('חשבו במאונך: 47 + 25', 72, 'מחברים יחידות, ואז עשרות', 47, 25, 1),
    VAV('חשבו במאונך: 36 + 18', 54, 'מעבר עשרות ביחידות', 36, 18, 2),
    VAV('חשבו במאונך: 64 + 29', 93, 'מעבר עשרות ביחידות', 64, 29, 2),
    VAV('חשבו במאונך: 58 + 37', 95, 'מעבר עשרות ביחידות', 58, 37, 3),
    VSV('חשבו במאונך: 68 − 25', 43, 'מחסרים יחידות, ואז עשרות', 68, 25, 1),
    VSV('חשבו במאונך: 52 − 27', 25, 'הלוואה מהעשרות', 52, 27, 2),
    VSV('חשבו במאונך: 74 − 38', 36, 'הלוואה מהעשרות', 74, 38, 2),
    VSV('חשבו במאונך: 91 − 56', 35, 'הלוואה מהעשרות', 91, 56, 3)
  );

  // ---------- כיתה ב׳ · מבנה עשרוני עד 1,000 ----------
  function PV(prompt, answer, hint, level) {
    return I('ב', 'place_value', prompt, answer, hint, { standard: ST.PLACE_VALUE, level: level || 1 });
  }
  RAW.push(
    PV('כמה מאות יש במספר 400?', 4, 'כל מאה היא 100 יחידות', 1),
    PV('כמה עשרות יש במספר 70?', 7, 'כל עשרה היא 10 יחידות', 1),
    PV('במספר 356, מהי ספרת המאות?', 3, 'הספרה הראשונה מימין לשמאל הן המאות', 1),
    PV('במספר 356, מהי ספרת העשרות?', 5, 'הספרה האמצעית', 1),
    PV('במספר 356, מהי ספרת היחידות?', 6, 'הספרה הימנית ביותר', 1),
    PV('200 + 30 + 4 = ?', 234, 'מרכיבים מספר ממאות עשרות ויחידות', 2),
    PV('500 + 6 = ?', 506, 'אין עשרות — הספרה באמצע היא 0', 2),
    PV('האם 47 הוא מספר זוגי או אי־זוגי? (כתבו זוגי או אי־זוגי)', 'אי-זוגי', '7 ביחידות — אי-זוגי', 2),
    PV('האם 82 הוא מספר זוגי או אי־זוגי? (כתבו זוגי או אי־זוגי)', 'זוגי', '2 ביחידות — זוגי', 2),
    PV('איזה מספר גדול יותר: 342 או 423?', 423, 'משווים קודם את ספרת המאות', 3),
    PV('איזה מספר קטן יותר: 605 או 560?', 560, 'משווים ספרת העשרות כששתי המאות שוות', 3),
    PV('כתבו את המספר שיש בו 3 מאות, 0 עשרות ו־8 יחידות.', 308, 'מאות עשרות יחידות בסדר הזה', 3)
  );

  // ---------- כיתה א׳ · גאומטריה — מיון מצולעים וזווית ישרה ----------
  function GEOA(grade, prompt, answer, hint, level, standard) {
    return I(grade, 'geometry', prompt, answer, hint, { strand: STRAND.GEO, standard: standard || ST.GEO_SORT, level: level || 1 });
  }
  RAW.push(
    GEOA('א', 'למשולש יש כמה צלעות?', 3, 'שלוש צלעות ושלושה קודקודים', 1),
    GEOA('א', 'לריבוע יש כמה צלעות?', 4, 'ארבע צלעות שוות', 1),
    GEOA('א', 'למלבן יש כמה קודקודים?', 4, 'ארבע פינות', 1),
    GEOA('א', 'איזו צורה יש לה הכי מעט צלעות: משולש, ריבוע או מחומש?', 'משולש', 'שלוש צלעות — הכי מעט', 2),
    GEOA('א', 'למחומש יש כמה צלעות?', 5, 'חמש צלעות', 2),
    GEOA('א', 'למשושה יש כמה קודקודים?', 6, 'שישה קודקודים', 2),
    GEOA('א', 'איזו משתי הצורות היא בעלת יותר צלעות: מלבן או מחומש?', 'מחומש', 'חמש צלעות לעומת ארבע', 3),
    GEOA('א', 'צורה עם 6 צלעות שוות — איך קוראים לה?', 'משושה', 'שש צלעות', 3),
    GEOA('א', 'פינת דף מרובע — האם הזווית שם ישרה? (כן/לא)', 'כן', 'פינת ריבוע היא תמיד זווית ישרה', 1, ST.RIGHT_ANGLE),
    GEOA('א', 'זווית ישרה שווה לכמה מעלות?', 90, 'תשעים מעלות בדיוק', 2, ST.RIGHT_ANGLE),
    GEOA('א', 'האם זווית של 90 מעלות היא זווית ישרה? (כן/לא)', 'כן', '90 מעלות בדיוק היא זווית ישרה', 2, ST.RIGHT_ANGLE),
    GEOA('א', 'האם זווית של 45 מעלות היא זווית ישרה? (כן/לא)', 'לא', 'רק 90 מעלות היא זווית ישרה', 3, ST.RIGHT_ANGLE)
  );

  // ---------- כיתה ב׳ · גאומטריה — מיון מצולעים וזווית ישרה ----------
  RAW.push(
    GEOA('ב', 'לריבוע ולמלבן — לשניהם יש כמה צלעות?', 4, 'שני המרובעים בעלי ארבע צלעות', 1),
    GEOA('ב', 'למשולש יש כמה קודקודים?', 3, 'שלושה קודקודים', 1),
    GEOA('ב', 'איזו צורה יש לה הכי הרבה צלעות מבין משולש, ריבוע ומשושה?', 'משושה', 'שש צלעות — הכי הרבה', 2),
    GEOA('ב', 'למחומש יש כמה קודקודים?', 5, 'חמישה קודקודים', 2),
    GEOA('ב', 'צורה עם 3 צלעות ו-3 קודקודים — איך קוראים לה?', 'משולש', 'שלוש צלעות', 1),
    GEOA('ב', 'צורה עם 5 צלעות — איך קוראים לה?', 'מחומש', 'חמש צלעות', 2),
    GEOA('ב', 'זווית ישרה שווה לכמה מעלות?', 90, 'תשעים מעלות בדיוק', 1, ST.RIGHT_ANGLE),
    GEOA('ב', 'פינת שולחן מלבני — האם הזווית שם ישרה? (כן/לא)', 'כן', 'פינת מלבן היא זווית ישרה', 2, ST.RIGHT_ANGLE),
    GEOA('ב', 'האם זווית של 120 מעלות היא זווית ישרה? (כן/לא)', 'לא', 'גדולה מ-90 — אינה ישרה', 2, ST.RIGHT_ANGLE),
    GEOA('ב', 'האם זווית של 90 מעלות היא זווית ישרה? (כן/לא)', 'כן', 'בדיוק 90 מעלות', 3, ST.RIGHT_ANGLE),
    GEOA('ב', 'איזו משתי הצורות בעלת פחות קודקודים: מחומש או משושה?', 'מחומש', 'חמישה קודקודים לעומת שישה', 3),
    GEOA('ב', 'משולש, ריבוע ומחומש — מיינו לפי מספר הצלעות מהקטן לגדול. מה השני ברשימה?', 'ריבוע', 'משולש (3), ריבוע (4), מחומש (5)', 3)
  );

  // ---------- כיתה א׳ · מדידה — אורך ביחידות מתווכות ואז ס״מ; שעון בשעות שלמות ----------
  function LEN(grade, prompt, answer, hint, ruler, level) {
    return I(grade, 'measurement', prompt, answer, hint, {
      strand: STRAND.MEASURE, standard: ST.LENGTH, widget: 'ruler', ruler: ruler, level: level || 1,
    });
  }
  function CLK(grade, prompt, answer, hint, clock, level) {
    return I(grade, 'measurement', prompt, answer, hint, {
      strand: STRAND.MEASURE, standard: ST.CLOCK, widget: 'clock', clock: clock, level: level || 1,
    });
  }
  RAW.push(
    LEN('א', 'כמה קוביות אורך יש בעיפרון שבתמונה?', 4, 'ספרו את היחידות המתווכות', { unit: 'unit', length: 4 }, 1),
    LEN('א', 'כמה קוביות אורך יש בספר שבתמונה?', 7, 'ספרו את היחידות המתווכות', { unit: 'unit', length: 7 }, 1),
    LEN('א', 'כמה קוביות אורך יש בשולחן שבתמונה?', 10, 'ספרו את היחידות המתווכות', { unit: 'unit', length: 10 }, 2),
    LEN('א', 'מדדו את המחק בסרגל — כמה ס״מ?', 3, 'קראו את הסימון על הסרגל', { unit: 'cm', length: 3 }, 2),
    LEN('א', 'מדדו את הקלמר בסרגל — כמה ס״מ?', 6, 'קראו את הסימון על הסרגל', { unit: 'cm', length: 6 }, 2),
    LEN('א', 'מדדו את המחברת בסרגל — כמה ס״מ?', 9, 'קראו את הסימון על הסרגל', { unit: 'cm', length: 9 }, 3),
    CLK('א', 'השעון מראה 3:00. מה השעה?', 3, 'מחוג השעות על 3, מחוג הדקות על 12', { hour: 3 }, 1),
    CLK('א', 'השעון מראה 7:00. מה השעה?', 7, 'מחוג השעות על 7, מחוג הדקות על 12', { hour: 7 }, 1),
    CLK('א', 'השעון מראה 10:00. מה השעה?', 10, 'מחוג השעות על 10, מחוג הדקות על 12', { hour: 10 }, 2),
    CLK('א', 'השעון מראה 12:00. מה השעה?', 12, 'שני המחוגים על 12', { hour: 12 }, 2),
    CLK('א', 'השעון מראה 5:00. מה השעה?', 5, 'מחוג השעות על 5', { hour: 5 }, 3),
    CLK('א', 'השעון מראה 1:00. מה השעה?', 1, 'מחוג השעות על 1', { hour: 1 }, 3)
  );

  // ---------- כיתה ב׳ · מדידה — אורך בס״מ; שעון בשעות שלמות ----------
  RAW.push(
    LEN('ב', 'מדדו את המברשת בסרגל — כמה ס״מ?', 15, 'קראו את הסימון על הסרגל', { unit: 'cm', length: 15 }, 1),
    LEN('ב', 'מדדו את הסרגל הקטן — כמה ס״מ?', 12, 'קראו את הסימון על הסרגל', { unit: 'cm', length: 12 }, 1),
    LEN('ב', 'מדדו את הקופסה — כמה ס״מ?', 18, 'קראו את הסימון על הסרגל', { unit: 'cm', length: 18 }, 2),
    LEN('ב', 'מדדו את המקלון — כמה ס״מ?', 20, 'קראו את הסימון על הסרגל', { unit: 'cm', length: 20 }, 2),
    LEN('ב', 'מדדו את הצעצוע — כמה ס״מ?', 8, 'קראו את הסימון על הסרגל', { unit: 'cm', length: 8 }, 3),
    LEN('ב', 'מדדו את המפתח — כמה ס״מ?', 5, 'קראו את הסימון על הסרגל', { unit: 'cm', length: 5 }, 3),
    CLK('ב', 'השעון מראה 6:00. מה השעה?', 6, 'מחוג השעות על 6', { hour: 6 }, 1),
    CLK('ב', 'השעון מראה 9:00. מה השעה?', 9, 'מחוג השעות על 9', { hour: 9 }, 1),
    CLK('ב', 'השעון מראה 11:00. מה השעה?', 11, 'מחוג השעות על 11', { hour: 11 }, 2),
    CLK('ב', 'השעון מראה 2:00. מה השעה?', 2, 'מחוג השעות על 2', { hour: 2 }, 2),
    CLK('ב', 'השעון מראה 4:00. מה השעה?', 4, 'מחוג השעות על 4', { hour: 4 }, 3),
    CLK('ב', 'השעון מראה 8:00. מה השעה?', 8, 'מחוג השעות על 8', { hour: 8 }, 3)
  );

  // ---------- כיתה א׳ · נתונים — פיקטוגרם ודיאגרמת עמודות ----------
  function PICT(grade, prompt, answer, hint, chart, level) {
    return I(grade, 'data', prompt, answer, hint, {
      strand: STRAND.DATA, standard: ST.PICTOGRAM, widget: 'pictogram', chart: chart, level: level || 1,
    });
  }
  function BARC(grade, prompt, answer, hint, chart, level) {
    return I(grade, 'data', prompt, answer, hint, {
      strand: STRAND.DATA, standard: ST.BARCHART, widget: 'barchart', chart: chart, level: level || 1,
    });
  }
  RAW.push(
    PICT('א', 'כל 🍎 מייצג פרי אחד. כמה תפוחים אכלה הכיתה?', 4, 'ספרו את הסמלים בשורת התפוחים', { icon: '🍎', key: 1, rows: [{ label: 'תפוחים', count: 4 }, { label: 'בננות', count: 2 }] }, 1),
    PICT('א', 'כל 🍎 מייצג פרי אחד. כמה בננות אכלה הכיתה?', 2, 'ספרו את הסמלים בשורת הבננות', { icon: '🍎', key: 1, rows: [{ label: 'תפוחים', count: 4 }, { label: 'בננות', count: 2 }] }, 1),
    PICT('א', 'כל ⭐ מייצג ילד אחד. כמה ילדים בחרו כדורגל?', 6, 'ספרו את הכוכבים בשורת הכדורגל', { icon: '⭐', key: 1, rows: [{ label: 'כדורגל', count: 6 }, { label: 'ריקוד', count: 3 }] }, 2),
    PICT('א', 'כל ⭐ מייצג ילד אחד. כמה ילדים יותר בחרו כדורגל מריקוד?', 3, 'הפרש בין שתי השורות', { icon: '⭐', key: 1, rows: [{ label: 'כדורגל', count: 6 }, { label: 'ריקוד', count: 3 }] }, 3),
    BARC('א', 'כמה ילדים בחרו בצבע כחול?', 5, 'קראו את גובה העמודה הכחולה', { bars: [{ label: 'כחול', value: 5 }, { label: 'אדום', value: 3 }, { label: 'ירוק', value: 2 }] }, 1),
    BARC('א', 'איזה צבע נבחר הכי הרבה — כתבו את המספר שלו', 5, 'העמודה הגבוהה ביותר', { bars: [{ label: 'כחול', value: 5 }, { label: 'אדום', value: 3 }, { label: 'ירוק', value: 2 }] }, 2),
    BARC('א', 'כמה ילדים יותר בחרו כחול מירוק?', 3, 'הפרש בין שתי העמודות', { bars: [{ label: 'כחול', value: 5 }, { label: 'אדום', value: 3 }, { label: 'ירוק', value: 2 }] }, 3),
    BARC('א', 'כמה ילדים בסך הכול השתתפו בסקר הצבעים?', 10, 'מחברים את כל העמודות', { bars: [{ label: 'כחול', value: 5 }, { label: 'אדום', value: 3 }, { label: 'ירוק', value: 2 }] }, 3),
    PICT('א', 'כל 🐶 מייצג חיית מחמד אחת. כמה כלבים יש בכיתה?', 5, 'ספרו את הסמלים', { icon: '🐶', key: 1, rows: [{ label: 'כלבים', count: 5 }, { label: 'חתולים', count: 4 }] }, 1),
    PICT('א', 'כל 🐶 מייצג חיית מחמד אחת. כמה חתולים יש בכיתה?', 4, 'ספרו את הסמלים', { icon: '🐶', key: 1, rows: [{ label: 'כלבים', count: 5 }, { label: 'חתולים', count: 4 }] }, 2),
    PICT('א', 'כל 🐶 מייצג חיית מחמד אחת. כמה חיות מחמד יש בסך הכול?', 9, 'מחברים את שתי השורות', { icon: '🐶', key: 1, rows: [{ label: 'כלבים', count: 5 }, { label: 'חתולים', count: 4 }] }, 3),
    BARC('א', 'איזה צבע נבחר הכי מעט — כתבו את המספר שלו', 2, 'העמודה הנמוכה ביותר', { bars: [{ label: 'כחול', value: 5 }, { label: 'אדום', value: 3 }, { label: 'ירוק', value: 2 }] }, 2)
  );

  // ---------- כיתה ב׳ · נתונים — פיקטוגרם עם מפתח גדול מ-1, דיאגרמת עמודות וטבלה ----------
  RAW.push(
    PICT('ב', 'כל 🍎 מייצג 2 פירות. כמה תפוחים נאספו בסך הכול?', 12, 'ספרו סמלים והכפילו כל אחד ב-2', { icon: '🍎', key: 2, rows: [{ label: 'תפוחים', count: 12 }, { label: 'אגסים', count: 8 }] }, 1),
    PICT('ב', 'כל 🍎 מייצג 2 פירות. כמה אגסים נאספו בסך הכול?', 8, 'ספרו סמלים והכפילו כל אחד ב-2', { icon: '🍎', key: 2, rows: [{ label: 'תפוחים', count: 12 }, { label: 'אגסים', count: 8 }] }, 2),
    PICT('ב', 'כל ⭐ מייצג 5 ילדים. כמה ילדים בחרו בטיול לים?', 25, 'הכפילו כל סמל ב-5', { icon: '⭐', key: 5, rows: [{ label: 'ים', count: 25 }, { label: 'הרים', count: 15 }] }, 2),
    PICT('ב', 'כל ⭐ מייצג 5 ילדים. בכמה יותר ילדים בחרו בים מבהרים?', 10, 'הפרש בין שתי הקבוצות אחרי הכפלה', { icon: '⭐', key: 5, rows: [{ label: 'ים', count: 25 }, { label: 'הרים', count: 15 }] }, 3),
    BARC('ב', 'כמה ספרים הושאלו ביום שני?', 40, 'קראו את גובה העמודה', { bars: [{ label: 'שני', value: 40 }, { label: 'שלישי', value: 55 }, { label: 'רביעי', value: 30 }] }, 1),
    BARC('ב', 'באיזה יום הושאלו הכי הרבה ספרים — כתבו את המספר', 55, 'העמודה הגבוהה ביותר', { bars: [{ label: 'שני', value: 40 }, { label: 'שלישי', value: 55 }, { label: 'רביעי', value: 30 }] }, 2),
    BARC('ב', 'כמה ספרים יותר הושאלו בשלישי מברביעי?', 25, 'הפרש בין שתי העמודות', { bars: [{ label: 'שני', value: 40 }, { label: 'שלישי', value: 55 }, { label: 'רביעי', value: 30 }] }, 3),
    BARC('ב', 'כמה ספרים הושאלו בסך הכול בשלושת הימים?', 125, 'מחברים את כל העמודות', { bars: [{ label: 'שני', value: 40 }, { label: 'שלישי', value: 55 }, { label: 'רביעי', value: 30 }] }, 3),
    PICT('ב', 'כל 🐦 מייצג 3 ציפורים. כמה ציפורים נספרו ביום הראשון?', 15, 'הכפילו סמלים ב-3', { icon: '🐦', key: 3, rows: [{ label: 'יום א׳', count: 15 }, { label: 'יום ב׳', count: 9 }] }, 1),
    PICT('ב', 'כל 🐦 מייצג 3 ציפורים. כמה ציפורים נספרו ביום השני?', 9, 'הכפילו סמלים ב-3', { icon: '🐦', key: 3, rows: [{ label: 'יום א׳', count: 15 }, { label: 'יום ב׳', count: 9 }] }, 2),
    PICT('ב', 'כל 🐦 מייצג 3 ציפורים. כמה ציפורים בסך הכול בשני הימים?', 24, 'מחברים את שתי הקבוצות', { icon: '🐦', key: 3, rows: [{ label: 'יום א׳', count: 15 }, { label: 'יום ב׳', count: 9 }] }, 3),
    BARC('ב', 'באיזה יום הושאלו הכי מעט ספרים — כתבו את המספר', 30, 'העמודה הנמוכה ביותר', { bars: [{ label: 'שני', value: 40 }, { label: 'שלישי', value: 55 }, { label: 'רביעי', value: 30 }] }, 2)
  );

  // Item ids are RAW indexes, and stored histories and tests hold them:
  // new items go below this line, never in the middle of the bank.

  // ---------- כיתה ג׳ · גאומטריה — סוגי זוויות ומיון משולשים ----------
  // Word answers are one word (or one hyphenated term): isCorrect ignores
  // spaces and hyphens, so חד זווית, חד-זווית and חד־זווית all match.
  RAW.push(
    GEOA('ג', 'זווית של 30 מעלות — חדה, ישרה, קהה או שטוחה?', 'חדה', 'קטנה מ־90 מעלות', 1, ST.ANGLE_KINDS),
    GEOA('ג', 'זווית של 150 מעלות — חדה, ישרה, קהה או שטוחה?', 'קהה', 'בין 90 ל־180 מעלות', 1, ST.ANGLE_KINDS),
    GEOA('ג', 'כמה זוויות ישרות יש במלבן?', 4, 'בכל אחת מארבע הפינות', 1, ST.ANGLE_KINDS),
    GEOA('ג', 'זווית של 180 מעלות — חדה, ישרה, קהה או שטוחה?', 'שטוחה', 'שתי השוקיים על קו ישר אחד', 2, ST.ANGLE_KINDS),
    GEOA('ג', 'בשעה 3:00 מחוגי השעון יוצרים זווית — חדה, ישרה, קהה או שטוחה?', 'ישרה', 'רבע סיבוב — כמו פינת דף', 2, ST.ANGLE_KINDS),
    GEOA('ג', 'בשעה 6:00 מחוגי השעון יוצרים זווית — חדה, ישרה, קהה או שטוחה?', 'שטוחה', 'המחוגים בקו ישר אחד', 3, ST.ANGLE_KINDS),
    GEOA('ג', 'שתי זוויות ישרות זו ליד זו יוצרות יחד זווית — חדה, ישרה, קהה או שטוחה?', 'שטוחה', '90 ועוד 90 הם 180 מעלות', 3, ST.ANGLE_KINDS),
    GEOA('ג', 'משולש שיש בו זווית של 90 מעלות — חד־זווית, ישר־זווית או קהה־זווית?', 'ישר־זווית', 'יש בו זווית ישרה', 1, ST.TRI_SORT),
    GEOA('ג', 'משולש שכל שלוש זוויותיו חדות — חד־זווית, ישר־זווית או קהה־זווית?', 'חד־זווית', 'כל הזוויות קטנות מ־90', 2, ST.TRI_SORT),
    GEOA('ג', 'זוויות המשולש הן 100, 40 ו־40 מעלות — חד־זווית, ישר־זווית או קהה־זווית?', 'קהה־זווית', '100 גדולה מ־90', 3, ST.TRI_SORT),
    GEOA('ג', 'למשולש יש בדיוק שתי צלעות שוות — שווה־צלעות, שווה־שוקיים או שונה־צלעות?', 'שווה־שוקיים', 'שתי השוקיים שוות', 2, ST.TRI_SORT),
    GEOA('ג', 'כמה זוויות ישרות יכולות להיות לכל היותר במשולש אחד?', 1, 'שתי זוויות ישרות כבר 180 מעלות — לא נשאר לשלישית', 3, ST.TRI_SORT)
  );

  // ---------- כיתה ד׳ · גאומטריה — מקבילים, מאונכים, מרובעים, תיבה ----------
  RAW.push(
    GEOA('ד', 'שני ישרים שלעולם אינם נפגשים — מקבילים או מאונכים?', 'מקבילים', 'כמו פסי רכבת', 1, ST.PARALLEL),
    GEOA('ד', 'במלבן, שתי צלעות שנפגשות בפינה — מקבילות או מאונכות?', 'מאונכות', 'הן יוצרות זווית ישרה', 1, ST.PARALLEL),
    GEOA('ד', 'כמה זוגות של צלעות מקבילות יש לריבוע?', 2, 'למעלה ולמטה, ימין ושמאל', 2, ST.PARALLEL),
    GEOA('ד', 'כמה זוגות של צלעות מקבילות יש לטרפז?', 1, 'לטרפז יש זוג אחד בדיוק', 2, ST.PARALLEL),
    GEOA('ד', 'מרובע שכל צלעותיו שוות וכל זוויותיו ישרות — איך קוראים לו?', 'ריבוע', 'ארבע צלעות שוות וארבע זוויות ישרות', 1, ST.QUAD_SORT),
    GEOA('ד', 'כמה אלכסונים יש למרובע?', 2, 'מכל קודקוד לקודקוד שמולו', 2, ST.QUAD_SORT),
    GEOA('ד', 'מרובע שכל ארבע צלעותיו שוות אבל זוויותיו אינן ישרות — איך קוראים לו?', 'מעוין', 'ריבוע ״מוטה״', 3, ST.QUAD_SORT),
    GEOA('ד', 'מרובע עם שני זוגות של צלעות מקבילות ובלי זווית ישרה — מקבילית או טרפז?', 'מקבילית', 'לטרפז יש רק זוג אחד', 3, ST.QUAD_SORT),
    GEOA('ד', 'כמה פאות יש לתיבה?', 6, 'למעלה, למטה וארבע דפנות', 1, ST.BOX),
    GEOA('ד', 'כמה מקצועות יש לתיבה?', 12, '4 למעלה, 4 למטה ו־4 עומדים', 2, ST.BOX),
    GEOA('ד', 'כמה קודקודים יש לקובייה?', 8, '4 למעלה ו־4 למטה', 2, ST.BOX),
    GEOA('ד', 'כל פאות הקובייה הן אותה צורה. איזו?', 'ריבוע', 'כל המקצועות של קובייה שווים', 3, ST.BOX)
  );

  // ---------- מדידה ב׳–ד׳ — בלי ציור: הנתונים כתובים בשאלה ----------
  // Answers are whole numbers so a child types digits only; the unit is in
  // the prompt. test/measurementBank.test.js checks them against measure.js.
  function MEAS(grade, prompt, answer, hint, level, standard) {
    return I(grade, 'measurement', prompt, answer, hint, { strand: STRAND.MEASURE, standard: standard, level: level });
  }

  // ---------- כיתה ב׳ · מדידה — חצאי שעות והיקף ----------
  RAW.push(
    MEAS('ב', 'כמה דקות יש בחצי שעה?', 30, 'שעה היא 60 דקות, וחצי ממנה', 1, ST.HALF_HOUR),
    MEAS('ב', 'השעון מראה 3:30. כמה דקות עברו מאז 3:00?', 30, 'מחוג הדקות על 6 — חצי סיבוב', 1, ST.HALF_HOUR),
    MEAS('ב', 'כמה חצאי שעה יש בשעה אחת?', 2, 'שני חצאים הם שלם', 2, ST.HALF_HOUR),
    MEAS('ב', 'השעון מראה 7:30. מחוג השעות נמצא בין 7 לאיזה מספר?', 8, 'חצי הדרך אל השעה הבאה', 2, ST.HALF_HOUR),
    MEAS('ב', 'יצאנו ב־4:00 וחזרנו ב־5:30. כמה חצאי שעה עברו?', 3, 'שעה שלמה היא שני חצאים, ועוד חצי', 3, ST.HALF_HOUR),
    MEAS('ב', 'שיר ארוך חצי שעה ועוד שיר ארוך חצי שעה. כמה דקות בסך הכול?', 60, '30 ועוד 30', 3, ST.HALF_HOUR),
    MEAS('ב', 'לריבוע צלע של 3 ס״מ. מה ההיקף בס״מ?', 12, 'ארבע צלעות שוות: 3+3+3+3', 1, ST.PERIMETER),
    MEAS('ב', 'למשולש צלעות של 3, 4 ו־5 ס״מ. מה ההיקף בס״מ?', 12, 'מחברים את שלוש הצלעות', 1, ST.PERIMETER),
    MEAS('ב', 'למלבן צלעות של 5 ס״מ ו־2 ס״מ. מה ההיקף בס״מ?', 14, '5+2+5+2', 2, ST.PERIMETER),
    MEAS('ב', 'למחומש 5 צלעות של 2 ס״מ כל אחת. מה ההיקף בס״מ?', 10, 'חמש פעמים 2', 2, ST.PERIMETER),
    MEAS('ב', 'היקף ריבוע הוא 20 ס״מ. כמה ס״מ אורך כל צלע?', 5, '20 מתחלק לארבע צלעות שוות', 3, ST.PERIMETER),
    MEAS('ב', 'היקף מלבן הוא 10 ס״מ, ואחת מצלעותיו 3 ס״מ. כמה ס״מ הצלע הסמוכה לה?', 2, '3+3 כבר 6; נשארו 4 לשתי הצלעות האחרות', 3, ST.PERIMETER)
  );

  // ---------- כיתה ג׳ · מדידה — שעות ודקות; שטח מלבן ----------
  RAW.push(
    MEAS('ג', 'כמה דקות יש ב־1 שעה?', 60, 'מחוג הדקות עושה סיבוב שלם', 1, ST.MINUTES),
    MEAS('ג', 'כמה דקות יש ברבע שעה?', 15, 'רבע מ־60', 1, ST.MINUTES),
    MEAS('ג', 'השיעור התחיל ב־8:00 ונגמר ב־8:45. כמה דקות נמשך?', 45, 'מ־00 עד 45', 2, ST.MINUTES),
    MEAS('ג', 'כמה דקות יש ב־3 שעות?', 180, 'שלוש פעמים 60', 2, ST.MINUTES),
    MEAS('ג', 'האוטובוס יוצא ב־10:40. עכשיו 10:25. בעוד כמה דקות הוא יוצא?', 15, 'מ־25 עד 40', 3, ST.MINUTES),
    MEAS('ג', 'האימון התחיל ב־4:30 ונגמר ב־6:00. כמה דקות נמשך?', 90, 'חצי שעה עד 5:00 ועוד שעה שלמה', 3, ST.MINUTES),
    MEAS('ג', 'מלבן בנוי מ־3 שורות של 4 משבצות. כמה משבצות יש בו?', 12, '3 פעמים 4', 1, ST.AREA),
    MEAS('ג', 'מלבן שאורכו 5 ס״מ ורוחבו 2 ס״מ. מה שטחו בסמ״ר?', 10, 'אורך כפול רוחב', 1, ST.AREA),
    MEAS('ג', 'ריבוע שצלעו 4 ס״מ. מה שטחו בסמ״ר?', 16, '4 כפול 4', 2, ST.AREA),
    MEAS('ג', 'מלבן שאורכו 7 ס״מ ורוחבו 3 ס״מ. מה שטחו בסמ״ר?', 21, '7 כפול 3', 2, ST.AREA),
    MEAS('ג', 'שטח מלבן הוא 24 סמ״ר ואורכו 6 ס״מ. כמה ס״מ רוחבו?', 4, 'איזה מספר כפול 6 נותן 24?', 3, ST.AREA),
    MEAS('ג', 'מלבן שאורכו 5 ס״מ ורוחבו 2 ס״מ, וריבוע שצלעו 3 ס״מ. כמה סמ״ר שטחם יחד?', 19, '10 ועוד 9', 3, ST.AREA)
  );

  // ---------- כיתה ד׳ · מדידה — המרת יחידות; זמן בלוח השנה ----------
  RAW.push(
    MEAS('ד', 'כמה ס״מ יש ב־2 מטרים?', 200, 'במטר אחד 100 ס״מ', 1, ST.UNITS),
    MEAS('ד', 'כמה גרם יש ב־3 ק״ג?', 3000, 'בקילוגרם אחד 1,000 גרם', 1, ST.UNITS),
    MEAS('ד', 'כמה מ״מ יש ב־3 ס״מ?', 30, 'בסנטימטר אחד 10 מילימטרים', 2, ST.UNITS),
    MEAS('ד', 'כמה מטרים יש ב־2 ק״מ?', 2000, 'בקילומטר אחד 1,000 מטרים', 2, ST.UNITS),
    MEAS('ד', 'כמה מ״ל יש בחצי ליטר?', 500, 'בליטר אחד 1,000 מ״ל', 3, ST.UNITS),
    MEAS('ד', 'חבל באורך 3 מטרים נחתך לחתיכות של 50 ס״מ. כמה חתיכות יש?', 6, '3 מטרים הם 300 ס״מ', 3, ST.UNITS),
    MEAS('ד', 'כמה חודשים יש בשנה לועזית?', 12, 'מינואר עד דצמבר', 1, ST.CALENDAR),
    MEAS('ד', 'כמה ימים יש ב־3 שבועות?', 21, 'בשבוע 7 ימים', 1, ST.CALENDAR),
    MEAS('ד', 'כמה שעות יש ב־1 יממה?', 24, 'יום ולילה יחד', 2, ST.CALENDAR),
    MEAS('ד', 'כמה ימים יש בשנה לועזית רגילה, לא מעוברת?', 365, 'בשנה מעוברת יש יום אחד יותר', 2, ST.CALENDAR),
    MEAS('ד', 'כמה שעות יש ב־2 יממות?', 48, 'פעמיים 24', 3, ST.CALENDAR),
    MEAS('ד', 'יום ההולדת בעוד 4 שבועות ו־3 ימים. בעוד כמה ימים?', 31, '4 פעמים 7, ועוד 3', 3, ST.CALENDAR)
  );

  // ---------- ה׳–ו׳ — שברים, עשרוניים, אחוזים (#96) ----------
  // Fraction answers are typed as a/b; adaptive.isCorrect accepts any
  // equivalent fraction, so 2/4 counts for 1/2. Decimal answers are numbers.
  // `music` names the music issue that reuses the item: lcm/bars/bpm for
  // #106 (grade ה׳), dotted/tempo/mean for #107 (grade ו׳).
  function G56(grade, skill, prompt, answer, hint, level, standard, music) {
    const strand = skill === 'fractions' ? STRAND.FRAC : STRAND.NUM;
    return I(grade, skill, prompt, answer, hint, { strand: strand, standard: standard, level: level, music: music });
  }

  // ---------- כיתה ה׳ · שברים ----------
  RAW.push(
    G56('ה', 'fractions', 'השלימו: 1/2 = ?/8. מה המונה?', 4, 'כופלים מונה ומכנה באותו מספר', 1, ST.FRAC_EQUIV),
    G56('ה', 'fractions', 'צמצמו עד הסוף: 6/8', '3/4', 'מחלקים מונה ומכנה ב־2', 1, ST.FRAC_EQUIV),
    G56('ה', 'fractions', 'כמה שמיניות יש ב־3/4?', 6, '3/4 = 6/8', 2, ST.FRAC_EQUIV, 'bars'),
    G56('ה', 'fractions', 'מה גדול יותר, 2/3 או 3/5? כתבו את השבר הגדול.', '2/3', 'מכנה משותף 15: 10/15 מול 9/15', 3, ST.FRAC_EQUIV),
    G56('ה', 'fractions', '1/4 + 2/4 = ?', '3/4', 'אותו מכנה — מחברים מונים', 1, ST.FRAC_ADD),
    G56('ה', 'fractions', '1/2 + 1/4 = ?', '3/4', '1/2 = 2/4', 1, ST.FRAC_ADD, 'bars'),
    G56('ה', 'fractions', '1/2 + 1/3 = ?', '5/6', 'מכנה משותף 6: 3/6 + 2/6', 2, ST.FRAC_ADD, 'lcm'),
    G56('ה', 'fractions', '3/4 − 1/8 = ?', '5/8', '3/4 = 6/8', 2, ST.FRAC_ADD, 'bars'),
    G56('ה', 'fractions', '2/3 + 1/4 = ?', '11/12', 'מכנה משותף 12: 8/12 + 3/12', 3, ST.FRAC_ADD, 'lcm'),
    G56('ה', 'fractions', 'תיבה של 4/4 מכילה רבע, שמינית ושמינית. כמה חסר עד תיבה מלאה? (כשבר)', '1/2', '1/4 + 1/8 + 1/8 = 1/2', 3, ST.FRAC_ADD, 'bars'),
    G56('ה', 'fractions', 'כמה זה 1/3 מ־12?', 4, 'מחלקים ל־3 חלקים שווים', 1, ST.FRAC_OF),
    G56('ה', 'fractions', 'כמה זה 3/4 מ־20?', 15, 'רבע מ־20 הוא 5, ושלושה רבעים', 2, ST.FRAC_OF),
    G56('ה', 'fractions', 'בכיתה 30 ילדים, 2/5 מהם מנגנים. כמה ילדים מנגנים?', 12, 'חמישית מ־30 היא 6', 3, ST.FRAC_OF)
  );

  // ---------- כיתה ה׳ · שברים עשרוניים ----------
  RAW.push(
    G56('ה', 'decimals', 'כתבו כשבר עשרוני: 7/10', 0.7, 'עשיריות — ספרה אחת אחרי הנקודה', 1, ST.DEC_PLACE),
    G56('ה', 'decimals', 'במספר 3.46, איזו ספרה במקום המאיות?', 6, 'הספרה השנייה אחרי הנקודה', 1, ST.DEC_PLACE),
    G56('ה', 'decimals', 'מה גדול יותר, 0.5 או 0.45? כתבו את הגדול.', 0.5, '0.50 מול 0.45', 2, ST.DEC_PLACE),
    G56('ה', 'decimals', 'כתבו כשבר עשרוני: 1/4', 0.25, '1/4 = 25/100', 2, ST.DEC_PLACE),
    G56('ה', 'decimals', 'פעימה ב־120 BPM נמשכת 60/120 שנייה. כמה שניות זה כשבר עשרוני?', 0.5, '60 חלקי 120', 3, ST.DEC_PLACE, 'bpm'),
    G56('ה', 'decimals', '0.3 + 0.4 = ?', 0.7, 'שלוש עשיריות ועוד ארבע עשיריות', 1, ST.DEC_ADD),
    G56('ה', 'decimals', '2.5 + 1.25 = ?', 3.75, 'מיישרים את הנקודות: 2.50 + 1.25', 2, ST.DEC_ADD),
    G56('ה', 'decimals', '5 − 1.6 = ?', 3.4, '5.0 − 1.6', 2, ST.DEC_ADD),
    G56('ה', 'decimals', 'מחברת עולה 4.90 ₪ ועט 2.35 ₪. כמה עודף מ־10 ₪?', 2.75, '4.90 + 2.35 = 7.25', 3, ST.DEC_ADD)
  );

  // ---------- כיתה ו׳ · כפל וחילוק שברים ----------
  RAW.push(
    G56('ו', 'fractions', '1/2 × 1/3 = ?', '1/6', 'מונה כפול מונה, מכנה כפול מכנה', 1, ST.FRAC_MUL),
    G56('ו', 'fractions', '3 × 1/4 = ?', '3/4', 'שלושה רבעים', 1, ST.FRAC_MUL),
    G56('ו', 'fractions', 'תו מנוקד ארוך פי 3/2 מהתו. כמה פעימות נמשך חצי מנוקד? (חצי = 2 פעימות)', 3, '2 × 3/2', 2, ST.FRAC_MUL, 'dotted'),
    G56('ו', 'fractions', '2/3 × 3/4 = ?', '1/2', '6/12 ואז מצמצמים', 2, ST.FRAC_MUL),
    G56('ו', 'fractions', '3 : 1/2 = ?', 6, 'כמה חצאים נכנסים ב־3?', 2, ST.FRAC_DIV),
    G56('ו', 'fractions', '3/4 : 1/8 = ?', 6, 'כמה שמיניות ב־3/4? 3/4 = 6/8', 3, ST.FRAC_DIV, 'bars'),
    G56('ו', 'fractions', '2/3 : 2 = ?', '1/3', 'חצי מ־2/3', 3, ST.FRAC_DIV)
  );

  // ---------- כיתה ו׳ · כפל וחילוק עשרוניים ----------
  RAW.push(
    G56('ו', 'decimals', '0.4 × 10 = ?', 4, 'כפל ב־10 מזיז את הנקודה ימינה', 1, ST.DEC_MUL),
    G56('ו', 'decimals', '3.2 : 100 = ?', 0.032, 'חילוק ב־100 מזיז את הנקודה שני מקומות שמאלה', 1, ST.DEC_MUL),
    G56('ו', 'decimals', '1.5 × 4 = ?', 6, '1.5 + 1.5 + 1.5 + 1.5', 2, ST.DEC_MUL),
    G56('ו', 'decimals', '0.3 × 0.2 = ?', 0.06, '3 × 2 = 6, ושתי ספרות אחרי הנקודה', 2, ST.DEC_MUL),
    G56('ו', 'decimals', '7.5 : 3 = ?', 2.5, '7.5 הם 75 עשיריות', 3, ST.DEC_MUL),
    G56('ו', 'decimals', 'שלושה שירים: 3.5, 4 ו־4.5 דקות. מה האורך הממוצע בדקות?', 4, '12 חלקי 3', 3, ST.DEC_MUL, 'mean')
  );

  // ---------- כיתה ו׳ · אחוזים ----------
  RAW.push(
    G56('ו', 'percent', 'כמה זה 50% מ־80?', 40, '50% הם חצי', 1, ST.PERCENT),
    G56('ו', 'percent', 'כמה זה 10% מ־70?', 7, '10% הם עשירית', 1, ST.PERCENT),
    G56('ו', 'percent', 'כמה זה 25% מ־60?', 15, '25% הם רבע', 2, ST.PERCENT),
    G56('ו', 'percent', 'כתבו כאחוז (מספר בלבד): 3/4', 75, '3/4 = 75/100', 2, ST.PERCENT),
    G56('ו', 'percent', 'קצב של 100 BPM עולה ב־20%. מה הקצב החדש?', 120, '20% מ־100 הם 20', 3, ST.PERCENT, 'tempo'),
    G56('ו', 'percent', 'מחיר 40 ₪ ירד ב־25%. מה המחיר החדש?', 30, '25% מ־40 הם 10', 3, ST.PERCENT)
  );

  // ---------- כיתה ב׳ · פעילויות מוזיקה (תוכנית §5, #103) ----------
  // Appended at the end: ids are RAW indexes, so earlier items keep theirs.
  // `music` names the activity; tables stay on 2/4/5/10 so the mastery gate
  // for 3/6/7/8/9 is untouched.
  function MB(skill, music, prompt, answer, hint, level, extra) {
    extra = extra || {};
    extra.level = level;
    extra.music = music;
    return I('ב', skill, prompt, answer, hint, extra);
  }
  function EVEN(n, level) {
    const even = n % 2 === 0;
    return MB('place_value', 'evenOdd', 'הקשיבו לפעימות: ' + '🥁'.repeat(n) + ' — לכל פעימה יש זוג? (כתבו זוגי או אי־זוגי)',
      even ? 'זוגי' : 'אי-זוגי',
      even ? 'מחלקים לזוגות — אף פעימה לא נשארת לבד' : 'בסוף נשארת פעימה אחת בלי זוג',
      level, { standard: ST.PLACE_VALUE, hear: [n] });
  }
  function DUO(op, a, b, answer, hint, level) {
    return MB(op === '+' ? 'addition' : 'subtraction', 'twoInstruments',
      'תוף מנגן את היחידות, בס מנגן את העשרות. חשבו במאונך: ' + a + ' ' + (op === '+' ? '+' : '−') + ' ' + b,
      answer, hint, level,
      { standard: op === '+' ? ST.VERT_ADD : ST.VERT_SUB, widget: 'vertical', vert: { a: a, b: b, op: op } });
  }
  function BARS(prompt, answer, hint, table, level) {
    return MB('multiplication', 'beatsBars', prompt, answer, hint, level, { standard: ST.MUL_B, table: table });
  }
  function HALF(prompt, answer, hint, level) {
    return MB('measurement', 'halfBar', prompt, answer, hint, level, { strand: STRAND.MEASURE, standard: ST.HALF_HOUR });
  }
  function REG(prompt, answer, hint, level, hear) {
    return MB('place_value', 'registers', prompt, answer, hint, level, { standard: ST.PLACE_VALUE, hear: hear });
  }
  const REGROUP = '10 מכות תוף מתקבצות לצליל בס אחד';
  const UNGROUP = 'אין מספיק מכות תוף — צליל בס אחד נפרט ל־10 מכות תוף';
  RAW.push(
    EVEN(4, 1), EVEN(3, 1), EVEN(6, 1), EVEN(5, 1),
    EVEN(7, 2), EVEN(8, 2), EVEN(9, 2),
    EVEN(10, 3), EVEN(11, 3), EVEN(12, 3),

    DUO('+', 23, 14, 37, 'התוף מנגן 3 + 4, הבס מנגן 2 + 1', 1),
    DUO('+', 41, 36, 77, 'התוף מנגן 1 + 6, הבס מנגן 4 + 3', 1),
    DUO('-', 58, 24, 34, 'התוף מנגן 8 − 4, הבס מנגן 5 − 2', 1),
    DUO('+', 38, 25, 63, '8 + 5 = 13 מכות תוף: ' + REGROUP, 2),
    DUO('+', 47, 16, 63, '7 + 6 = 13 מכות תוף: ' + REGROUP, 2),
    DUO('+', 29, 29, 58, '9 + 9 = 18 מכות תוף: ' + REGROUP, 2),
    DUO('-', 63, 28, 35, '3 − 8 לא יוצא: ' + UNGROUP, 2),
    DUO('+', 56, 37, 93, '6 + 7 = 13 מכות תוף: ' + REGROUP, 3),
    DUO('-', 70, 46, 24, 'אפס מכות תוף: ' + UNGROUP, 3),
    DUO('-', 85, 39, 46, '5 − 9 לא יוצא: ' + UNGROUP, 3),

    BARS('2 תיבות של 5/4 — כמה פעימות בסך הכול?', 10, 'בכל תיבה 5 פעימות, פעמיים', 5, 1),
    BARS('3 תיבות של 4/4 — כמה פעימות בסך הכול?', 12, '4, 8, 12', 4, 1),
    BARS('4 תיבות של 4/4 — כמה פעימות בסך הכול?', 16, '4 פעמים 4', 4, 1),
    BARS('6 תיבות של 2/4 — כמה פעימות בסך הכול?', 12, 'סופרים בדילוגים של 2', 2, 1),
    BARS('5 תיבות של 4/4 — כמה פעימות בסך הכול?', 20, '5 פעמים 4', 4, 2),
    BARS('9 תיבות של 2/4 — כמה פעימות בסך הכול?', 18, '9 פעמים 2', 2, 2),
    BARS('3 תיבות של 5/4 — כמה פעימות בסך הכול?', 15, '5, 10, 15', 5, 2),
    BARS('8 תיבות, ובכל תיבה 10 פעימות — כמה פעימות בסך הכול?', 80, 'סופרים בעשרות', 10, 2),
    BARS('קטע של 10 תיבות 4/4 — כמה פעימות בסך הכול?', 40, '10 פעמים 4', 10, 3),
    BARS('8 תיבות של 4/4 — כמה פעימות בסך הכול?', 32, '4 תיבות הן 16, ועוד 4 תיבות', 4, 3),
    BARS('7 תיבות של 5/4 — כמה פעימות בסך הכול?', 35, '7 פעמים 5', 5, 3),

    HALF('בתיבה 4/4 יש 4 פעימות. כמה פעימות בחצי תיבה?', 2, 'חצי מ־4', 1),
    HALF('תו חצי ממלא חצי תיבה 4/4. כמה פעימות הוא נמשך?', 2, 'חצי מ־4 פעימות', 1),
    HALF('כמה תווי חצי ממלאים תיבה 4/4 שלמה?', 2, 'חצי ועוד חצי הם שלם', 1),
    HALF('שעה היא כמו תיבה שלמה. כמה חצאי שעה יש בשעה?', 2, 'כמו שני תווי חצי בתיבה', 1),
    HALF('שעה היא 60 דקות, כמו תיבה שלמה. כמה דקות בחצי שעה — חצי תיבה?', 30, 'חצי מ־60', 1),
    HALF('2 תיבות של 4/4. כמה תווי חצי צריך כדי למלא אותן?', 4, '2 בכל תיבה', 2),
    HALF('שיר נמשך 4 תיבות. כמה תיבות הן חצי מהשיר?', 2, 'חצי מ־4', 2),
    HALF('מחוג הדקות עשה חצי סיבוב מ־2:00. מה השעה? (כתבו כמו 2:30)', '2:30', 'חצי סיבוב הוא חצי שעה', 2),
    HALF('החזרה מתחילה ב־10:00 ונמשכת חצי שעה. מתי היא נגמרת? (כתבו כמו 10:30)', '10:30', 'מוסיפים 30 דקות', 2),
    HALF('כמה דקות עוברות מ־6:30 עד 7:00?', 30, 'החצי השני של השעה', 3),
    HALF('חצי שעה, ועוד חצי שעה, ועוד חצי שעה. כמה דקות בסך הכול?', 90, '30 + 30 + 30', 3),

    REG('בס = מאות, פסנתר = עשרות, פעמון = יחידות. הבס מנגן 3, הפסנתר 4, הפעמון 2. איזה מספר?', 342, 'בס, פסנתר, פעמון — מאות, עשרות, יחידות', 1, [3, 4, 2]),
    REG('הבס מנגן 7 צלילים, הפסנתר והפעמון שותקים. איזה מספר?', 700, '7 מאות', 1),
    REG('במספר 618 — כמה צלילי בס (מאות)?', 6, 'ספרת המאות', 1),
    REG('במספר 618 — כמה צלילי פסנתר (עשרות)?', 1, 'ספרת העשרות', 1),
    REG('במספר 480 — כמה צלילי בס (מאות)?', 4, 'ספרת המאות', 1),
    REG('הבס מנגן 5, הפסנתר שותק, הפעמון מנגן 7. איזה מספר?', 507, 'אין עשרות — 0 באמצע', 2),
    REG('הבס מנגן 2, הפסנתר 6, הפעמון שותק. איזה מספר?', 260, 'אין יחידות — 0 בסוף', 2),
    REG('במספר 905 — כמה צלילי פסנתר (עשרות)?', 0, 'הפסנתר שותק', 2),
    REG('10 צלילי פסנתר (עשרות) מתקבצים לצליל בס אחד. כמה הוא שווה?', 100, '10 עשרות הן מאה', 2),
    REG('הבס מנגן 4, הפסנתר 12, הפעמון 3. איזה מספר?', 523, '12 עשרות הן מאה ועוד 2 עשרות', 3, [4, 12, 3]),
    REG('הבס מנגן 9, הפסנתר 9, הפעמון 10. איזה מספר?', 1000, '10 יחידות הן עשרה, ואז הכול מתקבץ', 3)
  );

  // ---------- כיתה ג׳ · פעילויות מוזיקה (תוכנית §5, #104) ----------
  // Appended at the end like grade ב׳. Every item that leans on table
  // 3/6/7/8/9 carries `table`, so the mastery gate still holds it back.
  // Remainder answers ("3 שארית 2") are checked by parseRemainderAnswer.
  function MC(skill, music, prompt, answer, hint, level, extra) {
    extra = extra || {};
    extra.level = level;
    extra.music = music;
    return I('ג', skill, prompt, answer, hint, extra);
  }
  function METER(prompt, answer, hint, table, level) {
    return MC('multiplication', 'meters', prompt, answer, hint, level, { standard: ST.MUL_C, table: table });
  }
  function LEFT(total, bar, level, table) {
    const q = Math.floor(total / bar);
    const r = total % bar;
    return MC('division', 'leftoverBeats',
      total + ' פעימות בתיבות של ' + bar + ' — כמה תיבות שלמות, וכמה פעימות נשארות? (כתבו כמו 3 שארית 2)',
      q + ' שארית ' + r,
      q + ' תיבות של ' + bar + ' הן ' + (q * bar) + ' פעימות; ' + (r ? 'הנותרות מתנגנות בצליל אחר' : 'לא נשארת אף פעימה'),
      level, { standard: ST.DIV_REM, meaning: 'quotative', table: table });
  }
  function TIMES(prompt, answer, hint, level, table) {
    return MC('word_problems', 'howManyTimes', prompt, answer, hint, level, { standard: ST.MUL_COMPARE, table: table });
  }
  function GRID(rows, steps, prompt, answer, hint, level, table) {
    return MC('measurement', 'stepGrid', prompt, answer, hint, level,
      { strand: STRAND.MEASURE, standard: ST.AREA, grid: { rows: rows, steps: steps }, table: table });
  }
  function TUNE(prompt, answer, hint, level) {
    return MC('measurement', 'tuneTime', prompt, answer, hint, level, { strand: STRAND.MEASURE, standard: ST.MINUTES });
  }
  function HZ(prompt, answer, hint, level) {
    return MC('place_value', 'hzCompare', prompt, answer, hint, level, { standard: ST.NUM_10K });
  }
  const NO_COMMA = ' (כתבו בלי פסיק)';
  RAW.push(
    METER('בתיבה של 3/4 יש 3 פעימות, והראשונה מודגשת. כמה פעימות ב־4 תיבות?', 12, 'לוח ה־3: 3, 6, 9, 12', 3, 1),
    METER('כמה פעימות ב־5 תיבות של 3/4?', 15, '5 פעמים 3', 3, 1),
    METER('כמה פעימות ב־7 תיבות של 3/4?', 21, '7 פעמים 3', 3, 2),
    METER('ואלס של 9 תיבות 3/4. כמה פעימות?', 27, '9 פעמים 3', 3, 2),
    METER('במשקל 3/4 סופרים את כל הפעימות מההתחלה. פעימה 18 — היא מודגשת? (כתבו כן או לא)', 'כן', '18 בלוח ה־3, אז היא פותחת תיבה חדשה', 3, 2),
    METER('במשקל 3/4, פעימה 20 — היא מודגשת? (כתבו כן או לא)', 'לא', '20 לא בלוח ה־3', 3, 3),
    METER('בתיבה של 6/8 יש 6 שמיניות. כמה שמיניות ב־3 תיבות?', 18, '6, 12, 18', 6, 2),
    METER('כמה שמיניות ב־4 תיבות של 6/8?', 24, '4 פעמים 6', 6, 2),
    METER('כמה שמיניות ב־7 תיבות של 6/8?', 42, '7 פעמים 6', 6, 3),
    METER('במשקל 6/8, שמינית 36 — היא סוגרת תיבה? (כתבו כן או לא)', 'כן', '36 בלוח ה־6: 6 תיבות שלמות', 6, 3),

    LEFT(9, 4, 1), LEFT(14, 4, 1), LEFT(11, 5, 1), LEFT(22, 5, 2),
    LEFT(19, 4, 2), LEFT(16, 4, 2), LEFT(23, 10, 2),
    LEFT(17, 3, 2, 3), LEFT(20, 6, 3, 6), LEFT(30, 7, 3, 7),

    TIMES('תוף אחד מנגן 60 פעימות בדקה, ותוף שני 120. פי כמה השני מהיר?', 2, '60 ועוד 60 הם 120', 1),
    TIMES('צליל של 220 הרץ וצליל של 440 הרץ — אוקטבה. פי כמה התדר הגבוה?', 2, 'אוקטבה מכפילה את התדר', 1),
    TIMES('צליל של 110 הרץ וצליל של 440 הרץ — שתי אוקטבות. פי כמה התדר הגבוה?', 4, 'פי 2 ואז שוב פי 2', 2),
    TIMES('מטרונום על 40, ואז על 200. פי כמה הוא מהיר יותר?', 5, '40 כפול 5', 2),
    TIMES('שיר אחד 10 תיבות, ושיר שני 50 תיבות. פי כמה השני ארוך?', 5, '10 כפול 5', 2),
    TIMES('תווה של 100 הרץ ותווה של 300 הרץ. פי כמה התדר הגבוה?', 3, '100 כפול 3', 2, 3),
    TIMES('גיטרה מנגנת 8 תווים, ופסנתר מנגן פי 4 תווים. כמה תווים מנגן הפסנתר?', 32, '8 כפול 4', 2),
    TIMES('דנה מתופפת 7 מכות, ויובל מתופף פי 6. כמה מכות מתופף יובל?', 42, '7 כפול 6', 3, 6),

    GRID(4, 8, 'בסקוונסר יש 4 שורות (תוף, מצילה, בס, כפיים) ו־8 צעדים. כמה משבצות יש ברשת?', 32, 'שטח מלבן: שורות כפול צעדים, 4 כפול 8', 1),
    GRID(2, 5, 'רשת של 2 שורות ו־5 צעדים. כמה משבצות?', 10, '2 כפול 5', 1),
    GRID(5, 4, 'רשת של 5 שורות ו־4 צעדים. כמה משבצות?', 20, '5 כפול 4', 1),
    GRID(4, 10, 'רשת של 4 שורות ו־10 צעדים. כמה משבצות?', 40, '4 כפול 10', 2),
    GRID(4, 6, 'רשת של 4 שורות ו־6 צעדים. כמה משבצות?', 24, '4 כפול 6', 2, 6),
    GRID(3, 8, 'רשת של 3 שורות ו־8 צעדים. כמה משבצות?', 24, '3 כפול 8', 2, 3),
    GRID(4, 8, 'ברשת 32 משבצות ו־4 שורות. כמה צעדים בכל שורה?', 8, '32 לחלק ל־4', 2),
    GRID(6, 8, 'רשת של 6 שורות ו־8 צעדים. כמה משבצות?', 48, '6 כפול 8', 3, 8),

    TUNE('שיר נמשך דקה אחת. כמה שניות?', 60, 'בדקה 60 שניות', 1),
    TUNE('שיר נמשך 2 דקות. כמה שניות?', 120, '60 ועוד 60', 1),
    TUNE('מנגינה של 3 דקות. כמה שניות?', 180, '3 פעמים 60', 2),
    TUNE('קטע של 90 שניות. כמה דקות ושניות? (כתבו כמו 1:30)', '1:30', '60 שניות הן דקה, ונשארות 30', 2),
    TUNE('קטע של 150 שניות. כמה דקות ושניות? (כתבו כמו 2:30)', '2:30', '120 שניות הן 2 דקות', 2),
    TUNE('שיר של 1:45. כמה שניות בסך הכול?', 105, '60 ועוד 45', 3),
    TUNE('שני שירים, כל אחד 2:30. כמה דקות בסך הכול?', 5, 'שתי דקות וחצי, פעמיים', 3),

    HZ('צליל א׳ 4186 הרץ, צליל ב׳ 4816 הרץ. איזה מספר גדול יותר?' + NO_COMMA, 4816, 'משווים אלפים, ואז מאות: 8 מאות מול 1', 1),
    HZ('צליל של 2093 הרץ. כמה אלפים יש במספר?', 2, 'ספרת האלפים', 1),
    HZ('צליל של 3520 הרץ. מה ספרת המאות?', 5, '3 אלפים, 5 מאות, 2 עשרות', 1),
    HZ('איזה גבוה יותר: 7040 הרץ או 7400 הרץ?' + NO_COMMA, 7400, 'אותם אלפים; 4 מאות מול 0', 2),
    HZ('צליל של 1000 הרץ, ועוד 10 צעדים של 100 הרץ. לאיזה תדר מגיעים?' + NO_COMMA, 2000, '10 מאות הן אלף', 2),
    HZ('5 אלפים, 0 מאות, 6 עשרות ו־4 יחידות הרץ. איזה מספר?' + NO_COMMA, 5064, 'אין מאות — 0 במקומן', 2),
    HZ('הצליל הגבוה ביותר בפסנתר הוא 4186 הרץ. כמה חסר לו עד 10,000?' + NO_COMMA, 5814, 'משלימים לאלפים: 4186 ועוד 14 הם 4200', 3)
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
    if (raw.wordType) it.wordType = raw.wordType;
    if (raw.ruler) it.ruler = raw.ruler;
    if (raw.clock) it.clock = raw.clock;
    if (raw.chart) it.chart = raw.chart;
    if (raw.vert) it.vert = raw.vert;
    if (raw.music) it.music = raw.music;
    if (raw.grid) it.grid = raw.grid;
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

  // Own keys only: a stored grade such as "constructor" must not resolve to
  // an Object.prototype member and crash the diagnostic.
  function isGrade(g) {
    return GRADES.indexOf(g) !== -1;
  }

  function skillsForGrade(grade) {
    return isGrade(grade) ? GRADE_SKILLS[grade].slice() : [];
  }

  // One base question and one intermediate question per skill: a child who
  // only stumbles at level 2 must look different in the gap report from a
  // child who is stuck at level 1.
  function diagnosticPair(skill, grade) {
    const rows = rowsOf(skill, grade);
    const pair = [];
    const base = rows.find(function (it) { return it.level === 1; });
    const mid = rows.find(function (it) { return it.level === 2; });
    if (base) pair.push(base);
    if (mid) pair.push(mid);
    // A skill missing one of the two levels still contributes two questions,
    // so the diagnostic keeps its length.
    rows.forEach(function (it) {
      if (pair.length < 2 && pair.indexOf(it) === -1) pair.push(it);
    });
    return pair;
  }

  function diagnosticItems(grade) {
    const g = isGrade(grade) ? grade : 'א';
    return skillsForGrade(g).flatMap(function (skill) {
      return diagnosticPair(skill, g);
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

  // Pass a skill to borrow only that skill's core facts: a grade-ג division
  // stage must not fill up with multiplication questions.
  function coreFactItems(skill) {
    return SHIPPED.filter(function (it) {
      if (skill != null && it.skill !== skill) return false;
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
    isGrade: isGrade,
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
