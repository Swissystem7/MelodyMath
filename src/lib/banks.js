// MelodyMath — one elementary item bank for the screen and for paper.
//
// A מחנכת שילוב printing a worksheet must get the same prompts the tablet
// shows. Diagnostic still uses the first two items of each skill (10 items).
// Class mode uses counting + addition + subtraction only (grades א–ב).
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

  const RM_BANK = {
    counting: [
      ['סְפרו את הפעימות: 🥁🥁🥁🥁🥁 — כמה יש?', 5, 'נגעו בכל תוף פעם אחת וספרו', [5]],
      ['כמה תווים בשורה? ♪ ♪ ♪ ♪ ♪ ♪ ♪', 7, 'ספרו אחד-אחד', [7]],
      ['6, ואז המספר הבא?', 7, 'המספר שבא אחרי 6'],
      ['כמה מחיאות כפיים? 👏👏👏👏👏👏👏👏', 8, 'ספרו כל מחיאה', [8]],
      ['כמה נקודות? • • • • • •', 6, 'ספרו כל נקודה', [6]],
      ['4, ואז המספר הבא?', 5, 'המספר שבא אחרי 4'],
      ['סִפרו: 🥁🥁🥁 — כמה יש?', 3, 'שלושה תופים', [3]],
      ['כמה ידיים? ✋✋✋✋✋✋✋✋✋✋', 10, 'ספרו עד 10', [10]],
    ],
    addition: [
      ['3 פעימות תוף ועוד 2 — כמה ביחד?', 5, '3, 4, 5', [3, 2]],
      ['4 תווים ועוד 3 תווים?', 7, 'חברו 4+3', [4, 3]],
      ['5 + 4 = ?', 9, 'התחילו מ-5 והוסיפו 4'],
      ['6 מחיאות ועוד 6?', 12, '6+6', [6, 6]],
      ['2 + 3 = ?', 5, '2 ואז עוד 3'],
      ['7 פעימות ועוד 1?', 8, '7+1', [7, 1]],
      ['1 + 8 = ?', 9, 'התחילו מ-1 והוסיפו 8'],
      ['5 תווים ועוד 5?', 10, '5+5', [5, 5]],
    ],
    subtraction: [
      ['היו 8 פעימות, 2 שתקו. כמה נשמעו?', 6, '8 פחות 2', [8]],
      ['9 תווים, מחקנו 4. כמה נשארו?', 5, 'ספרו אחורה מ-9'],
      ['7 - 3 = ?', 4, 'מ-7 מורידים 3'],
      ['מ-10 מחיאות עצרנו אחרי 6?', 4, '10 פחות 6'],
      ['5 - 2 = ?', 3, 'מ-5 מורידים 2'],
      ['היו 6 פעימות, 1 שתקה. כמה נשמעו?', 5, '6 פחות 1', [6]],
      ['10 - 3 = ?', 7, 'מ-10 מורידים 3'],
      ['8 תווים, מחקנו 8. כמה נשארו?', 0, '8 פחות 8'],
    ],
    multiplication: [
      ['3 תיבות, בכל אחת 2 פעימות. כמה בסך הכול?', 6, '3 פעמים 2'],
      ['4 × 2 = ?', 8, '4 קבוצות של 2'],
      ['5 שורות של 3 תווים?', 15, '5 פעמים 3'],
      ['2 × 6 = ?', 12, '2 קבוצות של 6'],
      ['2 תיבות, בכל אחת 4 פעימות. כמה בסך הכול?', 8, '2 פעמים 4'],
      ['3 × 3 = ?', 9, '3 קבוצות של 3'],
      ['1 × 7 = ?', 7, 'קבוצה אחת של 7'],
      ['4 שורות של 4 תווים?', 16, '4 פעמים 4'],
    ],
    basic_fractions: [
      ['חצי תיבה + חצי תיבה = כמה שלמות?', 1, 'שני חצאים שווים שלם'],
      ['עוגה ל-4 חלקים — כמה חלקים הם רבע?', 1, 'רבע = חלק אחד מ-4'],
      ['כמה רבעים יש בשלם?', 4, '4 רבעים משלימים שלם'],
      ['חצי מתוך 8 מחיאות זה כמה?', 4, 'חצי = לחלק ל-2'],
      ['רבע + רבע = כמה רבעים?', 2, '1+1'],
      ['כמה חצאים יש בשלם?', 2, 'שני חצאים'],
      ['שלושה רבעים — כמה רבעים זה?', 3, '3 מתוך 4'],
      ['חצי מתוך 6 תווים זה כמה?', 3, 'חצי = לחלק ל-2'],
    ],
  };

  function skillHe(k) {
    const hit = RM_SKILLS.find(function (s) { return s[0] === k; });
    return hit ? hit[1] : k;
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
    return rows.map(function (row) {
      return {
        skill: skill,
        he: skillHe(skill),
        prompt: row[0],
        answer: row[1],
        hint: row[2],
        hear: hearOf(row),
      };
    });
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

  return {
    RM_SKILLS: RM_SKILLS,
    RM_ORDER: RM_ORDER,
    RM_BANK: RM_BANK,
    skillHe: skillHe,
    rowsOf: rowsOf,
    hearOf: hearOf,
    diagnosticItems: diagnosticItems,
    classItems: classItems,
    practiceItems: practiceItems,
  };
});
