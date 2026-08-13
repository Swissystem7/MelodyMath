// MelodyMath — one elementary item bank for the screen and for paper.
//
// Coverage follows the Israeli יסודי spine for כיתות א׳–ד׳: מנייה,
// חיבור/חיסור עד 20, לוח הכפל, ושברים פשוטים. Each item has a level
// (1–3). Diagnostic still uses the first two items of each skill (10
// items). Class mode uses counting + addition + subtraction only.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const RM_SKILLS = [
    ['counting', 'מנייה'],
    ['addition', 'חיבור'],
    ['subtraction', 'חיסור'],
    ['multiplication', 'כפל'],
    ['basic_fractions', 'שברים בסיסיים'],
  ];
  const RM_ORDER = {};
  RM_SKILLS.forEach(function (s, i) { RM_ORDER[s[0]] = i; });

  const SKILL_GRADE = {
    counting: 'א׳',
    addition: 'א׳–ב׳',
    subtraction: 'א׳–ב׳',
    multiplication: 'ב׳–ג׳',
    basic_fractions: 'ג׳–ד׳',
  };

  const LEVEL_HE = {
    1: 'בסיס',
    2: 'ביניים',
    3: 'אתגר',
  };

  // row: [prompt, answer, hint, hear?, level]
  const RM_BANK = {
    counting: [
      ['סְפרו את הפעימות: 🥁🥁🥁🥁🥁 — כמה יש?', 5, 'נגעו בכל תוף פעם אחת וספרו', [5], 1],
      ['כמה תווים בשורה? ♪ ♪ ♪ ♪ ♪ ♪ ♪', 7, 'ספרו אחד-אחד', [7], 1],
      ['6, ואז המספר הבא?', 7, 'המספר שבא אחרי 6', null, 1],
      ['כמה מחיאות כפיים? 👏👏👏👏👏👏👏👏', 8, 'ספרו כל מחיאה', [8], 1],
      ['כמה נקודות? • • • • • •', 6, 'ספרו כל נקודה', [6], 1],
      ['4, ואז המספר הבא?', 5, 'המספר שבא אחרי 4', null, 1],
      ['סִפרו: 🥁🥁🥁 — כמה יש?', 3, 'שלושה תופים', [3], 1],
      ['כמה ידיים? ✋✋✋✋✋✋✋✋✋✋', 10, 'ספרו עד 10', [10], 1],
      ['2, ואז המספר הבא?', 3, 'אחרי 2 בא 3', null, 1],
      ['כמה תופים? 🥁🥁🥁🥁', 4, 'ארבעה תופים', [4], 1],
      ['9, ואז המספר הבא?', 10, 'אחרי 9 בא 10', null, 1],
      ['11, ואז המספר הבא?', 12, 'אחרי 11 בא 12', null, 2],
      ['14, ואז המספר הבא?', 15, 'אחרי 14 בא 15', null, 2],
      ['19, ואז המספר הבא?', 20, 'אחרי 19 בא 20', null, 2],
      ['המספר שלפני 8?', 7, 'לפני 8 בא 7', null, 2],
      ['המספר שלפני 12?', 11, 'לפני 12 בא 11', null, 2],
      ['המספר שלפני 20?', 19, 'לפני 20 בא 19', null, 2],
      ['כמה חסר מ-7 עד 10?', 3, '7, 8, 9, 10 — שלושה צעדים', null, 3],
      ['כמה חסר מ-15 עד 20?', 5, 'מ-15 עד 20 יש 5', null, 3],
      ['ספירה דילוגית: 2, 4, 6, 8, ?', 10, 'מוסיפים 2 בכל פעם', null, 3],
      ['ספירה דילוגית: 5, 10, 15, ?', 20, 'מוסיפים 5 בכל פעם', null, 3],
      ['ספירה דילוגית: 10, 12, 14, ?', 16, 'מוסיפים 2', null, 3],
    ],
    addition: [
      ['3 פעימות תוף ועוד 2 — כמה ביחד?', 5, '3, 4, 5', [3, 2], 1],
      ['4 תווים ועוד 3 תווים?', 7, 'חברו 4+3', [4, 3], 1],
      ['5 + 4 = ?', 9, 'התחילו מ-5 והוסיפו 4', null, 1],
      ['6 מחיאות ועוד 6?', 12, '6+6', [6, 6], 2],
      ['2 + 3 = ?', 5, '2 ואז עוד 3', null, 1],
      ['7 פעימות ועוד 1?', 8, '7+1', [7, 1], 1],
      ['1 + 8 = ?', 9, 'התחילו מ-1 והוסיפו 8', null, 1],
      ['5 תווים ועוד 5?', 10, '5+5', [5, 5], 1],
      ['4 + 4 = ?', 8, 'כפל של 4', null, 1],
      ['9 + 1 = ?', 10, 'משלימים ל-10', null, 1],
      ['8 + 2 = ?', 10, 'משלימים ל-10', null, 1],
      ['7 + 3 = ?', 10, 'משלימים ל-10', null, 1],
      ['6 + 5 = ?', 11, '6 ועוד 4 זה 10, ועוד 1', null, 2],
      ['8 + 4 = ?', 12, '8 ועוד 2 זה 10, ועוד 2', null, 2],
      ['9 + 6 = ?', 15, '9 ועוד 1 זה 10, ועוד 5', null, 2],
      ['7 + 8 = ?', 15, '7+7=14 ועוד 1', null, 2],
      ['9 + 7 = ?', 16, '9 ועוד 1 זה 10, ועוד 6', null, 2],
      ['8 + 8 = ?', 16, 'כפל של 8', null, 2],
      ['9 + 9 = ?', 18, 'כפל של 9', null, 3],
      ['11 + 5 = ?', 16, 'התחילו מ-11 והוסיפו 5', null, 3],
      ['12 + 8 = ?', 20, '12 ועוד 8 משלים ל-20', null, 3],
      ['13 + 6 = ?', 19, '13 ועוד 7 היה 20, פחות 1', null, 3],
      ['15 + 5 = ?', 20, 'משלימים ל-20', null, 3],
      ['14 + 6 = ?', 20, '14 ועוד 6', null, 3],
    ],
    subtraction: [
      ['היו 8 פעימות, 2 שתקו. כמה נשמעו?', 6, '8 פחות 2', [8], 1],
      ['9 תווים, מחקנו 4. כמה נשארו?', 5, 'ספרו אחורה מ-9', null, 1],
      ['7 - 3 = ?', 4, 'מ-7 מורידים 3', null, 1],
      ['מ-10 מחיאות עצרנו אחרי 6?', 4, '10 פחות 6', null, 1],
      ['5 - 2 = ?', 3, 'מ-5 מורידים 2', null, 1],
      ['היו 6 פעימות, 1 שתקה. כמה נשמעו?', 5, '6 פחות 1', [6], 1],
      ['10 - 3 = ?', 7, 'מ-10 מורידים 3', null, 1],
      ['8 תווים, מחקנו 8. כמה נשארו?', 0, '8 פחות 8', null, 1],
      ['10 - 1 = ?', 9, 'לפני 10', null, 1],
      ['9 - 5 = ?', 4, 'מ-9 מורידים 5', null, 1],
      ['10 - 7 = ?', 3, 'כמה חסר ל-7 כדי 10', null, 1],
      ['12 - 2 = ?', 10, 'שתי קפיצות אחורה', null, 2],
      ['15 - 5 = ?', 10, 'מ-15 מורידים 5', null, 2],
      ['14 - 4 = ?', 10, 'מ-14 מורידים 4', null, 2],
      ['11 - 6 = ?', 5, '11 פחות 6', null, 2],
      ['13 - 8 = ?', 5, '13 פחות 8', null, 2],
      ['16 - 7 = ?', 9, '16 פחות 6 זה 10, פחות עוד 1', null, 2],
      ['18 - 9 = ?', 9, 'חצי מ-18', null, 3],
      ['20 - 6 = ?', 14, 'מ-20 מורידים 6', null, 3],
      ['20 - 11 = ?', 9, '20 פחות 10 זה 10, פחות עוד 1', null, 3],
      ['17 - 8 = ?', 9, '17 פחות 7 זה 10, פחות עוד 1', null, 3],
      ['19 - 5 = ?', 14, 'מ-19 מורידים 5', null, 3],
      ['20 - 20 = ?', 0, 'הכול ירד', null, 3],
    ],
    multiplication: [
      ['3 תיבות, בכל אחת 2 פעימות. כמה בסך הכול?', 6, '3 פעמים 2', null, 1],
      ['4 × 2 = ?', 8, '4 קבוצות של 2', null, 1],
      ['5 שורות של 3 תווים?', 15, '5 פעמים 3', null, 2],
      ['2 × 6 = ?', 12, '2 קבוצות של 6', null, 1],
      ['2 תיבות, בכל אחת 4 פעימות. כמה בסך הכול?', 8, '2 פעמים 4', null, 1],
      ['3 × 3 = ?', 9, '3 קבוצות של 3', null, 2],
      ['1 × 7 = ?', 7, 'קבוצה אחת של 7', null, 1],
      ['4 שורות של 4 תווים?', 16, '4 פעמים 4', null, 2],
      ['5 × 2 = ?', 10, 'לוח ה-2', null, 1],
      ['10 × 2 = ?', 20, 'לוח ה-2', null, 1],
      ['5 × 5 = ?', 25, 'לוח ה-5', null, 1],
      ['5 × 10 = ?', 50, 'לוח ה-10', null, 1],
      ['10 × 3 = ?', 30, 'לוח ה-10', null, 1],
      ['10 × 7 = ?', 70, 'לוח ה-10', null, 1],
      ['0 × 8 = ?', 0, 'אפס קבוצות', null, 1],
      ['6 × 2 = ?', 12, 'לוח ה-2', null, 1],
      ['3 × 4 = ?', 12, '3 קבוצות של 4', null, 2],
      ['4 × 5 = ?', 20, '4 קבוצות של 5', null, 2],
      ['6 × 3 = ?', 18, 'לוח ה-3', null, 2],
      ['7 × 3 = ?', 21, 'לוח ה-3', null, 2],
      ['8 × 4 = ?', 32, 'לוח ה-4', null, 2],
      ['6 × 5 = ?', 30, 'לוח ה-5', null, 2],
      ['6 × 6 = ?', 36, 'לוח ה-6', null, 3],
      ['7 × 7 = ?', 49, 'לוח ה-7', null, 3],
      ['8 × 8 = ?', 64, 'לוח ה-8', null, 3],
      ['9 × 9 = ?', 81, 'לוח ה-9', null, 3],
      ['7 × 8 = ?', 56, '7×8', null, 3],
      ['6 × 9 = ?', 54, '6×9', null, 3],
      ['8 × 6 = ?', 48, '8×6', null, 3],
      ['9 × 4 = ?', 36, '9×4', null, 3],
    ],
    basic_fractions: [
      ['חצי תיבה + חצי תיבה = כמה שלמות?', 1, 'שני חצאים שווים שלם', null, 1],
      ['עוגה ל-4 חלקים — כמה חלקים הם רבע?', 1, 'רבע = חלק אחד מ-4', null, 1],
      ['כמה רבעים יש בשלם?', 4, '4 רבעים משלימים שלם', null, 1],
      ['חצי מתוך 8 מחיאות זה כמה?', 4, 'חצי = לחלק ל-2', null, 2],
      ['רבע + רבע = כמה רבעים?', 2, '1+1', null, 1],
      ['כמה חצאים יש בשלם?', 2, 'שני חצאים', null, 1],
      ['שלושה רבעים — כמה רבעים זה?', 3, '3 מתוך 4', null, 2],
      ['חצי מתוך 6 תווים זה כמה?', 3, 'חצי = לחלק ל-2', null, 2],
      ['רבע מתוך 8 תווים זה כמה?', 2, '8 חלקי 4', null, 2],
      ['חצי מתוך 10 מחיאות זה כמה?', 5, 'חצי = לחלק ל-2', null, 2],
      ['רבע מתוך 4 זה כמה?', 1, 'חלק אחד מ-4', null, 1],
      ['שני חצאים = כמה שלמות?', 1, '2/2 = 1', null, 1],
      ['כמה שלמות הם 4 רבעים?', 1, '4/4 = 1', null, 1],
      ['חצי מתוך 12 זה כמה?', 6, '12 חלקי 2', null, 2],
      ['רבע מתוך 12 זה כמה?', 3, '12 חלקי 4', null, 2],
      ['שלושה רבעים מתוך 8 — כמה זה? (2+2+2)', 6, 'כל רבע הוא 2', null, 3],
      ['חצי + רבע = כמה רבעים?', 3, 'חצי = 2 רבעים, ועוד 1', null, 3],
      ['כמה חצאים יש ב-2 שלמות?', 4, 'כל שלם = 2 חצאים', null, 3],
      ['כמה רבעים יש ב-2 שלמות?', 8, 'כל שלם = 4 רבעים', null, 3],
      ['רבע מתוך 20 זה כמה?', 5, '20 חלקי 4', null, 3],
    ],
  };

  function skillHe(k) {
    const hit = RM_SKILLS.find(function (s) { return s[0] === k; });
    return hit ? hit[1] : k;
  }

  function skillGrade(k) {
    return SKILL_GRADE[k] || '';
  }

  function levelHe(n) {
    return LEVEL_HE[n] || LEVEL_HE[1];
  }

  function clampLevel(n) {
    const v = Math.round(Number(n));
    if (!Number.isFinite(v)) return 1;
    return Math.min(3, Math.max(1, v));
  }

  function hearOf(row) {
    const raw = row && row[3];
    if (!Array.isArray(raw) || !raw.length) return null;
    const hear = [];
    for (let i = 0; i < raw.length; i++) {
      const n = Math.round(Number(raw[i]));
      if (!Number.isFinite(n) || n < 1 || n > 12) return null;
      hear.push(n);
    }
    return hear;
  }

  function rowsOf(skill) {
    const rows = RM_BANK[skill] || [];
    return rows.map(function (row, i) {
      return {
        id: skill + '-' + i,
        skill: skill,
        he: skillHe(skill),
        grade: skillGrade(skill),
        prompt: row[0],
        answer: row[1],
        hint: row[2],
        hear: hearOf(row),
        level: clampLevel(row[4] != null ? row[4] : 1),
      };
    });
  }

  function itemsAtLevel(skill, level) {
    const want = clampLevel(level);
    return rowsOf(skill).filter(function (it) { return it.level === want; });
  }

  function diagnosticItems() {
    return RM_SKILLS.flatMap(function (pair) {
      return rowsOf(pair[0]).slice(0, 2);
    });
  }

  function classItems() {
    return ['counting', 'addition', 'subtraction'].flatMap(rowsOf);
  }

  function practiceItems(skills) {
    const want = Array.isArray(skills) && skills.length
      ? skills
      : RM_SKILLS.map(function (s) { return s[0]; });
    return want.flatMap(rowsOf);
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

  return {
    RM_SKILLS: RM_SKILLS,
    RM_ORDER: RM_ORDER,
    RM_BANK: RM_BANK,
    SKILL_GRADE: SKILL_GRADE,
    LEVEL_HE: LEVEL_HE,
    skillHe: skillHe,
    skillGrade: skillGrade,
    levelHe: levelHe,
    clampLevel: clampLevel,
    rowsOf: rowsOf,
    hearOf: hearOf,
    itemsAtLevel: itemsAtLevel,
    diagnosticItems: diagnosticItems,
    classItems: classItems,
    practiceItems: practiceItems,
    coverage: coverage,
  };
});
